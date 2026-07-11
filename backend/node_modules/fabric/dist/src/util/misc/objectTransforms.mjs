import { CENTER } from "../../constants.mjs";
import { Point } from "../../Point.mjs";
import { invertTransform, multiplyTransformMatrices, qrDecompose } from "./matrix.mjs";
import { makeBoundingBoxFromPoints } from "./boundingBoxFromPoints.mjs";
//#region src/util/misc/objectTransforms.ts
/**
* given an object and a transform, apply the inverse transform to the object,
* this is equivalent to remove from that object that transformation, so that
* added in a space with the removed transform, the object will be the same as before.
* Removing from an object a transform that scale by 2 is like scaling it by 1/2.
* Removing from an object a transform that rotate by 30deg is like rotating by 30deg
* in the opposite direction.
* This util is used to add objects inside transformed groups or nested groups.
* @param {FabricObject} object the object you want to transform
* @param {TMat2D} transform the destination transform
*/
const removeTransformFromObject = (object, transform) => {
	applyTransformToObject(object, multiplyTransformMatrices(invertTransform(transform), object.calcOwnMatrix()));
};
/**
* given an object and a transform, apply the transform to the object.
* this is equivalent to change the space where the object is drawn.
* Adding to an object a transform that scale by 2 is like scaling it by 2.
* This is used when removing an object from an active selection for example.
* @param {FabricObject} object the object you want to transform
* @param {Array} transform the destination transform
*/
const addTransformToObject = (object, transform) => applyTransformToObject(object, multiplyTransformMatrices(transform, object.calcOwnMatrix()));
/**
* discard an object transform state and apply the one from the matrix.
* @param {FabricObject} object the object you want to transform
* @param {Array} transform the destination transform
*/
const applyTransformToObject = (object, transform) => {
	const { translateX, translateY, scaleX, scaleY, ...otherOptions } = qrDecompose(transform), center = new Point(translateX, translateY);
	object.flipX = false;
	object.flipY = false;
	Object.assign(object, otherOptions);
	object.set({
		scaleX,
		scaleY
	});
	object.setPositionByOrigin(center, CENTER, CENTER);
};
/**
* reset an object transform state to neutral. Top and left are not accounted for
* @param  {FabricObject} target object to transform
*/
const resetObjectTransform = (target) => {
	target.scaleX = 1;
	target.scaleY = 1;
	target.skewX = 0;
	target.skewY = 0;
	target.flipX = false;
	target.flipY = false;
	target.rotate(0);
};
/**
* Extract Object transform values
* @param  {FabricObject} target object to read from
* @return {Object} Components of transform
*/
const saveObjectTransform = (target) => ({
	scaleX: target.scaleX,
	scaleY: target.scaleY,
	skewX: target.skewX,
	skewY: target.skewY,
	angle: target.angle,
	left: target.left,
	flipX: target.flipX,
	flipY: target.flipY,
	top: target.top
});
/**
* given a width and height, return the size of the bounding box
* that can contains the box with width/height with applied transform.
* Use to calculate the boxes around objects for controls.
* @param {Number} width
* @param {Number} height
* @param {TMat2D} t
* @returns {Point} size
*/
const sizeAfterTransform = (width, height, t) => {
	const dimX = width / 2, dimY = height / 2, bbox = makeBoundingBoxFromPoints([
		new Point(-dimX, -dimY),
		new Point(dimX, -dimY),
		new Point(-dimX, dimY),
		new Point(dimX, dimY)
	].map((p) => p.transform(t)));
	return new Point(bbox.width, bbox.height);
};
//#endregion
export { addTransformToObject, applyTransformToObject, removeTransformFromObject, resetObjectTransform, saveObjectTransform, sizeAfterTransform };

//# sourceMappingURL=objectTransforms.mjs.map