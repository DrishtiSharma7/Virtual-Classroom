import { FILL, LEFT, NORMAL, STROKE, reNewline } from "../../constants.mjs";
//#region src/shapes/Text/constants.ts
const TEXT_DECORATION_THICKNESS = "textDecorationThickness";
const TEXT_DECORATION_COLOR = "textDecorationColor";
const fontProperties = [
	"fontSize",
	"fontWeight",
	"fontFamily",
	"fontStyle"
];
const textDecorationProperties = [
	"underline",
	"overline",
	"linethrough"
];
const textLayoutProperties = [
	...fontProperties,
	"lineHeight",
	"text",
	"charSpacing",
	"textAlign",
	"styles",
	"path",
	"pathStartOffset",
	"pathSide",
	"pathAlign"
];
const additionalProps = [
	...textLayoutProperties,
	...textDecorationProperties,
	"textBackgroundColor",
	"direction",
	TEXT_DECORATION_THICKNESS,
	TEXT_DECORATION_COLOR
];
const styleProperties = [
	...fontProperties,
	...textDecorationProperties,
	STROKE,
	"strokeWidth",
	FILL,
	"deltaY",
	"textBackgroundColor",
	TEXT_DECORATION_THICKNESS,
	TEXT_DECORATION_COLOR
];
const textDefaultValues = {
	_reNewline: reNewline,
	_reSpacesAndTabs: /[ \t\r]/g,
	_reSpaceAndTab: /[ \t\r]/,
	_reWords: /\S+/g,
	fontSize: 40,
	fontWeight: NORMAL,
	fontFamily: "Times New Roman",
	underline: false,
	overline: false,
	linethrough: false,
	textAlign: LEFT,
	fontStyle: NORMAL,
	lineHeight: 1.16,
	textBackgroundColor: "",
	stroke: null,
	shadow: null,
	path: void 0,
	pathStartOffset: 0,
	pathSide: LEFT,
	pathAlign: "baseline",
	charSpacing: 0,
	deltaY: 0,
	direction: "ltr",
	CACHE_FONT_SIZE: 400,
	MIN_TEXT_WIDTH: 2,
	superscript: {
		size: .6,
		baseline: -.35
	},
	subscript: {
		size: .6,
		baseline: .11
	},
	_fontSizeFraction: .222,
	offsets: {
		underline: .1,
		linethrough: -.28167,
		overline: -.81333
	},
	_fontSizeMult: 1.13,
	[TEXT_DECORATION_THICKNESS]: 66.667
};
const JUSTIFY = "justify";
const JUSTIFY_LEFT = "justify-left";
const JUSTIFY_RIGHT = "justify-right";
const JUSTIFY_CENTER = "justify-center";
//#endregion
export { JUSTIFY, JUSTIFY_CENTER, JUSTIFY_LEFT, JUSTIFY_RIGHT, TEXT_DECORATION_COLOR, TEXT_DECORATION_THICKNESS, additionalProps, styleProperties, textDefaultValues, textLayoutProperties };

//# sourceMappingURL=constants.mjs.map