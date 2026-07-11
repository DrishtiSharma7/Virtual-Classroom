import { _defineProperty } from "../../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { classRegistry } from "../../ClassRegistry.mjs";
import { LayoutStrategy } from "./LayoutStrategy.mjs";
//#region src/LayoutManager/LayoutStrategies/FitContentLayout.ts
/**
* Layout will adjust the bounding box to fit target's objects.
*/
var FitContentLayout = class extends LayoutStrategy {
	/**
	* @override layout on all triggers
	* Override at will
	*/
	shouldPerformLayout(context) {
		return true;
	}
};
_defineProperty(FitContentLayout, "type", "fit-content");
classRegistry.setClass(FitContentLayout);
//#endregion
export { FitContentLayout };

//# sourceMappingURL=FitContentLayout.mjs.map