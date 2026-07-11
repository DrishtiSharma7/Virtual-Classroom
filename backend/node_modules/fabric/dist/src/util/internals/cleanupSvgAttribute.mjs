import { normalizeWs } from "./normalizeWhiteSpace.mjs";
import { reNum } from "../../parser/constants.mjs";
//#region src/util/internals/cleanupSvgAttribute.ts
const regex = new RegExp(`(${reNum})`, "gi");
const cleanupSvgAttribute = (attributeValue) => normalizeWs(attributeValue.replace(regex, " $1 ").replace(/,/gi, " "));
//#endregion
export { cleanupSvgAttribute };

//# sourceMappingURL=cleanupSvgAttribute.mjs.map