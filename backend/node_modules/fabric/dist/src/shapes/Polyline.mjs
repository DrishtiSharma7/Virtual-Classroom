import { _defineProperty } from "../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { config } from "../config.mjs";
import { SKEW_X, SKEW_Y } from "../constants.mjs";
import { classRegistry } from "../ClassRegistry.mjs";
import { Point } from "../Point.mjs";
import { degreesToRadians } from "../util/misc/radiansDegreesConversion.mjs";
import { calcDimensionsMatrix, transformPoint } from "../util/misc/matrix.mjs";
import { toFixed } from "../util/misc/toFixed.mjs";
import { escapeXml } from "../util/lang_string.mjs";
import { makeBoundingBoxFromPoints } from "../util/misc/boundingBoxFromPoints.mjs";
import { cacheProperties } from "./Object/defaultValues.mjs";
import { FabricObject } from "./Object/FabricObject.mjs";
import { projectStrokeOnPoints } from "../util/misc/projectStroke/index.mjs";
import { SHARED_ATTRIBUTES } from "../parser/attributes.mjs";
import { parseAttributes } from "../parser/parseAttributes.mjs";
import { parsePointsAttribute } from "../parser/parsePointsAttribute.mjs";
//#region src/shapes/Polyline.ts
const polylineDefaultValues = { exactBoundingBox: false };
var Polyline = class Polyline extends FabricObject {
	static getDefaults() {
		return {
			...super.getDefaults(),
			...Polyline.ownDefaults
		};
	}
	/**
	* Constructor
	* @param {Array} points Array of points (where each point is an object with x and y)
	* @param {Object} [options] Options object
	* @return {Polyline} thisArg
	* @example
	* var poly = new Polyline([
	*     { x: 10, y: 10 },
	*     { x: 50, y: 30 },
	*     { x: 40, y: 70 },
	*     { x: 60, y: 50 },
	*     { x: 100, y: 150 },
	*     { x: 40, y: 100 }
	*   ], {
	*   stroke: 'red',
	*   left: 100,
	*   top: 100
	* });
	*/
	constructor(points = [], options = {}) {
		super();
		_defineProperty(this, "strokeDiff", void 0);
		Object.assign(this, Polyline.ownDefaults);
		this.setOptions(options);
		this.points = points;
		const { left, top } = options;
		this.initialized = true;
		this.setBoundingBox(true);
		typeof left === "number" && this.set("left", left);
		typeof top === "number" && this.set("top", top);
	}
	isOpen() {
		return true;
	}
	_projectStrokeOnPoints(options) {
		return projectStrokeOnPoints(this.points, options, this.isOpen());
	}
	/**
	* Calculate the polygon bounding box
	* @private
	*/
	_calcDimensions(options) {
		options = {
			scaleX: this.scaleX,
			scaleY: this.scaleY,
			skewX: this.skewX,
			skewY: this.skewY,
			strokeLineCap: this.strokeLineCap,
			strokeLineJoin: this.strokeLineJoin,
			strokeMiterLimit: this.strokeMiterLimit,
			strokeUniform: this.strokeUniform,
			strokeWidth: this.strokeWidth,
			...options || {}
		};
		const points = this.exactBoundingBox ? this._projectStrokeOnPoints(options).map((projection) => projection.projectedPoint) : this.points;
		if (points.length === 0) return {
			left: 0,
			top: 0,
			width: 0,
			height: 0,
			pathOffset: new Point(),
			strokeOffset: new Point(),
			strokeDiff: new Point()
		};
		const bbox = makeBoundingBoxFromPoints(points), matrix = calcDimensionsMatrix({
			...options,
			scaleX: 1,
			scaleY: 1
		}), bboxNoStroke = makeBoundingBoxFromPoints(this.points.map((p) => transformPoint(p, matrix, true))), scale = new Point(this.scaleX, this.scaleY);
		let offsetX = bbox.left + bbox.width / 2, offsetY = bbox.top + bbox.height / 2;
		if (this.exactBoundingBox) {
			offsetX = offsetX - offsetY * Math.tan(degreesToRadians(this.skewX));
			offsetY = offsetY - offsetX * Math.tan(degreesToRadians(this.skewY));
		}
		return {
			...bbox,
			pathOffset: new Point(offsetX, offsetY),
			strokeOffset: new Point(bboxNoStroke.left, bboxNoStroke.top).subtract(new Point(bbox.left, bbox.top)).multiply(scale),
			strokeDiff: new Point(bbox.width, bbox.height).subtract(new Point(bboxNoStroke.width, bboxNoStroke.height)).multiply(scale)
		};
	}
	/**
	* This function is an helper for svg import. it returns the center of the object in the svg
	* untransformed coordinates, by look at the polyline/polygon points.
	* @private
	* @return {Point} center point from element coordinates
	*/
	_findCenterFromElement() {
		const bbox = makeBoundingBoxFromPoints(this.points);
		return new Point(bbox.left + bbox.width / 2, bbox.top + bbox.height / 2);
	}
	setDimensions() {
		this.setBoundingBox();
	}
	setBoundingBox(adjustPosition) {
		const { left, top, width, height, pathOffset, strokeOffset, strokeDiff } = this._calcDimensions();
		this.set({
			width,
			height,
			pathOffset,
			strokeOffset,
			strokeDiff
		});
		adjustPosition && this.setPositionByOrigin(new Point(left + width / 2, top + height / 2), "center", "center");
	}
	/**
	* @deprecated intermidiate method to be removed, do not use
	*/
	isStrokeAccountedForInDimensions() {
		return this.exactBoundingBox;
	}
	/**
	* @override stroke is taken in account in size
	*/
	_getNonTransformedDimensions() {
		return this.exactBoundingBox ? new Point(this.width, this.height) : super._getNonTransformedDimensions();
	}
	/**
	* @override stroke and skewing are taken into account when projecting stroke on points,
	* therefore we don't want the default calculation to account for skewing as well.
	* Though it is possible to pass `width` and `height` in `options`, doing so is very strange, use with discretion.
	*
	* @private
	*/
	_getTransformedDimensions(options = {}) {
		if (this.exactBoundingBox) {
			let size;
			if (Object.keys(options).some((key) => this.strokeUniform || this.constructor.layoutProperties.includes(key))) {
				var _options$width, _options$height;
				const { width, height } = this._calcDimensions(options);
				size = new Point((_options$width = options.width) !== null && _options$width !== void 0 ? _options$width : width, (_options$height = options.height) !== null && _options$height !== void 0 ? _options$height : height);
			} else {
				var _options$width2, _options$height2;
				size = new Point((_options$width2 = options.width) !== null && _options$width2 !== void 0 ? _options$width2 : this.width, (_options$height2 = options.height) !== null && _options$height2 !== void 0 ? _options$height2 : this.height);
			}
			return size.multiply(new Point(options.scaleX || this.scaleX, options.scaleY || this.scaleY));
		} else return super._getTransformedDimensions(options);
	}
	/**
	* Recalculates dimensions when changing skew and scale
	* @private
	*/
	_set(key, value) {
		const changed = this.initialized && this[key] !== value;
		const output = super._set(key, value);
		if (this.exactBoundingBox && changed && ((key === "scaleX" || key === "scaleY") && this.strokeUniform && this.constructor.layoutProperties.includes("strokeUniform") || this.constructor.layoutProperties.includes(key))) this.setDimensions();
		return output;
	}
	/**
	* Returns object representation of an instance
	* @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
	* @return {Object} Object representation of an instance
	*/
	toObject(propertiesToInclude = []) {
		return {
			...super.toObject(propertiesToInclude),
			points: this.points.map(({ x, y }) => ({
				x,
				y
			}))
		};
	}
	/**
	* Returns svg representation of an instance
	* @return {Array} an array of strings with the specific svg representation
	* of the instance
	*/
	_toSVG() {
		const diffX = this.pathOffset.x, diffY = this.pathOffset.y, NUM_FRACTION_DIGITS = config.NUM_FRACTION_DIGITS;
		const points = this.points.map(({ x, y }) => `${toFixed(x - diffX, NUM_FRACTION_DIGITS)},${toFixed(y - diffY, NUM_FRACTION_DIGITS)}`).join(" ");
		return [
			`<${escapeXml(this.constructor.type).toLowerCase()} `,
			"COMMON_PARTS",
			`points="${points}" />\n`
		];
	}
	/**
	* @private
	* @param {CanvasRenderingContext2D} ctx Context to render on
	*/
	_render(ctx) {
		const len = this.points.length, x = this.pathOffset.x, y = this.pathOffset.y;
		if (!len || isNaN(this.points[len - 1].y)) return;
		ctx.beginPath();
		ctx.moveTo(this.points[0].x - x, this.points[0].y - y);
		for (let i = 0; i < len; i++) {
			const point = this.points[i];
			ctx.lineTo(point.x - x, point.y - y);
		}
		!this.isOpen() && ctx.closePath();
		this._renderPaintInOrder(ctx);
	}
	/**
	* Returns complexity of an instance
	* @return {Number} complexity of this instance
	*/
	complexity() {
		return this.points.length;
	}
	/**
	* Returns Polyline instance from an SVG element
	* @param {HTMLElement} element Element to parser
	* @param {Object} [options] Options object
	*/
	static async fromElement(element, options, cssRules) {
		const points = parsePointsAttribute(element.getAttribute("points")), { left, top, ...parsedAttributes } = parseAttributes(element, this.ATTRIBUTE_NAMES, cssRules);
		return new this(points, {
			...parsedAttributes,
			...options
		});
	}
	/**
	* Returns Polyline instance from an object representation
	* @param {Object} object Object to create an instance from
	* @returns {Promise<Polyline>}
	*/
	static fromObject(object) {
		return this._fromObject(object, { extraParam: "points" });
	}
};
_defineProperty(Polyline, "ownDefaults", polylineDefaultValues);
_defineProperty(Polyline, "type", "Polyline");
_defineProperty(Polyline, "layoutProperties", [
	SKEW_X,
	SKEW_Y,
	"strokeLineCap",
	"strokeLineJoin",
	"strokeMiterLimit",
	"strokeWidth",
	"strokeUniform",
	"points"
]);
_defineProperty(Polyline, "cacheProperties", [...cacheProperties, "points"]);
_defineProperty(Polyline, "ATTRIBUTE_NAMES", [...SHARED_ATTRIBUTES]);
classRegistry.setClass(Polyline);
classRegistry.setSVGClass(Polyline);
//#endregion
export { Polyline, polylineDefaultValues };

//# sourceMappingURL=Polyline.mjs.map