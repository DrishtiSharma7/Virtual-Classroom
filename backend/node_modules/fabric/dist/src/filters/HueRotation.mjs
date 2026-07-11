import { _defineProperty } from "../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { classRegistry } from "../ClassRegistry.mjs";
import { cos } from "../util/misc/cos.mjs";
import { sin } from "../util/misc/sin.mjs";
import { ColorMatrix, colorMatrixDefaultValues } from "./ColorMatrix.mjs";
//#region src/filters/HueRotation.ts
const hueRotationDefaultValues = {
	...colorMatrixDefaultValues,
	rotation: 0
};
/**
* HueRotation filter class
* @example
* const filter = new HueRotation({
*   rotation: -0.5
* });
* object.filters.push(filter);
* object.applyFilters();
*/
var HueRotation = class extends ColorMatrix {
	calculateMatrix() {
		const rad = this.rotation * Math.PI, cosine = cos(rad), sine = sin(rad), aThird = 1 / 3, aThirdSqtSin = Math.sqrt(aThird) * sine, OneMinusCos = 1 - cosine;
		this.matrix = [
			cosine + OneMinusCos / 3,
			aThird * OneMinusCos - aThirdSqtSin,
			aThird * OneMinusCos + aThirdSqtSin,
			0,
			0,
			aThird * OneMinusCos + aThirdSqtSin,
			cosine + aThird * OneMinusCos,
			aThird * OneMinusCos - aThirdSqtSin,
			0,
			0,
			aThird * OneMinusCos - aThirdSqtSin,
			aThird * OneMinusCos + aThirdSqtSin,
			cosine + aThird * OneMinusCos,
			0,
			0,
			0,
			0,
			0,
			1,
			0
		];
	}
	isNeutralState() {
		return this.rotation === 0;
	}
	applyTo(options) {
		this.calculateMatrix();
		super.applyTo(options);
	}
	toObject() {
		return {
			type: this.type,
			rotation: this.rotation
		};
	}
};
_defineProperty(HueRotation, "type", "HueRotation");
_defineProperty(HueRotation, "defaults", hueRotationDefaultValues);
classRegistry.setClass(HueRotation);
//#endregion
export { HueRotation };

//# sourceMappingURL=HueRotation.mjs.map