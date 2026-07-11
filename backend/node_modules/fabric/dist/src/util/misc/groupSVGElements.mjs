import { Group } from "../../shapes/Group.mjs";
//#region src/util/misc/groupSVGElements.ts
/**
* TODO experiment with different layout manager and svg results ( fixed fit content )
* Groups SVG elements (usually those retrieved from SVG document)
* @param {FabricObject[]} elements FabricObject(s) parsed from svg, to group
* @return {FabricObject | Group}
*/
const groupSVGElements = (elements, options) => {
	if (elements && elements.length === 1) return elements[0];
	return new Group(elements, options);
};
//#endregion
export { groupSVGElements };

//# sourceMappingURL=groupSVGElements.mjs.map