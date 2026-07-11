import { config } from "../../config.mjs";
import { FILL } from "../../constants.mjs";
import { toFixed } from "./toFixed.mjs";
import { escapeXml } from "../lang_string.mjs";
import { isSafeSvgStyleValue } from "../internals/svgExportCheck.mjs";
import { Color } from "../../color/Color.mjs";
//#region src/util/misc/svgParsing.ts
/**
* Returns array of attributes for given svg that fabric parses
* @param {SVGElementName} type Type of svg element (eg. 'circle')
* @return {Array} string names of supported attributes
*/
const getSvgAttributes = (type) => {
	const commonAttributes = [
		"instantiated_by_use",
		"style",
		"id",
		"class"
	];
	switch (type) {
		case "linearGradient": return commonAttributes.concat([
			"x1",
			"y1",
			"x2",
			"y2",
			"gradientUnits",
			"gradientTransform"
		]);
		case "radialGradient": return commonAttributes.concat([
			"gradientUnits",
			"gradientTransform",
			"cx",
			"cy",
			"r",
			"fx",
			"fy",
			"fr"
		]);
		case "stop": return commonAttributes.concat([
			"offset",
			"stop-color",
			"stop-opacity"
		]);
	}
	return commonAttributes;
};
/**
* Converts from attribute value to pixel value if applicable.
* Returns converted pixels or original value not converted.
* @param {string} value number to operate on
* @param {number} fontSize
* @return {number}
*/
const parseUnit = (value, fontSize = 16) => {
	const unit = /\D{0,2}$/.exec(value), number = parseFloat(value);
	const dpi = config.DPI;
	switch (unit === null || unit === void 0 ? void 0 : unit[0]) {
		case "mm": return number * dpi / 25.4;
		case "cm": return number * dpi / 2.54;
		case "in": return number * dpi;
		case "pt": return number * dpi / 72;
		case "pc": return number * dpi / 72 * 12;
		case "em": return number * fontSize;
		default: return number;
	}
};
const parseAlign = (align) => {
	if (align && align !== "none") return [align.slice(1, 4), align.slice(5, 8)];
	else if (align === "none") return [align, align];
	return ["Mid", "Mid"];
};
/**
* Parse preserveAspectRatio attribute from element
* https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/preserveAspectRatio
* @param {string} attribute to be parsed
* @return {Object} an object containing align and meetOrSlice attribute
*/
const parsePreserveAspectRatioAttribute = (attribute) => {
	const [firstPart, secondPart] = attribute.trim().split(" ");
	const [alignX, alignY] = parseAlign(firstPart);
	return {
		meetOrSlice: secondPart || "meet",
		alignX,
		alignY
	};
};
/**
* Adobe Illustrator (at least CS5) is unable to render rgba()-based fill values
* we work around it by "moving" alpha channel into opacity attribute and setting fill's alpha to 1
* @param prop
* @param value
* @param {boolean} inlineStyle The default is inline style, the separator used is ":", The other is "="
* @returns
*/
const colorPropToSVG = (prop, value, inlineStyle = true) => {
	let colorValue;
	let opacityValue;
	if (!value) colorValue = "none";
	else if (value.toLive) colorValue = `url(#SVGID_${escapeXml(value.id)})`;
	else {
		const rawValue = String(value);
		if (!isSafeSvgStyleValue(rawValue)) colorValue = new Color("black").toRgb();
		else {
			const color = new Color(rawValue), opacity = color.getAlpha();
			colorValue = color.toRgb();
			if (opacity !== 1) opacityValue = opacity.toString();
		}
	}
	if (inlineStyle) return `${prop}: ${colorValue}; ${opacityValue ? `${prop}-opacity: ${opacityValue}; ` : ""}`;
	else return `${prop}="${colorValue}" ${opacityValue ? `${prop}-opacity="${opacityValue}" ` : ""}`;
};
const createSVGRect = (color, { left, top, width, height }, precision = config.NUM_FRACTION_DIGITS) => {
	const svgColor = colorPropToSVG(FILL, color, false);
	const [x, y, w, h] = [
		left,
		top,
		width,
		height
	].map((value) => toFixed(value, precision));
	return `<rect ${svgColor} x="${x}" y="${y}" width="${w}" height="${h}"></rect>`;
};
//#endregion
export { colorPropToSVG, createSVGRect, getSvgAttributes, parsePreserveAspectRatioAttribute, parseUnit };

//# sourceMappingURL=svgParsing.mjs.map