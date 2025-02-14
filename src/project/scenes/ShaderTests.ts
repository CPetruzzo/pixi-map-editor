import { Graphics } from "@pixi/graphics";
import { Filter } from "@pixi/core";
import { Manager } from "../..";
import { PixiScene } from "../../engine/scenemanager/scenes/PixiScene";

export class ShaderTest extends PixiScene {
	private filter: Filter;
	constructor() {
		super();

		// Creamos un objeto Graphics para dibujar una forma en pantalla
		const shape = new Graphics();
		shape.beginFill(0xffffff);
		shape.drawRect(0, 0, Manager.width, Manager.height);
		shape.endFill();
		this.addChild(shape);

		// Creamos un filtro personalizado utilizando el shader proporcionado
		const shaderCode = `
            precision mediump float;
            
            vec3 palette( float t ) {
                vec3 a = vec3(0.5, 0.5, 0.5);
                vec3 b = vec3(0.5, 0.5, 0.5);
                vec3 c = vec3(1.0, 1.0, 1.0);
                vec3 d = vec3(0.263,0.416,0.557);

                return a + b*cos( 6.28318*(c*t+d) );
            }

            uniform float time;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / vec2(${Manager.width.toFixed(1)}, ${Manager.height.toFixed(1)});
                vec3 color = palette(length(uv) + time * 0.4);

                gl_FragColor = vec4(color, 1.0);
            }
        `;

		this.filter = new Filter(undefined, shaderCode, { time: 0 });
		shape.filters = [this.filter];
	}

	public override update(): void {
		this.filter.uniforms.time += 0.01;
	}
}
