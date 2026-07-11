//#region src/util/internals/findRight.ts
const findIndexRight = (array, predicate) => {
	for (let index = array.length - 1; index >= 0; index--) if (predicate(array[index], index, array)) return index;
	return -1;
};
//#endregion
export { findIndexRight };

//# sourceMappingURL=findRight.mjs.map