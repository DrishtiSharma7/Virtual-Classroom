import { _defineProperty } from "../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { classRegistry } from "../ClassRegistry.mjs";
import { FabricObject } from "./Object/FabricObject.mjs";
//#region src/shapes/Triangle.ts
const triangleDefaultValues = {
	width: 100,
	height: 100
};
var Triangle = class Triangle extends FabricObject {
	static getDefaults() {
		return {
			...super.getDefaults(),
			...Triangle.ownDefaults
		};
	}
	/**
	* Constructor
	* @param {Object} [options] Options object
	*/
	constructor(options) {
		super();
		Object.assign(this, Triangle.ownDefaults);
		this.setOptions(options);
	}
	/**
	* @private
	* @param {CanvasRenderingContext2D} ctx Context to render on
	*/
	_render(ctx) {
		const widthBy2 = this.width / 2, heightBy2 = this.height / 2;
		ctx.beginPath();
		ctx.moveTo(-widthBy2, heightBy2);
		ctx.lineTo(0, -heightBy2);
		ctx.lineTo(widthBy2, heightBy2);
		ctx.closePath();
		this._renderPaintInOrder(ctx);
	}
	/**
	* Returns svg representation of an instance
	* @return {Array} an array of strings with the specific svg representation
	* of the instance
	*/
	_toSVG() {
		const widthBy2 = this.width / 2, heightBy2 = this.height / 2;
		return [
			"<polygon ",
			"COMMON_PARTS",
			"points=\"",
			`${-widthBy2} ${heightBy2},0 ${-heightBy2},${widthBy2} ${heightBy2}`,
			"\" />"
		];
	}
};
_defineProperty(Triangle, "type", "Triangle");
_defineProperty(Triangle, "ownDefaults", triangleDefaultValues);
classRegistry.setClass(Triangle);
classRegistry.setSVGClass(Triangle);
//#endregion
export { Triangle };

//# sourceMappingURL=Triangle.mjs.map