import { ROTATING } from "../constants.mjs";
import { radiansToDegrees } from "../util/misc/radiansDegreesConversion.mjs";
import { NOT_ALLOWED_CURSOR, isLocked } from "./util.mjs";
import { wrapWithFireEvent } from "./wrapWithFireEvent.mjs";
import { wrapWithFixedAnchor } from "./wrapWithFixedAnchor.mjs";
//#region src/controls/rotate.ts
/**
* Find the correct style for the control that is used for rotation.
* this function is very simple and it just take care of not-allowed or standard cursor
* @param {Event} eventData the javascript event that is causing the scale
* @param {Control} control the control that is interested in the action
* @param {FabricObject} fabricObject the fabric object that is interested in the action
* @return {String} a valid css string for the cursor
*/
const rotationStyleHandler = (eventData, control, fabricObject) => {
	if (fabricObject.lockRotation) return NOT_ALLOWED_CURSOR;
	return control.cursorStyle;
};
/**
* Action handler for rotation and snapping, without anchor point.
* Needs to be wrapped with `wrapWithFixedAnchor` to be effective
* @param {Event} eventData javascript event that is doing the transform
* @param {Object} transform javascript object containing a series of information around the current transform
* @param {number} x current mouse x position, canvas normalized
* @param {number} y current mouse y position, canvas normalized
* @return {Boolean} true if some change happened
* @private
*/
const rotateObjectWithSnapping = (eventData, { target, ex, ey, theta, originX, originY }, x, y) => {
	const pivotPoint = target.getPositionByOrigin(originX, originY);
	if (isLocked(target, "lockRotation")) return false;
	const lastAngle = Math.atan2(ey - pivotPoint.y, ex - pivotPoint.x);
	let angle = radiansToDegrees(Math.atan2(y - pivotPoint.y, x - pivotPoint.x) - lastAngle + theta);
	if (target.snapAngle && target.snapAngle > 0) {
		const snapAngle = target.snapAngle, snapThreshold = target.snapThreshold || snapAngle, rightAngleLocked = Math.ceil(angle / snapAngle) * snapAngle, leftAngleLocked = Math.floor(angle / snapAngle) * snapAngle;
		if (Math.abs(angle - leftAngleLocked) < snapThreshold) angle = leftAngleLocked;
		else if (Math.abs(angle - rightAngleLocked) < snapThreshold) angle = rightAngleLocked;
	}
	if (angle < 0) angle = 360 + angle;
	angle %= 360;
	const hasRotated = target.angle !== angle;
	target.angle = angle;
	return hasRotated;
};
const rotationWithSnapping = wrapWithFireEvent(ROTATING, wrapWithFixedAnchor(rotateObjectWithSnapping));
//#endregion
export { rotationStyleHandler, rotationWithSnapping };

//# sourceMappingURL=rotate.mjs.map