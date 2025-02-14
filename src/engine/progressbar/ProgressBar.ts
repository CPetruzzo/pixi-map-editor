import { Texture } from "@pixi/core";
import { Container } from "@pixi/display";
import { Graphics } from "@pixi/graphics";
import { ObservablePoint } from "@pixi/math";
import { Sprite } from "@pixi/sprite";
import { Easing, Tween } from "tweedle.js";
import * as MathUtils from "../../engine/utils/MathUtils";
import type { IProgress } from "./IProgress";

export class ProgressBar extends Container implements IProgress {
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

	public get animatedRatio(): number {
		if (this.vertical) {
			return this.barMask.scale.y;
		} else {
			return this.barMask.scale.x;
		}
	}

	public get animatedValue(): number {
		return this.animatedRatio * (this.max - this.min) + this.min;
	}

	private barContainer: Container;
	private graphic: Sprite;
	private barMask: Graphics;
	private background: Sprite;
	private cap: Sprite; // Somebdoy will need you one day, but I am too tired today. - Milton of the past.
	private content: Container;
	private vertical: boolean;
	private reverse: boolean;
	private tween: Tween<any>;
	constructor(options: ProgressBarOptions) {
		super();
		this._anchor = new ObservablePoint(this.updateAnchor, this, options.anchorX, options.anchorY);
		this.graphic = options.texture ? Sprite.from(options.texture) : Sprite.from(Texture.EMPTY);
		this.background = options.background ? Sprite.from(options.background) : Sprite.from(Texture.EMPTY);
		this.background.anchor.set(0.5);
		this.cap = options.cap ? Sprite.from(options.cap) : Sprite.from(Texture.EMPTY);
		this.cap.anchor.set(0.5);
		this.barMask = new Graphics();

		this.vertical = Boolean(options.vertical); // look at me using "!!" I am a javascript developer alright
		this.reverse = Boolean(options.reverse); // look at me using "!!" I am a javascript developer alright

		// big setup...
		this.barContainer = new Container();

		if (options.vertical) {
			if (options.reverse) {
				this.graphic.anchor.set(0, 0);
				this.barMask.beginFill(0xff00ff, 1);
				this.barMask.drawRect(0, 0, this.graphic.width, this.graphic.height);
				this.barMask.endFill();
				this.barContainer.x = -this.graphic.width / 2;
				this.barContainer.y = -this.graphic.height / 2;
			} else {
				this.graphic.anchor.set(0, 1);
				this.barMask.beginFill(0xff00ff, 1);
				this.barMask.drawRect(0, -this.graphic.height, this.graphic.width, this.graphic.height);
				this.barMask.endFill();
				this.barContainer.x = -this.graphic.width / 2;
				this.barContainer.y = Number(this.graphic.height) / 2;
			}
		} else {
			if (options.reverse) {
				this.graphic.anchor.set(1, 0);
				this.barMask.beginFill(0xff00ff, 1);
				this.barMask.drawRect(-this.graphic.width, 0, this.graphic.width, this.graphic.height);
				this.barMask.endFill();
				this.barContainer.x = Number(this.graphic.width) / 2;
				this.barContainer.y = -this.graphic.height / 2;
			} else {
				this.graphic.anchor.set(0, 0);
				this.barMask.beginFill(0xff00ff, 1);
				this.barMask.drawRect(0, 0, this.graphic.width, this.graphic.height);
				this.barMask.endFill();
				this.barContainer.x = -this.graphic.width / 2;
				this.barContainer.y = -this.graphic.height / 2;
			}
		}

		this.barContainer.addChild(this.graphic);
		this.barContainer.addChild(this.barMask);
		this.barContainer.addChild(this.cap);
		this.graphic.mask = this.barMask; // first try?

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
			this.tween = new Tween(this.barMask.scale);

			if (this.vertical) {
				this.tween.to({ y: this._ratio }, tweenDuration);
			} else {
				this.tween.to({ x: this._ratio }, tweenDuration);
			}

			this.tween.easing(Easing.Quadratic.Out).onUpdate(this.fixCap.bind(this)).start();
		} else {
			if (this.vertical) {
				this.barMask.scale.y = this._ratio;
			} else {
				this.barMask.scale.x = this._ratio;
			}
			this.fixCap();
		}
	}

	private fixCap(): void {
		// ok, centering the cap on the bar is easy.
		if (this.vertical) {
			this.cap.x = this.graphic.width / 2;
		} else {
			this.cap.y = this.graphic.height / 2;
		}

		// now, finding the top of the bar... thats a tricky one
		if (this.reverse) {
			if (this.vertical) {
				this.cap.y = this.barMask.height;
			} else {
				this.cap.x = -this.barMask.width;
			}
		} else {
			if (this.vertical) {
				console.log(this.barMask.width, this.barMask.scale.y);
				this.cap.y = -this.barMask.height;
			} else {
				this.cap.x = this.barMask.width;
			}
		}
	}

	private updateAnchor(): void {
		// content is centered. that way I can make sure the background bar aligns with the inside bar
		// however, that makes alignment a bitch
		this.content.x = this.content.x * (0.5 - this.anchor.x);
		this.content.y = this.content.y * (0.5 - this.anchor.y);
	}
}

export interface ProgressBarOptions {
	texture: string;
	maxValue?: number;
	minValue?: number;
	initialValue?: number;
	background?: string;
	cap?: string;
	vertical?: boolean;
	reverse?: boolean;
	anchorX?: number;
	anchorY?: number;
}
