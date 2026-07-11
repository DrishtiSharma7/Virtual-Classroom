import { __exportAll } from "../../_virtual/_rolldown/runtime.mjs";
import { getLocalPoint } from "./util.mjs";
import { wrapWithFireEvent } from "./wrapWithFireEvent.mjs";
import { wrapWithFixedAnchor } from "./wrapWithFixedAnchor.mjs";
import { changeHeight, changeObjectHeight, changeObjectWidth, changeWidth } from "./changeWidth.mjs";
import { renderCircleControl, renderSquareControl } from "./controlRendering.mjs";
import { rotationStyleHandler, rotationWithSnapping } from "./rotate.mjs";
import { scaleCursorStyleHandler, scalingEqually, scalingX, scalingY } from "./scale.mjs";
import { skewCursorStyleHandler, skewHandlerX, skewHandlerY } from "./skew.mjs";
import { scaleOrSkewActionName, scaleSkewCursorStyleHandler, scalingXOrSkewingY, scalingYOrSkewingX } from "./scaleSkew.mjs";
import { createObjectDefaultControls, createResizeControls, createTextboxDefaultControls } from "./commonControls.mjs";
import { dragHandler } from "./drag.mjs";
import { createPolyActionHandler, createPolyControls, createPolyPositionHandler, factoryPolyActionHandler, polyActionHandler } from "./polyControl.mjs";
import { createPathControls } from "./pathControl.mjs";
//#region src/controls/index.ts
var controls_exports = /* @__PURE__ */ __exportAll({
	changeHeight: () => changeHeight,
	changeObjectHeight: () => changeObjectHeight,
	changeObjectWidth: () => changeObjectWidth,
	changeWidth: () => changeWidth,
	createObjectDefaultControls: () => createObjectDefaultControls,
	createPathControls: () => createPathControls,
	createPolyActionHandler: () => createPolyActionHandler,
	createPolyControls: () => createPolyControls,
	createPolyPositionHandler: () => createPolyPositionHandler,
	createResizeControls: () => createResizeControls,
	createTextboxDefaultControls: () => createTextboxDefaultControls,
	dragHandler: () => dragHandler,
	factoryPolyActionHandler: () => factoryPolyActionHandler,
	getLocalPoint: () => getLocalPoint,
	polyActionHandler: () => polyActionHandler,
	renderCircleControl: () => renderCircleControl,
	renderSquareControl: () => renderSquareControl,
	rotationStyleHandler: () => rotationStyleHandler,
	rotationWithSnapping: () => rotationWithSnapping,
	scaleCursorStyleHandler: () => scaleCursorStyleHandler,
	scaleOrSkewActionName: () => scaleOrSkewActionName,
	scaleSkewCursorStyleHandler: () => scaleSkewCursorStyleHandler,
	scalingEqually: () => scalingEqually,
	scalingX: () => scalingX,
	scalingXOrSkewingY: () => scalingXOrSkewingY,
	scalingY: () => scalingY,
	scalingYOrSkewingX: () => scalingYOrSkewingX,
	skewCursorStyleHandler: () => skewCursorStyleHandler,
	skewHandlerX: () => skewHandlerX,
	skewHandlerY: () => skewHandlerY,
	wrapWithFireEvent: () => wrapWithFireEvent,
	wrapWithFixedAnchor: () => wrapWithFixedAnchor
});
//#endregion
export { controls_exports };

//# sourceMappingURL=index.mjs.map