import { RESIZING } from "../constants.mjs";
import { resolveOrigin } from "../util/misc/resolveOrigin.mjs";
import { getLocalPoint, isTransformCentered } from "./util.mjs";
import { wrapWithFireEvent } from "./wrapWithFireEvent.mjs";
import { wrapWithFixedAnchor } from "./wrapWithFixedAnchor.mjs";
//#region src/controls/changeWidth.ts
const changeObjectDimensionGen = (dimension, origin, xorY, scale) => (eventData, transform, x, y) => {
	const localPointValue = getLocalPoint(transform, transform.originX, transform.originY, x, y)[xorY];
	const originValue = resolveOrigin(transform[origin]);
	if (originValue === 0 || originValue > 0 && localPointValue < 0 || originValue < 0 && localPointValue > 0) {
		const { target } = transform, strokePadding = target.strokeWidth / (target.strokeUniform ? target[scale] : 1), multiplier = isTransformCentered(transform) ? 2 : 1, oldWidth = target[dimension], newWidth = Math.abs(localPointValue * multiplier / target[scale]) - strokePadding;
		target.set(dimension, Math.max(newWidth, 1));
		return oldWidth !== target[dimension];
	}
	return false;
};
/**
* Action handler to change object's width
* Needs to be wrapped with `wrapWithFixedAnchor` to be effective
* You want to use this only if you are building a new control handler and you want
* to reuse some logic. use "changeWidth" if you are looking to just use a control for width
* @param {Event} eventData javascript event that is doing the transform
* @param {Object} transform javascript object containing a series of information around the current transform
* @param {number} x current mouse x position, canvas normalized
* @param {number} y current mouse y position, canvas normalized
* @return {Boolean} true if some change happened
*/
const changeObjectWidth = changeObjectDimensionGen("width", "originX", "x", "scaleX");
/**
* Action handler to change object's height
* Needs to be wrapped with `wrapWithFixedAnchor` to be effective
* You want to use this only if you are building a new control handler and you want
* to reuse some logic. use "changeHeight" if you are looking to just use a control for height
* @param {Event} eventData javascript event that is doing the transform
* @param {Object} transform javascript object containing a series of information around the current transform
* @param {number} x current mouse x position, canvas normalized
* @param {number} y current mouse y position, canvas normalized
* @return {Boolean} true if some change happened
*/
const changeObjectHeight = changeObjectDimensionGen("height", "originY", "y", "scaleY");
/**
* Control handler for changing width
*/
const changeWidth = wrapWithFireEvent(RESIZING, wrapWithFixedAnchor(changeObjectWidth));
/**
* Control handler for changing height
*/
const changeHeight = wrapWithFireEvent(RESIZING, wrapWithFixedAnchor(changeObjectHeight));
//#endregion
export { changeHeight, changeObjectHeight, changeObjectWidth, changeWidth };

//# sourceMappingURL=changeWidth.mjs.map