//#region src/util/internals/getRandomInt.ts
/**
* Returns random number between 2 specified ones.
* @param {Number} min lower limit
* @param {Number} max upper limit
* @return {Number} random value (between min and max)
*/
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
//#endregion
export { getRandomInt };

//# sourceMappingURL=getRandomInt.mjs.map