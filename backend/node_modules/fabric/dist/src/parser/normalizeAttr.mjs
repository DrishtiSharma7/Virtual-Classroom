import { attributesMap } from "./constants.mjs";
//#region src/parser/normalizeAttr.ts
const normalizeAttr = (attr) => {
	var _attributesMap;
	return (_attributesMap = attributesMap[attr]) !== null && _attributesMap !== void 0 ? _attributesMap : attr;
};
//#endregion
export { normalizeAttr };

//# sourceMappingURL=normalizeAttr.mjs.map