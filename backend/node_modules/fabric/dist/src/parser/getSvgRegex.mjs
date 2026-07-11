//#region src/parser/getSvgRegex.ts
function getSvgRegex(arr) {
	return new RegExp("^(" + arr.join("|") + ")\\b", "i");
}
//#endregion
export { getSvgRegex };

//# sourceMappingURL=getSvgRegex.mjs.map