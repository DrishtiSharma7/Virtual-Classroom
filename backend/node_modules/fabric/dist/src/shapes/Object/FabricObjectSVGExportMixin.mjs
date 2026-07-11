import { FILL, NONE, STROKE } from "../../constants.mjs";
import { uid } from "../../util/internals/uid.mjs";
import { matrixToSVG } from "../../util/misc/svgExport.mjs";
import { isFiller } from "../../util/typeAssertions.mjs";
import { escapeXml } from "../../util/lang_string.mjs";
import { getSafeSvgStyleNumber, getSafeSvgStyleToken } from "../../util/internals/svgExportCheck.mjs";
import { colorPropToSVG } from "../../util/misc/svgParsing.mjs";
//#region src/shapes/Object/FabricObjectSVGExportMixin.ts
var FabricObjectSVGExportMixin = class {
	/**
	* Returns styles-string for svg-export
	* @param {Boolean} skipShadow a boolean to skip shadow filter output
	* @return {String}
	*/
	getSvgStyles(skipShadow) {
		const fillRule = this.fillRule == null ? "nonzero" : getSafeSvgStyleToken(this.fillRule), strokeWidth = this.strokeWidth == null ? "0" : getSafeSvgStyleNumber(this.strokeWidth), strokeDashArray = this.strokeDashArray == null ? NONE : this.strokeDashArray.every((value) => Number.isFinite(Number(value))) ? this.strokeDashArray.join(" ") : "", strokeDashOffset = this.strokeDashOffset == null ? "0" : getSafeSvgStyleNumber(this.strokeDashOffset), strokeLineCap = this.strokeLineCap == null ? "butt" : getSafeSvgStyleToken(this.strokeLineCap), strokeLineJoin = this.strokeLineJoin == null ? "miter" : getSafeSvgStyleToken(this.strokeLineJoin), strokeMiterLimit = this.strokeMiterLimit == null ? "4" : getSafeSvgStyleNumber(this.strokeMiterLimit), opacity = this.opacity == null ? "1" : getSafeSvgStyleNumber(this.opacity), visibility = this.visible ? "" : " visibility: hidden;", filter = skipShadow ? "" : this.getSvgFilter(), fill = colorPropToSVG(FILL, this.fill);
		return [
			colorPropToSVG(STROKE, this.stroke),
			strokeWidth ? `stroke-width: ${strokeWidth}; ` : "",
			strokeDashArray ? `stroke-dasharray: ${strokeDashArray}; ` : "",
			strokeLineCap ? `stroke-linecap: ${strokeLineCap}; ` : "",
			strokeDashOffset ? `stroke-dashoffset: ${strokeDashOffset}; ` : "",
			strokeLineJoin ? `stroke-linejoin: ${strokeLineJoin}; ` : "",
			strokeMiterLimit ? `stroke-miterlimit: ${strokeMiterLimit}; ` : "",
			fill,
			fillRule ? `fill-rule: ${fillRule}; ` : "",
			opacity ? `opacity: ${opacity};` : "",
			filter,
			visibility
		].map((v) => escapeXml(v)).join("");
	}
	/**
	* Returns filter for svg shadow
	* @return {String}
	*/
	getSvgFilter() {
		return this.shadow ? `filter: url(#SVGID_${escapeXml(this.shadow.id)});` : "";
	}
	/**
	* Returns id attribute for svg output
	* @return {String}
	*/
	getSvgCommons() {
		return [this.id ? `id="${escapeXml(String(this.id))}" ` : "", this.clipPath ? `clip-path="url(#${escapeXml(this.clipPath.clipPathId)})" ` : ""].join("");
	}
	/**
	* Returns transform-string for svg-export
	* @param {Boolean} use the full transform or the single object one.
	* @return {String}
	*/
	getSvgTransform(full, additionalTransform = "") {
		return `${`transform="${matrixToSVG(full ? this.calcTransformMatrix() : this.calcOwnMatrix())}`}${additionalTransform}" `;
	}
	/**
	* Returns svg representation of an instance
	* This function is implemented in each subclass
	* This is just because typescript otherwise cryies all the time
	* @return {Array} an array of strings with the specific svg representation
	* of the instance
	*/
	_toSVG(_reviver) {
		return [""];
	}
	/**
	* Returns svg representation of an instance
	* @param {TSVGReviver} [reviver] Method for further parsing of svg representation.
	* @return {String} svg representation of an instance
	*/
	toSVG(reviver) {
		return this._createBaseSVGMarkup(this._toSVG(reviver), { reviver });
	}
	/**
	* Returns svg clipPath representation of an instance
	* @param {TSVGReviver} [reviver] Method for further parsing of svg representation.
	* @return {String} svg representation of an instance
	*/
	toClipPathSVG(reviver) {
		return "	" + this._createBaseClipPathSVGMarkup(this._toSVG(reviver), { reviver });
	}
	/**
	* @private
	*/
	_createBaseClipPathSVGMarkup(objectMarkup, { reviver, additionalTransform = "" } = {}) {
		const commonPieces = [this.getSvgTransform(true, additionalTransform), this.getSvgCommons()].join(""), index = objectMarkup.indexOf("COMMON_PARTS");
		objectMarkup[index] = commonPieces;
		return reviver ? reviver(objectMarkup.join("")) : objectMarkup.join("");
	}
	/**
	* @private
	*/
	_createBaseSVGMarkup(objectMarkup, { noStyle, reviver, withShadow, additionalTransform } = {}) {
		const styleInfo = noStyle ? "" : `style="${this.getSvgStyles()}" `, shadowInfo = withShadow ? `style="${this.getSvgFilter()}" ` : "", clipPath = this.clipPath, vectorEffect = this.strokeUniform ? "vector-effect=\"non-scaling-stroke\" " : "", absoluteClipPath = clipPath && clipPath.absolutePositioned, stroke = this.stroke, fill = this.fill, shadow = this.shadow, markup = [], index = objectMarkup.indexOf("COMMON_PARTS");
		let clipPathMarkup;
		if (clipPath) {
			clipPath.clipPathId = `CLIPPATH_${uid()}`;
			clipPathMarkup = `<clipPath id="${clipPath.clipPathId}" >\n${clipPath.toClipPathSVG(reviver)}</clipPath>\n`;
		}
		if (absoluteClipPath) markup.push("<g ", shadowInfo, this.getSvgCommons(), " >\n");
		markup.push("<g ", this.getSvgTransform(false), !absoluteClipPath ? shadowInfo + this.getSvgCommons() : "", " >\n");
		objectMarkup[index] = [
			styleInfo,
			vectorEffect,
			noStyle ? "" : this.addPaintOrder(),
			" ",
			additionalTransform ? `transform="${additionalTransform}" ` : ""
		].join("");
		if (isFiller(fill)) markup.push(fill.toSVG(this));
		if (isFiller(stroke)) markup.push(stroke.toSVG(this));
		if (shadow) markup.push(shadow.toSVG(this));
		if (clipPath) markup.push(clipPathMarkup);
		markup.push(objectMarkup.join(""));
		markup.push("</g>\n");
		absoluteClipPath && markup.push("</g>\n");
		return reviver ? reviver(markup.join("")) : markup.join("");
	}
	addPaintOrder() {
		return this.paintFirst !== "fill" ? ` paint-order="${escapeXml(this.paintFirst)}" ` : "";
	}
};
//#endregion
export { FabricObjectSVGExportMixin };

//# sourceMappingURL=FabricObjectSVGExportMixin.mjs.map