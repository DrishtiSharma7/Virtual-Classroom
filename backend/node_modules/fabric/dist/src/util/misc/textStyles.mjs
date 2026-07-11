import { reNewline } from "../../constants.mjs";
import { graphemeSplit } from "../lang_string.mjs";
import { cloneStyles } from "../internals/cloneStyles.mjs";
//#region src/util/misc/textStyles.ts
/**
* @param {Object} prevStyle first style to compare
* @param {Object} thisStyle second style to compare
* @param {boolean} forTextSpans whether to check overline, underline, and line-through properties
* @return {boolean} true if the style changed
*/
const hasStyleChanged = (prevStyle, thisStyle, forTextSpans = false) => prevStyle.fill !== thisStyle.fill || prevStyle.stroke !== thisStyle.stroke || prevStyle.strokeWidth !== thisStyle.strokeWidth || prevStyle.fontSize !== thisStyle.fontSize || prevStyle.fontFamily !== thisStyle.fontFamily || prevStyle.fontWeight !== thisStyle.fontWeight || prevStyle.fontStyle !== thisStyle.fontStyle || prevStyle.textDecorationThickness !== thisStyle.textDecorationThickness || prevStyle.textDecorationColor !== thisStyle.textDecorationColor || prevStyle.textBackgroundColor !== thisStyle.textBackgroundColor || prevStyle.deltaY !== thisStyle.deltaY || forTextSpans && (prevStyle.overline !== thisStyle.overline || prevStyle.underline !== thisStyle.underline || prevStyle.linethrough !== thisStyle.linethrough);
/**
* Returns the array form of a text object's inline styles property with styles grouped in ranges
* rather than per character. This format is less verbose, and is better suited for storage
* so it is used in serialization (not during runtime).
* @param {object} styles per character styles for a text object
* @param {String} text the text string that the styles are applied to
* @return {{start: number, end: number, style: object}[]}
*/
const stylesToArray = (styles, text) => {
	const textLines = text.split("\n"), stylesArray = [];
	let charIndex = -1, prevStyle = {};
	styles = cloneStyles(styles);
	for (let i = 0; i < textLines.length; i++) {
		const chars = graphemeSplit(textLines[i]);
		if (!styles[i]) {
			charIndex += chars.length;
			prevStyle = {};
			continue;
		}
		for (let c = 0; c < chars.length; c++) {
			charIndex++;
			const thisStyle = styles[i][c];
			if (thisStyle && Object.keys(thisStyle).length > 0) if (hasStyleChanged(prevStyle, thisStyle, true)) stylesArray.push({
				start: charIndex,
				end: charIndex + 1,
				style: thisStyle
			});
			else stylesArray[stylesArray.length - 1].end++;
			prevStyle = thisStyle || {};
		}
	}
	return stylesArray;
};
/**
* Returns the object form of the styles property with styles that are assigned per
* character rather than grouped by range. This format is more verbose, and is
* only used during runtime (not for serialization/storage)
* @param {Array} styles the serialized form of a text object's styles
* @param {String} text the text string that the styles are applied to
* @return {Object}
*/
const stylesFromArray = (styles, text) => {
	if (!Array.isArray(styles)) return cloneStyles(styles);
	const textLines = text.split(reNewline), stylesObject = {};
	let charIndex = -1, styleIndex = 0;
	for (let i = 0; i < textLines.length; i++) {
		const chars = graphemeSplit(textLines[i]);
		for (let c = 0; c < chars.length; c++) {
			charIndex++;
			if (styles[styleIndex] && styles[styleIndex].start <= charIndex && charIndex < styles[styleIndex].end) {
				stylesObject[i] = stylesObject[i] || {};
				stylesObject[i][c] = { ...styles[styleIndex].style };
				if (charIndex === styles[styleIndex].end - 1) styleIndex++;
			}
		}
	}
	return stylesObject;
};
//#endregion
export { hasStyleChanged, stylesFromArray, stylesToArray };

//# sourceMappingURL=textStyles.mjs.map