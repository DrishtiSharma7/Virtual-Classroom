import { _defineProperty } from "../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { classRegistry } from "../ClassRegistry.mjs";
import { ColorMatrix } from "./ColorMatrix.mjs";
//#region src/filters/ColorMatrixFilters.ts
function createColorMatrixFilter(key, matrix) {
	var _Class;
	const newClass = (_Class = class extends ColorMatrix {
		toObject() {
			return {
				type: this.type,
				colorsOnly: this.colorsOnly
			};
		}
	}, _defineProperty(_Class, "type", key), _defineProperty(_Class, "defaults", {
		colorsOnly: false,
		matrix
	}), _Class);
	classRegistry.setClass(newClass, key);
	return newClass;
}
const Brownie = createColorMatrixFilter("Brownie", [
	.5997,
	.34553,
	-.27082,
	0,
	.186,
	-.0377,
	.86095,
	.15059,
	0,
	-.1449,
	.24113,
	-.07441,
	.44972,
	0,
	-.02965,
	0,
	0,
	0,
	1,
	0
]);
const Vintage = createColorMatrixFilter("Vintage", [
	.62793,
	.32021,
	-.03965,
	0,
	.03784,
	.02578,
	.64411,
	.03259,
	0,
	.02926,
	.0466,
	-.08512,
	.52416,
	0,
	.02023,
	0,
	0,
	0,
	1,
	0
]);
const Kodachrome = createColorMatrixFilter("Kodachrome", [
	1.12855,
	-.39673,
	-.03992,
	0,
	.24991,
	-.16404,
	1.08352,
	-.05498,
	0,
	.09698,
	-.16786,
	-.56034,
	1.60148,
	0,
	.13972,
	0,
	0,
	0,
	1,
	0
]);
const Technicolor = createColorMatrixFilter("Technicolor", [
	1.91252,
	-.85453,
	-.09155,
	0,
	.04624,
	-.30878,
	1.76589,
	-.10601,
	0,
	-.27589,
	-.2311,
	-.75018,
	1.84759,
	0,
	.12137,
	0,
	0,
	0,
	1,
	0
]);
const Polaroid = createColorMatrixFilter("Polaroid", [
	1.438,
	-.062,
	-.062,
	0,
	0,
	-.122,
	1.378,
	-.122,
	0,
	0,
	-.016,
	-.016,
	1.483,
	0,
	0,
	0,
	0,
	0,
	1,
	0
]);
const Sepia = createColorMatrixFilter("Sepia", [
	.393,
	.769,
	.189,
	0,
	0,
	.349,
	.686,
	.168,
	0,
	0,
	.272,
	.534,
	.131,
	0,
	0,
	0,
	0,
	0,
	1,
	0
]);
const BlackWhite = createColorMatrixFilter("BlackWhite", [
	1.5,
	1.5,
	1.5,
	0,
	-1,
	1.5,
	1.5,
	1.5,
	0,
	-1,
	1.5,
	1.5,
	1.5,
	0,
	-1,
	0,
	0,
	0,
	1,
	0
]);
//#endregion
export { BlackWhite, Brownie, Kodachrome, Polaroid, Sepia, Technicolor, Vintage };

//# sourceMappingURL=ColorMatrixFilters.mjs.map