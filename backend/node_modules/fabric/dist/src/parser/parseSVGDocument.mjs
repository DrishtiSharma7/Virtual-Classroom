import { SignalAbortedError, log } from "../util/internals/console.mjs";
import { svgValidTagNamesRegEx } from "./constants.mjs";
import { applyViewboxTransform } from "./applyViewboxTransform.mjs";
import { getTagName } from "./getTagName.mjs";
import { hasInvalidAncestor } from "./hasInvalidAncestor.mjs";
import { parseUseDirectives } from "./parseUseDirectives.mjs";
import { ElementsParser } from "./elements_parser.mjs";
//#region src/parser/parseSVGDocument.ts
const isValidSvgTag = (el) => svgValidTagNamesRegEx.test(getTagName(el));
const createEmptyResponse = () => ({
	objects: [],
	elements: [],
	options: {},
	allElements: []
});
/**
* Parses an SVG document, converts it to an array of corresponding fabric.* instances and passes them to a callback
* @param {HTMLElement} doc SVG document to parse
* @param {TSvgParsedCallback} callback Invoked when the parsing is done, with null if parsing wasn't possible with the list of svg nodes.
* @param {TSvgReviverCallback} [reviver] Extra callback for further parsing of SVG elements, called after each fabric object has been created.
* Takes as input the original svg element and the generated `FabricObject` as arguments. Used to inspect extra properties not parsed by fabric,
* or extra custom manipulation
* @param {Object} [options] Object containing options for parsing
* @param {String} [options.crossOrigin] crossOrigin setting to use for external resources
* @param {AbortSignal} [options.signal] handle aborting, see https://developer.mozilla.org/en-US/docs/Web/API/AbortController/signal
* @return {SVGParsingOutput}
* {@link SVGParsingOutput} also receives `allElements` array as the last argument. This is the full list of svg nodes available in the document.
* You may want to use it if you are trying to regroup the objects as they were originally grouped in the SVG. ( This was the reason why it was added )
*/
async function parseSVGDocument(doc, reviver, { crossOrigin, signal } = {}) {
	if (signal && signal.aborted) {
		log("log", new SignalAbortedError("parseSVGDocument"));
		return createEmptyResponse();
	}
	const documentElement = doc.documentElement;
	parseUseDirectives(doc);
	const descendants = Array.from(documentElement.getElementsByTagName("*")), options = {
		...applyViewboxTransform(documentElement),
		crossOrigin,
		signal
	};
	const elements = descendants.filter((el) => {
		applyViewboxTransform(el);
		return isValidSvgTag(el) && !hasInvalidAncestor(el);
	});
	if (!elements || elements && !elements.length) return {
		...createEmptyResponse(),
		options,
		allElements: descendants
	};
	const localClipPaths = {};
	descendants.filter((el) => getTagName(el) === "clipPath").forEach((el) => {
		el.setAttribute("originalTransform", el.getAttribute("transform") || "");
		const id = el.getAttribute("id");
		localClipPaths[id] = Array.from(el.getElementsByTagName("*")).filter((el) => isValidSvgTag(el));
	});
	return {
		objects: await new ElementsParser(elements, options, reviver, doc, localClipPaths).parse(),
		elements,
		options,
		allElements: descendants
	};
}
//#endregion
export { createEmptyResponse, parseSVGDocument };

//# sourceMappingURL=parseSVGDocument.mjs.map