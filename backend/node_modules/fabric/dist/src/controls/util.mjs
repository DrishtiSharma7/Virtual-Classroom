import { CENTER, quarterPI, twoMathPi } from "../constants.mjs";
import { Point } from "../Point.mjs";
import { degreesToRadians } from "../util/misc/radiansDegreesConversion.mjs";
import { sendPointToPlane } from "../util/misc/planeChange.mjs";
import { resolveOrigin } from "../util/misc/resolveOrigin.mjs";
import { calcVectorRotation, createVector } from "../util/misc/vectors.mjs";
//#region src/controls/util.ts
const NOT_ALLOWED_CURSOR = "not-allowed";
/**
* @param {Boolean} alreadySelected true if target is already selected
* @param {String} corner a string representing the corner ml, mr, tl ...
* @param {Event} e Event object
* @param {FabricObject} [target] inserted back to help overriding. Unused
*/
const getActionFromCorner = (alreadySelected, corner, e, target) => {
	if (!corner || !alreadySelected) return "drag";
	const control = target.controls[corner];
	return control.getActionName(e, control, target);
};
/**
* Checks if transform is centered
* @param {Object} transform transform data
* @return {Boolean} true if transform is centered
*/
function isTransformCentered(transform) {
	return resolveOrigin(transform.originX) === resolveOrigin("center") && resolveOrigin(transform.originY) === resolveOrigin("center");
}
function invertOrigin(origin) {
	return -resolveOrigin(origin) + .5;
}
const isLocked = (target, lockingKey) => target[lockingKey];
const commonEventInfo = (eventData, transform, x, y) => {
	return {
		e: eventData,
		transform,
		pointer: new Point(x, y)
	};
};
/**
* Combine control position and object angle to find the control direction compared
* to the object center.
* @param {FabricObject} fabricObject the fabric object for which we are rendering controls
* @param {Control} control the control class
* @return {Number} 0 - 7 a quadrant number
*/
function findCornerQuadrant(fabricObject, control, coord) {
	const target = coord;
	const angle = calcVectorRotation(createVector(sendPointToPlane(fabricObject.getCenterPoint(), fabricObject.canvas.viewportTransform, void 0), target)) + twoMathPi;
	return Math.round(angle % twoMathPi / quarterPI);
}
/**
* @returns the normalized point (rotated relative to center) in local coordinates
*/
function normalizePoint(target, point, originX, originY) {
	const center = target.getRelativeCenterPoint(), p = typeof originX !== "undefined" && typeof originY !== "undefined" ? target.translateToGivenOrigin(center, CENTER, CENTER, originX, originY) : new Point(target.left, target.top);
	return (target.angle ? point.rotate(-degreesToRadians(target.angle), center) : point).subtract(p);
}
/**
* Transforms a point to the offset from the given origin
* @param {Object} transform
* @param {String} originX
* @param {String} originY
* @param {number} x
* @param {number} y
* @return {Fabric.Point} the normalized point
*/
function getLocalPoint({ target, corner }, originX, originY, x, y) {
	var _target$canvas;
	const control = target.controls[corner], zoom = ((_target$canvas = target.canvas) === null || _target$canvas === void 0 ? void 0 : _target$canvas.getZoom()) || 1, padding = target.padding / zoom, localPoint = normalizePoint(target, new Point(x, y), originX, originY);
	if (localPoint.x >= padding) localPoint.x -= padding;
	if (localPoint.x <= -padding) localPoint.x += padding;
	if (localPoint.y >= padding) localPoint.y -= padding;
	if (localPoint.y <= padding) localPoint.y += padding;
	localPoint.x -= control.offsetX;
	localPoint.y -= control.offsetY;
	return localPoint;
}
//#endregion
export { NOT_ALLOWED_CURSOR, commonEventInfo, findCornerQuadrant, getActionFromCorner, getLocalPoint, invertOrigin, isLocked, isTransformCentered };

//# sourceMappingURL=util.mjs.map