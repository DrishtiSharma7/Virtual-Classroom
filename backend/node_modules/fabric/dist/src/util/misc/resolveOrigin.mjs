//#region src/util/misc/resolveOrigin.ts
const originOffset = {
	left: -.5,
	top: -.5,
	center: 0,
	bottom: .5,
	right: .5
};
/**
* Resolves origin value relative to center
* @private
* @param {TOriginX | TOriginY} originValue originX / originY
* @returns number
*/
const resolveOrigin = (originValue) => typeof originValue === "string" ? originOffset[originValue] : originValue - .5;
//#endregion
export { resolveOrigin };

//# sourceMappingURL=resolveOrigin.mjs.map