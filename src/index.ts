import "./pixi";
import { SceneManager } from "./engine/scenemanager/SceneManager";
import { DataManager } from "./engine/datamanager/DataManager";
import { DEBUG } from "./flags";
import * as ALL_FLAGS from "./flags";
import { forceFocus, preventDrag, preventKeys } from "./engine/utils/browserFunctions";
import { ScaleHelper } from "./engine/utils/ScaleHelper";
import { PixiRenderer } from "./engine/scenemanager/renderers/PixiRenderer";
import { settings } from "pixi.js";
import { DEFAULTS } from "tweedle.js";
import { Box2DHelper } from "./engine/utils/Box2DHelper";
import { CameraOrbitControl } from "pixi3d/pixi7";
import { CircularLoadingTransition } from "./engine/scenemanager/transitions/CircularLoadingTransition";

import { ConstructionEngineScene } from "./project/scenes/ConstructionEngineScene/ConstructionEngineScene";

settings.RENDER_OPTIONS.hello = false;

DEFAULTS.safetyCheckFunction = (obj: any) => !obj?.destroyed;

export const pixiSettings = {
	backgroundColor: 0x0,
	width: ScaleHelper.IDEAL_WIDTH,
	resolution: window.devicePixelRatio || 1,
	autoDensity: true,
	height: ScaleHelper.IDEAL_HEIGHT,
	autoStart: false,
	view: document.getElementById("pixi-canvas") as HTMLCanvasElement,
	interactionTestsAllScenes: true,
};

document.getElementById("pixi-content").style.background = "#" + "000000"; // app.renderer.backgroundColor.toString(16);
document.getElementById("pixi-content").appendChild(pixiSettings.view);

preventDrag(); // prevents scrolling by dragging.
preventKeys(); // prevents scrolling by keyboard keys. (usually required for latam)
forceFocus();
// registerWorker(); // registers the service worker for pwa

export const pixiRenderer = new PixiRenderer(pixiSettings);
// eslint-disable-next-line @typescript-eslint/naming-convention
export const Manager = new SceneManager(pixiRenderer);

export const cameraControl = new CameraOrbitControl(pixiSettings.view);

DataManager.save();
DataManager.load();

if (DEBUG) {
	console.group("DEBUG MODE ENABLED:");
	for (const flag in ALL_FLAGS) {
		console.log(`${flag} =`, (ALL_FLAGS as any)[flag]);
	}
	console.groupEnd();
}
// Manager.setRotateScene("portrait", SimpleLockScene, ["rotateDevice"]);

window.addEventListener("resize", () => {
	const w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
	const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
	Manager.resize(w, h, window.devicePixelRatio || 1);
});

window.dispatchEvent(new Event("resize"));
window.addEventListener("contextmenu", (e) => {
	e.preventDefault();
	window.dispatchEvent(new CustomEvent("rightClick", { detail: "Clic derecho detectado" }));
});

const initializeCb = function (): void {
	// Manager.changeScene(import(/* webpackPrefetch: true */ "./project/scenes/LoaderScene"));
	Manager.changeScene(ConstructionEngineScene, { transitionClass: CircularLoadingTransition });
};

if (ALL_FLAGS.USE_BOX2D) {
	Box2DHelper.initialize().then(() => initializeCb());
} else {
	initializeCb();
}

export function vibrateMobileDevice(): void {
	if ("vibrate" in navigator) {
		navigator.vibrate(500);
		console.log("Vibrando.");
	} else {
		console.log("La vibración no es compatible con este dispositivo.");
	}
}
