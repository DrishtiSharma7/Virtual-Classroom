import { _defineProperty } from "../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
//#region src/filters/Canvas2dFilterBackend.ts
var Canvas2dFilterBackend = class {
	constructor() {
		_defineProperty(
			this,
			/**
			* Experimental. This object is a sort of repository of help layers used to avoid
			* of recreating them during frequent filtering. If you are previewing a filter with
			* a slider you probably do not want to create help layers every filter step.
			* in this object there will be appended some canvases, created once, resized sometimes
			* cleared never. Clearing is left to the developer.
			**/
			"resources",
			{}
		);
	}
	/**
	* Apply a set of filters against a source image and draw the filtered output
	* to the provided destination canvas.
	*
	* @param {EnhancedFilter} filters The filter to apply.
	* @param {HTMLImageElement|HTMLCanvasElement} sourceElement The source to be filtered.
	* @param {Number} sourceWidth The width of the source input.
	* @param {Number} sourceHeight The height of the source input.
	* @param {HTMLCanvasElement} targetCanvas The destination for filtered output to be drawn.
	*/
	applyFilters(filters, sourceElement, sourceWidth, sourceHeight, targetCanvas) {
		const ctx = targetCanvas.getContext("2d", {
			willReadFrequently: true,
			desynchronized: true
		});
		if (!ctx) return;
		ctx.drawImage(sourceElement, 0, 0, sourceWidth, sourceHeight);
		const pipelineState = {
			sourceWidth,
			sourceHeight,
			imageData: ctx.getImageData(0, 0, sourceWidth, sourceHeight),
			originalEl: sourceElement,
			originalImageData: ctx.getImageData(0, 0, sourceWidth, sourceHeight),
			canvasEl: targetCanvas,
			ctx,
			filterBackend: this
		};
		filters.forEach((filter) => {
			filter.applyTo(pipelineState);
		});
		const { imageData: imageDataPostFilter } = pipelineState;
		if (imageDataPostFilter.width !== sourceWidth || imageDataPostFilter.height !== sourceHeight) {
			targetCanvas.width = imageDataPostFilter.width;
			targetCanvas.height = imageDataPostFilter.height;
		}
		ctx.putImageData(imageDataPostFilter, 0, 0);
		return pipelineState;
	}
};
//#endregion
export { Canvas2dFilterBackend };

//# sourceMappingURL=Canvas2dFilterBackend.mjs.map