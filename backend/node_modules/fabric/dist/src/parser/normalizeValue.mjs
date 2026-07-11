import { CENTER, FILL, LEFT, RIGHT, STROKE } from "../constants.mjs";
import { multiplyTransformMatrices } from "../util/misc/matrix.mjs";
import { parseUnit } from "../util/misc/svgParsing.mjs";
import "../shapes/Text/constants.mjs";
import { parseTransformAttribute } from "./parseTransformAttribute.mjs";
//#region src/parser/normalizeValue.ts
function normalizeValue(attr, value, parentAttributes, fontSize) {
	const isArray = Array.isArray(value);
	let parsed;
	let ouputValue = value;
	if ((attr === "fill" || attr === "stroke") && value === "none") ouputValue = "";
	else if (attr === "strokeUniform") return value === "non-scaling-stroke";
	else if (attr === "strokeDashArray") if (value === "none") ouputValue = null;
	else ouputValue = value.replace(/,/g, " ").split(/\s+/).map(parseFloat);
	else if (attr === "transformMatrix") if (parentAttributes && parentAttributes.transformMatrix) ouputValue = multiplyTransformMatrices(parentAttributes.transformMatrix, parseTransformAttribute(value));
	else ouputValue = parseTransformAttribute(value);
	else if (attr === "visible") {
		ouputValue = value !== "none" && value !== "hidden";
		if (parentAttributes && parentAttributes.visible === false) ouputValue = false;
	} else if (attr === "opacity") {
		ouputValue = parseFloat(value);
		if (parentAttributes && typeof parentAttributes.opacity !== "undefined") ouputValue *= parentAttributes.opacity;
	} else if (attr === "textAnchor") ouputValue = value === "start" ? LEFT : value === "end" ? RIGHT : CENTER;
	else if (attr === "charSpacing" || attr === "textDecorationThickness") parsed = parseUnit(value, fontSize) / fontSize * 1e3;
	else if (attr === "paintFirst") {
		const fillIndex = value.indexOf(FILL);
		const strokeIndex = value.indexOf(STROKE);
		ouputValue = FILL;
		if (fillIndex > -1 && strokeIndex > -1 && strokeIndex < fillIndex) ouputValue = STROKE;
		else if (fillIndex === -1 && strokeIndex > -1) ouputValue = STROKE;
	} else if (attr === "href" || attr === "xlink:href" || attr === "font" || attr === "id") return value;
	else if (attr === "imageSmoothing") return value === "optimizeQuality";
	else parsed = isArray ? value.map(parseUnit) : parseUnit(value, fontSize);
	return !isArray && isNaN(parsed) ? ouputValue : parsed;
}
//#endregion
export { normalizeValue };

//# sourceMappingURL=normalizeValue.mjs.map