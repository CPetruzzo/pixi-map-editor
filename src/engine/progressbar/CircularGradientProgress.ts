import { Tween, Easing } from "tweedle.js";
import { Graphics } from "@pixi/graphics";
import * as MathUtils from "../../engine/utils/MathUtils";
import type { IProgress } from "./IProgress";
import vertexSrc from "./circularGradient.vert";
import fragmentSrc from "./circularGradient.frag";
import { Geometry, Renderer, Shader, Texture } from "@pixi/core";
import { Container, IDestroyOptions } from "@pixi/display";
import { ObservablePoint } from "@pixi/math";
import { Mesh } from "@pixi/mesh";
import { Sprite } from "@pixi/sprite";

export class CircularGradientProgress extends Container implements IProgress {
	private uniforms: {
		progress: number;
		thicknessInPixels: number;
		radiusInPixels: number;
		smoothingInPixels: number;
		colors: number[];
		colorStops: number[];
		colorCount: number;
		uWorldAlpha: number;
		fixedPattern: boolean;
		reverse: boolean;
	};
	private _min: number;

	public get min(): number {
		return this._min;
	}
	public set min(value: number) {
		this._min = value;
		this.updateValue();
	}
	private _max: number;
	public get max(): number {
		return this._max;
	}
	public set max(value: number) {
		this._max = value;
		this.updateValue();
	}
	private _value: number;
	public get value(): number {
		return this._value;
	}
	public set value(value: number) {
		this._value = value;
		this.updateValue();
	}

	private _ratio: number;
	public get ratio(): number {
		return this._ratio;
	}

	public set ratio(value: number) {
		this._value = value * (this._max - this._min) + this._min;
		this.updateValue();
	}

	private readonly _anchor: ObservablePoint;
	public get anchor(): ObservablePoint {
		return this._anchor;
	}
	public set anchor(value: ObservablePoint) {
		this._anchor.copyFrom(value);
	}

	private _animatedRatio: number;

	public get animatedRatio(): number {
		return this._animatedRatio;
	}

	public get animatedValue(): number {
		return this.animatedRatio * (this.max - this.min) + this.min;
	}

	private barContainer: Container;
	private quad: Mesh<Shader>;
	public background: Sprite;
	public startCap: Graphics;
	public endCap: Graphics;
	private content: Container;
	private reverse: boolean;
	private tween: Tween<any>;
	private capRadius: number;

	constructor(options: CircularGradientProgressOptions) {
		super();
		this._anchor = new ObservablePoint(this.updateAnchor, this, options.anchorX, options.anchorY);

		const { outerRadius, innerRadius } = options;

		let colors: { color: number; stop: number; alpha?: number }[];
		if (typeof options.colors == "number") {
			colors = [{ color: options.colors, stop: 1 }];
		} else {
			colors = Array.from(options.colors);
		}

		if (colors.length > 9) {
			console.warn("Circular Gradient can't handle more than 9 colors! Colors beyond the 9th will be ignored");
			while (colors.length > 9) {
				colors.pop();
			}
		}

		// Build geometry.
		const geometry = new Geometry()
			.addAttribute(
				"aVertexPosition", // the attribute name
				[-outerRadius, -outerRadius, outerRadius, -outerRadius, outerRadius, outerRadius, -outerRadius, outerRadius],
				2
			) // the size of the attribute
			.addAttribute(
				"aUvs", // the attribute name
				[0, 0, 1, 0, 1, 1, 0, 1],
				2
			) // the size of the attribute
			.addIndex([0, 1, 2, 0, 2, 3]);

		this.uniforms = {
			progress: options.initialValue | 0,
			thicknessInPixels: outerRadius - innerRadius,
			radiusInPixels: outerRadius,
			smoothingInPixels: options.overrideSmoothingSize ?? 1,
			colors: colors.reduce((acc, c) => acc.concat(this.hexToShader(c.color), [c.alpha ?? 1]), []), // flatMap doesn't exist yet :(
			colorStops: colors.map((c) => c.stop),
			colorCount: colors.length,
			fixedPattern: Boolean(options.fixed),
			uWorldAlpha: this.worldAlpha,
			reverse: Boolean(options.reverse),
		};

		// Build the shader and the quad.
		const shader = Shader.from(vertexSrc, fragmentSrc, this.uniforms);
		this.quad = new Mesh(geometry, shader);

		this.background = options.background ? Sprite.from(options.background) : Sprite.from(Texture.EMPTY);
		this.background.anchor.set(0.5);

		// diagonal to the edge of the graphic
		const capSize = outerRadius - innerRadius - (options.overrideSmoothingSize ?? 1) * 2;

		this.capRadius = options.capRadius ?? (innerRadius + outerRadius) / 2;

		this.startCap = new Graphics();
		this.startCap.beginFill(colors[0].color, colors[0].alpha ?? 1);
		this.startCap.drawCircle(0, 0, capSize / 2);
		this.startCap.endFill();
		this.startCap.visible = options.startCap;

		this.endCap = new Graphics();
		this.endCap.beginFill(colors[colors.length - 1].color, colors[colors.length - 1].alpha ?? 1);
		this.endCap.drawCircle(0, 0, capSize / 2);
		this.endCap.endFill();
		this.endCap.visible = options.endCap;

		this.reverse = Boolean(options.reverse);

		// big setup...
		this.barContainer = new Container();

		this.barContainer.addChild(this.quad);
		this.barContainer.addChild(this.startCap);
		this.barContainer.addChild(this.endCap);

		this.content = new Container();
		this.content.addChild(this.background);
		this.content.addChild(this.barContainer);
		this.addChild(this.content);

		this._min = options.minValue ?? 0;
		this._max = options.maxValue ?? 1;
		this.value = options.initialValue ?? 0; // intentional use of the public here. kick off the gears
	}

	public updateValue(newValue?: number, tweenDuration?: number): void {
		if (newValue != null) {
			this._value = newValue; // use private to avoid endless recursion
		}
		this.tween?.stop();
		this._ratio = MathUtils.clamp((this._value - this._min) / (this._max - this._min), 0, 1);
		if (tweenDuration) {
			this.tween = new Tween({ t: this._animatedRatio });

			this.tween.to({ t: this._ratio }, tweenDuration);

			this.tween
				.easing(Easing.Quadratic.Out)
				.onUpdate((o) => this.updateShader(o.t))
				.start();
		} else {
			this.updateShader(this._ratio);
		}
	}

	public override destroy(options?: boolean | IDestroyOptions): void {
		this.tween?.stop();
		super.destroy(options);
	}

	private updateShader(elapsed: number): void {
		this._animatedRatio = elapsed;

		const zero = Math.PI * -0.5;
		const one = Math.PI * 1.5;

		let angle: number;

		if (this.reverse) {
			// Math.PI * 1.5 = 0
			// Math.PI * -0.5 = 100
			angle = MathUtils.lerp(one, zero, elapsed);
		} else {
			// Math.PI * -0.5 = 0
			// Math.PI * 1.5 = 100
			angle = MathUtils.lerp(zero, one, elapsed);
		}

		this.uniforms.progress = elapsed;

		this.fixCap(angle);
	}

	private fixCap(angle: number): void {
		// Start is always on the top.
		this.startCap.position.x = 0;
		this.startCap.position.y = -this.capRadius;

		// sine and cosine just works™
		this.endCap.x = Math.cos(angle) * this.capRadius;
		this.endCap.y = Math.sin(angle) * this.capRadius;
	}

	private updateAnchor(): void {
		// content is centered. that way I can make sure the background bar aligns with the inside bar
		// however, that makes alignment a bitch
		this.content.x = this.content.x * (0.5 - this.anchor.x);
		this.content.y = this.content.y * (0.5 - this.anchor.y);
	}

	private hexToShader(color: number): [number, number, number] {
		const r = ((color >> 16) & 0xff) / 255;
		const g = ((color >> 8) & 0xff) / 255;
		const b = (color & 0xff) / 255;
		return [r, g, b];
	}

	public override render(renderer: Renderer): void {
		this.uniforms.uWorldAlpha = this.worldAlpha;
		super.render(renderer);
	}
}

export interface CircularGradientProgressOptions {
	outerRadius: number;
	innerRadius: number;
	colors: number | { color: number; stop: number; alpha?: number }[];

	/**
	 * default smoothing is 1 pixel.
	 */
	overrideSmoothingSize?: number;
	maxValue?: number;
	minValue?: number;
	initialValue?: number;
	background?: Texture | string;
	startCap?: boolean;
	endCap?: boolean;
	maskRadius?: number;
	capRadius?: number;
	reverse?: boolean;
	fixed?: boolean;
	anchorX?: number;
	anchorY?: number;
}
