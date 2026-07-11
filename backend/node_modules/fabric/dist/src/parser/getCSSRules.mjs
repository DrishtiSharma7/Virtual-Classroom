//#region src/parser/getCSSRules.ts
/**
* Returns CSS rules for a given SVG document
* @param {HTMLElement} doc SVG document to parse
* @return {Object} CSS rules of this document
*/
function getCSSRules(doc) {
	const styles = doc.getElementsByTagName("style");
	const allRules = {};
	for (let i = 0; i < styles.length; i++) {
		const styleContents = (styles[i].textContent || "").replace(/\/\*[\s\S]*?\*\//g, "");
		if (styleContents.trim() === "") continue;
		styleContents.split("}").filter((rule, index, array) => array.length > 1 && rule.trim()).forEach((rule) => {
			if ((rule.match(/{/g) || []).length > 1 && rule.trim().startsWith("@")) return;
			const match = rule.split("{"), ruleObj = {}, propertyValuePairs = match[1].trim().split(";").filter(function(pair) {
				return pair.trim();
			});
			for (let j = 0; j < propertyValuePairs.length; j++) {
				const pair = propertyValuePairs[j].split(":"), property = pair[0].trim();
				ruleObj[property] = pair[1].trim();
			}
			rule = match[0].trim();
			rule.split(",").forEach((_rule) => {
				_rule = _rule.replace(/^svg/i, "").trim();
				if (_rule === "") return;
				allRules[_rule] = {
					...allRules[_rule] || {},
					...ruleObj
				};
			});
		});
	}
	return allRules;
}
//#endregion
export { getCSSRules };

//# sourceMappingURL=getCSSRules.mjs.map