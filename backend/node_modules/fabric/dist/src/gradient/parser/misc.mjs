//#region src/gradient/parser/misc.ts
function parseType(el) {
	return el.nodeName === "linearGradient" || el.nodeName === "LINEARGRADIENT" ? "linear" : "radial";
}
function parseGradientUnits(el) {
	return el.getAttribute("gradientUnits") === "userSpaceOnUse" ? "pixels" : "percentage";
}
//#endregion
export { parseGradientUnits, parseType };

//# sourceMappingURL=misc.mjs.map