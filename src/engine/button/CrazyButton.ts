// import { Container, InteractionEvent, ObservablePoint, Point, Texture } from "pixi.js-legacy";
// import { Button, ButtonOptions, ButtonStateOptions } from "../engine/ui/button/Button";
// import { Tween, Easing } from "tweedle.js";
// import { Emitter, EmitterConfig, OldEmitterConfig } from "pixi-particles";

// export class CrazyButton extends Button {
// 	private tweenHandler: Tween<ObservablePoint>;
// 	private particleEmitter: Emitter;
// 	private particleContainer: Container;
// 	private shouldCallAtention: boolean;
// 	private _auxiliarThingy: Container;
// 	public get auxiliarThingy(): Container {
// 		if (!this._auxiliarThingy) {
// 			this._auxiliarThingy = new Container();
// 		}
// 		return this._auxiliarThingy;
// 	}
// 	constructor(
// 		options: ButtonOptions,
// 		shouldCallAtention: boolean = false,
// 		particles?: {
// 			particleImages: Array<Texture>;
// 			config: EmitterConfig | OldEmitterConfig;
// 			particleContainer?: Container;
// 		}
// 	) {
// 		super(options);
// 		this.shouldCallAtention = shouldCallAtention;
// 		if (particles) {
// 			this.particleContainer = particles.particleContainer ?? this;
// 			this.particleEmitter = new Emitter(this.particleContainer, particles.particleImages, particles.config);
// 			this.particleEmitter.emit = false;
// 		}

// 		this.addChild(this.auxiliarThingy);
// 		this.auxiliarThingy.addChild(this.scaleAndFilterContainer);
// 	}

// 	protected setState(newState: ButtonStateOptions): void {
// 		super.setState(newState);
// 		// todo check state and do crazy tween stuff
// 		switch (newState) {
// 			case this.highlightState:
// 				this.tweenHandler?.onComplete(undefined);
// 				this.tweenHandler?.stop();
// 				this.auxiliarThingy.scale.set(1);

// 				this.tweenHandler = new Tween(this.auxiliarThingy.scale)
// 					.to({ x: 1.1, y: 1.1 }, 750)
// 					.easing(Easing.Sinusoidal.InOut)
// 					.repeat(Number.POSITIVE_INFINITY)
// 					.yoyo(true)
// 					.start();
// 				break;

// 			default:
// 				this.callForAttention(); // doshake will call itself over and over again
// 				break;
// 		}
// 	}

// 	private callForAttention(): void {
// 		this.tweenHandler?.onComplete(undefined);
// 		this.tweenHandler?.stop();
// 		this.auxiliarThingy.scale.set(1);
// 		if (this.shouldCallAtention) {
// 			this.tweenHandler = new Tween(this.auxiliarThingy.scale)
// 				.to({ x: 1.1, y: 1.1 }, 150)
// 				.easing(Easing.Quadratic.Out)
// 				.repeat(3)
// 				.yoyo(true)
// 				.delay(3000)
// 				.onComplete(this.callForAttention.bind(this))
// 				.start();
// 		}
// 	}

// 	protected onPointerClickCallback(_e: InteractionEvent): void {
// 		if (this.particleEmitter) {
// 			const auxPos = this.particleContainer.toLocal(new Point(), this);
// 			this.particleEmitter.updateOwnerPos(auxPos.x, auxPos.y);
// 			this.particleEmitter.emit = true;
// 		}
// 		super.onPointerClickCallback(_e);
// 	}

// 	public destroy(options?: { children?: boolean; texture?: boolean; baseTexture?: boolean }): void {
// 		this.tweenHandler?.stop();
// 		this.tweenHandler = undefined;
// 		// this.particleEmitter?.destroy();
// 		super.destroy(options);
// 	}

// 	public update(dt: number): void {
// 		if (!this.visible) {
// 			this.tweenHandler?.stop();
// 			this.tweenHandler = undefined;
// 		}
// 		this.particleEmitter?.update(dt / 1000);
// 	}
// }

