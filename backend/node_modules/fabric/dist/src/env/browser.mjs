import { WebGLProbe } from "../filters/GLProbes/WebGLProbe.mjs";
//#region src/env/browser.ts
const copyPasteData = {};
const getEnv = () => {
	return {
		document,
		window,
		isTouchSupported: "ontouchstart" in window || "ontouchstart" in document || window && window.navigator && window.navigator.maxTouchPoints > 0,
		WebGLProbe: new WebGLProbe(),
		dispose() {},
		copyPasteData
	};
};
//#endregion
export { getEnv };

//# sourceMappingURL=browser.mjs.map