import { _defineProperty } from "../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { Color } from "../color/Color.mjs";
//#region src/brushes/BaseBrush.ts
/**
* @see {@link http://fabric5.fabricjs.com/freedrawing|Freedrawing demo}
*/
var BaseBrush = class {
	constructor(canvas) {
		_defineProperty(
			this,
			/**
			* Color of a brush
			* @type String
			*/
			"color",
			"rgb(0, 0, 0)"
		);
		_defineProperty(
			this,
			/**
			* Width of a brush, has to be a Number, no string literals
			* @type Number
			*/
			"width",
			1
		);
		_defineProperty(
			this,
			/**
			* Shadow object representing shadow of this shape.
			* <b>Backwards incompatibility note:</b> This property replaces "shadowColor" (String), "shadowOffsetX" (Number),
			* "shadowOffsetY" (Number) and "shadowBlur" (Number) since v1.2.12
			* @type Shadow
			*/
			"shadow",
			null
		);
		_defineProperty(
			this,
			/**
			* Line endings style of a brush (one of "butt", "round", "square")
			* @type String
			*/
			"strokeLineCap",
			"round"
		);
		_defineProperty(
			this,
			/**
			* Corner style of a brush (one of "bevel", "round", "miter")
			* @type String
			*/
			"strokeLineJoin",
			"round"
		);
		_defineProperty(
			this,
			/**
			* Maximum miter length (used for strokeLineJoin = "miter") of a brush's
			* @type Number
			*/
			"strokeMiterLimit",
			10
		);
		_defineProperty(
			this,
			/**
			* Stroke Dash Array.
			* @type Array
			*/
			"strokeDashArray",
			null
		);
		_defineProperty(
			this,
			/**
			* When `true`, the free drawing is limited to the whiteboard size. Default to false.
			* @type Boolean
			* @default false
			*/
			"limitedToCanvasSize",
			false
		);
		this.canvas = canvas;
	}
	/**
	* Sets brush styles
	* @private
	* @param {CanvasRenderingContext2D} ctx
	*/
	_setBrushStyles(ctx) {
		ctx.strokeStyle = this.color;
		ctx.lineWidth = this.width;
		ctx.lineCap = this.strokeLineCap;
		ctx.miterLimit = this.strokeMiterLimit;
		ctx.lineJoin = this.strokeLineJoin;
		ctx.setLineDash(this.strokeDashArray || []);
	}
	/**
	* Sets the transformation on given context
	* @param {CanvasRenderingContext2D} ctx context to render on
	* @private
	*/
	_saveAndTransform(ctx) {
		const v = this.canvas.viewportTransform;
		ctx.save();
		ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
	}
	needsFullRender() {
		return new Color(this.color).getAlpha() < 1 || !!this.shadow;
	}
	/**
	* Sets brush shadow styles
	* @private
	*/
	_setShadow() {
		if (!this.shadow || !this.canvas) return;
		const canvas = this.canvas, shadow = this.shadow, ctx = canvas.contextTop, zoom = canvas.getZoom() * canvas.getRetinaScaling();
		ctx.shadowColor = shadow.color;
		ctx.shadowBlur = shadow.blur * zoom;
		ctx.shadowOffsetX = shadow.offsetX * zoom;
		ctx.shadowOffsetY = shadow.offsetY * zoom;
	}
	/**
	* Removes brush shadow styles
	* @private
	*/
	_resetShadow() {
		const ctx = this.canvas.contextTop;
		ctx.shadowColor = "";
		ctx.shadowBlur = ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
	}
	/**
	* Check is pointer is outside canvas boundaries
	* @param {Object} pointer
	* @private
	*/
	_isOutSideCanvas(pointer) {
		return pointer.x < 0 || pointer.x > this.canvas.getWidth() || pointer.y < 0 || pointer.y > this.canvas.getHeight();
	}
};
//#endregion
export { BaseBrush };

//# sourceMappingURL=BaseBrush.mjs.map