import { CENTER, LEFT, SCALE_X, SCALE_Y, iMatrix } from "../../constants.mjs";
import { Point } from "../../Point.mjs";
import { CommonMethods } from "../../CommonMethods.mjs";
import { degreesToRadians, radiansToDegrees } from "../../util/misc/radiansDegreesConversion.mjs";
import { calcDimensionsMatrix, calcPlaneRotation, calcPlaneScaleY, calcPlaneZoom, composeMatrix, createRotateMatrix, createTranslateMatrix, invertTransform, multiplyTransformMatrices, transformPoint } from "../../util/misc/matrix.mjs";
import { makeBoundingBoxFromPoints } from "../../util/misc/boundingBoxFromPoints.mjs";
import { sizeAfterTransform } from "../../util/misc/objectTransforms.mjs";
import { resolveOrigin } from "../../util/misc/resolveOrigin.mjs";
import { Intersection } from "../../Intersection.mjs";
//#region src/shapes/Object/ObjectGeometry.ts
var ObjectGeometry = class extends CommonMethods {
	/**
	* @returns {number} x position according to object's originX property in canvas coordinate plane
	*/
	getX() {
		return this.getXY().x;
	}
	/**
	* @param {number} value x position according to object's originX property in canvas coordinate plane
	*/
	setX(value) {
		this.setXY(this.getXY().setX(value));
	}
	/**
	* @returns {number} y position according to object's originY property in canvas coordinate plane
	*/
	getY() {
		return this.getXY().y;
	}
	/**
	* @param {number} value y position according to object's originY property in canvas coordinate plane
	*/
	setY(value) {
		this.setXY(this.getXY().setY(value));
	}
	/**
	* @returns {number} x position according to object's originX property in parent's coordinate plane\
	* if parent is canvas then this property is identical to {@link getX}
	*/
	getRelativeX() {
		return this.left;
	}
	/**
	* @param {number} value x position according to object's originX property in parent's coordinate plane\
	* if parent is canvas then this method is identical to {@link setX}
	*/
	setRelativeX(value) {
		this.left = value;
	}
	/**
	* @returns {number} y position according to object's originY property in parent's coordinate plane\
	* if parent is canvas then this property is identical to {@link getY}
	*/
	getRelativeY() {
		return this.top;
	}
	/**
	* @param {number} value y position according to object's originY property in parent's coordinate plane\
	* if parent is canvas then this property is identical to {@link setY}
	*/
	setRelativeY(value) {
		this.top = value;
	}
	/**
	* @returns {Point} x position according to object's originX originY properties in canvas coordinate plane
	*/
	getXY() {
		const relativePosition = this.getRelativeXY();
		return this.group ? transformPoint(relativePosition, this.group.calcTransformMatrix()) : relativePosition;
	}
	/**
	* Set an object position to a particular point, the point is intended in absolute ( canvas ) coordinate.
	* You can specify originX and originY values,
	* that otherwise are the object's current values.
	* @example <caption>Set object's bottom left corner to point (5,5) on canvas</caption>
	* object.setXY(new Point(5, 5), 'left', 'bottom').
	* @param {Point} point position in scene coordinate plane
	* @param {TOriginX} [originX] Horizontal origin: 'left', 'center' or 'right'
	* @param {TOriginY} [originY] Vertical origin: 'top', 'center' or 'bottom'
	*/
	setXY(point, originX, originY) {
		if (this.group) point = transformPoint(point, invertTransform(this.group.calcTransformMatrix()));
		this.setRelativeXY(point, originX, originY);
	}
	/**
	* @returns {Point} x,y position according to object's originX originY properties in parent's coordinate plane
	*/
	getRelativeXY() {
		return new Point(this.left, this.top);
	}
	/**
	* As {@link setXY}, but in current parent's coordinate plane (the current group if any or the canvas)
	* @param {Point} point position according to object's originX originY properties in parent's coordinate plane
	* @param {TOriginX} [originX] Horizontal origin: 'left', 'center' or 'right'
	* @param {TOriginY} [originY] Vertical origin: 'top', 'center' or 'bottom'
	*/
	setRelativeXY(point, originX = this.originX, originY = this.originY) {
		this.setPositionByOrigin(point, originX, originY);
	}
	/**
	* @deprecated intermidiate method to be removed, do not use
	*/
	isStrokeAccountedForInDimensions() {
		return false;
	}
	/**
	* @return {Point[]} [tl, tr, br, bl] in the scene plane
	*/
	getCoords() {
		const { tl, tr, br, bl } = this.aCoords || (this.aCoords = this.calcACoords());
		const coords = [
			tl,
			tr,
			br,
			bl
		];
		if (this.group) {
			const t = this.group.calcTransformMatrix();
			return coords.map((p) => transformPoint(p, t));
		}
		return coords;
	}
	/**
	* Checks if object intersects with the scene rect formed by tl and br
	*/
	intersectsWithRect(tl, br) {
		return Intersection.intersectPolygonRectangle(this.getCoords(), tl, br).status === "Intersection";
	}
	/**
	* Checks if object intersects with another object
	* @param {Object} other Object to test
	* @return {Boolean} true if object intersects with another object
	*/
	intersectsWithObject(other) {
		const intersection = Intersection.intersectPolygonPolygon(this.getCoords(), other.getCoords());
		return intersection.status === "Intersection" || intersection.status === "Coincident" || other.isContainedWithinObject(this) || this.isContainedWithinObject(other);
	}
	/**
	* Checks if object is fully contained within area of another object
	* @param {Object} other Object to test
	* @return {Boolean} true if object is fully contained within area of another object
	*/
	isContainedWithinObject(other) {
		return this.getCoords().every((point) => other.containsPoint(point));
	}
	/**
	* Checks if object is fully contained within the scene rect formed by tl and br
	*/
	isContainedWithinRect(tl, br) {
		const { left, top, width, height } = this.getBoundingRect();
		return left >= tl.x && left + width <= br.x && top >= tl.y && top + height <= br.y;
	}
	isOverlapping(other) {
		return this.intersectsWithObject(other) || this.isContainedWithinObject(other) || other.isContainedWithinObject(this);
	}
	/**
	* Checks if point is inside the object
	* @param {Point} point Point to check against
	* @return {Boolean} true if point is inside the object
	*/
	containsPoint(point) {
		return Intersection.isPointInPolygon(point, this.getCoords());
	}
	/**
	* Checks if object is contained within the canvas with current viewportTransform
	* the check is done stopping at first point that appears on screen
	* @return {Boolean} true if object is fully or partially contained within canvas
	*/
	isOnScreen() {
		if (!this.canvas) return false;
		const { tl, br } = this.canvas.vptCoords;
		if (this.getCoords().some((point) => point.x <= br.x && point.x >= tl.x && point.y <= br.y && point.y >= tl.y)) return true;
		if (this.intersectsWithRect(tl, br)) return true;
		return this.containsPoint(tl.midPointFrom(br));
	}
	/**
	* Checks if object is partially contained within the canvas with current viewportTransform
	* @return {Boolean} true if object is partially contained within canvas
	*/
	isPartiallyOnScreen() {
		if (!this.canvas) return false;
		const { tl, br } = this.canvas.vptCoords;
		if (this.intersectsWithRect(tl, br)) return true;
		return this.getCoords().every((point) => (point.x >= br.x || point.x <= tl.x) && (point.y >= br.y || point.y <= tl.y)) && this.containsPoint(tl.midPointFrom(br));
	}
	/**
	* Returns coordinates of object's bounding rectangle (left, top, width, height)
	* the box is intended as aligned to axis of canvas.
	* @return {Object} Object with left, top, width, height properties
	*/
	getBoundingRect() {
		return makeBoundingBoxFromPoints(this.getCoords());
	}
	/**
	* Returns width of an object's bounding box counting transformations
	* @todo shouldn't this account for group transform and return the actual size in canvas coordinate plane?
	* @return {Number} width value
	*/
	getScaledWidth() {
		return this._getTransformedDimensions().x;
	}
	/**
	* Returns height of an object bounding box counting transformations
	* @todo shouldn't this account for group transform and return the actual size in canvas coordinate plane?
	* @return {Number} height value
	*/
	getScaledHeight() {
		return this._getTransformedDimensions().y;
	}
	/**
	* Scales an object (equally by x and y)
	* @param {Number} value Scale factor
	* @return {void}
	*/
	scale(value) {
		this._set(SCALE_X, value);
		this._set(SCALE_Y, value);
		this.setCoords();
	}
	/**
	* Scales an object to a given width, with respect to bounding box (scaling by x/y equally)
	* @param {Number} value New width value
	* @return {void}
	*/
	scaleToWidth(value) {
		const boundingRectFactor = this.getBoundingRect().width / this.getScaledWidth();
		return this.scale(value / this.width / boundingRectFactor);
	}
	/**
	* Scales an object to a given height, with respect to bounding box (scaling by x/y equally)
	* @param {Number} value New height value
	* @return {void}
	*/
	scaleToHeight(value) {
		const boundingRectFactor = this.getBoundingRect().height / this.getScaledHeight();
		return this.scale(value / this.height / boundingRectFactor);
	}
	getCanvasRetinaScaling() {
		var _this$canvas;
		return ((_this$canvas = this.canvas) === null || _this$canvas === void 0 ? void 0 : _this$canvas.getRetinaScaling()) || 1;
	}
	/**
	* Returns the object angle relative to canvas counting also the group property
	* @returns {TDegree}
	*/
	getTotalAngle() {
		return this.group ? radiansToDegrees(calcPlaneRotation(this.calcTransformMatrix())) : this.angle;
	}
	/**
	* Retrieves viewportTransform from Object's canvas if available
	* @return {TMat2D}
	*/
	getViewportTransform() {
		var _this$canvas2;
		return ((_this$canvas2 = this.canvas) === null || _this$canvas2 === void 0 ? void 0 : _this$canvas2.viewportTransform) || iMatrix.concat();
	}
	/**
	* Calculates the coordinates of the 4 corner of the bbox, in absolute coordinates.
	* those never change with zoom or viewport changes.
	* @return {TCornerPoint}
	*/
	calcACoords() {
		const rotateMatrix = createRotateMatrix({ angle: this.angle }), { x, y } = this.getRelativeCenterPoint(), finalMatrix = multiplyTransformMatrices(createTranslateMatrix(x, y), rotateMatrix), dim = this._getTransformedDimensions(), w = dim.x / 2, h = dim.y / 2;
		return {
			tl: transformPoint({
				x: -w,
				y: -h
			}, finalMatrix),
			tr: transformPoint({
				x: w,
				y: -h
			}, finalMatrix),
			bl: transformPoint({
				x: -w,
				y: h
			}, finalMatrix),
			br: transformPoint({
				x: w,
				y: h
			}, finalMatrix)
		};
	}
	/**
	* Sets corner and controls position coordinates based on current angle, width and height, left and top.
	* aCoords are used to quickly find an object on the canvas.
	* See {@link https://github.com/fabricjs/fabric.js/wiki/When-to-call-setCoords} and {@link http://fabric5.fabricjs.com/fabric-gotchas}
	*/
	setCoords() {
		this.aCoords = this.calcACoords();
	}
	transformMatrixKey(skipGroup = false) {
		let prefix = [];
		if (!skipGroup && this.group) prefix = this.group.transformMatrixKey(skipGroup);
		prefix.push(this.top, this.left, this.width, this.height, this.scaleX, this.scaleY, this.angle, this.strokeWidth, this.skewX, this.skewY, +this.flipX, +this.flipY, resolveOrigin(this.originX), resolveOrigin(this.originY));
		return prefix;
	}
	/**
	* calculate transform matrix that represents the current transformations from the
	* object's properties.
	* @param {Boolean} [skipGroup] return transform matrix for object not counting parent transformations
	* There are some situation in which this is useful to avoid the fake rotation.
	* @return {TMat2D} transform matrix for the object
	*/
	calcTransformMatrix(skipGroup = false) {
		let matrix = this.calcOwnMatrix();
		if (skipGroup || !this.group) return matrix;
		const key = this.transformMatrixKey(skipGroup), cache = this.matrixCache;
		if (cache && cache.key.every((x, i) => x === key[i])) return cache.value;
		if (this.group) matrix = multiplyTransformMatrices(this.group.calcTransformMatrix(false), matrix);
		this.matrixCache = {
			key,
			value: matrix
		};
		return matrix;
	}
	/**
	* calculate transform matrix that represents the current transformations from the
	* object's properties, this matrix does not include the group transformation
	* @return {TMat2D} transform matrix for the object
	*/
	calcOwnMatrix() {
		const key = this.transformMatrixKey(true), cache = this.ownMatrixCache;
		if (cache && cache.key.every((x, i) => x === key[i])) return cache.value;
		const center = this.getRelativeCenterPoint(), value = composeMatrix({
			angle: this.angle,
			translateX: center.x,
			translateY: center.y,
			scaleX: this.scaleX,
			scaleY: this.scaleY,
			skewX: this.skewX,
			skewY: this.skewY,
			flipX: this.flipX,
			flipY: this.flipY
		});
		this.ownMatrixCache = {
			key,
			value
		};
		return value;
	}
	/**
	* Calculate object dimensions from its properties
	* @private
	* @returns {Point} dimensions
	*/
	_getNonTransformedDimensions() {
		return new Point(this.width, this.height).scalarAdd(this.strokeWidth);
	}
	/**
	* Calculate object dimensions for controls box, including padding and canvas zoom.
	* and active selection
	* @private
	* @param {object} [options] transform options
	* @returns {Point} dimensions
	*/
	_calculateCurrentDimensions(options) {
		var _this$canvas3;
		const vpt = (_this$canvas3 = this.canvas) === null || _this$canvas3 === void 0 ? void 0 : _this$canvas3.viewportTransform;
		const dim = this._getTransformedDimensions(options);
		if (vpt) return dim.multiply(new Point(calcPlaneZoom(vpt), calcPlaneScaleY(vpt))).scalarAdd(2 * this.padding);
		return dim.scalarAdd(2 * this.padding);
	}
	/**
	* Calculate object bounding box dimensions from its properties scale, skew.
	* This bounding box is aligned with object angle and not with canvas axis or screen.
	* @param {Object} [options]
	* @param {Number} [options.scaleX]
	* @param {Number} [options.scaleY]
	* @param {Number} [options.skewX]
	* @param {Number} [options.skewY]
	* @private
	* @returns {Point} dimensions
	*/
	_getTransformedDimensions(options = {}) {
		const dimOptions = {
			scaleX: this.scaleX,
			scaleY: this.scaleY,
			skewX: this.skewX,
			skewY: this.skewY,
			width: this.width,
			height: this.height,
			strokeWidth: this.strokeWidth,
			...options
		};
		const strokeWidth = dimOptions.strokeWidth;
		let preScalingStrokeValue = strokeWidth, postScalingStrokeValue = 0;
		if (this.strokeUniform) {
			preScalingStrokeValue = 0;
			postScalingStrokeValue = strokeWidth;
		}
		const dimX = dimOptions.width + preScalingStrokeValue, dimY = dimOptions.height + preScalingStrokeValue, noSkew = dimOptions.skewX === 0 && dimOptions.skewY === 0;
		let finalDimensions;
		if (noSkew) finalDimensions = new Point(dimX * dimOptions.scaleX, dimY * dimOptions.scaleY);
		else finalDimensions = sizeAfterTransform(dimX, dimY, calcDimensionsMatrix(dimOptions));
		return finalDimensions.scalarAdd(postScalingStrokeValue);
	}
	/**
	* Translates the coordinates from a set of origin to another (based on the object's dimensions)
	* @param {Point} point The point which corresponds to the originX and originY params
	* @param {TOriginX} fromOriginX Horizontal origin: 'left', 'center' or 'right'
	* @param {TOriginY} fromOriginY Vertical origin: 'top', 'center' or 'bottom'
	* @param {TOriginX} toOriginX Horizontal origin: 'left', 'center' or 'right'
	* @param {TOriginY} toOriginY Vertical origin: 'top', 'center' or 'bottom'
	* @return {Point}
	*/
	translateToGivenOrigin(point, fromOriginX, fromOriginY, toOriginX, toOriginY) {
		let x = point.x, y = point.y;
		const offsetX = resolveOrigin(toOriginX) - resolveOrigin(fromOriginX), offsetY = resolveOrigin(toOriginY) - resolveOrigin(fromOriginY);
		if (offsetX || offsetY) {
			const dim = this._getTransformedDimensions();
			x += offsetX * dim.x;
			y += offsetY * dim.y;
		}
		return new Point(x, y);
	}
	/**
	* Translates the coordinates from origin to center coordinates (based on the object's dimensions)
	* @param {Point} point The point which corresponds to the originX and originY params
	* @param {TOriginX} originX Horizontal origin: 'left', 'center' or 'right'
	* @param {TOriginY} originY Vertical origin: 'top', 'center' or 'bottom'
	* @return {Point}
	*/
	translateToCenterPoint(point, originX, originY) {
		if (originX === "center" && originY === "center") return point;
		const p = this.translateToGivenOrigin(point, originX, originY, CENTER, CENTER);
		if (this.angle) return p.rotate(degreesToRadians(this.angle), point);
		return p;
	}
	/**
	* Translates the coordinates from center to origin coordinates (based on the object's dimensions)
	* @param {Point} center The point which corresponds to center of the object
	* @param {OriginX} originX Horizontal origin: 'left', 'center' or 'right'
	* @param {OriginY} originY Vertical origin: 'top', 'center' or 'bottom'
	* @return {Point}
	*/
	translateToOriginPoint(center, originX, originY) {
		const p = this.translateToGivenOrigin(center, CENTER, CENTER, originX, originY);
		if (this.angle) return p.rotate(degreesToRadians(this.angle), center);
		return p;
	}
	/**
	* Returns the center coordinates of the object relative to canvas
	* @return {Point}
	*/
	getCenterPoint() {
		const relCenter = this.getRelativeCenterPoint();
		return this.group ? transformPoint(relCenter, this.group.calcTransformMatrix()) : relCenter;
	}
	/**
	* Returns the center coordinates of the object relative to it's parent
	* @return {Point}
	*/
	getRelativeCenterPoint() {
		return this.translateToCenterPoint(new Point(this.left, this.top), this.originX, this.originY);
	}
	/**
	* Alias of {@link getPositionByOrigin}
	* @deprecated use {@link getPositionByOrigin} instead
	*/
	getPointByOrigin(originX, originY) {
		return this.getPositionByOrigin(originX, originY);
	}
	/**
	* This function is the mirror of {@link setPositionByOrigin}
	* Returns the position of the object based on specified origin.
	* Take an object that has left, top set to 100, 100 with origin 'left', 'top'.
	* Return the values of left top ( wrapped in a point ) that you would need to keep
	* the same position if origin where different ( ex: center, bottom )
	* Alternatively you can use this to also find which point in the parent plane is a specific origin
	* ( where is the bottom right corner of my object? )
	* @param {TOriginX} originX Horizontal origin: 'left', 'center' or 'right'
	* @param {TOriginY} originY Vertical origin: 'top', 'center' or 'bottom'
	* @return {Point}
	*/
	getPositionByOrigin(originX, originY) {
		return this.translateToOriginPoint(this.getRelativeCenterPoint(), originX, originY);
	}
	/**
	* Sets the position of the object taking into consideration the object's origin
	* @param {Point} pos The new position of the object
	* @param {TOriginX} originX Horizontal origin: 'left', 'center' or 'right'
	* @param {TOriginY} originY Vertical origin: 'top', 'center' or 'bottom'
	* @return {void}
	*/
	setPositionByOrigin(pos, originX, originY) {
		const center = this.translateToCenterPoint(pos, originX, originY), position = this.translateToOriginPoint(center, this.originX, this.originY);
		this.set({
			left: position.x,
			top: position.y
		});
	}
	/**
	* @private
	*/
	_getLeftTopCoords() {
		return this.getPositionByOrigin(LEFT, "top");
	}
	/**
	* An utility method to position the object by its left top corner.
	* Useful to reposition objects since now the default origin is center/center
	* Places the left/top corner of the object bounding box in p.
	*/
	positionByLeftTop(p) {
		return this.setPositionByOrigin(p, LEFT, "top");
	}
};
//#endregion
export { ObjectGeometry };

//# sourceMappingURL=ObjectGeometry.mjs.map