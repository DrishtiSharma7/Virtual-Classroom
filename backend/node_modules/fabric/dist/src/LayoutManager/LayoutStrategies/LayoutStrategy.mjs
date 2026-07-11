import { _defineProperty } from "../../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { Point } from "../../Point.mjs";
import { makeBoundingBoxFromPoints } from "../../util/misc/boundingBoxFromPoints.mjs";
import "../constants.mjs";
import { getObjectBounds } from "./utils.mjs";
//#region src/LayoutManager/LayoutStrategies/LayoutStrategy.ts
/**
* Exposes a main public method {@link calcLayoutResult} that is used by the `LayoutManager` to perform layout.
* Returning `undefined` signals the `LayoutManager` to skip the layout.
*
* In charge of calculating the bounding box of the passed objects.
*/
var LayoutStrategy = class {
	/**
	* Used by the `LayoutManager` to perform layout
	* @TODO/fix: if this method is calcResult, should calc unconditionally.
	* the condition to not calc should be evaluated by the layoutManager.
	* @returns layout result **OR** `undefined` to skip layout
	*/
	calcLayoutResult(context, objects) {
		if (this.shouldPerformLayout(context)) return this.calcBoundingBox(objects, context);
	}
	shouldPerformLayout({ type, prevStrategy, strategy }) {
		return type === "initialization" || type === "imperative" || !!prevStrategy && strategy !== prevStrategy;
	}
	shouldLayoutClipPath({ type, target: { clipPath } }) {
		return type !== "initialization" && clipPath && !clipPath.absolutePositioned;
	}
	getInitialSize(context, result) {
		return result.size;
	}
	/**
	* Override this method to customize layout.
	*/
	calcBoundingBox(objects, context) {
		const { type, target } = context;
		if (type === "imperative" && context.overrides) return context.overrides;
		if (objects.length === 0) return;
		const { left, top, width, height } = makeBoundingBoxFromPoints(objects.map((object) => getObjectBounds(target, object)).reduce((coords, curr) => coords.concat(curr), []));
		const bboxSize = new Point(width, height);
		const bboxCenter = new Point(left, top).add(bboxSize.scalarDivide(2));
		if (type === "initialization") {
			const actualSize = this.getInitialSize(context, {
				size: bboxSize,
				center: bboxCenter
			});
			return {
				center: bboxCenter,
				relativeCorrection: new Point(0, 0),
				size: actualSize
			};
		} else return {
			center: bboxCenter.transform(target.calcOwnMatrix()),
			size: bboxSize
		};
	}
};
_defineProperty(LayoutStrategy, "type", "strategy");
//#endregion
export { LayoutStrategy };

//# sourceMappingURL=LayoutStrategy.mjs.map