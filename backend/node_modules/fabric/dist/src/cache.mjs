import { _defineProperty } from "../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { config } from "./config.mjs";
//#region src/cache.ts
var Cache = class {
	constructor() {
		_defineProperty(
			this,
			/**
			* This object keeps the results of the boundsOfCurve calculation mapped by the joined arguments necessary to calculate it.
			* It does speed up calculation, if you parse and add always the same paths, but in case of heavy usage of freedrawing
			* you do not get any speed benefit and you get a big object in memory.
			* The object was a private variable before, while now is appended to the lib so that you have access to it and you
			* can eventually clear it.
			* It was an internal variable, is accessible since version 2.3.4
			*/
			"boundsOfCurveCache",
			{}
		);
		this.charWidthsCache = /* @__PURE__ */ new Map();
	}
	/**
	* @return {Object} reference to cache
	*/
	getFontCache({ fontFamily, fontStyle, fontWeight }) {
		fontFamily = fontFamily.toLowerCase();
		const cache = this.charWidthsCache;
		if (!cache.has(fontFamily)) cache.set(fontFamily, /* @__PURE__ */ new Map());
		const fontCache = cache.get(fontFamily);
		const cacheKey = `${fontStyle.toLowerCase()}_${(fontWeight + "").toLowerCase()}`;
		if (!fontCache.has(cacheKey)) fontCache.set(cacheKey, /* @__PURE__ */ new Map());
		return fontCache.get(cacheKey);
	}
	/**
	* Clear char widths cache for the given font family or all the cache if no
	* fontFamily is specified.
	* Use it if you know you are loading fonts in a lazy way and you are not waiting
	* for custom fonts to load properly when adding text objects to the canvas.
	* If a text object is added when its own font is not loaded yet, you will get wrong
	* measurement and so wrong bounding boxes.
	* After the font cache is cleared, either change the textObject text content or call
	* initDimensions() to trigger a recalculation
	* @param {String} [fontFamily] font family to clear
	*/
	clearFontCache(fontFamily) {
		if (!fontFamily) this.charWidthsCache = /* @__PURE__ */ new Map();
		else this.charWidthsCache.delete((fontFamily || "").toLowerCase());
	}
	/**
	* Given current aspect ratio, determines the max width and height that can
	* respect the total allowed area for the cache.
	* @param {number} ar aspect ratio
	* @return {number[]} Limited dimensions X and Y
	*/
	limitDimsByArea(ar) {
		const { perfLimitSizeTotal } = config;
		const roughWidth = Math.sqrt(perfLimitSizeTotal * ar);
		return [Math.floor(roughWidth), Math.floor(perfLimitSizeTotal / roughWidth)];
	}
};
const cache = new Cache();
//#endregion
export { cache };

//# sourceMappingURL=cache.mjs.map