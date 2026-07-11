import { _defineProperty } from "../../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import "../../constants.mjs";
import { Point, ZERO } from "../../Point.mjs";
import { degreesToRadians } from "../../util/misc/radiansDegreesConversion.mjs";
import { calcDimensionsMatrix, calcPlaneRotation, calcPlaneScaleY, calcPlaneZoom, createRotateMatrix, createTranslateMatrix, multiplyTransformMatrices, qrDecompose } from "../../util/misc/matrix.mjs";
import { sizeAfterTransform } from "../../util/misc/objectTransforms.mjs";
import { interactiveObjectDefaultValues } from "./defaultValues.mjs";
import { FabricObject } from "./Object.mjs";
import { createObjectDefaultControls } from "../../controls/commonControls.mjs";
//#region src/shapes/Object/InteractiveObject.ts
var InteractiveFabricObject = class InteractiveFabricObject extends FabricObject {
	static getDefaults() {
		return {
			...super.getDefaults(),
			...InteractiveFabricObject.ownDefaults
		};
	}
	/**
	* Constructor
	* @param {Object} [options] Options object
	*/
	constructor(options) {
		super();
		Object.assign(this, this.constructor.createControls(), InteractiveFabricObject.ownDefaults);
		this.setOptions(options);
	}
	/**
	* Creates the default control object.
	* If you prefer to have on instance of controls shared among all objects
	* make this function return an empty object and add controls to the ownDefaults
	* @param {Object} [options] Options object
	*/
	static createControls() {
		return { controls: createObjectDefaultControls() };
	}
	/**
	* Update width and height of the canvas for cache
	* returns true or false if canvas needed resize.
	* @private
	* @return {Boolean} true if the canvas has been resized
	*/
	_updateCacheCanvas() {
		const targetCanvas = this.canvas;
		if (this.noScaleCache && targetCanvas && targetCanvas._currentTransform) {
			const transform = targetCanvas._currentTransform, target = transform.target, action = transform.action;
			if (this === target && action && action.startsWith("scale")) return false;
		}
		return super._updateCacheCanvas();
	}
	getActiveControl() {
		const key = this.__corner;
		return key ? {
			key,
			control: this.controls[key],
			coord: this.oCoords[key]
		} : void 0;
	}
	/**
	* Determines which corner is under the mouse cursor, represented by `pointer`.
	* This function returns a corner only if the object is the active one.
	* This is done to avoid selecting corner of non active object and activating transformations
	* rather than drag action. The default behavior of fabricJS is that if you want to transform
	* an object, first you select it to show the control set
	* @private
	* @param {Object} pointer The pointer indicating the mouse position
	* @param {boolean} forTouch indicates if we are looking for interaction area with a touch action
	* @return {String|Boolean} corner code (tl, tr, bl, br, etc.), or 0 if nothing is found.
	*/
	findControl(pointer, forTouch = false) {
		if (!this.hasControls || !this.canvas) return;
		this.__corner = void 0;
		const cornerEntries = Object.entries(this.oCoords);
		for (let i = cornerEntries.length - 1; i >= 0; i--) {
			const [key, corner] = cornerEntries[i];
			const control = this.controls[key];
			if (control.shouldActivate(key, this, pointer, forTouch ? corner.touchCorner : corner.corner)) {
				this.__corner = key;
				return {
					key,
					control,
					coord: this.oCoords[key]
				};
			}
		}
	}
	/**
	* Calculates the coordinates of the center of each control plus the corners of the control itself
	* This basically just delegates to each control positionHandler
	* WARNING: changing what is passed to positionHandler is a breaking change, since position handler
	* is a public api and should be done just if extremely necessary
	* @return {Record<string, TOCoord>}
	*/
	calcOCoords() {
		const vpt = this.getViewportTransform(), vptScaleX = calcPlaneZoom(vpt), vptScaleY = calcPlaneScaleY(vpt), center = this.getCenterPoint(), finalMatrix = multiplyTransformMatrices(multiplyTransformMatrices(vpt, multiplyTransformMatrices(createTranslateMatrix(center.x, center.y), createRotateMatrix({ angle: this.getTotalAngle() - (!!this.group && this.flipX ? 180 : 0) }))), [
			1 / vptScaleX,
			0,
			0,
			1 / vptScaleY,
			0,
			0
		]), transformOptions = this.group ? qrDecompose(this.calcTransformMatrix()) : void 0;
		if (transformOptions) {
			transformOptions.scaleX = Math.abs(transformOptions.scaleX);
			transformOptions.scaleY = Math.abs(transformOptions.scaleY);
		}
		const dim = this._calculateCurrentDimensions(transformOptions), coords = {};
		this.forEachControl((control, key) => {
			const position = control.positionHandler(dim, finalMatrix, this, control);
			coords[key] = Object.assign(position, this._calcCornerCoords(control, position));
		});
		return coords;
	}
	/**
	* Sets the coordinates that determine the interaction area of each control
	* note: if we would switch to ROUND corner area, all of this would disappear.
	* everything would resolve to a single point and a pythagorean theorem for the distance
	* @todo evaluate simplification of code switching to circle interaction area at runtime
	* @private
	*/
	_calcCornerCoords(control, position) {
		const angle = this.getTotalAngle();
		return {
			corner: control.calcCornerCoords(angle, this.cornerSize, position.x, position.y, false, this),
			touchCorner: control.calcCornerCoords(angle, this.touchCornerSize, position.x, position.y, true, this)
		};
	}
	/**
	* @override set controls' coordinates as well
	* See {@link https://github.com/fabricjs/fabric.js/wiki/When-to-call-setCoords} and {@link https://fabric5.fabricjs.com/fabric-gotchas}
	* @return {void}
	*/
	setCoords() {
		super.setCoords();
		this.canvas && (this.oCoords = this.calcOCoords());
	}
	/**
	* Calls a function for each control. The function gets called,
	* with the control, the control's key and the object that is calling the iterator
	* @param {Function} fn function to iterate over the controls over
	*/
	forEachControl(fn) {
		for (const i in this.controls) fn(this.controls[i], i, this);
	}
	/**
	* Draws a colored layer behind the object, inside its selection borders.
	* Requires public options: padding, selectionBackgroundColor
	* this function is called when the context is transformed
	* has checks to be skipped when the object is on a staticCanvas
	* @todo evaluate if make this disappear in favor of a pre-render hook for objects
	* this was added by Andrea Bogazzi to make possible some feature for work reasons
	* it seemed a good option, now is an edge case
	* @param {CanvasRenderingContext2D} ctx Context to draw on
	*/
	drawSelectionBackground(ctx) {
		if (!this.selectionBackgroundColor || this.canvas && this.canvas._activeObject !== this) return;
		ctx.save();
		const center = this.getRelativeCenterPoint(), wh = this._calculateCurrentDimensions(), vpt = this.getViewportTransform();
		ctx.translate(center.x, center.y);
		ctx.scale(1 / vpt[0], 1 / vpt[3]);
		ctx.rotate(degreesToRadians(this.angle));
		ctx.fillStyle = this.selectionBackgroundColor;
		ctx.fillRect(-wh.x / 2, -wh.y / 2, wh.x, wh.y);
		ctx.restore();
	}
	/**
	* @public override this function in order to customize the drawing of the control box, e.g. rounded corners, different border style.
	* @param {CanvasRenderingContext2D} ctx ctx is rotated and translated so that (0,0) is at object's center
	* @param {Point} size the control box size used
	*/
	strokeBorders(ctx, size) {
		ctx.strokeRect(-size.x / 2, -size.y / 2, size.x, size.y);
	}
	/**
	* @private
	* @param {CanvasRenderingContext2D} ctx Context to draw on
	* @param {Point} size
	* @param {TStyleOverride} styleOverride object to override the object style
	*/
	_drawBorders(ctx, size, styleOverride = {}) {
		const options = {
			hasControls: this.hasControls,
			borderColor: this.borderColor,
			borderDashArray: this.borderDashArray,
			...styleOverride
		};
		ctx.save();
		ctx.strokeStyle = options.borderColor;
		this._setLineDash(ctx, options.borderDashArray);
		this.strokeBorders(ctx, size);
		options.hasControls && this.drawControlsConnectingLines(ctx, size);
		ctx.restore();
	}
	/**
	* Renders controls and borders for the object
	* the context here is not transformed
	* @todo move to interactivity
	* @param {CanvasRenderingContext2D} ctx Context to render on
	* @param {TStyleOverride} [styleOverride] properties to override the object style
	*/
	_renderControls(ctx, styleOverride = {}) {
		const { hasBorders, hasControls } = this;
		const styleOptions = {
			hasBorders,
			hasControls,
			...styleOverride
		};
		const vpt = this.getViewportTransform(), shouldDrawBorders = styleOptions.hasBorders, shouldDrawControls = styleOptions.hasControls;
		const options = qrDecompose(multiplyTransformMatrices(vpt, this.calcTransformMatrix()));
		ctx.save();
		ctx.translate(options.translateX, options.translateY);
		ctx.lineWidth = this.borderScaleFactor;
		if (this.group === this.parent) ctx.globalAlpha = this.isMoving ? this.borderOpacityWhenMoving : 1;
		if (this.flipX) options.angle -= 180;
		const vptAngle = calcPlaneRotation(vpt);
		ctx.rotate(this.group ? degreesToRadians(options.angle) : degreesToRadians(this.angle) + vptAngle);
		shouldDrawBorders && this.drawBorders(ctx, options, styleOverride);
		shouldDrawControls && this.drawControls(ctx, styleOverride);
		ctx.restore();
	}
	/**
	* Draws borders of an object's bounding box.
	* Requires public properties: width, height
	* Requires public options: padding, borderColor
	* @param {CanvasRenderingContext2D} ctx Context to draw on
	* @param {object} options object representing current object parameters
	* @param {TStyleOverride} [styleOverride] object to override the object style
	*/
	drawBorders(ctx, options, styleOverride) {
		let size;
		if (styleOverride && styleOverride.forActiveSelection || this.group) {
			const bbox = sizeAfterTransform(this.width, this.height, calcDimensionsMatrix(options)), stroke = !this.isStrokeAccountedForInDimensions() ? (this.strokeUniform ? new Point().scalarAdd(this.canvas ? this.canvas.getZoom() : 1) : new Point(options.scaleX, options.scaleY)).scalarMultiply(this.strokeWidth) : ZERO;
			size = bbox.add(stroke).scalarAdd(this.borderScaleFactor).scalarAdd(this.padding * 2);
		} else size = this._calculateCurrentDimensions().scalarAdd(this.borderScaleFactor);
		this._drawBorders(ctx, size, styleOverride);
	}
	/**
	* Draws lines from a borders of an object's bounding box to controls that have `withConnection` property set.
	* Requires public properties: width, height
	* Requires public options: padding, borderColor
	* @param {CanvasRenderingContext2D} ctx Context to draw on
	* @param {Point} size object size x = width, y = height
	*/
	drawControlsConnectingLines(ctx, size) {
		let shouldStroke = false;
		ctx.beginPath();
		this.forEachControl((control, key) => {
			if (control.withConnection && control.getVisibility(this, key)) {
				shouldStroke = true;
				ctx.moveTo(control.x * size.x, control.y * size.y);
				ctx.lineTo(control.x * size.x + control.offsetX, control.y * size.y + control.offsetY);
			}
		});
		shouldStroke && ctx.stroke();
	}
	/**
	* Draws corners of an object's bounding box.
	* Requires public properties: width, height
	* Requires public options: cornerSize, padding
	* Be aware that since fabric 6.0 this function does not call setCoords anymore.
	* setCoords needs to be called manually if the object of which we are rendering controls
	* is outside the standard selection and transform process.
	* @param {CanvasRenderingContext2D} ctx Context to draw on
	* @param {ControlRenderingStyleOverride} styleOverride object to override the object style
	*/
	drawControls(ctx, styleOverride = {}) {
		ctx.save();
		const retinaScaling = this.getCanvasRetinaScaling();
		const { cornerStrokeColor, cornerDashArray, cornerColor } = this;
		const options = {
			cornerStrokeColor,
			cornerDashArray,
			cornerColor,
			...styleOverride
		};
		ctx.setTransform(retinaScaling, 0, 0, retinaScaling, 0, 0);
		ctx.strokeStyle = ctx.fillStyle = options.cornerColor;
		if (!this.transparentCorners) ctx.strokeStyle = options.cornerStrokeColor;
		this._setLineDash(ctx, options.cornerDashArray);
		this.forEachControl((control, key) => {
			if (control.getVisibility(this, key)) {
				const p = this.oCoords[key];
				control.render(ctx, p.x, p.y, options, this);
			}
		});
		ctx.restore();
	}
	/**
	* Returns true if the specified control is visible, false otherwise.
	* @param {string} controlKey The key of the control. Possible values are usually 'tl', 'tr', 'br', 'bl', 'ml', 'mt', 'mr', 'mb', 'mtr',
	* but since the control api allow for any control name, can be any string.
	* @returns {boolean} true if the specified control is visible, false otherwise
	*/
	isControlVisible(controlKey) {
		return this.controls[controlKey] && this.controls[controlKey].getVisibility(this, controlKey);
	}
	/**
	* Sets the visibility of the specified control.
	* please do not use.
	* @param {String} controlKey The key of the control. Possible values are 'tl', 'tr', 'br', 'bl', 'ml', 'mt', 'mr', 'mb', 'mtr'.
	* but since the control api allow for any control name, can be any string.
	* @param {Boolean} visible true to set the specified control visible, false otherwise
	* @todo discuss this overlap of priority here with the team. Andrea Bogazzi for details
	*/
	setControlVisible(controlKey, visible) {
		if (!this._controlsVisibility) this._controlsVisibility = {};
		this._controlsVisibility[controlKey] = visible;
	}
	/**
	* Sets the visibility state of object controls, this is just a bulk option for setControlVisible;
	* @param {Record<string, boolean>} [options] with an optional key per control
	* example: {Boolean} [options.bl] true to enable the bottom-left control, false to disable it
	*/
	setControlsVisibility(options = {}) {
		Object.entries(options).forEach(([controlKey, visibility]) => this.setControlVisible(controlKey, visibility));
	}
	/**
	* Clears the canvas.contextTop in a specific area that corresponds to the object's bounding box
	* that is in the canvas.contextContainer.
	* This function is used to clear pieces of contextTop where we render ephemeral effects on top of the object.
	* Example: blinking cursor text selection, drag effects.
	* @todo discuss swapping restoreManually with a renderCallback, but think of async issues
	* @param {Boolean} [restoreManually] When true won't restore the context after clear, in order to draw something else.
	* @return {CanvasRenderingContext2D|undefined} canvas.contextTop that is either still transformed
	* with the object transformMatrix, or restored to neutral transform
	*/
	clearContextTop(restoreManually) {
		if (!this.canvas) return;
		const ctx = this.canvas.contextTop;
		if (!ctx) return;
		const v = this.canvas.viewportTransform;
		ctx.save();
		ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
		this.transform(ctx);
		const width = this.width + 4, height = this.height + 4;
		ctx.clearRect(-width / 2, -height / 2, width, height);
		restoreManually || ctx.restore();
		return ctx;
	}
	/**
	* This callback function is called every time _discardActiveObject or _setActiveObject
	* try to to deselect this object. If the function returns true, the process is cancelled
	* @param {Object} [_options] options sent from the upper functions
	* @param {TPointerEvent} [options.e] event if the process is generated by an event
	* @param {FabricObject} [options.object] next object we are setting as active, and reason why
	* this is being deselected
	*/
	onDeselect(_options) {
		return false;
	}
	/**
	* This callback function is called every time _discardActiveObject or _setActiveObject
	* try to to select this object. If the function returns true, the process is cancelled
	* @param {Object} [_options] options sent from the upper functions
	* @param {Event} [_options.e] event if the process is generated by an event
	*/
	onSelect(_options) {
		return false;
	}
	/**
	* Override to customize Drag behavior
	* Fired from {@link Canvas#_onMouseMove}
	* @returns true in order for the window to start a drag session
	*/
	shouldStartDragging(_e) {
		return false;
	}
	/**
	* Override to customize Drag behavior\
	* Fired once a drag session has started
	* @returns true to handle the drag event
	*/
	onDragStart(_e) {
		return false;
	}
	/**
	* Override to customize drag and drop behavior
	* @public
	* @param {DragEvent} _e
	* @returns {boolean} true if the object currently dragged can be dropped on the target
	*/
	canDrop(_e) {
		return false;
	}
	/**
	* Override to customize drag and drop behavior
	* render a specific effect when an object is the source of a drag event
	* example: render the selection status for the part of text that is being dragged from a text object
	* @public
	* @param {DragEvent} _e
	*/
	renderDragSourceEffect(_e) {}
	/**
	* Override to customize drag and drop behavior
	* render a specific effect when an object is the target of a drag event
	* used to show that the underly object can receive a drop, or to show how the
	* object will change when dropping. example: show the cursor where the text is about to be dropped
	* @public
	* @param {DragEvent} _e
	*/
	renderDropTargetEffect(_e) {}
};
_defineProperty(InteractiveFabricObject, "ownDefaults", interactiveObjectDefaultValues);
//#endregion
export { InteractiveFabricObject };

//# sourceMappingURL=InteractiveObject.mjs.map