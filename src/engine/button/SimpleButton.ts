import { Button } from "./Button";

export class SimpleButton extends Button {
	constructor(texture: string, callback: Function, clickOnce?: boolean) {
		// ! STOP!
		// I know what you are thinking, I just need to change this class a little bit but NO!
		// This is an example of how you take the super comples Button class and make something small that works for your particular use case.
		// If you need ALL the flexibility, you should use `Button`.
		// If you want to abstract the complexity of `Button` in simpler class, then create your own, project specific button wrapper and use that instead.
		// I repeat: This is an example of how a wrapper might look like. Make your own that is fit for your project or use `Button` as is.
		super({
			defaultState: {
				texture: texture,
			},
			highlightState: {
				scale: 1.03,
			},
			downState: {
				scale: 0.97,
			},
			clickOnce,
			onClick: callback,
		});
	}
}
