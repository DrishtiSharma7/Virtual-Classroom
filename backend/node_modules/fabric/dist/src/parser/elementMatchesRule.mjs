import { selectorMatches } from "./selectorMatches.mjs";
import { doesSomeParentMatch } from "./doesSomeParentMatch.mjs";
//#region src/parser/elementMatchesRule.ts
/**
* @private
*/
function elementMatchesRule(element, selectors) {
	let parentMatching = true;
	const firstMatching = selectorMatches(element, selectors.pop());
	if (firstMatching && selectors.length) parentMatching = doesSomeParentMatch(element, selectors);
	return firstMatching && parentMatching && selectors.length === 0;
}
//#endregion
export { elementMatchesRule };

//# sourceMappingURL=elementMatchesRule.mjs.map