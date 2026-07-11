import { getSvgRegex } from "./getSvgRegex.mjs";
import { svgInvalidAncestors } from "./constants.mjs";
import { getTagName } from "./getTagName.mjs";
//#region src/parser/hasInvalidAncestor.ts
const svgInvalidAncestorsRegEx = getSvgRegex(svgInvalidAncestors);
function hasInvalidAncestor(element) {
	let _element = element;
	while (_element && (_element = _element.parentElement)) if (_element && _element.nodeName && svgInvalidAncestorsRegEx.test(getTagName(_element)) && !_element.getAttribute("instantiated_by_use")) return true;
	return false;
}
//#endregion
export { hasInvalidAncestor };

//# sourceMappingURL=hasInvalidAncestor.mjs.map