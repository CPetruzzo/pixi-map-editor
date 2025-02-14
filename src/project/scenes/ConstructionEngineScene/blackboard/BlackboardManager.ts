// src/engine/scenes/ConstructionEngineScene/blackboard/BlackboardManager.ts
import type { Container } from "pixi.js";
import { Graphics } from "pixi.js";

export class BlackboardManager {
	private blackboard: Container;
	private grid: Graphics;
	public gridSize: number;

	constructor(blackboard: Container, gridSize: number = 50) {
		this.blackboard = blackboard;
		this.gridSize = gridSize;
		this.grid = new Graphics();
		this.blackboard.addChild(this.grid);
	}

	/**
	 * Crea una vista previa semitransparente del objeto a colocar.
	 */
	public createPreview(tool: string): Graphics {
		const preview = new Graphics();
		if (tool === "building") {
			preview.beginFill(0x00ff00, 0.5);
			preview.drawRect(-25, -25, 50, 50);
			preview.endFill();
		} else if (tool === "floor") {
			preview.beginFill(0x0000ff, 0.5);
			preview.drawRect(-25, -25, 50, 50);
			preview.endFill();
		} else if (tool === "eraser") {
			preview.beginFill(0xff0000, 0.5);
			preview.drawRect(-25, -25, 50, 50);
			preview.endFill();
		} else if (tool === "player") {
			preview.beginFill(0xffffff, 0.5);
			preview.drawRect(-25, -25, 50, 50);
			preview.endFill();
		} else if (tool === "flag") {
			preview.beginFill(0xf00fff, 0.5);
			preview.drawRect(-25, -25, 50, 50);
			preview.endFill();
		}
		return preview;
	}
	public drawBackground(): void {
		const bg = new Graphics();
		bg.beginFill(0x222222);
		// Área de 1920x1080 centrada en (0,0)
		bg.drawRect(-960, -540, 1920, 1080);
		bg.endFill();
		this.blackboard.addChildAt(bg, 0);
	}

	public drawGrid(): void {
		const width = 1920,
			height = 1080;
		this.grid.clear();
		this.grid.lineStyle(1, 0x666666, 0.5);
		for (let x = -width / 2; x <= width / 2; x += this.gridSize) {
			this.grid.moveTo(x, -height / 2);
			this.grid.lineTo(x, height / 2);
		}
		for (let y = -height / 2; y <= height / 2; y += this.gridSize) {
			this.grid.moveTo(-width / 2, y);
			this.grid.lineTo(width / 2, y);
		}
	}

	public cleanBlackboard(): void {
		this.blackboard.removeChildren();
		this.drawBackground();
		this.grid = new Graphics();
		this.blackboard.addChild(this.grid);
		this.drawGrid();
	}

	public getGrid(): Graphics {
		return this.grid;
	}

	/**
	 * Redondea la posición al grid.
	 */
	public getSnappedPosition(x: number, y: number): { x: number; y: number } {
		return {
			x: Math.round(x / this.gridSize) * this.gridSize,
			y: Math.round(y / this.gridSize) * this.gridSize,
		};
	}
}
