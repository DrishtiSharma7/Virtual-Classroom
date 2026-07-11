import { _defineProperty } from "../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { classRegistry } from "../ClassRegistry.mjs";
import { isWebGLPipelineState } from "./utils.mjs";
import { BaseFilter } from "./BaseFilter.mjs";
import { fragmentSource } from "./shaders/blur.mjs";
//#region src/filters/Blur.ts
const blurDefaultValues = { blur: 0 };
/**
* Blur filter class
* @example
* const filter = new Blur({
*   blur: 0.5
* });
* object.filters.push(filter);
* object.applyFilters();
* canvas.renderAll();
*/
var Blur = class extends BaseFilter {
	getFragmentSource() {
		return fragmentSource;
	}
	applyTo(options) {
		if (isWebGLPipelineState(options)) {
			this.aspectRatio = options.sourceWidth / options.sourceHeight;
			options.passes++;
			this._setupFrameBuffer(options);
			this.horizontal = true;
			this.applyToWebGL(options);
			this._swapTextures(options);
			this._setupFrameBuffer(options);
			this.horizontal = false;
			this.applyToWebGL(options);
			this._swapTextures(options);
		} else this.applyTo2d(options);
	}
	applyTo2d({ imageData: { data, width, height } }) {
		this.aspectRatio = width / height;
		this.horizontal = true;
		let blurValue = this.getBlurValue() * width;
		const imageData = new Uint8ClampedArray(data);
		const samples = 15;
		const bytesInRow = 4 * width;
		for (let i = 0; i < data.length; i += 4) {
			let r = 0, g = 0, b = 0, a = 0, totalA = 0;
			const minIRow = i - i % bytesInRow;
			const maxIRow = minIRow + bytesInRow;
			for (let j = -samples + 1; j < samples; j++) {
				const percent = j / samples;
				const distance = Math.floor(blurValue * percent) * 4;
				const weight = 1 - Math.abs(percent);
				let sampledPixel = i + distance;
				if (sampledPixel < minIRow) sampledPixel = minIRow;
				else if (sampledPixel > maxIRow) sampledPixel = maxIRow;
				const localAlpha = data[sampledPixel + 3] * weight;
				r += data[sampledPixel] * localAlpha;
				g += data[sampledPixel + 1] * localAlpha;
				b += data[sampledPixel + 2] * localAlpha;
				a += localAlpha;
				totalA += weight;
			}
			imageData[i] = r / a;
			imageData[i + 1] = g / a;
			imageData[i + 2] = b / a;
			imageData[i + 3] = a / totalA;
		}
		this.horizontal = false;
		blurValue = this.getBlurValue() * height;
		for (let i = 0; i < imageData.length; i += 4) {
			let r = 0, g = 0, b = 0, a = 0, totalA = 0;
			const minIRow = i % bytesInRow;
			const maxIRow = imageData.length - bytesInRow + minIRow;
			for (let j = -samples + 1; j < samples; j++) {
				const percent = j / samples;
				const distance = Math.floor(blurValue * percent) * bytesInRow;
				const weight = 1 - Math.abs(percent);
				let sampledPixel = i + distance;
				if (sampledPixel < minIRow) sampledPixel = minIRow;
				else if (sampledPixel > maxIRow) sampledPixel = maxIRow;
				const localAlpha = imageData[sampledPixel + 3] * weight;
				r += imageData[sampledPixel] * localAlpha;
				g += imageData[sampledPixel + 1] * localAlpha;
				b += imageData[sampledPixel + 2] * localAlpha;
				a += localAlpha;
				totalA += weight;
			}
			data[i] = r / a;
			data[i + 1] = g / a;
			data[i + 2] = b / a;
			data[i + 3] = a / totalA;
		}
	}
	/**
	* Send data from this filter to its shader program's uniforms.
	*
	* @param {WebGLRenderingContext} gl The GL canvas context used to compile this filter's shader.
	* @param {Object} uniformLocations A map of string uniform names to WebGLUniformLocation objects
	*/
	sendUniformData(gl, uniformLocations) {
		const delta = this.chooseRightDelta();
		gl.uniform2fv(uniformLocations.uDelta, delta);
	}
	isNeutralState() {
		return this.blur === 0;
	}
	getBlurValue() {
		let blurScale = 1;
		const { horizontal, aspectRatio } = this;
		if (horizontal) {
			if (aspectRatio > 1) blurScale = 1 / aspectRatio;
		} else if (aspectRatio < 1) blurScale = aspectRatio;
		return blurScale * this.blur * .12;
	}
	/**
	* choose right value of image percentage to blur with
	* @returns {Array} a numeric array with delta values
	*/
	chooseRightDelta() {
		const blur = this.getBlurValue();
		return this.horizontal ? [blur, 0] : [0, blur];
	}
};
_defineProperty(Blur, "type", "Blur");
_defineProperty(Blur, "defaults", blurDefaultValues);
_defineProperty(Blur, "uniformLocations", ["uDelta"]);
classRegistry.setClass(Blur);
//#endregion
export { Blur };

//# sourceMappingURL=Blur.mjs.map