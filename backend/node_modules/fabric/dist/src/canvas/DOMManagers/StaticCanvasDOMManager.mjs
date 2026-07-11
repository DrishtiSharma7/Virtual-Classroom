import { _defineProperty } from "../../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { FabricError } from "../../util/internals/console.mjs";
import { getEnv, getFabricDocument } from "../../env/index.mjs";
import { createCanvasElement, isHTMLCanvas } from "../../util/misc/dom.mjs";
import { getElementOffset, setCSSDimensions, setCanvasDimensions } from "./util.mjs";
//#region src/canvas/DOMManagers/StaticCanvasDOMManager.ts
var StaticCanvasDOMManager = class {
	constructor(arg0) {
		_defineProperty(this, "_originalCanvasStyle", void 0);
		_defineProperty(this, "lower", void 0);
		const el = this.createLowerCanvas(arg0);
		this.lower = {
			el,
			ctx: el.getContext("2d")
		};
	}
	createLowerCanvas(arg0) {
		const el = isHTMLCanvas(arg0) ? arg0 : arg0 && getFabricDocument().getElementById(arg0) || createCanvasElement();
		if (el.hasAttribute("data-fabric")) throw new FabricError("Trying to initialize a canvas that has already been initialized. Did you forget to dispose the canvas?");
		this._originalCanvasStyle = el.style.cssText;
		el.setAttribute("data-fabric", "main");
		el.classList.add("lower-canvas");
		return el;
	}
	cleanupDOM({ width, height }) {
		const { el } = this.lower;
		el.classList.remove("lower-canvas");
		el.removeAttribute("data-fabric");
		el.setAttribute("width", `${width}`);
		el.setAttribute("height", `${height}`);
		el.style.cssText = this._originalCanvasStyle || "";
		this._originalCanvasStyle = void 0;
	}
	setDimensions(size, retinaScaling) {
		const { el, ctx } = this.lower;
		setCanvasDimensions(el, ctx, size, retinaScaling);
	}
	setCSSDimensions(size) {
		setCSSDimensions(this.lower.el, size);
	}
	/**
	* Calculates canvas element offset relative to the document
	*/
	calcOffset() {
		return getElementOffset(this.lower.el);
	}
	dispose() {
		getEnv().dispose(this.lower.el);
		delete this.lower;
	}
};
//#endregion
export { StaticCanvasDOMManager };

//# sourceMappingURL=StaticCanvasDOMManager.mjs.map