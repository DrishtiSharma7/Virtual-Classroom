import { reNum } from "../../parser/constants.mjs";
//#region src/util/path/regex.ts
const commaWsp = `\\s*,?\\s*`;
/**
* p for param
* using "bad naming" here because it makes the regex much easier to read
* p is a number that is preceded by an arbitrary number of spaces, maybe 0,
* a comma or not, and then possibly more spaces or not.
*/
const p = `${commaWsp}(${reNum})`;
const reArcCommandPoints = `${p}${p}${p}${commaWsp}([01])${commaWsp}([01])${p}${p}`;
const rePathCommand = "[mzlhvcsqta][^mzlhvcsqta]*";
//#endregion
export { reArcCommandPoints, rePathCommand };

//# sourceMappingURL=regex.mjs.map