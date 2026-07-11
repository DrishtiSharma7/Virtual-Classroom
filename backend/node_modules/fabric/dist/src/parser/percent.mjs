import { capValue } from "../util/misc/capValue.mjs";
import { ifNaN } from "../util/internals/ifNaN.mjs";
//#region src/parser/percent.ts
/**
* Will loosely accept as percent numbers that are not like
* 3.4a%. This function does not check for the correctness of a percentage
* but it checks that values that are in theory correct are or arent percentages
*/
function isPercent(value) {
	return value && /%$/.test(value) && Number.isFinite(parseFloat(value));
}
/**
* Parse a percentage value in an svg.
* @param value
* @param fallback in case of not possible to parse the number
* @returns ∈ [0, 1]
*/
function parsePercent(value, valueIfNaN) {
	return capValue(0, ifNaN(typeof value === "number" ? value : typeof value === "string" ? parseFloat(value) / (isPercent(value) ? 100 : 1) : NaN, valueIfNaN), 1);
}
//#endregion
export { isPercent, parsePercent };

//# sourceMappingURL=percent.mjs.map