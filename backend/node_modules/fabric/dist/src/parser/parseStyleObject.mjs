//#region src/parser/parseStyleObject.ts
/**
* Takes a style object and parses it in one that has only defined values
* and lowercases properties
* @param style
* @param oStyle
*/
function parseStyleObject(style, oStyle) {
	Object.entries(style).forEach(([prop, value]) => {
		if (value === void 0) return;
		oStyle[prop.toLowerCase()] = value;
	});
}
//#endregion
export { parseStyleObject };

//# sourceMappingURL=parseStyleObject.mjs.map