import { _defineProperty } from "../../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { getEnv, getFabricDocument } from "../../env/index.mjs";
import { NONE } from "../../constants.mjs";
import { createCanvasElement } from "../../util/misc/dom.mjs";
import { makeElementUnselectable, setCSSDimensions, setCanvasDimensions } from "./util.mjs";
import { StaticCanvasDOMManager } from "./StaticCanvasDOMManager.mjs";
import { setStyle } from "../../util/internals/dom_style.mjs";
//#region src/canvas/DOMManagers/CanvasDOMManager.ts
var CanvasDOMManager = class extends StaticCanvasDOMManager {
	constructor(arg0, { allowTouchScrolling = false, containerClass = "" } = {}) {
		super(arg0);
		_defineProperty(this, "upper", void 0);
		_defineProperty(this, "container", void 0);
		const { el: lowerCanvasEl } = this.lower;
		const upperCanvasEl = this.createUpperCanvas();
		this.upper = {
			el: upperCanvasEl,
			ctx: upperCanvasEl.getContext("2d")
		};
		this.applyCanvasStyle(lowerCanvasEl, { allowTouchScrolling });
		this.applyCanvasStyle(upperCanvasEl, {
			allowTouchScrolling,
			styles: {
				position: "absolute",
				left: "0",
				top: "0"
			}
		});
		const container = this.createContainerElement();
		container.classList.add(containerClass);
		if (lowerCanvasEl.parentNode) lowerCanvasEl.parentNode.replaceChild(container, lowerCanvasEl);
		container.append(lowerCanvasEl, upperCanvasEl);
		this.container = container;
	}
	createUpperCanvas() {
		const { el: lowerCanvasEl } = this.lower;
		const el = createCanvasElement();
		el.className = lowerCanvasEl.className;
		el.classList.remove("lower-canvas");
		el.classList.add("upper-canvas");
		el.setAttribute("data-fabric", "top");
		el.style.cssText = lowerCanvasEl.style.cssText;
		el.setAttribute("draggable", "true");
		return el;
	}
	createContainerElement() {
		const container = getFabricDocument().createElement("div");
		container.setAttribute("data-fabric", "wrapper");
		setStyle(container, { position: "relative" });
		makeElementUnselectable(container);
		return container;
	}
	/**
	* @private
	* @param {HTMLCanvasElement} element canvas element to apply styles on
	*/
	applyCanvasStyle(element, options) {
		const { styles, allowTouchScrolling } = options;
		setStyle(element, {
			...styles,
			"touch-action": allowTouchScrolling ? "manipulation" : NONE
		});
		makeElementUnselectable(element);
	}
	setDimensions(size, retinaScaling) {
		super.setDimensions(size, retinaScaling);
		const { el, ctx } = this.upper;
		setCanvasDimensions(el, ctx, size, retinaScaling);
	}
	setCSSDimensions(size) {
		super.setCSSDimensions(size);
		setCSSDimensions(this.upper.el, size);
		setCSSDimensions(this.container, size);
	}
	cleanupDOM(size) {
		const container = this.container, { el: lowerCanvasEl } = this.lower, { el: upperCanvasEl } = this.upper;
		super.cleanupDOM(size);
		container.removeChild(upperCanvasEl);
		container.removeChild(lowerCanvasEl);
		if (container.parentNode) container.parentNode.replaceChild(lowerCanvasEl, container);
	}
	dispose() {
		super.dispose();
		getEnv().dispose(this.upper.el);
		delete this.upper;
		delete this.container;
	}
};
//#endregion
export { CanvasDOMManager };

//# sourceMappingURL=CanvasDOMManager.mjs.map