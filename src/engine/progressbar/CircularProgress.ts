import { Texture } from "@pixi/core";
import { Container } from "@pixi/display";
import { Graphics } from "@pixi/graphics";
import { ObservablePoint, Rectangle } from "@pixi/math";
import { Sprite } from "@pixi/sprite";
import { Tween, Easing } from "tweedle.js";
import * as MathUtils from "../../engine/utils/MathUtils";
import type { IProgress } from "./IProgress";

export class CircularProgress extends Container implements IProgress {
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
	public graphic: Sprite;
	private arcMask: Graphics;
	public background: Sprite;
	public startCap: Sprite;
	public endCap: Sprite;
	private content: Container;
	private reverse: boolean;
	private tween: Tween<any>;
	private maskRadius: number;
	private capRadius: number;

	constructor(options: CircularProgressOptions) {
		super();
		this._anchor = new ObservablePoint(this.updateAnchor, this, options.anchorX, options.anchorY);
		this.graphic = options.texture ? Sprite.from(options.texture) : Sprite.from(Texture.EMPTY);
		this.graphic.anchor.set(0.5);
		this.background = options.background ? Sprite.from(options.background) : Sprite.from(Texture.EMPTY);
		this.background.anchor.set(0.5);

		this.startCap = options.startCap ? Sprite.from(options.startCap) : Sprite.from(Texture.EMPTY);
		this.startCap.anchor.set(0.5);

		this.endCap = options.endCap ? Sprite.from(options.endCap) : Sprite.from(Texture.EMPTY);
		this.endCap.anchor.set(0.5);

		this.arcMask = new Graphics();

		this.reverse = Boolean(options.reverse);

		// diagonal to the edge of the graphic
		const capSize = Math.max(this.startCap.width, this.startCap.height, this.endCap.width, this.endCap.height);
		const graphicSize = Math.max(this.graphic.width, this.graphic.height);

		this.maskRadius = options.maskRadius ?? Math.sqrt(this.graphic.width ** 2 + this.graphic.height ** 2) / 2 + capSize / 2;
		this.capRadius = options.capRadius ?? graphicSize / 2 - capSize / 2;

		// big setup...
		this.barContainer = new Container();

		this.barContainer.addChild(this.arcMask);
		this.barContainer.addChild(this.graphic);
		this.barContainer.addChild(this.startCap);
		this.barContainer.addChild(this.endCap);
		this.graphic.mask = this.arcMask;

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
				.onUpdate((o) => this.recreateMask(o.t))
				.start();
		} else {
			this.recreateMask(this._ratio);
		}
	}

	private recreateMask(elapsed: number): void {
		this.arcMask.clear();
		this.arcMask.beginFill(0xff00ff, 1);

		this._animatedRatio = elapsed;

		const zero = Math.PI * -0.5;
		const one = Math.PI * 1.5;

		let angle: number;

		if (this.reverse) {
			// Math.PI * 1.5 = 0
			// Math.PI * -0.5 = 100
			angle = MathUtils.lerp(one, zero, elapsed);
			this.arcMask.arc(0, 0, this.maskRadius, angle, one);
		} else {
			// Math.PI * -0.5 = 0
			// Math.PI * 1.5 = 100
			angle = MathUtils.lerp(zero, one, elapsed);
			this.arcMask.arc(0, 0, this.maskRadius, zero, angle);
		}

		this.arcMask.lineTo(0, 0);
		this.arcMask.endFill();

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

	public override getLocalBounds(rect?: Rectangle, skipChildrenUpdate = false): Rectangle {
		if (!skipChildrenUpdate) {
			this.arcMask.updateTransform();
		}

		this.barContainer.removeChild(this.arcMask);
		this.graphic.mask = undefined;

		const retval = super.getLocalBounds(rect, skipChildrenUpdate);

		this.barContainer.addChild(this.arcMask);
		this.graphic.mask = this.arcMask;

		return retval;
	}

	public override calculateBounds(): void {
		this.barContainer.removeChild(this.arcMask);
		this.graphic.mask = undefined;

		super.calculateBounds();

		this.barContainer.addChild(this.arcMask);
		this.graphic.mask = this.arcMask;
	}
}

interface CircularProgressOptions {
	texture: Texture | string;
	maxValue?: number;
	minValue?: number;
	initialValue?: number;
	background?: Texture | string;
	startCap?: Texture | string;
	endCap?: Texture | string;
	maskRadius?: number;
	capRadius?: number;
	reverse?: boolean;
	anchorX?: number;
	anchorY?: number;
}
