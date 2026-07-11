import { _defineProperty } from "../../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { classRegistry } from "../../ClassRegistry.mjs";
import { Point } from "../../Point.mjs";
import { makeBoundingBoxFromPoints } from "../../util/misc/boundingBoxFromPoints.mjs";
import { sendPointToPlane } from "../../util/misc/planeChange.mjs";
import { getObjectBounds } from "./utils.mjs";
import { LayoutStrategy } from "./LayoutStrategy.mjs";
//#region src/LayoutManager/LayoutStrategies/ClipPathLayout.ts
/**
* Layout will adjust the bounding box to match the clip path bounding box.
*/
var ClipPathLayout = class extends LayoutStrategy {
	shouldPerformLayout(context) {
		return !!context.target.clipPath && super.shouldPerformLayout(context);
	}
	shouldLayoutClipPath() {
		return false;
	}
	calcLayoutResult(context, objects) {
		const { target } = context;
		const { clipPath, group } = target;
		if (!clipPath || !this.shouldPerformLayout(context)) return;
		const { width, height } = makeBoundingBoxFromPoints(getObjectBounds(target, clipPath));
		const size = new Point(width, height);
		if (clipPath.absolutePositioned) return {
			center: sendPointToPlane(clipPath.getRelativeCenterPoint(), void 0, group ? group.calcTransformMatrix() : void 0),
			size
		};
		else {
			const clipPathCenter = clipPath.getRelativeCenterPoint().transform(target.calcOwnMatrix(), true);
			if (this.shouldPerformLayout(context)) {
				const { center = new Point(), correction = new Point() } = this.calcBoundingBox(objects, context) || {};
				return {
					center: center.add(clipPathCenter),
					correction: correction.subtract(clipPathCenter),
					size
				};
			} else return {
				center: target.getRelativeCenterPoint().add(clipPathCenter),
				size
			};
		}
	}
};
_defineProperty(ClipPathLayout, "type", "clip-path");
classRegistry.setClass(ClipPathLayout);
//#endregion
export { ClipPathLayout };

//# sourceMappingURL=ClipPathLayout.mjs.map