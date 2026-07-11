import { elementMatchesRule } from "./elementMatchesRule.mjs";
//#region src/parser/getGlobalStylesForElement.ts
/**
* @private
*/
function getGlobalStylesForElement(element, cssRules = {}) {
	let styles = {};
	for (const rule in cssRules) if (elementMatchesRule(element, rule.split(" "))) styles = {
		...styles,
		...cssRules[rule]
	};
	return styles;
}
//#endregion
export { getGlobalStylesForElement };

//# sourceMappingURL=getGlobalStylesForElement.mjs.map