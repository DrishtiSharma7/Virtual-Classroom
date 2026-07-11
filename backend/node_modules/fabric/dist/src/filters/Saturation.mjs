import { _defineProperty } from "../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { classRegistry } from "../ClassRegistry.mjs";
import { BaseFilter } from "./BaseFilter.mjs";
import { fragmentSource } from "./shaders/saturation.mjs";
//#region src/filters/Saturation.ts
const saturationDefaultValues = { saturation: 0 };
/**
* Saturate filter class
* @example
* const filter = new Saturation({
*   saturation: 1
* });
* object.filters.push(filter);
* object.applyFilters();
*/
var Saturation = class extends BaseFilter {
	getFragmentSource() {
		return fragmentSource;
	}
	/**
	* Apply the Saturation operation to a Uint8ClampedArray representing the pixels of an image.
	*
	* @param {Object} options
	* @param {ImageData} options.imageData The Uint8ClampedArray to be filtered.
	*/
	applyTo2d({ imageData: { data } }) {
		const adjust = -this.saturation;
		for (let i = 0; i < data.length; i += 4) {
			const r = data[i];
			const g = data[i + 1];
			const b = data[i + 2];
			const max = Math.max(r, g, b);
			data[i] += max !== r ? (max - r) * adjust : 0;
			data[i + 1] += max !== g ? (max - g) * adjust : 0;
			data[i + 2] += max !== b ? (max - b) * adjust : 0;
		}
	}
	/**
	* Send data from this filter to its shader program's uniforms.
	*
	* @param {WebGLRenderingContext} gl The GL canvas context used to compile this filter's shader.
	* @param {Object} uniformLocations A map of string uniform names to WebGLUniformLocation objects
	*/
	sendUniformData(gl, uniformLocations) {
		gl.uniform1f(uniformLocations.uSaturation, -this.saturation);
	}
	isNeutralState() {
		return this.saturation === 0;
	}
};
_defineProperty(Saturation, "type", "Saturation");
_defineProperty(Saturation, "defaults", saturationDefaultValues);
_defineProperty(Saturation, "uniformLocations", ["uSaturation"]);
classRegistry.setClass(Saturation);
//#endregion
export { Saturation };

//# sourceMappingURL=Saturation.mjs.map