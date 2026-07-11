import { getFabricWindow } from "../env/index.mjs";
import { createCanvasElement, createCanvasElementFor } from "../util/misc/dom.mjs";
import { WebGLFilterBackend } from "./WebGLFilterBackend.mjs";
//#region src/filters/utils.ts
const isWebGLPipelineState = (options) => {
	return options.webgl !== void 0;
};
/**
* Pick a method to copy data from GL context to 2d canvas.  In some browsers using
* drawImage should be faster, but is also bugged for a small combination of old hardware
* and drivers.
* putImageData is faster than drawImage for that specific operation.
*/
const isPutImageFaster = (width, height) => {
	const targetCanvas = createCanvasElementFor({
		width,
		height
	});
	const gl = createCanvasElement().getContext("webgl");
	const testContext = { imageBuffer: /* @__PURE__ */ new ArrayBuffer(width * height * 4) };
	const testPipelineState = {
		destinationWidth: width,
		destinationHeight: height,
		targetCanvas
	};
	let startTime;
	startTime = getFabricWindow().performance.now();
	WebGLFilterBackend.prototype.copyGLTo2D.call(testContext, gl, testPipelineState);
	const drawImageTime = getFabricWindow().performance.now() - startTime;
	startTime = getFabricWindow().performance.now();
	WebGLFilterBackend.prototype.copyGLTo2DPutImageData.call(testContext, gl, testPipelineState);
	return drawImageTime > getFabricWindow().performance.now() - startTime;
};
//#endregion
export { isPutImageFaster, isWebGLPipelineState };

//# sourceMappingURL=utils.mjs.map