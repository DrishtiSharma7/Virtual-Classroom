import { _defineProperty } from "../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { classRegistry } from "../ClassRegistry.mjs";
import "./Text/constants.mjs";
import { createTextboxDefaultControls } from "../controls/commonControls.mjs";
import { IText } from "./IText/IText.mjs";
//#region src/shapes/Textbox.ts
const textboxDefaultValues = {
	minWidth: 20,
	dynamicMinWidth: 2,
	lockScalingFlip: true,
	noScaleCache: false,
	_wordJoiners: /[ \t\r]/,
	splitByGrapheme: false
};
/**
* Textbox class, based on IText, allows the user to resize the text rectangle
* and wraps lines automatically. Textboxes have their Y scaling locked, the
* user can only change width. Height is adjusted automatically based on the
* wrapping of lines.
*/
var Textbox = class Textbox extends IText {
	static getDefaults() {
		return {
			...super.getDefaults(),
			...Textbox.ownDefaults
		};
	}
	/**
	* Constructor
	* @param {String} text Text string
	* @param {Object} [options] Options object
	*/
	constructor(text, options) {
		super(text, {
			...Textbox.ownDefaults,
			...options
		});
	}
	/**
	* Creates the default control object.
	* If you prefer to have on instance of controls shared among all objects
	* make this function return an empty object and add controls to the ownDefaults object
	*/
	static createControls() {
		return { controls: createTextboxDefaultControls() };
	}
	/**
	* Unlike superclass's version of this function, Textbox does not update
	* its width.
	* @private
	* @override
	*/
	initDimensions() {
		if (!this.initialized) return;
		this.isEditing && this.initDelayedCursor();
		this._clearCache();
		this.dynamicMinWidth = 0;
		this._styleMap = this._generateStyleMap(this._splitText());
		if (this.dynamicMinWidth > this.width) this._set("width", this.dynamicMinWidth);
		if (this.textAlign.includes("justify")) this.enlargeSpaces();
		this.height = this.calcTextHeight();
	}
	/**
	* Generate an object that translates the style object so that it is
	* broken up by visual lines (new lines and automatic wrapping).
	* The original text styles object is broken up by actual lines (new lines only),
	* which is only sufficient for Text / IText
	* @private
	*/
	_generateStyleMap(textInfo) {
		let realLineCount = 0, realLineCharCount = 0, charCount = 0;
		const map = {};
		for (let i = 0; i < textInfo.graphemeLines.length; i++) {
			if (textInfo.graphemeText[charCount] === "\n" && i > 0) {
				realLineCharCount = 0;
				charCount++;
				realLineCount++;
			} else if (!this.splitByGrapheme && this._reSpaceAndTab.test(textInfo.graphemeText[charCount]) && i > 0) {
				realLineCharCount++;
				charCount++;
			}
			map[i] = {
				line: realLineCount,
				offset: realLineCharCount
			};
			charCount += textInfo.graphemeLines[i].length;
			realLineCharCount += textInfo.graphemeLines[i].length;
		}
		return map;
	}
	/**
	* Returns true if object has a style property or has it on a specified line
	* @param {Number} lineIndex
	* @return {Boolean}
	*/
	styleHas(property, lineIndex) {
		if (this._styleMap && !this.isWrapping) {
			const map = this._styleMap[lineIndex];
			if (map) lineIndex = map.line;
		}
		return super.styleHas(property, lineIndex);
	}
	/**
	* Returns true if object has no styling or no styling in a line
	* @param {Number} lineIndex , lineIndex is on wrapped lines.
	* @return {Boolean}
	*/
	isEmptyStyles(lineIndex) {
		if (!this.styles) return true;
		let offset = 0, nextLineIndex, nextOffset, shouldLimit = false;
		const map = this._styleMap[lineIndex], mapNextLine = this._styleMap[lineIndex + 1];
		if (map) {
			lineIndex = map.line;
			offset = map.offset;
		}
		if (mapNextLine) {
			nextLineIndex = mapNextLine.line;
			shouldLimit = nextLineIndex === lineIndex;
			nextOffset = mapNextLine.offset;
		}
		const obj = typeof lineIndex === "undefined" ? this.styles : { line: this.styles[lineIndex] };
		for (const p1 in obj) for (const p2 in obj[p1]) {
			const p2Number = parseInt(p2, 10);
			if (p2Number >= offset && (!shouldLimit || p2Number < nextOffset)) for (const p3 in obj[p1][p2]) return false;
		}
		return true;
	}
	/**
	* @protected
	* @param {Number} lineIndex
	* @param {Number} charIndex
	* @return {TextStyleDeclaration} a style object reference to the existing one or a new empty object when undefined
	*/
	_getStyleDeclaration(lineIndex, charIndex) {
		if (this._styleMap && !this.isWrapping) {
			const map = this._styleMap[lineIndex];
			if (!map) return {};
			lineIndex = map.line;
			charIndex = map.offset + charIndex;
		}
		return super._getStyleDeclaration(lineIndex, charIndex);
	}
	/**
	* @param {Number} lineIndex
	* @param {Number} charIndex
	* @param {Object} style
	* @private
	*/
	_setStyleDeclaration(lineIndex, charIndex, style) {
		const map = this._styleMap[lineIndex];
		super._setStyleDeclaration(map.line, map.offset + charIndex, style);
	}
	/**
	* @param {Number} lineIndex
	* @param {Number} charIndex
	* @private
	*/
	_deleteStyleDeclaration(lineIndex, charIndex) {
		const map = this._styleMap[lineIndex];
		super._deleteStyleDeclaration(map.line, map.offset + charIndex);
	}
	/**
	* probably broken need a fix
	* Returns the real style line that correspond to the wrapped lineIndex line
	* Used just to verify if the line does exist or not.
	* @param {Number} lineIndex
	* @returns {Boolean} if the line exists or not
	* @private
	*/
	_getLineStyle(lineIndex) {
		const map = this._styleMap[lineIndex];
		return !!this.styles[map.line];
	}
	/**
	* Set the line style to an empty object so that is initialized
	* @param {Number} lineIndex
	* @param {Object} style
	* @private
	*/
	_setLineStyle(lineIndex) {
		const map = this._styleMap[lineIndex];
		super._setLineStyle(map.line);
	}
	/**
	* Wraps text using the 'width' property of Textbox. First this function
	* splits text on newlines, so we preserve newlines entered by the user.
	* Then it wraps each line using the width of the Textbox by calling
	* _wrapLine().
	* @param {Array} lines The string array of text that is split into lines
	* @param {Number} desiredWidth width you want to wrap to
	* @returns {Array} Array of lines
	*/
	_wrapText(lines, desiredWidth) {
		this.isWrapping = true;
		const data = this.getGraphemeDataForRender(lines);
		const wrapped = [];
		for (let i = 0; i < data.wordsData.length; i++) wrapped.push(...this._wrapLine(i, desiredWidth, data));
		this.isWrapping = false;
		return wrapped;
	}
	/**
	* For each line of text terminated by an hard line stop,
	* measure each word width and extract the largest word from all.
	* The returned words here are the one that at the end will be rendered.
	* @param {string[]} lines the lines we need to measure
	*
	*/
	getGraphemeDataForRender(lines) {
		const splitByGrapheme = this.splitByGrapheme, infix = splitByGrapheme ? "" : " ";
		let largestWordWidth = 0;
		return {
			wordsData: lines.map((line, lineIndex) => {
				let offset = 0;
				const wordsOrGraphemes = splitByGrapheme ? this.graphemeSplit(line) : this.wordSplit(line);
				if (wordsOrGraphemes.length === 0) return [{
					word: [],
					width: 0
				}];
				return wordsOrGraphemes.map((word) => {
					const graphemeArray = splitByGrapheme ? [word] : this.graphemeSplit(word);
					const width = this._measureWord(graphemeArray, lineIndex, offset);
					largestWordWidth = Math.max(width, largestWordWidth);
					offset += graphemeArray.length + infix.length;
					return {
						word: graphemeArray,
						width
					};
				});
			}),
			largestWordWidth
		};
	}
	/**
	* Helper function to measure a string of text, given its lineIndex and charIndex offset
	* It gets called when charBounds are not available yet.
	* Override if necessary
	* Use with {@link Textbox#wordSplit}
	*
	* @param {CanvasRenderingContext2D} ctx
	* @param {String} text
	* @param {number} lineIndex
	* @param {number} charOffset
	* @returns {number}
	*/
	_measureWord(word, lineIndex, charOffset = 0) {
		let width = 0, prevGrapheme;
		const skipLeft = true;
		for (let i = 0, len = word.length; i < len; i++) {
			const box = this._getGraphemeBox(word[i], lineIndex, i + charOffset, prevGrapheme, skipLeft);
			width += box.kernedWidth;
			prevGrapheme = word[i];
		}
		return width;
	}
	/**
	* Override this method to customize word splitting
	* Use with {@link Textbox#_measureWord}
	* @param {string} value
	* @returns {string[]} array of words
	*/
	wordSplit(value) {
		return value.split(this._wordJoiners);
	}
	/**
	* Wraps a line of text using the width of the Textbox as desiredWidth
	* and leveraging the known width o words from GraphemeData
	* @private
	* @param {Number} lineIndex
	* @param {Number} desiredWidth width you want to wrap the line to
	* @param {GraphemeData} graphemeData an object containing all the lines' words width.
	* @param {Number} reservedSpace space to remove from wrapping for custom functionalities
	* @returns {Array} Array of line(s) into which the given text is wrapped
	* to.
	*/
	_wrapLine(lineIndex, desiredWidth, { largestWordWidth, wordsData }, reservedSpace = 0) {
		const additionalSpace = this._getWidthOfCharSpacing(), splitByGrapheme = this.splitByGrapheme, graphemeLines = [], infix = splitByGrapheme ? "" : " ";
		let lineWidth = 0, line = [], offset = 0, infixWidth = 0, lineJustStarted = true;
		desiredWidth -= reservedSpace;
		const maxWidth = Math.max(desiredWidth, largestWordWidth, this.dynamicMinWidth);
		const data = wordsData[lineIndex];
		let i;
		for (i = 0; i < data.length; i++) {
			const { word, width: wordWidth } = data[i];
			offset += word.length;
			lineWidth += infixWidth + wordWidth - additionalSpace;
			if (lineWidth > maxWidth && !lineJustStarted) {
				graphemeLines.push(line);
				line = [];
				lineWidth = wordWidth;
				lineJustStarted = true;
			} else lineWidth += additionalSpace;
			if (!lineJustStarted && !splitByGrapheme) line.push(infix);
			line = line.concat(word);
			infixWidth = splitByGrapheme ? 0 : this._measureWord([infix], lineIndex, offset);
			offset++;
			lineJustStarted = false;
		}
		i && graphemeLines.push(line);
		if (largestWordWidth + reservedSpace > this.dynamicMinWidth) this.dynamicMinWidth = largestWordWidth - additionalSpace + reservedSpace;
		return graphemeLines;
	}
	/**
	* Detect if the text line is ended with an hard break
	* text and itext do not have wrapping, return false
	* @param {Number} lineIndex text to split
	* @return {Boolean}
	*/
	isEndOfWrapping(lineIndex) {
		if (!this._styleMap[lineIndex + 1]) return true;
		if (this._styleMap[lineIndex + 1].line !== this._styleMap[lineIndex].line) return true;
		return false;
	}
	/**
	* Detect if a line has a linebreak and so we need to account for it when moving
	* and counting style.
	* This is important only for splitByGrapheme at the end of wrapping.
	* If we are not wrapping the offset is always 1
	* @return Number
	*/
	missingNewlineOffset(lineIndex, skipWrapping) {
		if (this.splitByGrapheme && !skipWrapping) return this.isEndOfWrapping(lineIndex) ? 1 : 0;
		return 1;
	}
	/**
	* Gets lines of text to render in the Textbox. This function calculates
	* text wrapping on the fly every time it is called.
	* @param {String} text text to split
	* @returns {Array} Array of lines in the Textbox.
	* @override
	*/
	_splitTextIntoLines(text) {
		const newText = super._splitTextIntoLines(text), graphemeLines = this._wrapText(newText.lines, this.width), lines = new Array(graphemeLines.length);
		for (let i = 0; i < graphemeLines.length; i++) lines[i] = graphemeLines[i].join("");
		newText.lines = lines;
		newText.graphemeLines = graphemeLines;
		return newText;
	}
	getMinWidth() {
		return Math.max(this.minWidth, this.dynamicMinWidth);
	}
	_removeExtraneousStyles() {
		const linesToKeep = /* @__PURE__ */ new Map();
		for (const prop in this._styleMap) {
			const propNumber = parseInt(prop, 10);
			if (this._textLines[propNumber]) {
				const lineIndex = this._styleMap[prop].line;
				linesToKeep.set(`${lineIndex}`, true);
			}
		}
		for (const prop in this.styles) if (!linesToKeep.has(prop)) delete this.styles[prop];
	}
	/**
	* Returns object representation of an instance
	* @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
	* @return {Object} object representation of an instance
	*/
	toObject(propertiesToInclude = []) {
		return super.toObject([
			"minWidth",
			"splitByGrapheme",
			...propertiesToInclude
		]);
	}
};
_defineProperty(Textbox, "type", "Textbox");
_defineProperty(Textbox, "textLayoutProperties", [...IText.textLayoutProperties, "width"]);
_defineProperty(Textbox, "ownDefaults", textboxDefaultValues);
classRegistry.setClass(Textbox);
//#endregion
export { Textbox };

//# sourceMappingURL=Textbox.mjs.map