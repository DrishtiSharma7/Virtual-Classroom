import { _defineProperty } from "../../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { classRegistry } from "../../ClassRegistry.mjs";
import { Point } from "../../Point.mjs";
import { LayoutStrategy } from "./LayoutStrategy.mjs";
//#region src/LayoutManager/LayoutStrategies/FixedLayout.ts
/**
* Layout will keep target's initial size.
*/
var FixedLayout = class extends LayoutStrategy {
	/**
	* @override respect target's initial size
	*/
	getInitialSize({ target }, { size }) {
		return new Point(target.width || size.x, target.height || size.y);
	}
};
_defineProperty(FixedLayout, "type", "fixed");
classRegistry.setClass(FixedLayout);
//#endregion
export { FixedLayout };

//# sourceMappingURL=FixedLayout.mjs.map