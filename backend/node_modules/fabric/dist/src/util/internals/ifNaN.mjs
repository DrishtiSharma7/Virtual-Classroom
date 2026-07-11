//#region src/util/internals/ifNaN.ts
/**
*
* @param value value to check if NaN
* @param [valueIfNaN]
* @returns `fallback` is `value is NaN
*/
const ifNaN = (value, valueIfNaN) => {
	return isNaN(value) && typeof valueIfNaN === "number" ? valueIfNaN : value;
};
//#endregion
export { ifNaN };

//# sourceMappingURL=ifNaN.mjs.map