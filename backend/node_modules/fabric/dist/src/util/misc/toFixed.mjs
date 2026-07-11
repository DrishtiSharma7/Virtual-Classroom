//#region src/util/misc/toFixed.ts
/**
* A wrapper around Number#toFixed, which contrary to native method returns number, not string.
* @param {number|string} number number to operate on
* @param {number} fractionDigits number of fraction digits to "leave"
* @return {number}
*/
const toFixed = (number, fractionDigits) => parseFloat(Number(number).toFixed(fractionDigits));
//#endregion
export { toFixed };

//# sourceMappingURL=toFixed.mjs.map