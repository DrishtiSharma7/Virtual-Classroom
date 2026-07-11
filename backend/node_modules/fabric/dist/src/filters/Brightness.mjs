import { _defineProperty } from "../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { classRegistry } from "../ClassRegistry.mjs";
import { BaseFilter } from "./BaseFilter.mjs";
import { fragmentSource } from "./shaders/brightness.mjs";
//#region src/filters/Brightness.ts
const brightnessDefaultValues = { brightness: 0 };
/**
* Brightness filter class
* @example
* const filter = new Brightness({
*   brightness: 0.05
* });
* object.filters.push(filter);
* object.applyFilters();
*/
var Brightness = class extends BaseFilter {
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
		const brightness = Math.round(this.brightness * 255);
		for (let i = 0; i < data.length; i += 4) {
			data[i] += brightness;
			data[i + 1] += brightness;
			data[i + 2] += brightness;
		}
	}
	isNeutralState() {
		return this.brightness === 0;
	}
	/**
	* Send data from this filter to its shader program's uniforms.
	*
	* @param {WebGLRenderingContext} gl The GL canvas context used to compile this filter's shader.
	* @param {Object} uniformLocations A map of string uniform names to WebGLUniformLocation objects
	*/
	sendUniformData(gl, uniformLocations) {
		gl.uniform1f(uniformLocations.uBrightness, this.brightness);
	}
};
_defineProperty(Brightness, "type", "Brightness");
_defineProperty(Brightness, "defaults", brightnessDefaultValues);
_defineProperty(Brightness, "uniformLocations", ["uBrightness"]);
classRegistry.setClass(Brightness);
//#endregion
export { Brightness };

//# sourceMappingURL=Brightness.mjs.map