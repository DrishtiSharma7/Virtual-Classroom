import { _defineProperty } from "../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { classRegistry } from "../ClassRegistry.mjs";
import { Color } from "../color/Color.mjs";
import { BaseFilter } from "./BaseFilter.mjs";
import { fragmentShader } from "./shaders/removeColor.mjs";
//#region src/filters/RemoveColor.ts
const removeColorDefaultValues = {
	color: "#FFFFFF",
	distance: .02,
	useAlpha: false
};
/**
* Remove white filter class
* @example
* const filter = new RemoveColor({
*   threshold: 0.2,
* });
* object.filters.push(filter);
* object.applyFilters();
* canvas.renderAll();
*/
var RemoveColor = class extends BaseFilter {
	getFragmentSource() {
		return fragmentShader;
	}
	/**
	* Applies filter to canvas element
	* @param {Object} canvasEl Canvas element to apply filter to
	*/
	applyTo2d({ imageData: { data } }) {
		const distance = this.distance * 255, source = new Color(this.color).getSource(), lowC = [
			source[0] - distance,
			source[1] - distance,
			source[2] - distance
		], highC = [
			source[0] + distance,
			source[1] + distance,
			source[2] + distance
		];
		for (let i = 0; i < data.length; i += 4) {
			const r = data[i];
			const g = data[i + 1];
			const b = data[i + 2];
			if (r > lowC[0] && g > lowC[1] && b > lowC[2] && r < highC[0] && g < highC[1] && b < highC[2]) data[i + 3] = 0;
		}
	}
	/**
	* Send data from this filter to its shader program's uniforms.
	*
	* @param {WebGLRenderingContext} gl The GL canvas context used to compile this filter's shader.
	* @param {Object} uniformLocations A map of string uniform names to WebGLUniformLocation objects
	*/
	sendUniformData(gl, uniformLocations) {
		const source = new Color(this.color).getSource(), distance = this.distance, lowC = [
			0 + source[0] / 255 - distance,
			0 + source[1] / 255 - distance,
			0 + source[2] / 255 - distance,
			1
		], highC = [
			source[0] / 255 + distance,
			source[1] / 255 + distance,
			source[2] / 255 + distance,
			1
		];
		gl.uniform4fv(uniformLocations.uLow, lowC);
		gl.uniform4fv(uniformLocations.uHigh, highC);
	}
};
_defineProperty(RemoveColor, "type", "RemoveColor");
_defineProperty(RemoveColor, "defaults", removeColorDefaultValues);
_defineProperty(RemoveColor, "uniformLocations", ["uLow", "uHigh"]);
classRegistry.setClass(RemoveColor);
//#endregion
export { RemoveColor };

//# sourceMappingURL=RemoveColor.mjs.map