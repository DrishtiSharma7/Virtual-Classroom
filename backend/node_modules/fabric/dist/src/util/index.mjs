import { __exportAll } from "../../_virtual/_rolldown/runtime.mjs";
import { removeFromArray } from "./internals/removeFromArray.mjs";
import { cos } from "./misc/cos.mjs";
import { sin } from "./misc/sin.mjs";
import { cancelAnimFrame, requestAnimFrame } from "./animation/AnimationFrameProvider.mjs";
import { copyCanvasElement, createCanvasElement, createImage, toBlob, toDataURL } from "./misc/dom.mjs";
import { degreesToRadians, radiansToDegrees } from "./misc/radiansDegreesConversion.mjs";
import { calcDimensionsMatrix, composeMatrix, createRotateMatrix, createScaleMatrix, createSkewXMatrix, createSkewYMatrix, createTranslateMatrix, invertTransform, isIdentityMatrix, multiplyTransformMatrices, multiplyTransformMatrixArray, qrDecompose, transformPoint } from "./misc/matrix.mjs";
import { enlivenObjectEnlivables, enlivenObjects, loadImage } from "./misc/objectEnlive.mjs";
import { pick } from "./misc/pick.mjs";
import { toFixed } from "./misc/toFixed.mjs";
import { matrixToSVG } from "./misc/svgExport.mjs";
import { lang_string_exports } from "./lang_string.mjs";
import { getPointer, isTouchEvent } from "./dom_event.mjs";
import { makeBoundingBoxFromPoints } from "./misc/boundingBoxFromPoints.mjs";
import { addTransformToObject, applyTransformToObject, removeTransformFromObject, resetObjectTransform, saveObjectTransform, sizeAfterTransform } from "./misc/objectTransforms.mjs";
import { calcPlaneChangeMatrix, sendObjectToPlane, sendPointToPlane, sendVectorToPlane } from "./misc/planeChange.mjs";
import { calcAngleBetweenVectors, calcVectorRotation, createVector, crossProduct, dotProduct, getOrthonormalVector, getUnitVector, isBetweenVectors, magnitude, rotateVector } from "./misc/vectors.mjs";
import { getSvgAttributes, parsePreserveAspectRatioAttribute, parseUnit } from "./misc/svgParsing.mjs";
import { capValue } from "./misc/capValue.mjs";
import { easing_exports } from "./animation/easing.mjs";
import { animate, animateColor } from "./animation/animate.mjs";
import { isTransparent } from "./misc/isTransparent.mjs";
import { projectStrokeOnPoints } from "./misc/projectStroke/index.mjs";
import { hasStyleChanged, stylesFromArray, stylesToArray } from "./misc/textStyles.mjs";
import { groupSVGElements } from "./misc/groupSVGElements.mjs";
import { findScaleToCover, findScaleToFit } from "./misc/findScaleTo.mjs";
import { getBoundsOfCurve, getPathSegmentsInfo, getPointOnPath, getRegularPolygonPath, getSmoothPathFromPoints, joinPath, makePathSimpler, parsePath, transformPath } from "./path/index.mjs";
import { mergeClipPaths } from "./misc/mergeClipPaths.mjs";
import { getRandomInt } from "./internals/getRandomInt.mjs";
import { removeTransformMatrixForSvgParsing } from "./transform_matrix_removal.mjs";
//#region src/util/index.ts
var util_exports = /* @__PURE__ */ __exportAll({
	addTransformToObject: () => addTransformToObject,
	animate: () => animate,
	animateColor: () => animateColor,
	applyTransformToObject: () => applyTransformToObject,
	calcAngleBetweenVectors: () => calcAngleBetweenVectors,
	calcDimensionsMatrix: () => calcDimensionsMatrix,
	calcPlaneChangeMatrix: () => calcPlaneChangeMatrix,
	calcVectorRotation: () => calcVectorRotation,
	cancelAnimFrame: () => cancelAnimFrame,
	capValue: () => capValue,
	composeMatrix: () => composeMatrix,
	copyCanvasElement: () => copyCanvasElement,
	cos: () => cos,
	createCanvasElement: () => createCanvasElement,
	createImage: () => createImage,
	createRotateMatrix: () => createRotateMatrix,
	createScaleMatrix: () => createScaleMatrix,
	createSkewXMatrix: () => createSkewXMatrix,
	createSkewYMatrix: () => createSkewYMatrix,
	createTranslateMatrix: () => createTranslateMatrix,
	createVector: () => createVector,
	crossProduct: () => crossProduct,
	degreesToRadians: () => degreesToRadians,
	dotProduct: () => dotProduct,
	ease: () => easing_exports,
	enlivenObjectEnlivables: () => enlivenObjectEnlivables,
	enlivenObjects: () => enlivenObjects,
	findScaleToCover: () => findScaleToCover,
	findScaleToFit: () => findScaleToFit,
	getBoundsOfCurve: () => getBoundsOfCurve,
	getOrthonormalVector: () => getOrthonormalVector,
	getPathSegmentsInfo: () => getPathSegmentsInfo,
	getPointOnPath: () => getPointOnPath,
	getPointer: () => getPointer,
	getRandomInt: () => getRandomInt,
	getRegularPolygonPath: () => getRegularPolygonPath,
	getSmoothPathFromPoints: () => getSmoothPathFromPoints,
	getSvgAttributes: () => getSvgAttributes,
	getUnitVector: () => getUnitVector,
	groupSVGElements: () => groupSVGElements,
	hasStyleChanged: () => hasStyleChanged,
	invertTransform: () => invertTransform,
	isBetweenVectors: () => isBetweenVectors,
	isIdentityMatrix: () => isIdentityMatrix,
	isTouchEvent: () => isTouchEvent,
	isTransparent: () => isTransparent,
	joinPath: () => joinPath,
	loadImage: () => loadImage,
	magnitude: () => magnitude,
	makeBoundingBoxFromPoints: () => makeBoundingBoxFromPoints,
	makePathSimpler: () => makePathSimpler,
	matrixToSVG: () => matrixToSVG,
	mergeClipPaths: () => mergeClipPaths,
	multiplyTransformMatrices: () => multiplyTransformMatrices,
	multiplyTransformMatrixArray: () => multiplyTransformMatrixArray,
	parsePath: () => parsePath,
	parsePreserveAspectRatioAttribute: () => parsePreserveAspectRatioAttribute,
	parseUnit: () => parseUnit,
	pick: () => pick,
	projectStrokeOnPoints: () => projectStrokeOnPoints,
	qrDecompose: () => qrDecompose,
	radiansToDegrees: () => radiansToDegrees,
	removeFromArray: () => removeFromArray,
	removeTransformFromObject: () => removeTransformFromObject,
	removeTransformMatrixForSvgParsing: () => removeTransformMatrixForSvgParsing,
	requestAnimFrame: () => requestAnimFrame,
	resetObjectTransform: () => resetObjectTransform,
	rotateVector: () => rotateVector,
	saveObjectTransform: () => saveObjectTransform,
	sendObjectToPlane: () => sendObjectToPlane,
	sendPointToPlane: () => sendPointToPlane,
	sendVectorToPlane: () => sendVectorToPlane,
	sin: () => sin,
	sizeAfterTransform: () => sizeAfterTransform,
	string: () => lang_string_exports,
	stylesFromArray: () => stylesFromArray,
	stylesToArray: () => stylesToArray,
	toBlob: () => toBlob,
	toDataURL: () => toDataURL,
	toFixed: () => toFixed,
	transformPath: () => transformPath,
	transformPoint: () => transformPoint
});
//#endregion
export { util_exports };

//# sourceMappingURL=index.mjs.map