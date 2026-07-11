import { isPercent } from "../../parser/percent.mjs";
import { parseGradientUnits, parseType } from "./misc.mjs";
//#region src/gradient/parser/parseCoords.ts
function convertPercentUnitsToValues(valuesToConvert, { width, height, gradientUnits }) {
	let finalValue;
	return Object.entries(valuesToConvert).reduce((acc, [prop, propValue]) => {
		if (propValue === "Infinity") finalValue = 1;
		else if (propValue === "-Infinity") finalValue = 0;
		else {
			const isString = typeof propValue === "string";
			finalValue = isString ? parseFloat(propValue) : propValue;
			if (isString && isPercent(propValue)) {
				finalValue *= .01;
				if (gradientUnits === "pixels") {
					if (prop === "x1" || prop === "x2" || prop === "r2") finalValue *= width;
					if (prop === "y1" || prop === "y2") finalValue *= height;
				}
			}
		}
		acc[prop] = finalValue;
		return acc;
	}, {});
}
function getValue(el, key) {
	return el.getAttribute(key);
}
function parseLinearCoords(el) {
	return {
		x1: getValue(el, "x1") || 0,
		y1: getValue(el, "y1") || 0,
		x2: getValue(el, "x2") || "100%",
		y2: getValue(el, "y2") || 0
	};
}
function parseRadialCoords(el) {
	return {
		x1: getValue(el, "fx") || getValue(el, "cx") || "50%",
		y1: getValue(el, "fy") || getValue(el, "cy") || "50%",
		r1: 0,
		x2: getValue(el, "cx") || "50%",
		y2: getValue(el, "cy") || "50%",
		r2: getValue(el, "r") || "50%"
	};
}
function parseCoords(el, size) {
	return convertPercentUnitsToValues(parseType(el) === "linear" ? parseLinearCoords(el) : parseRadialCoords(el), {
		...size,
		gradientUnits: parseGradientUnits(el)
	});
}
//#endregion
export { parseCoords };

//# sourceMappingURL=parseCoords.mjs.map