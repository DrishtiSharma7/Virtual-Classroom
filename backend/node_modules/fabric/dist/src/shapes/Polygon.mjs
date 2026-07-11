import { _defineProperty } from "../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { classRegistry } from "../ClassRegistry.mjs";
import { Polyline, polylineDefaultValues } from "./Polyline.mjs";
//#region src/shapes/Polygon.ts
var Polygon = class extends Polyline {
	isOpen() {
		return false;
	}
};
_defineProperty(Polygon, "ownDefaults", polylineDefaultValues);
_defineProperty(Polygon, "type", "Polygon");
classRegistry.setClass(Polygon);
classRegistry.setSVGClass(Polygon);
//#endregion
export { Polygon };

//# sourceMappingURL=Polygon.mjs.map