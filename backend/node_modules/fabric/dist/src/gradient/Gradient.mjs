import { _defineProperty } from "../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { iMatrix } from "../constants.mjs";
import { classRegistry } from "../ClassRegistry.mjs";
import { uid } from "../util/internals/uid.mjs";
import { pick } from "../util/misc/pick.mjs";
import { matrixToSVG } from "../util/misc/svgExport.mjs";
import { isPath } from "../util/typeAssertions.mjs";
import { escapeXml } from "../util/lang_string.mjs";
import { isSafeSvgStyleValue } from "../util/internals/svgExportCheck.mjs";
import { Color } from "../color/Color.mjs";
import { parseTransformAttribute } from "../parser/parseTransformAttribute.mjs";
import { linearDefaultCoords, radialDefaultCoords } from "./constants.mjs";
import { parseColorStops } from "./parser/parseColorStops.mjs";
import { parseGradientUnits, parseType } from "./parser/misc.mjs";
import { parseCoords } from "./parser/parseCoords.mjs";
//#region src/gradient/Gradient.ts
/**
* Gradient class
* @class Gradient
* @see {@link http://fabric5.fabricjs.com/fabric-intro-part-2#gradients}
*/
var Gradient = class {
	constructor(options) {
		const { type = "linear", gradientUnits = "pixels", coords = {}, colorStops = [], offsetX = 0, offsetY = 0, gradientTransform, id } = options || {};
		Object.assign(this, {
			type,
			gradientUnits,
			coords: {
				...type === "radial" ? radialDefaultCoords : linearDefaultCoords,
				...coords
			},
			colorStops,
			offsetX,
			offsetY,
			gradientTransform,
			id: id ? `${id}_${uid()}` : uid()
		});
	}
	/**
	* Adds another colorStop
	* @param {Record<string, string>} colorStop Object with offset and color
	* @return {Gradient} thisArg
	*/
	addColorStop(colorStops) {
		for (const position in colorStops) this.colorStops.push({
			offset: parseFloat(position),
			color: colorStops[position]
		});
		return this;
	}
	/**
	* Returns object representation of a gradient
	* @param {string[]} [propertiesToInclude] Any properties that you might want to additionally include in the output
	* @return {object}
	*/
	toObject(propertiesToInclude) {
		return {
			...pick(this, propertiesToInclude),
			type: this.type,
			coords: { ...this.coords },
			colorStops: this.colorStops.map((colorStop) => ({ ...colorStop })),
			offsetX: this.offsetX,
			offsetY: this.offsetY,
			gradientUnits: this.gradientUnits,
			gradientTransform: this.gradientTransform ? [...this.gradientTransform] : void 0
		};
	}
	/**
	* Returns SVG representation of an gradient
	* @param {FabricObject} object Object to create a gradient for
	* @return {String} SVG representation of an gradient (linear/radial)
	*/
	toSVG(object, { additionalTransform: preTransform } = {}) {
		const markup = [], transform = this.gradientTransform ? this.gradientTransform.concat() : iMatrix.concat(), gradientUnits = this.gradientUnits === "pixels" ? "userSpaceOnUse" : "objectBoundingBox";
		const colorStops = this.colorStops.map((colorStop) => ({ ...colorStop })).sort((a, b) => {
			return a.offset - b.offset;
		});
		let offsetX = -this.offsetX, offsetY = -this.offsetY;
		if (gradientUnits === "objectBoundingBox") {
			offsetX /= object.width;
			offsetY /= object.height;
		} else {
			offsetX += object.width / 2;
			offsetY += object.height / 2;
		}
		if (isPath(object) && this.gradientUnits !== "percentage") {
			offsetX -= object.pathOffset.x;
			offsetY -= object.pathOffset.y;
		}
		transform[4] -= offsetX;
		transform[5] -= offsetY;
		const commonAttributes = [
			`id="SVGID_${escapeXml(String(this.id))}"`,
			`gradientUnits="${gradientUnits}"`,
			`gradientTransform="${preTransform ? preTransform + " " : ""}${matrixToSVG(transform)}"`,
			""
		].join(" ");
		const sanitizeCoord = (value) => parseFloat(String(value));
		if (this.type === "linear") {
			const { x1, y1, x2, y2 } = this.coords;
			const sx1 = sanitizeCoord(x1);
			const sy1 = sanitizeCoord(y1);
			const sx2 = sanitizeCoord(x2);
			const sy2 = sanitizeCoord(y2);
			markup.push("<linearGradient ", commonAttributes, " x1=\"", sx1, "\" y1=\"", sy1, "\" x2=\"", sx2, "\" y2=\"", sy2, "\">\n");
		} else if (this.type === "radial") {
			const { x1, y1, x2, y2, r1, r2 } = this.coords;
			const sx1 = sanitizeCoord(x1);
			const sy1 = sanitizeCoord(y1);
			const sx2 = sanitizeCoord(x2);
			const sy2 = sanitizeCoord(y2);
			const sr1 = sanitizeCoord(r1);
			const sr2 = sanitizeCoord(r2);
			const needsSwap = sr1 > sr2;
			markup.push("<radialGradient ", commonAttributes, " cx=\"", needsSwap ? sx1 : sx2, "\" cy=\"", needsSwap ? sy1 : sy2, "\" r=\"", needsSwap ? sr1 : sr2, "\" fx=\"", needsSwap ? sx2 : sx1, "\" fy=\"", needsSwap ? sy2 : sy1, "\">\n");
			if (needsSwap) {
				colorStops.reverse();
				colorStops.forEach((colorStop) => {
					colorStop.offset = 1 - colorStop.offset;
				});
			}
			const minRadius = Math.min(sr1, sr2);
			if (minRadius > 0) {
				const percentageShift = minRadius / Math.max(sr1, sr2);
				colorStops.forEach((colorStop) => {
					colorStop.offset += percentageShift * (1 - colorStop.offset);
				});
			}
		}
		colorStops.forEach(({ color, offset }) => {
			const rawColor = String(color);
			const serializedColor = isSafeSvgStyleValue(rawColor) ? rawColor : new Color(rawColor).toRgba();
			markup.push(`<stop offset="${offset * 100}%" style="stop-color:${escapeXml(serializedColor)};"/>\n`);
		});
		markup.push(this.type === "linear" ? "</linearGradient>" : "</radialGradient>", "\n");
		return markup.join("");
	}
	/**
	* Returns an instance of CanvasGradient
	* @param {CanvasRenderingContext2D} ctx Context to render on
	* @return {CanvasGradient}
	*/
	toLive(ctx) {
		const { x1, y1, x2, y2, r1, r2 } = this.coords;
		const gradient = this.type === "linear" ? ctx.createLinearGradient(x1, y1, x2, y2) : ctx.createRadialGradient(x1, y1, r1, x2, y2, r2);
		this.colorStops.forEach(({ color, offset }) => {
			gradient.addColorStop(offset, color);
		});
		return gradient;
	}
	static async fromObject(options) {
		const { colorStops, gradientTransform } = options;
		return new this({
			...options,
			colorStops: colorStops ? colorStops.map((colorStop) => ({ ...colorStop })) : void 0,
			gradientTransform: gradientTransform ? [...gradientTransform] : void 0
		});
	}
	/**
	* Returns {@link Gradient} instance from an SVG element
	* @param {SVGGradientElement} el SVG gradient element
	* @param {FabricObject} instance
	* @param {String} opacity A fill-opacity or stroke-opacity attribute to multiply to each stop's opacity.
	* @param {SVGOptions} svgOptions an object containing the size of the SVG in order to parse correctly gradients
	* that uses gradientUnits as 'userSpaceOnUse' and percentages.
	* @return {Gradient} Gradient instance
	* @see http://www.w3.org/TR/SVG/pservers.html#LinearGradientElement
	* @see http://www.w3.org/TR/SVG/pservers.html#RadialGradientElement
	*
	*  @example
	*
	*  <linearGradient id="linearGrad1">
	*    <stop offset="0%" stop-color="white"/>
	*    <stop offset="100%" stop-color="black"/>
	*  </linearGradient>
	*
	*  OR
	*
	*  <linearGradient id="linearGrad2">
	*    <stop offset="0" style="stop-color:rgb(255,255,255)"/>
	*    <stop offset="1" style="stop-color:rgb(0,0,0)"/>
	*  </linearGradient>
	*
	*  OR
	*
	*  <radialGradient id="radialGrad1">
	*    <stop offset="0%" stop-color="white" stop-opacity="1" />
	*    <stop offset="50%" stop-color="black" stop-opacity="0.5" />
	*    <stop offset="100%" stop-color="white" stop-opacity="1" />
	*  </radialGradient>
	*
	*  OR
	*
	*  <radialGradient id="radialGrad2">
	*    <stop offset="0" stop-color="rgb(255,255,255)" />
	*    <stop offset="0.5" stop-color="rgb(0,0,0)" />
	*    <stop offset="1" stop-color="rgb(255,255,255)" />
	*  </radialGradient>
	*
	*/
	static fromElement(el, instance, svgOptions) {
		const gradientUnits = parseGradientUnits(el);
		const center = instance._findCenterFromElement();
		return new this({
			id: el.getAttribute("id") || void 0,
			type: parseType(el),
			coords: parseCoords(el, {
				width: svgOptions.viewBoxWidth || svgOptions.width,
				height: svgOptions.viewBoxHeight || svgOptions.height
			}),
			colorStops: parseColorStops(el, svgOptions.opacity),
			gradientUnits,
			gradientTransform: parseTransformAttribute(el.getAttribute("gradientTransform") || ""),
			...gradientUnits === "pixels" ? {
				offsetX: instance.width / 2 - center.x,
				offsetY: instance.height / 2 - center.y
			} : {
				offsetX: 0,
				offsetY: 0
			}
		});
	}
};
_defineProperty(Gradient, "type", "Gradient");
classRegistry.setClass(Gradient, "gradient");
classRegistry.setClass(Gradient, "linear");
classRegistry.setClass(Gradient, "radial");
//#endregion
export { Gradient };

//# sourceMappingURL=Gradient.mjs.map