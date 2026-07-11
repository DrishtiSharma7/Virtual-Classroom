import { version } from "../package.mjs";
//#region src/constants.ts
const VERSION = version;
function noop() {}
const halfPI = Math.PI / 2;
const quarterPI = Math.PI / 4;
const twoMathPi = Math.PI * 2;
const PiBy180 = Math.PI / 180;
const iMatrix = Object.freeze([
	1,
	0,
	0,
	1,
	0,
	0
]);
const kRect = .4477152502;
const CENTER = "center";
const LEFT = "left";
const BOTTOM = "bottom";
const RIGHT = "right";
const NONE = "none";
const reNewline = /\r?\n/;
const MOVING = "moving";
const SCALING = "scaling";
const ROTATING = "rotating";
const ROTATE = "rotate";
const SKEWING = "skewing";
const RESIZING = "resizing";
const MODIFY_POLY = "modifyPoly";
const MODIFY_PATH = "modifyPath";
const CHANGED = "changed";
const SCALE = "scale";
const SCALE_X = "scaleX";
const SCALE_Y = "scaleY";
const SKEW_X = "skewX";
const SKEW_Y = "skewY";
const FILL = "fill";
const STROKE = "stroke";
const MODIFIED = "modified";
const NORMAL = "normal";
//#endregion
export { BOTTOM, CENTER, CHANGED, FILL, LEFT, MODIFIED, MODIFY_PATH, MODIFY_POLY, MOVING, NONE, NORMAL, PiBy180, RESIZING, RIGHT, ROTATE, ROTATING, SCALE, SCALE_X, SCALE_Y, SCALING, SKEWING, SKEW_X, SKEW_Y, STROKE, VERSION, halfPI, iMatrix, kRect, noop, quarterPI, reNewline, twoMathPi };

//# sourceMappingURL=constants.mjs.map