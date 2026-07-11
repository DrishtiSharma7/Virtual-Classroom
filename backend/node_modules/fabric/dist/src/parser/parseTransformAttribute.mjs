import { ROTATE, SCALE, SKEW_X, SKEW_Y, iMatrix } from "../constants.mjs";
import { createRotateMatrix, createScaleMatrix, createSkewXMatrix, createSkewYMatrix, createTranslateMatrix, multiplyTransformMatrixArray } from "../util/misc/matrix.mjs";
import { reNum } from "./constants.mjs";
import { cleanupSvgAttribute } from "../util/internals/cleanupSvgAttribute.mjs";
//#region src/parser/parseTransformAttribute.ts
const p = `(${reNum})`;
const skewX = String.raw`(skewX)\(${p}\)`;
const skewY = String.raw`(skewY)\(${p}\)`;
const rotate = String.raw`(rotate)\(${p}(?: ${p} ${p})?\)`;
const scale = String.raw`(scale)\(${p}(?: ${p})?\)`;
const translate = String.raw`(translate)\(${p}(?: ${p})?\)`;
const transform = `(?:${String.raw`(matrix)\(${p} ${p} ${p} ${p} ${p} ${p}\)`}|${translate}|${rotate}|${scale}|${skewX}|${skewY})`;
const transforms = `(?:${transform}*)`;
const transformList = String.raw`^\s*(?:${transforms}?)\s*$`;
const reTransformList = new RegExp(transformList);
const reTransform = new RegExp(transform);
const reTransformAll = new RegExp(transform, "g");
/**
* Parses "transform" attribute, returning an array of values
* @param {String} attributeValue String containing attribute value
* @return {TTransformMatrix} Array of 6 elements representing transformation matrix
*/
function parseTransformAttribute(attributeValue) {
	attributeValue = cleanupSvgAttribute(attributeValue).replace(/\s*([()])\s*/gi, "$1");
	const matrices = [];
	if (!attributeValue || attributeValue && !reTransformList.test(attributeValue)) return [...iMatrix];
	for (const match of attributeValue.matchAll(reTransformAll)) {
		const transformMatch = reTransform.exec(match[0]);
		if (!transformMatch) continue;
		let matrix = iMatrix;
		const [, operation, ...rawArgs] = transformMatch.filter((m) => !!m);
		const [arg0, arg1, arg2, arg3, arg4, arg5] = rawArgs.map((arg) => parseFloat(arg));
		switch (operation) {
			case "translate":
				matrix = createTranslateMatrix(arg0, arg1);
				break;
			case ROTATE:
				matrix = createRotateMatrix({ angle: arg0 }, {
					x: arg1,
					y: arg2
				});
				break;
			case SCALE:
				matrix = createScaleMatrix(arg0, arg1);
				break;
			case SKEW_X:
				matrix = createSkewXMatrix(arg0);
				break;
			case SKEW_Y:
				matrix = createSkewYMatrix(arg0);
				break;
			case "matrix":
				matrix = [
					arg0,
					arg1,
					arg2,
					arg3,
					arg4,
					arg5
				];
				break;
		}
		matrices.push(matrix);
	}
	return multiplyTransformMatrixArray(matrices);
}
//#endregion
export { parseTransformAttribute };

//# sourceMappingURL=parseTransformAttribute.mjs.map