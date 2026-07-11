import { svgNS } from "./constants.mjs";
import { parseStyleString } from "./parseStyleString.mjs";
import { applyViewboxTransform } from "./applyViewboxTransform.mjs";
import { getMultipleNodes } from "./getMultipleNodes.mjs";
//#region src/parser/parseUseDirectives.ts
function parseUseDirectives(doc) {
	const nodelist = getMultipleNodes(doc, ["use", "svg:use"]);
	const skipAttributes = [
		"x",
		"y",
		"xlink:href",
		"href",
		"transform"
	];
	for (const useElement of nodelist) {
		const useAttributes = useElement.attributes;
		const useAttrMap = {};
		for (const attr of useAttributes) attr.value && (useAttrMap[attr.name] = attr.value);
		const xlink = (useAttrMap["xlink:href"] || useAttrMap.href || "").slice(1);
		if (xlink === "") return;
		const referencedElement = doc.getElementById(xlink);
		if (referencedElement === null) return;
		let clonedOriginal = referencedElement.cloneNode(true);
		const originalAttributes = clonedOriginal.attributes;
		const originalAttrMap = {};
		for (const attr of originalAttributes) attr.value && (originalAttrMap[attr.name] = attr.value);
		const { x = 0, y = 0, transform = "" } = useAttrMap;
		const currentTrans = `${transform} ${originalAttrMap.transform || ""} translate(${x}, ${y})`;
		applyViewboxTransform(clonedOriginal);
		if (/^svg$/i.test(clonedOriginal.nodeName)) {
			const el3 = clonedOriginal.ownerDocument.createElementNS(svgNS, "g");
			Object.entries(originalAttrMap).forEach(([name, value]) => el3.setAttributeNS(svgNS, name, value));
			el3.append(...clonedOriginal.childNodes);
			clonedOriginal = el3;
		}
		for (const attr of useAttributes) {
			if (!attr) continue;
			const { name, value } = attr;
			if (skipAttributes.includes(name)) continue;
			if (name === "style") {
				const styleRecord = {};
				parseStyleString(value, styleRecord);
				Object.entries(originalAttrMap).forEach(([name, value]) => {
					styleRecord[name] = value;
				});
				parseStyleString(originalAttrMap.style || "", styleRecord);
				const mergedStyles = Object.entries(styleRecord).map((entry) => entry.join(":")).join(";");
				clonedOriginal.setAttribute(name, mergedStyles);
			} else !originalAttrMap[name] && clonedOriginal.setAttribute(name, value);
		}
		clonedOriginal.setAttribute("transform", currentTrans);
		clonedOriginal.setAttribute("instantiated_by_use", "1");
		clonedOriginal.removeAttribute("id");
		useElement.parentNode.replaceChild(clonedOriginal, useElement);
	}
}
//#endregion
export { parseUseDirectives };

//# sourceMappingURL=parseUseDirectives.mjs.map