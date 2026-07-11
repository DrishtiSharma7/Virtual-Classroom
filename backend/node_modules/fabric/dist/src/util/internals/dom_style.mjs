//#region src/util/internals/dom_style.ts
/**
* wrapper for setting element's style
* @param {HTMLElement} element an HTMLElement
* @param {Object} styles to apply to element
*/
function setStyle(element, styles) {
	const elementStyle = element.style;
	if (!elementStyle) return;
	Object.entries(styles).forEach(([property, value]) => elementStyle.setProperty(property, value));
}
//#endregion
export { setStyle };

//# sourceMappingURL=dom_style.mjs.map