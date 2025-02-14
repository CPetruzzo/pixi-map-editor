/* eslint-disable @typescript-eslint/naming-convention */
declare namespace GlobalMixins {
	interface DisplayObjectEvents {
		"custom event here": any; // Reemplaza con el tipo correspondiente si es necesario
		MOBILE: any;
		JOYSTICKUP: any;
		JOYSTICKDOWN: any;
		JOYSTICKMOVE: any;
		WALK: any;
		ROCK_THROW: any;
		AIM: any;
		STOPAIM: any;
		collisionStart: any;

		// Nuevos eventos
		gameOver: void; // o el tipo de dato que maneje el evento
		changeLevel: number; // se asume que el nivel es un número
		changeBallCount: number; // se asume que el conteo de bolas es un número
		changePowerAttack: number; // se asume que el poder de ataque es un número
		showDamage: { damage: number; textBounds: Rectangle }; // el evento lleva daño y un Rectangle
		showAreaDamage: Point; // se asume que se pasa un punto

		// RUNFALL RESUME PAUSE
		RESUME_PAUSE: any;
		HIGHSCORE_NAME_READY: any;
		toggledButtonEvent: any;

		START: any;
		TIME_ENDED: any;

		aimToggled: any;
	}
}
