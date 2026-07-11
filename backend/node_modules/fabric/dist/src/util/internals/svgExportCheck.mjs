//#region src/util/internals/svgExportCheck.ts
const unsafeSvgStyleValueRegex = new RegExp(String.raw`[\0-\x1F\x7F;<>\\]|\/\*|\*\/|url\s*\(|expression\s*\(|(?:java|vb)script\s*:|data\s*:|@import\b`, "iu");
const isSafeSvgStyleValue = (value) => typeof value === "string" && value.trim().length > 0 && !unsafeSvgStyleValueRegex.test(value);
const getSafeSvgStyleNumber = (value, fallback = "") => {
	const numeric = Number(value);
	return Number.isFinite(numeric) ? `${numeric}` : fallback;
};
const getSafeSvgStyleToken = (value, fallback = "") => typeof value === "string" && isSafeSvgStyleValue(value) ? value : fallback;
//#endregion
export { getSafeSvgStyleNumber, getSafeSvgStyleToken, isSafeSvgStyleValue };

//# sourceMappingURL=svgExportCheck.mjs.map