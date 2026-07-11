import { SCALE_X, SCALE_Y, SKEWING, SKEW_X, SKEW_Y } from "../constants.mjs";
import { Point } from "../Point.mjs";
import { degreesToRadians, radiansToDegrees } from "../util/misc/radiansDegreesConversion.mjs";
import { resolveOrigin } from "../util/misc/resolveOrigin.mjs";
import { NOT_ALLOWED_CURSOR, findCornerQuadrant, getLocalPoint, isLocked } from "./util.mjs";
import { wrapWithFireEvent } from "./wrapWithFireEvent.mjs";
import { wrapWithFixedAnchor } from "./wrapWithFixedAnchor.mjs";
//#region src/controls/skew.ts
const AXIS_KEYS = {
	x: {
		counterAxis: "y",
		scale: SCALE_X,
		skew: SKEW_X,
		lockSkewing: "lockSkewingX",
		origin: "originX",
		flip: "flipX"
	},
	y: {
		counterAxis: "x",
		scale: SCALE_Y,
		skew: SKEW_Y,
		lockSkewing: "lockSkewingY",
		origin: "originY",
		flip: "flipY"
	}
};
const skewMap = [
	"ns",
	"nesw",
	"ew",
	"nwse"
];
/**
* return the correct cursor style for the skew action
* @param {Event} eventData the javascript event that is causing the scale
* @param {Control} control the control that is interested in the action
* @param {FabricObject} fabricObject the fabric object that is interested in the action
* @return {String} a valid css string for the cursor
*/
const skewCursorStyleHandler = (eventData, control, fabricObject, coord) => {
	if (control.x !== 0 && isLocked(fabricObject, "lockSkewingY")) return NOT_ALLOWED_CURSOR;
	if (control.y !== 0 && isLocked(fabricObject, "lockSkewingX")) return NOT_ALLOWED_CURSOR;
	return `${skewMap[findCornerQuadrant(fabricObject, control, coord) % 4]}-resize`;
};
/**
* Since skewing is applied before scaling, calculations are done in a scaleless plane
* @see https://github.com/fabricjs/fabric.js/pull/8380
*/
function skewObject(axis, { target, ex, ey, skewingSide, ...transform }, pointer) {
	const { skew: skewKey } = AXIS_KEYS[axis], offset = pointer.subtract(new Point(ex, ey)).divide(new Point(target.scaleX, target.scaleY))[axis], skewingBefore = target[skewKey], skewingStart = transform[skewKey], shearingStart = Math.tan(degreesToRadians(skewingStart)), b = axis === "y" ? target._getTransformedDimensions({
		scaleX: 1,
		scaleY: 1,
		skewX: 0
	}).x : target._getTransformedDimensions({
		scaleX: 1,
		scaleY: 1
	}).y;
	const shearing = 2 * offset * skewingSide / Math.max(b, 1) + shearingStart;
	const skewing = radiansToDegrees(Math.atan(shearing));
	target.set(skewKey, skewing);
	const changed = skewingBefore !== target[skewKey];
	if (changed && axis === "y") {
		const { skewX, scaleX } = target, dimBefore = target._getTransformedDimensions({ skewY: skewingBefore }), dimAfter = target._getTransformedDimensions(), compensationFactor = skewX !== 0 ? dimBefore.x / dimAfter.x : 1;
		compensationFactor !== 1 && target.set("scaleX", compensationFactor * scaleX);
	}
	return changed;
}
/**
* Wrapped Action handler for skewing on a given axis, takes care of the
* skew direction and determines the correct transform origin for the anchor point
* @param {Event} eventData javascript event that is doing the transform
* @param {Object} transform javascript object containing a series of information around the current transform
* @param {number} x current mouse x position, canvas normalized
* @param {number} y current mouse y position, canvas normalized
* @return {Boolean} true if some change happened
*/
function skewHandler(axis, eventData, transform, x, y) {
	const { target } = transform, { counterAxis, origin: originKey, lockSkewing: lockSkewingKey, skew: skewKey, flip: flipKey } = AXIS_KEYS[axis];
	if (isLocked(target, lockSkewingKey)) return false;
	const { origin: counterOriginKey, flip: counterFlipKey } = AXIS_KEYS[counterAxis], counterOriginFactor = resolveOrigin(transform[counterOriginKey]) * (target[counterFlipKey] ? -1 : 1), skewingSide = -Math.sign(counterOriginFactor) * (target[flipKey] ? -1 : 1), origin = -((target[skewKey] === 0 && getLocalPoint(transform, "center", "center", x, y)[axis] > 0 || target[skewKey] > 0 ? 1 : -1) * skewingSide) * .5 + .5;
	return wrapWithFireEvent(SKEWING, wrapWithFixedAnchor((eventData, transform, x, y) => skewObject(axis, transform, new Point(x, y))))(eventData, {
		...transform,
		[originKey]: origin,
		skewingSide
	}, x, y);
}
/**
* Wrapped Action handler for skewing on the X axis, takes care of the
* skew direction and determines the correct transform origin for the anchor point
* @param {Event} eventData javascript event that is doing the transform
* @param {Object} transform javascript object containing a series of information around the current transform
* @param {number} x current mouse x position, canvas normalized
* @param {number} y current mouse y position, canvas normalized
* @return {Boolean} true if some change happened
*/
const skewHandlerX = (eventData, transform, x, y) => {
	return skewHandler("x", eventData, transform, x, y);
};
/**
* Wrapped Action handler for skewing on the Y axis, takes care of the
* skew direction and determines the correct transform origin for the anchor point
* @param {Event} eventData javascript event that is doing the transform
* @param {Object} transform javascript object containing a series of information around the current transform
* @param {number} x current mouse x position, canvas normalized
* @param {number} y current mouse y position, canvas normalized
* @return {Boolean} true if some change happened
*/
const skewHandlerY = (eventData, transform, x, y) => {
	return skewHandler("y", eventData, transform, x, y);
};
//#endregion
export { skewCursorStyleHandler, skewHandlerX, skewHandlerY };

//# sourceMappingURL=skew.mjs.map