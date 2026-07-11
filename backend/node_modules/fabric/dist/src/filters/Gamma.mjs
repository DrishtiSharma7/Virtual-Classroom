import { _defineProperty } from "../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { classRegistry } from "../ClassRegistry.mjs";
import { BaseFilter } from "./BaseFilter.mjs";
import { fragmentSource } from "./shaders/gamma.mjs";
//#region src/filters/Gamma.ts
const GAMMA = "Gamma";
const gammaDefaultValues = { gamma: [
	1,
	1,
	1
] };
/**
* Gamma filter class
* @example
* const filter = new Gamma({
*   gamma: [1, 0.5, 2.1]
* });
* object.filters.push(filter);
* object.applyFilters();
*/
var Gamma = class extends BaseFilter {
	getFragmentSource() {
		return fragmentSource;
	}
	constructor(options = {}) {
		super(options);
		this.gamma = options.gamma || this.constructor.defaults.gamma.concat();
	}
	/**
	* Apply the Gamma operation to a Uint8Array representing the pixels of an image.
	*
	* @param {Object} options
	* @param {ImageData} options.imageData The Uint8Array to be filtered.
	*/
	applyTo2d({ imageData: { data } }) {
		const gamma = this.gamma, rInv = 1 / gamma[0], gInv = 1 / gamma[1], bInv = 1 / gamma[2];
		if (!this.rgbValues) this.rgbValues = {
			r: new Uint8Array(256),
			g: new Uint8Array(256),
			b: new Uint8Array(256)
		};
		const rgb = this.rgbValues;
		for (let i = 0; i < 256; i++) {
			rgb.r[i] = Math.pow(i / 255, rInv) * 255;
			rgb.g[i] = Math.pow(i / 255, gInv) * 255;
			rgb.b[i] = Math.pow(i / 255, bInv) * 255;
		}
		for (let i = 0; i < data.length; i += 4) {
			data[i] = rgb.r[data[i]];
			data[i + 1] = rgb.g[data[i + 1]];
			data[i + 2] = rgb.b[data[i + 2]];
		}
	}
	/**
	* Send data from this filter to its shader program's uniforms.
	*
	* @param {WebGLRenderingContext} gl The GL canvas context used to compile this filter's shader.
	* @param {Object} uniformLocations A map of string uniform names to WebGLUniformLocation objects
	*/
	sendUniformData(gl, uniformLocations) {
		gl.uniform3fv(uniformLocations.uGamma, this.gamma);
	}
	isNeutralState() {
		const { gamma } = this;
		return gamma[0] === 1 && gamma[1] === 1 && gamma[2] === 1;
	}
	toObject() {
		return {
			type: GAMMA,
			gamma: this.gamma.concat()
		};
	}
};
_defineProperty(Gamma, "type", GAMMA);
_defineProperty(Gamma, "defaults", gammaDefaultValues);
_defineProperty(Gamma, "uniformLocations", ["uGamma"]);
classRegistry.setClass(Gamma);
//#endregion
export { Gamma };

//# sourceMappingURL=Gamma.mjs.map