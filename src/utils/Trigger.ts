import { Container } from "@pixi/display";

export class Trigger extends Container {
	constructor() {
		super();
	}

	public activate(doSomething: void): void {
		() => {
			doSomething;
		};
	}
}
