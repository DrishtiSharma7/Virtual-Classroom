import { _defineProperty } from "../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { classRegistry } from "../ClassRegistry.mjs";
import { createCanvasElement } from "../util/misc/dom.mjs";
import { FabricImage } from "../shapes/Image.mjs";
import { BaseFilter } from "./BaseFilter.mjs";
import { fragmentSource, vertexSource } from "./shaders/blendImage.mjs";
//#region src/filters/BlendImage.ts
const blendImageDefaultValues = {
	mode: "multiply",
	alpha: 1
};
/**
* Image Blend filter class
* @example
* const filter = new filters.BlendColor({
*  color: '#000',
*  mode: 'multiply'
* });
*
* const filter = new BlendImage({
*  image: fabricImageObject,
*  mode: 'multiply'
* });
* object.filters.push(filter);
* object.applyFilters();
* canvas.renderAll();
*/
var BlendImage = class extends BaseFilter {
	getCacheKey() {
		return `${this.type}_${this.mode}`;
	}
	getFragmentSource() {
		return fragmentSource[this.mode];
	}
	getVertexSource() {
		return vertexSource;
	}
	applyToWebGL(options) {
		const gl = options.context, texture = this.createTexture(options.filterBackend, this.image);
		this.bindAdditionalTexture(gl, texture, gl.TEXTURE1);
		super.applyToWebGL(options);
		this.unbindAdditionalTexture(gl, gl.TEXTURE1);
	}
	createTexture(backend, image) {
		return backend.getCachedTexture(image.cacheKey, image.getElement());
	}
	/**
	* Calculate a transformMatrix to adapt the image to blend over
	* @param {Object} options
	* @param {WebGLRenderingContext} options.context The GL context used for rendering.
	* @param {Object} options.programCache A map of compiled shader programs, keyed by filter type.
	*/
	calculateMatrix() {
		const image = this.image, { width, height } = image.getElement();
		return [
			1 / image.scaleX,
			0,
			0,
			0,
			1 / image.scaleY,
			0,
			-image.left / width,
			-image.top / height,
			1
		];
	}
	/**
	* Apply the Blend operation to a Uint8ClampedArray representing the pixels of an image.
	*
	* @param {Object} options
	* @param {ImageData} options.imageData The Uint8ClampedArray to be filtered.
	*/
	applyTo2d({ imageData: { data, width, height }, filterBackend: { resources } }) {
		const image = this.image;
		if (!resources.blendImage) resources.blendImage = createCanvasElement();
		const canvas1 = resources.blendImage;
		const context = canvas1.getContext("2d");
		if (canvas1.width !== width || canvas1.height !== height) {
			canvas1.width = width;
			canvas1.height = height;
		} else context.clearRect(0, 0, width, height);
		context.setTransform(image.scaleX, 0, 0, image.scaleY, image.left, image.top);
		context.drawImage(image.getElement(), 0, 0, width, height);
		const blendData = context.getImageData(0, 0, width, height).data;
		for (let i = 0; i < data.length; i += 4) {
			const r = data[i];
			const g = data[i + 1];
			const b = data[i + 2];
			const a = data[i + 3];
			const tr = blendData[i];
			const tg = blendData[i + 1];
			const tb = blendData[i + 2];
			const ta = blendData[i + 3];
			switch (this.mode) {
				case "multiply":
					data[i] = r * tr / 255;
					data[i + 1] = g * tg / 255;
					data[i + 2] = b * tb / 255;
					data[i + 3] = a * ta / 255;
					break;
				case "mask":
					data[i + 3] = ta;
					break;
			}
		}
	}
	/**
	* Send data from this filter to its shader program's uniforms.
	*
	* @param {WebGLRenderingContext} gl The GL canvas context used to compile this filter's shader.
	* @param {Object} uniformLocations A map of string uniform names to WebGLUniformLocation objects
	*/
	sendUniformData(gl, uniformLocations) {
		const matrix = this.calculateMatrix();
		gl.uniform1i(uniformLocations.uImage, 1);
		gl.uniformMatrix3fv(uniformLocations.uTransformMatrix, false, matrix);
	}
	/**
	* Returns object representation of an instance
	* TODO: Handle the possibility of missing image better.
	* As of now a BlendImage filter without image can't be used with fromObject
	* @return {Object} Object representation of an instance
	*/
	toObject() {
		return {
			...super.toObject(),
			image: this.image && this.image.toObject()
		};
	}
	/**
	* Create filter instance from an object representation
	* @param {object} object Object to create an instance from
	* @param {object} [options]
	* @param {AbortSignal} [options.signal] handle aborting image loading, see https://developer.mozilla.org/en-US/docs/Web/API/AbortController/signal
	* @returns {Promise<BlendImage>}
	*/
	static async fromObject({ type, image, ...filterOptions }, options) {
		return FabricImage.fromObject(image, options).then((enlivedImage) => new this({
			...filterOptions,
			image: enlivedImage
		}));
	}
};
_defineProperty(BlendImage, "type", "BlendImage");
_defineProperty(BlendImage, "defaults", blendImageDefaultValues);
_defineProperty(BlendImage, "uniformLocations", ["uTransformMatrix", "uImage"]);
classRegistry.setClass(BlendImage);
//#endregion
export { BlendImage };

//# sourceMappingURL=BlendImage.mjs.map