import { MODIFY_POLY } from "../constants.mjs";
import { Point } from "../Point.mjs";
import { multiplyTransformMatrices } from "../util/misc/matrix.mjs";
import { sendPointToPlane } from "../util/misc/planeChange.mjs";
import { wrapWithFireEvent } from "./wrapWithFireEvent.mjs";
import { Control } from "./Control.mjs";
//#region src/controls/polyControl.ts
const ACTION_NAME = MODIFY_POLY;
/**
* This function locates the controls.
* It'll be used both for drawing and for interaction.
*/
const createPolyPositionHandler = (pointIndex) => {
	return function(dim, finalMatrix, polyObject) {
		const { points, pathOffset } = polyObject;
		return new Point(points[pointIndex]).subtract(pathOffset).transform(multiplyTransformMatrices(polyObject.getViewportTransform(), polyObject.calcTransformMatrix()));
	};
};
/**
* This function defines what the control does.
* It'll be called on every mouse move after a control has been clicked and is being dragged.
* The function receives as argument the mouse event, the current transform object
* and the current position in canvas coordinate `transform.target` is a reference to the
* current object being transformed.
*/
const polyActionHandler = (eventData, transform, x, y) => {
	const { target, pointIndex } = transform;
	const poly = target;
	const mouseLocalPosition = sendPointToPlane(new Point(x, y), void 0, poly.calcOwnMatrix());
	poly.points[pointIndex] = mouseLocalPosition.add(poly.pathOffset);
	poly.setDimensions();
	poly.set("dirty", true);
	return true;
};
/**
* Keep the polygon in the same position when we change its `width`/`height`/`top`/`left`.
*/
const factoryPolyActionHandler = (pointIndex, fn) => {
	return function(eventData, transform, x, y) {
		const poly = transform.target, anchorPoint = new Point(poly.points[(pointIndex > 0 ? pointIndex : poly.points.length) - 1]), anchorPointInParentPlane = anchorPoint.subtract(poly.pathOffset).transform(poly.calcOwnMatrix()), actionPerformed = fn(eventData, {
			...transform,
			pointIndex
		}, x, y);
		const diff = anchorPoint.subtract(poly.pathOffset).transform(poly.calcOwnMatrix()).subtract(anchorPointInParentPlane);
		poly.left -= diff.x;
		poly.top -= diff.y;
		return actionPerformed;
	};
};
const createPolyActionHandler = (pointIndex) => wrapWithFireEvent(ACTION_NAME, factoryPolyActionHandler(pointIndex, polyActionHandler));
function createPolyControls(arg0, options = {}) {
	const controls = {};
	for (let idx = 0; idx < (typeof arg0 === "number" ? arg0 : arg0.points.length); idx++) controls[`p${idx}`] = new Control({
		actionName: ACTION_NAME,
		positionHandler: createPolyPositionHandler(idx),
		actionHandler: createPolyActionHandler(idx),
		...options
	});
	return controls;
}
//#endregion
export { createPolyActionHandler, createPolyControls, createPolyPositionHandler, factoryPolyActionHandler, polyActionHandler };

//# sourceMappingURL=polyControl.mjs.map