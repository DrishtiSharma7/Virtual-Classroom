import { _defineProperty } from "../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { config } from "../config.mjs";
import { log } from "../util/internals/console.mjs";
import { classRegistry } from "../ClassRegistry.mjs";
import { uid } from "../util/internals/uid.mjs";
import { loadImage } from "../util/misc/objectEnlive.mjs";
import { pick } from "../util/misc/pick.mjs";
import { toFixed } from "../util/misc/toFixed.mjs";
import { escapeXml } from "../util/lang_string.mjs";
import { ifNaN } from "../util/internals/ifNaN.mjs";
//#region src/Pattern/Pattern.ts
/**
* @see {@link http://fabric5.fabricjs.com/patterns demo}
* @see {@link http://fabric5.fabricjs.com/dynamic-patterns demo}
*/
var Pattern = class {
	/**
	* Legacy identifier of the class. Prefer using this.constructor.type 'Pattern'
	* or utils like isPattern, or instance of to indentify a pattern in your code.
	* Will be removed in future versiones
	* @TODO add sustainable warning message
	* @type string
	* @deprecated
	*/
	get type() {
		return "pattern";
	}
	set type(value) {
		log("warn", "Setting type has no effect", value);
	}
	/**
	* Constructor
	* @param {Object} [options] Options object
	* @param {option.source} [source] the pattern source, eventually empty or a drawable
	*/
	constructor(options) {
		_defineProperty(
			this,
			/**
			* @type PatternRepeat
			* @defaults
			*/
			"repeat",
			"repeat"
		);
		_defineProperty(
			this,
			/**
			* Pattern horizontal offset from object's left/top corner
			* @type Number
			*/
			"offsetX",
			0
		);
		_defineProperty(
			this,
			/**
			* Pattern vertical offset from object's left/top corner
			* @type Number
			*/
			"offsetY",
			0
		);
		_defineProperty(
			this,
			/**
			* @type TCrossOrigin
			*/
			"crossOrigin",
			""
		);
		this.id = uid();
		Object.assign(this, options);
	}
	/**
	* @returns true if {@link source} is an <img> element
	*/
	isImageSource() {
		return !!this.source && typeof this.source.src === "string";
	}
	/**
	* @returns true if {@link source} is a <canvas> element
	*/
	isCanvasSource() {
		return !!this.source && !!this.source.toDataURL;
	}
	sourceToString() {
		return this.isImageSource() ? this.source.src : this.isCanvasSource() ? this.source.toDataURL() : "";
	}
	/**
	* Returns an instance of CanvasPattern
	* @param {CanvasRenderingContext2D} ctx Context to create pattern
	* @return {CanvasPattern}
	*/
	toLive(ctx) {
		if (!this.source || this.isImageSource() && (!this.source.complete || this.source.naturalWidth === 0 || this.source.naturalHeight === 0)) return null;
		return ctx.createPattern(this.source, this.repeat);
	}
	/**
	* Returns object representation of a pattern
	* @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
	* @return {object} Object representation of a pattern instance
	*/
	toObject(propertiesToInclude = []) {
		const { repeat, crossOrigin } = this;
		return {
			...pick(this, propertiesToInclude),
			type: "pattern",
			source: this.sourceToString(),
			repeat,
			crossOrigin,
			offsetX: toFixed(this.offsetX, config.NUM_FRACTION_DIGITS),
			offsetY: toFixed(this.offsetY, config.NUM_FRACTION_DIGITS),
			patternTransform: this.patternTransform ? [...this.patternTransform] : null
		};
	}
	/**
	* Returns SVG representation of a pattern
	*/
	toSVG({ width, height }) {
		const { source: patternSource, repeat, id } = this, patternOffsetX = ifNaN(this.offsetX / width, 0), patternOffsetY = ifNaN(this.offsetY / height, 0), patternWidth = repeat === "repeat-y" || repeat === "no-repeat" ? 1 + Math.abs(patternOffsetX || 0) : ifNaN(patternSource.width / width, 0), patternHeight = repeat === "repeat-x" || repeat === "no-repeat" ? 1 + Math.abs(patternOffsetY || 0) : ifNaN(patternSource.height / height, 0);
		return [
			`<pattern id="SVGID_${escapeXml(id)}" x="${patternOffsetX}" y="${patternOffsetY}" width="${patternWidth}" height="${patternHeight}">`,
			`<image x="0" y="0" width="${patternSource.width}" height="${patternSource.height}" xlink:href="${escapeXml(this.sourceToString())}"></image>`,
			`</pattern>`,
			""
		].join("\n");
	}
	static async fromObject({ type, source, patternTransform, ...otherOptions }, options) {
		const img = await loadImage(source, {
			...options,
			crossOrigin: otherOptions.crossOrigin
		});
		return new this({
			...otherOptions,
			patternTransform: patternTransform && patternTransform.slice(0),
			source: img
		});
	}
};
_defineProperty(Pattern, "type", "Pattern");
classRegistry.setClass(Pattern);
classRegistry.setClass(Pattern, "pattern");
//#endregion
export { Pattern };

//# sourceMappingURL=Pattern.mjs.map