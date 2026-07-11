import { _defineProperty } from "../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { SCALE_X, SCALE_Y } from "../constants.mjs";
import { classRegistry } from "../ClassRegistry.mjs";
import { cos } from "../util/misc/cos.mjs";
import { sin } from "../util/misc/sin.mjs";
import { degreesToRadians } from "../util/misc/radiansDegreesConversion.mjs";
import { escapeXml } from "../util/lang_string.mjs";
import { cacheProperties } from "./Object/defaultValues.mjs";
import { FabricObject } from "./Object/FabricObject.mjs";
import { SHARED_ATTRIBUTES } from "../parser/attributes.mjs";
import { parseAttributes } from "../parser/parseAttributes.mjs";
//#region src/shapes/Circle.ts
const CIRCLE_PROPS = [
	"radius",
	"startAngle",
	"endAngle",
	"counterClockwise"
];
const circleDefaultValues = {
	radius: 0,
	startAngle: 0,
	endAngle: 360,
	counterClockwise: false
};
var Circle = class Circle extends FabricObject {
	static getDefaults() {
		return {
			...super.getDefaults(),
			...Circle.ownDefaults
		};
	}
	/**
	* Constructor
	* @param {Object} [options] Options object
	*/
	constructor(options) {
		super();
		Object.assign(this, Circle.ownDefaults);
		this.setOptions(options);
	}
	/**
	* @private
	* @param {String} key
	* @param {*} value
	*/
	_set(key, value) {
		super._set(key, value);
		if (key === "radius") this.setRadius(value);
		return this;
	}
	/**
	* @private
	* @param {CanvasRenderingContext2D} ctx context to render on
	*/
	_render(ctx) {
		ctx.beginPath();
		ctx.arc(0, 0, this.radius, degreesToRadians(this.startAngle), degreesToRadians(this.endAngle), this.counterClockwise);
		this._renderPaintInOrder(ctx);
	}
	/**
	* Returns horizontal radius of an object (according to how an object is scaled)
	* @return {Number}
	*/
	getRadiusX() {
		return this.get("radius") * this.get(SCALE_X);
	}
	/**
	* Returns vertical radius of an object (according to how an object is scaled)
	* @return {Number}
	*/
	getRadiusY() {
		return this.get("radius") * this.get(SCALE_Y);
	}
	/**
	* Sets radius of an object (and updates width accordingly)
	*/
	setRadius(value) {
		this.radius = value;
		this.set({
			width: value * 2,
			height: value * 2
		});
	}
	/**
	* Returns object representation of an instance
	* @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
	* @return {Object} object representation of an instance
	*/
	toObject(propertiesToInclude = []) {
		return super.toObject([...CIRCLE_PROPS, ...propertiesToInclude]);
	}
	/**
	* Returns svg representation of an instance
	* @return {Array} an array of strings with the specific svg representation
	* of the instance
	*/
	_toSVG() {
		const { radius, startAngle, endAngle } = this;
		const angle = (endAngle - startAngle) % 360;
		if (angle === 0) return [
			"<circle ",
			"COMMON_PARTS",
			"cx=\"0\" cy=\"0\" ",
			"r=\"",
			`${escapeXml(radius)}`,
			"\" />\n"
		];
		else {
			const start = degreesToRadians(startAngle), end = degreesToRadians(endAngle), startX = cos(start) * radius, startY = sin(start) * radius, endX = cos(end) * radius, endY = sin(end) * radius;
			return [
				`<path d="M ${startX} ${startY} A ${radius} ${radius} 0 ${angle > 180 ? 1 : 0} ${this.counterClockwise ? 0 : 1} ${endX} ${endY}" `,
				"COMMON_PARTS",
				" />\n"
			];
		}
	}
	/**
	* Returns {@link Circle} instance from an SVG element
	* @param {HTMLElement} element Element to parse
	* @param {Object} [options] Partial Circle object to default missing properties on the element.
	* @throws {Error} If value of `r` attribute is missing or invalid
	*/
	static async fromElement(element, options, cssRules) {
		const { left = 0, top = 0, radius = 0, ...otherParsedAttributes } = parseAttributes(element, this.ATTRIBUTE_NAMES, cssRules);
		return new this({
			...otherParsedAttributes,
			radius,
			left: left - radius,
			top: top - radius
		});
	}
	/**
	* @todo how do we declare this??
	*/
	static fromObject(object) {
		return super._fromObject(object);
	}
};
_defineProperty(Circle, "type", "Circle");
_defineProperty(Circle, "cacheProperties", [...cacheProperties, ...CIRCLE_PROPS]);
_defineProperty(Circle, "ownDefaults", circleDefaultValues);
_defineProperty(Circle, "ATTRIBUTE_NAMES", [
	"cx",
	"cy",
	"r",
	...SHARED_ATTRIBUTES
]);
classRegistry.setClass(Circle);
classRegistry.setSVGClass(Circle);
//#endregion
export { Circle };

//# sourceMappingURL=Circle.mjs.map