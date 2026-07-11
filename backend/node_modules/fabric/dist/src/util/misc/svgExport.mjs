import { config } from "../../config.mjs";
import { toFixed } from "./toFixed.mjs";
//#region src/util/misc/svgExport.ts
/**
* given an array of 6 number returns something like `"matrix(...numbers)"`
* @param {TMat2D} transform an array with 6 numbers
* @return {String} transform matrix for svg
*/
const matrixToSVG = (transform) => "matrix(" + transform.map((value) => toFixed(value, config.NUM_FRACTION_DIGITS)).join(" ") + ")";
//#endregion
export { matrixToSVG };

//# sourceMappingURL=svgExport.mjs.map