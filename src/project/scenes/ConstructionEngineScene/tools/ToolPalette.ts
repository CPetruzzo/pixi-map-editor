// src/engine/scenes/ConstructionEngineScene/tools/ToolPalette.ts
import type { Container } from "pixi.js";
import { Graphics, Text } from "pixi.js";
import { Manager } from "../../../..";
import { ConstructionGameScene } from "../ConstructionGameScene";

export class ToolPalette {
	private container: Container;
	private setToolCallback: (tool: string) => void;

	constructor(container: Container, setToolCallback: (tool: string) => void) {
		this.container = container;
		this.setToolCallback = setToolCallback;
	}

	public createToolPalette(): void {
		this.createButton("🧹 Eraser", -360, 0, () => this.setToolCallback("eraser"));
		this.createButton("🏗️ Wall", -240, 0, () => this.setToolCallback("building"));
		this.createButton("🪵 Floor", -120, 0, () => this.setToolCallback("floor"));
		this.createButton("🚩 Flag", -240, 50, () => this.setToolCallback("flag"));
		this.createButton("FlagSelect", -120, 50, () => this.setToolCallback("flagSelect"));
		this.createButton("💾 Export", 120, 0, () => this.setToolCallback("export"));
		this.createButton("💾 Load", 240, 0, () => this.setToolCallback("load"));
		this.createButton("🧹 Clean", 0, 0, () => this.setToolCallback("clean"));
		this.createButton("🖼️ PNG", 360, 0, () => this.setToolCallback("exportPNG"));
		this.createButton("🎮 Player", -480, 0, () => this.setToolCallback("player"));
		this.createButton("🔀 Move", -480, 50, () => this.setToolCallback("playerSelect"));
		this.createButton("🧪 Test", 480, 0, () => {
			Manager.changeScene(ConstructionGameScene);
		});
		// this.createButton("💾 Save", 120, 50, () => this.setToolCallback("saveDirect"));
	}

	public createButton(label: string, x: number, y: number, onClick: () => void): void {
		const btn = new Graphics();
		btn.beginFill(0x333333);
		btn.drawRoundedRect(-50, -20, 100, 40, 10);
		btn.endFill();
		btn.x = x;
		btn.y = y;

		const text = new Text(label, {
			fontFamily: "Arial",
			fontSize: 18,
			fill: 0xffffff,
		});
		text.anchor.set(0.5);
		btn.addChild(text);
		btn.interactive = true;
		btn.on("pointerup", () => onClick());
		this.container.addChild(btn);
	}
}
