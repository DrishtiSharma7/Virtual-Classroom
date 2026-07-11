//#region src/parser/selectorMatches.ts
function selectorMatches(element, selector) {
	const nodeName = element.nodeName;
	const classNames = element.getAttribute("class");
	const id = element.getAttribute("id");
	const azAz = "(?![a-zA-Z\\-]+)";
	let matcher;
	matcher = new RegExp("^" + nodeName, "i");
	selector = selector.replace(matcher, "");
	if (id && selector.length) {
		matcher = new RegExp("#" + id + azAz, "i");
		selector = selector.replace(matcher, "");
	}
	if (classNames && selector.length) {
		const splitClassNames = classNames.split(" ");
		for (let i = splitClassNames.length; i--;) {
			matcher = new RegExp("\\." + splitClassNames[i] + azAz, "i");
			selector = selector.replace(matcher, "");
		}
	}
	return selector.length === 0;
}
//#endregion
export { selectorMatches };

//# sourceMappingURL=selectorMatches.mjs.map