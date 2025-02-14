import type { Container } from "@pixi/display";

export interface IProgress extends Container {
	min: number;
	max: number;
	value: number;
	ratio: number;
	animatedValue: number;
	updateValue(newValue?: number, tweenDuration?: number): void;
}
