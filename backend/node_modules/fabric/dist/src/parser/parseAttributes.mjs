import { parseUnit } from "../util/misc/svgParsing.mjs";
import { cPath, fSize, svgValidParentsRegEx } from "./constants.mjs";
import { getGlobalStylesForElement } from "./getGlobalStylesForElement.mjs";
import { normalizeAttr } from "./normalizeAttr.mjs";
import { normalizeValue } from "./normalizeValue.mjs";
import { parseFontDeclaration } from "./parseFontDeclaration.mjs";
import { parseStyleAttribute } from "./parseStyleAttribute.mjs";
import { setStrokeFillOpacity } from "./setStrokeFillOpacity.mjs";
//#region src/parser/parseAttributes.ts
/**
* Returns an object of attributes' name/value, given element and an array of attribute names;
* Parses parent "g" nodes recursively upwards.
* @param {SVGElement | HTMLElement} element Element to parse
* @param {Array} attributes Array of attributes to parse
* @return {Object} object containing parsed attributes' names/values
*/
function parseAttributes(element, attributes, cssRules) {
	if (!element) return {};
	let parentAttributes = {}, fontSize, parentFontSize = 16;
	if (element.parentNode && svgValidParentsRegEx.test(element.parentNode.nodeName)) {
		parentAttributes = parseAttributes(element.parentElement, attributes, cssRules);
		if (parentAttributes.fontSize) fontSize = parentFontSize = parseUnit(parentAttributes.fontSize);
	}
	const ownAttributes = {
		...attributes.reduce((memo, attr) => {
			const value = element.getAttribute(attr);
			if (value) memo[attr] = value;
			return memo;
		}, {}),
		...getGlobalStylesForElement(element, cssRules),
		...parseStyleAttribute(element)
	};
	if (ownAttributes["clip-path"]) element.setAttribute(cPath, ownAttributes[cPath]);
	if (ownAttributes["font-size"]) {
		fontSize = parseUnit(ownAttributes[fSize], parentFontSize);
		ownAttributes[fSize] = `${fontSize}`;
	}
	const normalizedStyle = {};
	for (const attr in ownAttributes) {
		const normalizedAttr = normalizeAttr(attr);
		normalizedStyle[normalizedAttr] = normalizeValue(normalizedAttr, ownAttributes[attr], parentAttributes, fontSize);
	}
	if (normalizedStyle && normalizedStyle.font) parseFontDeclaration(normalizedStyle.font, normalizedStyle);
	const mergedAttrs = {
		...parentAttributes,
		...normalizedStyle
	};
	return svgValidParentsRegEx.test(element.nodeName) ? mergedAttrs : setStrokeFillOpacity(mergedAttrs);
}
//#endregion
export { parseAttributes };

//# sourceMappingURL=parseAttributes.mjs.map