import { __exportAll } from "../../_virtual/_rolldown/runtime.mjs";
import { getFabricWindow } from "../env/index.mjs";
//#region src/util/lang_string.ts
var lang_string_exports = /* @__PURE__ */ __exportAll({
	capitalize: () => capitalize,
	escapeXml: () => escapeXml,
	graphemeSplit: () => graphemeSplit
});
/**
* Capitalizes a string
* @param {String} string String to capitalize
* @param {Boolean} [firstLetterOnly] If true only first letter is capitalized
* and other letters stay untouched, if false first letter is capitalized
* and other letters are converted to lowercase.
* @return {String} Capitalized version of a string
*/
const capitalize = (string, firstLetterOnly = false) => `${string.charAt(0).toUpperCase()}${firstLetterOnly ? string.slice(1) : string.slice(1).toLowerCase()}`;
/**
* Escapes XML in a string
* @param {String} string String to escape
* @return {String} Escaped version of a string
*/
const escapeXml = (stringOrNumber) => stringOrNumber.toString().replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
let segmenter;
const getSegmenter = () => {
	if (!segmenter) segmenter = "Intl" in getFabricWindow() && "Segmenter" in Intl && new Intl.Segmenter(void 0, { granularity: "grapheme" });
	return segmenter;
};
/**
* Divide a string in the user perceived single units
* @param {String} textstring String to escape
* @return {Array} array containing the graphemes
*/
const graphemeSplit = (textstring) => {
	segmenter || getSegmenter();
	if (segmenter) {
		const segments = segmenter.segment(textstring);
		return Array.from(segments).map(({ segment }) => segment);
	}
	return graphemeSplitImpl(textstring);
};
const graphemeSplitImpl = (textstring) => {
	const graphemes = [];
	for (let i = 0, chr; i < textstring.length; i++) {
		if ((chr = getWholeChar(textstring, i)) === false) continue;
		graphemes.push(chr);
	}
	return graphemes;
};
const getWholeChar = (str, i) => {
	const code = str.charCodeAt(i);
	if (isNaN(code)) return "";
	if (code < 55296 || code > 57343) return str.charAt(i);
	if (55296 <= code && code <= 56319) {
		if (str.length <= i + 1) throw "High surrogate without following low surrogate";
		const next = str.charCodeAt(i + 1);
		if (56320 > next || next > 57343) throw "High surrogate without following low surrogate";
		return str.charAt(i) + str.charAt(i + 1);
	}
	if (i === 0) throw "Low surrogate without preceding high surrogate";
	const prev = str.charCodeAt(i - 1);
	if (55296 > prev || prev > 56319) throw "Low surrogate without preceding high surrogate";
	return false;
};
//#endregion
export { escapeXml, graphemeSplit, lang_string_exports };

//# sourceMappingURL=lang_string.mjs.map