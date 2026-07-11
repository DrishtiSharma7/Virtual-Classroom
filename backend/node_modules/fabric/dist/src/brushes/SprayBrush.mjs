import { _defineProperty } from "../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { CENTER } from "../constants.mjs";
import { Shadow } from "../Shadow.mjs";
import { Rect } from "../shapes/Rect.mjs";
import { Group } from "../shapes/Group.mjs";
import { getRandomInt } from "../util/internals/getRandomInt.mjs";
import { BaseBrush } from "./BaseBrush.mjs";
//#region src/brushes/SprayBrush.ts
/**
*
* @param rects
* @returns
*/
function getUniqueRects(rects) {
	const uniqueRects = {};
	const uniqueRectsArray = [];
	for (let i = 0, key; i < rects.length; i++) {
		key = `${rects[i].left}${rects[i].top}`;
		if (!uniqueRects[key]) {
			uniqueRects[key] = true;
			uniqueRectsArray.push(rects[i]);
		}
	}
	return uniqueRectsArray;
}
var SprayBrush = class extends BaseBrush {
	/**
	* Constructor
	* @param {Canvas} canvas
	* @return {SprayBrush} Instance of a spray brush
	*/
	constructor(canvas) {
		super(canvas);
		_defineProperty(
			this,
			/**
			* Width of a spray
			* @type Number
			*/
			"width",
			10
		);
		_defineProperty(
			this,
			/**
			* Density of a spray (number of dots per chunk)
			* @type Number
			*/
			"density",
			20
		);
		_defineProperty(
			this,
			/**
			* Width of spray dots
			* @type Number
			*/
			"dotWidth",
			1
		);
		_defineProperty(
			this,
			/**
			* Width variance of spray dots
			* @type Number
			*/
			"dotWidthVariance",
			1
		);
		_defineProperty(
			this,
			/**
			* Whether opacity of a dot should be random
			* @type Boolean
			*/
			"randomOpacity",
			false
		);
		_defineProperty(
			this,
			/**
			* Whether overlapping dots (rectangles) should be removed (for performance reasons)
			* @type Boolean
			*/
			"optimizeOverlapping",
			true
		);
		this.sprayChunks = [];
		this.sprayChunk = [];
	}
	/**
	* Invoked on mouse down
	* @param {Point} pointer
	*/
	onMouseDown(pointer) {
		this.sprayChunks = [];
		this.canvas.clearContext(this.canvas.contextTop);
		this._setShadow();
		this.addSprayChunk(pointer);
		this.renderChunck(this.sprayChunk);
	}
	/**
	* Invoked on mouse move
	* @param {Point} pointer
	*/
	onMouseMove(pointer) {
		if (this.limitedToCanvasSize === true && this._isOutSideCanvas(pointer)) return;
		this.addSprayChunk(pointer);
		this.renderChunck(this.sprayChunk);
	}
	/**
	* Invoked on mouse up
	*/
	onMouseUp() {
		const originalRenderOnAddRemove = this.canvas.renderOnAddRemove;
		this.canvas.renderOnAddRemove = false;
		const rects = [];
		for (let i = 0; i < this.sprayChunks.length; i++) {
			const sprayChunk = this.sprayChunks[i];
			for (let j = 0; j < sprayChunk.length; j++) {
				const chunck = sprayChunk[j];
				const rect = new Rect({
					width: chunck.width,
					height: chunck.width,
					left: chunck.x + 1,
					top: chunck.y + 1,
					originX: CENTER,
					originY: CENTER,
					fill: this.color
				});
				rects.push(rect);
			}
		}
		const group = new Group(this.optimizeOverlapping ? getUniqueRects(rects) : rects, {
			objectCaching: true,
			subTargetCheck: false,
			interactive: false
		});
		this.shadow && group.set("shadow", new Shadow(this.shadow));
		this.canvas.fire("before:path:created", { path: group });
		this.canvas.add(group);
		this.canvas.fire("path:created", { path: group });
		this.canvas.clearContext(this.canvas.contextTop);
		this._resetShadow();
		this.canvas.renderOnAddRemove = originalRenderOnAddRemove;
		this.canvas.requestRenderAll();
	}
	renderChunck(sprayChunck) {
		const ctx = this.canvas.contextTop;
		ctx.fillStyle = this.color;
		this._saveAndTransform(ctx);
		for (let i = 0; i < sprayChunck.length; i++) {
			const point = sprayChunck[i];
			ctx.globalAlpha = point.opacity;
			ctx.fillRect(point.x, point.y, point.width, point.width);
		}
		ctx.restore();
	}
	/**
	* Render all spray chunks
	*/
	_render() {
		const ctx = this.canvas.contextTop;
		ctx.fillStyle = this.color;
		this._saveAndTransform(ctx);
		for (let i = 0; i < this.sprayChunks.length; i++) this.renderChunck(this.sprayChunks[i]);
		ctx.restore();
	}
	/**
	* @param {Point} pointer
	*/
	addSprayChunk(pointer) {
		this.sprayChunk = [];
		const radius = this.width / 2;
		for (let i = 0; i < this.density; i++) this.sprayChunk.push({
			x: getRandomInt(pointer.x - radius, pointer.x + radius),
			y: getRandomInt(pointer.y - radius, pointer.y + radius),
			width: this.dotWidthVariance ? getRandomInt(Math.max(1, this.dotWidth - this.dotWidthVariance), this.dotWidth + this.dotWidthVariance) : this.dotWidth,
			opacity: this.randomOpacity ? getRandomInt(0, 100) / 100 : 1
		});
		this.sprayChunks.push(this.sprayChunk);
	}
};
//#endregion
export { SprayBrush };

//# sourceMappingURL=SprayBrush.mjs.map