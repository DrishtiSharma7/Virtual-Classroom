import { _defineProperty } from "../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { CENTER } from "../constants.mjs";
import { classRegistry } from "../ClassRegistry.mjs";
import { Point } from "../Point.mjs";
import { isFiller } from "../util/typeAssertions.mjs";
import { makeBoundingBoxFromPoints } from "../util/misc/boundingBoxFromPoints.mjs";
import { cacheProperties } from "./Object/defaultValues.mjs";
import { FabricObject } from "./Object/FabricObject.mjs";
import { SHARED_ATTRIBUTES } from "../parser/attributes.mjs";
import { parseAttributes } from "../parser/parseAttributes.mjs";
//#region src/shapes/Line.ts
const coordProps = [
	"x1",
	"x2",
	"y1",
	"y2"
];
/**
* A Class to draw a line
* A bunch of methods will be added to Polyline to handle the line case
* The line class is very strange to work with, is all special, it hardly aligns
* to what a developer want everytime there is an angle
* @deprecated
*/
var Line = class Line extends FabricObject {
	/**
	* Constructor
	* @param {Array} [points] Array of points
	* @param {Object} [options] Options object
	* @return {Line} thisArg
	*/
	constructor([x1, y1, x2, y2] = [
		0,
		0,
		0,
		0
	], options = {}) {
		super();
		Object.assign(this, Line.ownDefaults);
		this.setOptions(options);
		this.x1 = x1;
		this.x2 = x2;
		this.y1 = y1;
		this.y2 = y2;
		this._setWidthHeight();
		const { left, top } = options;
		typeof left === "number" && this.set("left", left);
		typeof top === "number" && this.set("top", top);
	}
	/**
	* @private
	* @param {Object} [options] Options
	*/
	_setWidthHeight() {
		const { x1, y1, x2, y2 } = this;
		this.width = Math.abs(x2 - x1);
		this.height = Math.abs(y2 - y1);
		const { left, top, width, height } = makeBoundingBoxFromPoints([{
			x: x1,
			y: y1
		}, {
			x: x2,
			y: y2
		}]);
		const position = new Point(left + width / 2, top + height / 2);
		this.setPositionByOrigin(position, CENTER, CENTER);
	}
	/**
	* @private
	* @param {String} key
	* @param {*} value
	*/
	_set(key, value) {
		super._set(key, value);
		if (coordProps.includes(key)) this._setWidthHeight();
		return this;
	}
	/**
	* @private
	* @param {CanvasRenderingContext2D} ctx Context to render on
	*/
	_render(ctx) {
		ctx.beginPath();
		const p = this.calcLinePoints();
		ctx.moveTo(p.x1, p.y1);
		ctx.lineTo(p.x2, p.y2);
		ctx.lineWidth = this.strokeWidth;
		const origStrokeStyle = ctx.strokeStyle;
		if (isFiller(this.stroke)) ctx.strokeStyle = this.stroke.toLive(ctx);
		else {
			var _this$stroke;
			ctx.strokeStyle = (_this$stroke = this.stroke) !== null && _this$stroke !== void 0 ? _this$stroke : ctx.fillStyle;
		}
		this.stroke && this._renderStroke(ctx);
		ctx.strokeStyle = origStrokeStyle;
	}
	/**
	* This function is an helper for svg import. it returns the center of the object in the svg
	* untransformed coordinates
	* @private
	* @return {Point} center point from element coordinates
	*/
	_findCenterFromElement() {
		return new Point((this.x1 + this.x2) / 2, (this.y1 + this.y2) / 2);
	}
	/**
	* Returns object representation of an instance
	* @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
	* @return {Object} object representation of an instance
	*/
	toObject(propertiesToInclude = []) {
		return {
			...super.toObject(propertiesToInclude),
			...this.calcLinePoints()
		};
	}
	_getNonTransformedDimensions() {
		const dim = super._getNonTransformedDimensions();
		if (this.strokeLineCap === "butt") {
			if (this.width === 0) dim.y -= this.strokeWidth;
			if (this.height === 0) dim.x -= this.strokeWidth;
		}
		return dim;
	}
	/**
	* Recalculates line points given width and height
	* Those points are simply placed around the center,
	* This is not useful outside internal render functions and svg output
	* Is not meant to be for the developer.
	* @private
	*/
	calcLinePoints() {
		const { x1: _x1, x2: _x2, y1: _y1, y2: _y2, width, height } = this;
		const xMult = _x1 <= _x2 ? -.5 : .5, yMult = _y1 <= _y2 ? -.5 : .5;
		return {
			x1: xMult * width,
			x2: xMult * -width,
			y1: yMult * height,
			y2: yMult * -height
		};
	}
	/**
	* Returns svg representation of an instance
	* @return {Array} an array of strings with the specific svg representation
	* of the instance
	*/
	_toSVG() {
		const { x1, x2, y1, y2 } = this.calcLinePoints();
		return [
			"<line ",
			"COMMON_PARTS",
			`x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />\n`
		];
	}
	/**
	* Returns Line instance from an SVG element
	* @param {HTMLElement} element Element to parse
	* @param {Object} [options] Options object
	* @param {Function} [callback] callback function invoked after parsing
	*/
	static async fromElement(element, options, cssRules) {
		const { x1 = 0, y1 = 0, x2 = 0, y2 = 0, ...parsedAttributes } = parseAttributes(element, this.ATTRIBUTE_NAMES, cssRules);
		return new this([
			x1,
			y1,
			x2,
			y2
		], parsedAttributes);
	}
	/**
	* Returns Line instance from an object representation
	* @param {Object} object Object to create an instance from
	* @returns {Promise<Line>}
	*/
	static fromObject({ x1, y1, x2, y2, ...object }) {
		return this._fromObject({
			...object,
			points: [
				x1,
				y1,
				x2,
				y2
			]
		}, { extraParam: "points" });
	}
};
_defineProperty(Line, "type", "Line");
_defineProperty(Line, "cacheProperties", [...cacheProperties, ...coordProps]);
_defineProperty(Line, "ATTRIBUTE_NAMES", SHARED_ATTRIBUTES.concat(coordProps));
classRegistry.setClass(Line);
classRegistry.setSVGClass(Line);
//#endregion
export { Line };

//# sourceMappingURL=Line.mjs.map