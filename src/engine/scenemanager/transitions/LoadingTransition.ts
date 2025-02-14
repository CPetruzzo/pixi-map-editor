import { Easing, Tween } from "tweedle.js";
import { Graphics } from "@pixi/graphics";
import { TransitionBase } from "./TransitionBase";
import { ScaleHelper } from "../../utils/ScaleHelper";
import type { ResolveOverride } from "../ITransition";
import { TweenUtils } from "../../tweens/tweenUtils";
import { CircularGradientProgress, CircularGradientProgressOptions } from "../../progressbar/CircularGradientProgress";

export class LoadingTransition extends TransitionBase {
	private readonly color: number;
	private readonly fadeInTime: number;
	private readonly fadeOutTime: number;
	private readonly fade: Graphics;

	private readonly overallProgress: CircularGradientProgress;
	private readonly progressSettingsBase: CircularGradientProgressOptions;
	private readonly bundleProgressBars: Record<string, CircularGradientProgress> = {};

	public constructor() {
		super();
		this.fade = new Graphics();
		this.fade.interactive = true;
		this.fade.alpha = 0;

		this.progressSettingsBase = {
			colors: 0xffffff,
			innerRadius: 300,
			outerRadius: 400,
			anchorX: 0.5,
			anchorY: 0.5,
			endCap: false,
			startCap: false,
			initialValue: 0,
		};

		this.overallProgress = new CircularGradientProgress(this.progressSettingsBase);
		this.overallProgress.alpha = 0;

		this.addChild(this.fade);
		this.addChild(this.overallProgress);

		console.log("I EXISTS!");
	}

	public override startCovering(): Promise<void> {
		const directingTween = new Tween(this.fade, this.tweens).to({ alpha: 1 }, this.fadeInTime).easing(Easing.Linear.None).start();
		new Tween(this.overallProgress, this.tweens).to({ alpha: 1 }, this.fadeInTime).delay(100).easing(Easing.Linear.None).start();
		return TweenUtils.promisify(directingTween).then(); // then converts the promise to a void promise.
	}
	public override startResolving(): Promise<ResolveOverride> {
		return Promise.resolve(undefined);
	}
	public override startUncovering(): Promise<void> {
		this.tweens.removeAll();
		new Tween(this.overallProgress, this.tweens).to({ alpha: 0 }, this.fadeOutTime).easing(Easing.Linear.None).start();
		const directingTween = new Tween(this.fade, this.tweens).to({ alpha: 0 }, this.fadeOutTime).easing(Easing.Linear.None).start();
		return TweenUtils.promisify(directingTween).then(); // then converts the promise to a void promise.
	}

	public override onDownloadProgress(progress: number, bundlesProgress: Record<string, number>): void {
		// Update the overall progress
		this.overallProgress.updateValue(progress, 300);

		// Make per-bundle progressbars
		const keys = Object.keys(bundlesProgress).sort();
		if (keys.length == 1) {
			// We are loading only one bundle, no need for multiple progressbars
			return;
		}

		console.log(bundlesProgress, keys);

		for (let i = 0; i < keys.length; i++) {
			if (this.bundleProgressBars[keys[i]] === undefined) {
				const ciruclarSettings = { ...this.progressSettingsBase };
				ciruclarSettings.outerRadius = 290 - i * 30;
				ciruclarSettings.innerRadius = ciruclarSettings.outerRadius - 20;
				const bundleProgressBar = new CircularGradientProgress(ciruclarSettings);
				this.overallProgress.addChild(bundleProgressBar);
				this.bundleProgressBars[keys[i]] = bundleProgressBar;
			}

			this.bundleProgressBars[keys[i]].updateValue(bundlesProgress[keys[i]], 300);
		}
	}

	public override onResize(w: number, h: number): void {
		this.fade.clear();
		this.fade.beginFill(this.color, 1);
		this.fade.drawRect(0, 0, w, h);
		this.fade.endFill();

		ScaleHelper.setScaleRelativeToScreen(this.overallProgress, w, h, 0.5, 0.25);
		this.overallProgress.x = w / 2;
		this.overallProgress.y = h / 2;
	}
}
