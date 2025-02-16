import type { DisplayObject } from "@pixi/display";
import { Container } from "@pixi/display";
import type { Graphics } from "@pixi/graphics";
import { Point } from "@pixi/math";
import { Sprite } from "@pixi/sprite";
import { Text, TextStyle } from "@pixi/text";
import i18next from "i18next";
import { Response } from "sat";
import { PixiScene } from "../../engine/scenemanager/scenes/PixiScene";
import type { IHitable } from "../../engine/collision/IHitable";
import { HitPoly } from "../../engine/collision/HitPoly";
import { Hit } from "../../engine/collision/Hit";
import { GraphicsHelper } from "../../engine/utils/GraphicsHelper";
import { lerp } from "../../engine/utils/MathUtils";
import type { FederatedPointerEvent } from "pixi.js";

export class ShootingScene extends PixiScene {
	public static readonly BUNDLES = ["construction"];

	private currentlyDragging: DisplayObject | null = null;
	private draggingOffset: Point = new Point();
	private sprs: Sprite[] = [];
	private hitboxes: (Graphics & IHitable)[] = [];
	private debugContainer = new Container();

	constructor() {
		super();

		const instructions = new Text(i18next.t<string>("demos.sat.instructions"), new TextStyle({ fill: "white", fontFamily: "Arial Rounded MT" }));
		instructions.x = 100;
		this.addChild(instructions);

		// * A simple square hitbox
		let spr = Sprite.from("flag");
		spr.x = 100;
		spr.y = 100;
		let hitbox = HitPoly.makeBox(0, 0, spr.width, spr.height, true);
		spr.addChild(hitbox);
		this.hitboxes.push(hitbox);
		this.sprs.push(spr);

		// * A really ugly concave shape
		spr = Sprite.from("player");
		spr.anchor.set(0.18, 0.09);
		spr.scale.set(1);
		spr.x = 300;
		spr.y = 500;

		hitbox = new HitPoly(
			[
				new Point(0, 0),
				new Point(90, 0),
				new Point(130, 10),
				new Point(160, 25),
				new Point(225, 60),
				new Point(270, 50),
				new Point(315, 55),
				new Point(330, 70),
				new Point(340, 90),
				new Point(350, 70),
				new Point(365, 55),
				new Point(380, 45),
				new Point(700, 175),
				new Point(100, 175),
				new Point(100, 215),
				new Point(80, 215),
				new Point(80, 175),
				new Point(0, 175),
			],
			true
		);

		spr.addChild(hitbox);
		this.hitboxes.push(hitbox);
		this.sprs.push(spr);

		this.addChild(...this.sprs);
		this.makeDemoControls();
		this.addChild(this.debugContainer);
	}

	public override update(): void {
		this.debugContainer.removeChildren().forEach((c) => c.destroy());
		this.sprs.forEach((s) => (s.tint = 0xffffff));

		const result = new Response();
		for (let i = 0; i < this.hitboxes.length; i++) {
			for (let j = 0; j < this.hitboxes.length; j++) {
				if (i === j) {
					continue;
				}
				const hitA = this.hitboxes[i];
				const hitB = this.hitboxes[j];
				const sprA = this.sprs[i];
				const sprB = this.sprs[j];

				if (Hit.test(hitA, hitB, result)) {
					sprA.tint = 0x0000ff;
					sprB.tint = 0x0000ff;

					const overlapGraphic = GraphicsHelper.arrow({
						x: result.overlapN.x,
						y: result.overlapN.y,
						magnitude: result.overlap,
					});
					overlapGraphic.position.copyFrom(hitA.getGlobalPosition());
					this.debugContainer.addChild(overlapGraphic);
				}
			}
		}
	}

	private makeDemoControls(): void {
		for (const draggable of this.sprs) {
			draggable.interactive = true;
			draggable.on("pointerdown", this.startDrag, this);
			draggable.on("pointerup", this.endDrag, this);
			draggable.on("pointerupoutside", this.endDrag, this);
			draggable.on("pointermove", this.onDragMove, this);
		}
	}

	private startDrag(event: FederatedPointerEvent): void {
		const target = event.currentTarget as DisplayObject;
		const parentPosition = event.data.getLocalPosition(target.parent);

		this.draggingOffset = new Point(parentPosition.x, parentPosition.y);

		target.position.set(target.position.x - this.draggingOffset.x, target.position.y - this.draggingOffset.y);

		this.currentlyDragging = target;
	}

	private endDrag(): void {
		this.currentlyDragging = null;
	}

	private onDragMove(event: FederatedPointerEvent): void {
		if (!this.currentlyDragging) {
			return;
		}
		const newPosition = event.data.getLocalPosition(this.currentlyDragging.parent);
		this.currentlyDragging.x = lerp(this.currentlyDragging.x, newPosition.x + this.draggingOffset.x, 0.5);
		this.currentlyDragging.y = lerp(this.currentlyDragging.y, newPosition.y + this.draggingOffset.y, 0.5);
	}
}
