import { _defineProperty } from "../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { classRegistry } from "../ClassRegistry.mjs";
import { BaseFilter } from "./BaseFilter.mjs";
import { fragmentSource } from "./shaders/noise.mjs";
//#region src/filters/Noise.ts
const noiseDefaultValues = { noise: 0 };
/**
* Noise filter class
* @example
* const filter = new Noise({
*   noise: 700
* });
* object.filters.push(filter);
* object.applyFilters();
* canvas.renderAll();
*/
var Noise = class extends BaseFilter {
	getFragmentSource() {
		return fragmentSource;
	}
	/**
	* Apply the Brightness operation to a Uint8ClampedArray representing the pixels of an image.
	*
	* @param {Object} options
	* @param {ImageData} options.imageData The Uint8ClampedArray to be filtered.
	*/
	applyTo2d({ imageData: { data } }) {
		const noise = this.noise;
		for (let i = 0; i < data.length; i += 4) {
			const rand = (.5 - Math.random()) * noise;
			data[i] += rand;
			data[i + 1] += rand;
			data[i + 2] += rand;
		}
	}
	/**
	* Send data from this filter to its shader program's uniforms.
	*
	* @param {WebGLRenderingContext} gl The GL canvas context used to compile this filter's shader.
	* @param {Object} uniformLocations A map of string uniform names to WebGLUniformLocation objects
	*/
	sendUniformData(gl, uniformLocations) {
		gl.uniform1f(uniformLocations.uNoise, this.noise / 255);
		gl.uniform1f(uniformLocations.uSeed, Math.random());
	}
	isNeutralState() {
		return this.noise === 0;
	}
};
_defineProperty(Noise, "type", "Noise");
_defineProperty(Noise, "defaults", noiseDefaultValues);
_defineProperty(Noise, "uniformLocations", ["uNoise", "uSeed"]);
classRegistry.setClass(Noise);
//#endregion
export { Noise };

//# sourceMappingURL=Noise.mjs.map