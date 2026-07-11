import { RESIZING, ROTATE } from "../constants.mjs";
import { changeWidth } from "./changeWidth.mjs";
import { Control } from "./Control.mjs";
import { rotationStyleHandler, rotationWithSnapping } from "./rotate.mjs";
import { scaleCursorStyleHandler, scalingEqually } from "./scale.mjs";
import { scaleOrSkewActionName, scaleSkewCursorStyleHandler, scalingXOrSkewingY, scalingYOrSkewingX } from "./scaleSkew.mjs";
//#region src/controls/commonControls.ts
const createObjectDefaultControls = () => ({
	ml: new Control({
		x: -.5,
		y: 0,
		cursorStyleHandler: scaleSkewCursorStyleHandler,
		actionHandler: scalingXOrSkewingY,
		getActionName: scaleOrSkewActionName
	}),
	mr: new Control({
		x: .5,
		y: 0,
		cursorStyleHandler: scaleSkewCursorStyleHandler,
		actionHandler: scalingXOrSkewingY,
		getActionName: scaleOrSkewActionName
	}),
	mb: new Control({
		x: 0,
		y: .5,
		cursorStyleHandler: scaleSkewCursorStyleHandler,
		actionHandler: scalingYOrSkewingX,
		getActionName: scaleOrSkewActionName
	}),
	mt: new Control({
		x: 0,
		y: -.5,
		cursorStyleHandler: scaleSkewCursorStyleHandler,
		actionHandler: scalingYOrSkewingX,
		getActionName: scaleOrSkewActionName
	}),
	tl: new Control({
		x: -.5,
		y: -.5,
		cursorStyleHandler: scaleCursorStyleHandler,
		actionHandler: scalingEqually
	}),
	tr: new Control({
		x: .5,
		y: -.5,
		cursorStyleHandler: scaleCursorStyleHandler,
		actionHandler: scalingEqually
	}),
	bl: new Control({
		x: -.5,
		y: .5,
		cursorStyleHandler: scaleCursorStyleHandler,
		actionHandler: scalingEqually
	}),
	br: new Control({
		x: .5,
		y: .5,
		cursorStyleHandler: scaleCursorStyleHandler,
		actionHandler: scalingEqually
	}),
	mtr: new Control({
		x: 0,
		y: -.5,
		actionHandler: rotationWithSnapping,
		cursorStyleHandler: rotationStyleHandler,
		offsetY: -40,
		withConnection: true,
		actionName: ROTATE
	})
});
const createResizeControls = () => ({
	mr: new Control({
		x: .5,
		y: 0,
		actionHandler: changeWidth,
		cursorStyleHandler: scaleSkewCursorStyleHandler,
		actionName: RESIZING
	}),
	ml: new Control({
		x: -.5,
		y: 0,
		actionHandler: changeWidth,
		cursorStyleHandler: scaleSkewCursorStyleHandler,
		actionName: RESIZING
	})
});
const createTextboxDefaultControls = () => ({
	...createObjectDefaultControls(),
	...createResizeControls()
});
//#endregion
export { createObjectDefaultControls, createResizeControls, createTextboxDefaultControls };

//# sourceMappingURL=commonControls.mjs.map