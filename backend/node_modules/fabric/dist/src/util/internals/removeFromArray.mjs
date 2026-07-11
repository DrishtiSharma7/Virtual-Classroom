//#region src/util/internals/removeFromArray.ts
/**
* Removes value from an array.
* Presence of value (and its position in an array) is determined via `Array.prototype.indexOf`
* @param {Array} array
* @param {*} value
* @return {Array} original array
*/
const removeFromArray = (array, value) => {
	const idx = array.indexOf(value);
	if (idx !== -1) array.splice(idx, 1);
	return array;
};
//#endregion
export { removeFromArray };

//# sourceMappingURL=removeFromArray.mjs.map