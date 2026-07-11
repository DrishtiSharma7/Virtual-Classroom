import { _defineProperty } from "../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { Shadow } from "../Shadow.mjs";
import { getSmoothPathFromPoints, joinPath } from "../util/path/index.mjs";
import { BaseBrush } from "./BaseBrush.mjs";
import { Path } from "../shapes/Path.mjs";
//#region src/brushes/PencilBrush.ts
/**
* @private
* @param {TSimplePathData} pathData SVG path commands
* @returns {boolean}
*/
function isEmptySVGPath(pathData) {
	return joinPath(pathData) === "M 0 0 Q 0 0 0 0 L 0 0";
}
var PencilBrush = class PencilBrush extends BaseBrush {
	constructor(canvas) {
		super(canvas);
		_defineProperty(
			this,
			/**
			* Discard points that are less than `decimate` pixel distant from each other
			* @type Number
			* @default 0.4
			*/
			"decimate",
			.4
		);
		_defineProperty(
			this,
			/**
			* Draws a straight line between last recorded point to current pointer
			* Used for `shift` functionality
			*
			* @type boolean
			* @default false
			*/
			"drawStraightLine",
			false
		);
		_defineProperty(
			this,
			/**
			* The event modifier key that makes the brush draw a straight line.
			* If `null` or 'none' or any other string that is not a modifier key the feature is disabled.
			* @type {ModifierKey | undefined | null}
			*/
			"straightLineKey",
			"shiftKey"
		);
		this._points = [];
		this._hasStraightLine = false;
	}
	needsFullRender() {
		return super.needsFullRender() || this._hasStraightLine;
	}
	static drawSegment(ctx, p1, p2) {
		const midPoint = p1.midPointFrom(p2);
		ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
		return midPoint;
	}
	/**
	* Invoked on mouse down
	* @param {Point} pointer
	*/
	onMouseDown(pointer, { e }) {
		if (!this.canvas._isMainEvent(e)) return;
		this.drawStraightLine = !!this.straightLineKey && e[this.straightLineKey];
		this._prepareForDrawing(pointer);
		this._addPoint(pointer);
		this._render();
	}
	/**
	* Invoked on mouse move
	* @param {Point} pointer
	*/
	onMouseMove(pointer, { e }) {
		if (!this.canvas._isMainEvent(e)) return;
		this.drawStraightLine = !!this.straightLineKey && e[this.straightLineKey];
		if (this.limitedToCanvasSize === true && this._isOutSideCanvas(pointer)) return;
		if (this._addPoint(pointer) && this._points.length > 1) if (this.needsFullRender()) {
			this.canvas.clearContext(this.canvas.contextTop);
			this._render();
		} else {
			const points = this._points, length = points.length, ctx = this.canvas.contextTop;
			this._saveAndTransform(ctx);
			if (this.oldEnd) {
				ctx.beginPath();
				ctx.moveTo(this.oldEnd.x, this.oldEnd.y);
			}
			this.oldEnd = PencilBrush.drawSegment(ctx, points[length - 2], points[length - 1]);
			ctx.stroke();
			ctx.restore();
		}
	}
	/**
	* Invoked on mouse up
	*/
	onMouseUp({ e }) {
		if (!this.canvas._isMainEvent(e)) return true;
		this.drawStraightLine = false;
		this.oldEnd = void 0;
		this._finalizeAndAddPath();
		return false;
	}
	/**
	* @private
	* @param {Point} pointer Actual mouse position related to the canvas.
	*/
	_prepareForDrawing(pointer) {
		this._reset();
		this._addPoint(pointer);
		this.canvas.contextTop.moveTo(pointer.x, pointer.y);
	}
	/**
	* @private
	* @param {Point} point Point to be added to points array
	*/
	_addPoint(point) {
		if (this._points.length > 1 && point.eq(this._points[this._points.length - 1])) return false;
		if (this.drawStraightLine && this._points.length > 1) {
			this._hasStraightLine = true;
			this._points.pop();
		}
		this._points.push(point);
		return true;
	}
	/**
	* Clear points array and set contextTop canvas style.
	* @private
	*/
	_reset() {
		this._points = [];
		this._setBrushStyles(this.canvas.contextTop);
		this._setShadow();
		this._hasStraightLine = false;
	}
	/**
	* Draw a smooth path on the topCanvas using quadraticCurveTo
	* @private
	* @param {CanvasRenderingContext2D} [ctx]
	*/
	_render(ctx = this.canvas.contextTop) {
		let p1 = this._points[0], p2 = this._points[1];
		this._saveAndTransform(ctx);
		ctx.beginPath();
		if (this._points.length === 2 && p1.x === p2.x && p1.y === p2.y) {
			const width = this.width / 1e3;
			p1.x -= width;
			p2.x += width;
		}
		ctx.moveTo(p1.x, p1.y);
		for (let i = 1; i < this._points.length; i++) {
			PencilBrush.drawSegment(ctx, p1, p2);
			p1 = this._points[i];
			p2 = this._points[i + 1];
		}
		ctx.lineTo(p1.x, p1.y);
		ctx.stroke();
		ctx.restore();
	}
	/**
	* Converts points to SVG path
	* @param {Point[]} points Array of points
	* @return {TSimplePathData} SVG path commands
	*/
	convertPointsToSVGPath(points) {
		return getSmoothPathFromPoints(points, this.width / 1e3);
	}
	/**
	* Creates a Path object to add on canvas
	* @param {TSimplePathData} pathData Path data
	* @return {Path} Path to add on canvas
	*/
	createPath(pathData) {
		const path = new Path(pathData, {
			fill: null,
			stroke: this.color,
			strokeWidth: this.width,
			strokeLineCap: this.strokeLineCap,
			strokeMiterLimit: this.strokeMiterLimit,
			strokeLineJoin: this.strokeLineJoin,
			strokeDashArray: this.strokeDashArray
		});
		if (this.shadow) {
			this.shadow.affectStroke = true;
			path.shadow = new Shadow(this.shadow);
		}
		return path;
	}
	/**
	* Decimate points array with the decimate value
	*/
	decimatePoints(points, distance) {
		if (points.length <= 2) return points;
		let lastPoint = points[0], cDistance;
		const zoom = this.canvas.getZoom(), adjustedDistance = Math.pow(distance / zoom, 2), l = points.length - 1, newPoints = [lastPoint];
		for (let i = 1; i < l - 1; i++) {
			cDistance = Math.pow(lastPoint.x - points[i].x, 2) + Math.pow(lastPoint.y - points[i].y, 2);
			if (cDistance >= adjustedDistance) {
				lastPoint = points[i];
				newPoints.push(lastPoint);
			}
		}
		newPoints.push(points[l]);
		return newPoints;
	}
	/**
	* On mouseup after drawing the path on contextTop canvas
	* we use the points captured to create an new Path object
	* and add it to the canvas.
	*/
	_finalizeAndAddPath() {
		this.canvas.contextTop.closePath();
		if (this.decimate) this._points = this.decimatePoints(this._points, this.decimate);
		const pathData = this.convertPointsToSVGPath(this._points);
		if (isEmptySVGPath(pathData)) {
			this.canvas.requestRenderAll();
			return;
		}
		const path = this.createPath(pathData);
		this.canvas.clearContext(this.canvas.contextTop);
		this.canvas.fire("before:path:created", { path });
		this.canvas.add(path);
		this.canvas.requestRenderAll();
		path.setCoords();
		this._resetShadow();
		this.canvas.fire("path:created", { path });
	}
};
//#endregion
export { PencilBrush };

//# sourceMappingURL=PencilBrush.mjs.map