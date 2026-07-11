import { iMatrix } from "../constants.mjs";
//#region src/canvas/StaticCanvasOptions.ts
const staticCanvasDefaults = {
	backgroundVpt: true,
	backgroundColor: "",
	overlayVpt: true,
	overlayColor: "",
	includeDefaultValues: true,
	svgViewportTransformation: true,
	renderOnAddRemove: true,
	skipOffscreen: true,
	enableRetinaScaling: true,
	imageSmoothingEnabled: true,
	controlsAboveOverlay: false,
	allowTouchScrolling: false,
	viewportTransform: [...iMatrix],
	patternQuality: "best"
};
//#endregion
export { staticCanvasDefaults };

//# sourceMappingURL=StaticCanvasOptions.mjs.map