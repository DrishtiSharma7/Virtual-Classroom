import { _defineProperty } from "../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { CENTER, CHANGED, MODIFIED, MODIFY_PATH, MODIFY_POLY, MOVING, RESIZING, ROTATING, SCALING, SKEWING, iMatrix } from "../constants.mjs";
import { classRegistry } from "../ClassRegistry.mjs";
import { Point } from "../Point.mjs";
import { invertTransform } from "../util/misc/matrix.mjs";
import { resolveOrigin } from "../util/misc/resolveOrigin.mjs";
import { LAYOUT_TYPE_OBJECT_MODIFIED, LAYOUT_TYPE_OBJECT_MODIFYING } from "./constants.mjs";
import { FitContentLayout } from "./LayoutStrategies/FitContentLayout.mjs";
//#region src/LayoutManager/LayoutManager.ts
const LAYOUT_MANAGER = "layoutManager";
var LayoutManager = class {
	constructor(strategy = new FitContentLayout()) {
		_defineProperty(this, "strategy", void 0);
		this.strategy = strategy;
		this._subscriptions = /* @__PURE__ */ new Map();
	}
	performLayout(context) {
		const strictContext = {
			bubbles: true,
			strategy: this.strategy,
			...context,
			prevStrategy: this._prevLayoutStrategy,
			stopPropagation() {
				this.bubbles = false;
			}
		};
		this.onBeforeLayout(strictContext);
		const layoutResult = this.getLayoutResult(strictContext);
		if (layoutResult) this.commitLayout(strictContext, layoutResult);
		this.onAfterLayout(strictContext, layoutResult);
		this._prevLayoutStrategy = strictContext.strategy;
	}
	/**
	* Attach handlers for events that we know will invalidate the layout when
	* performed on child objects ( general transforms ).
	* Returns the disposers for later unsubscribing and cleanup
	* @param {FabricObject} object
	* @param {RegistrationContext & Partial<StrictLayoutContext>} context
	* @returns {VoidFunction[]} disposers remove the handlers
	*/
	attachHandlers(object, context) {
		const { target } = context;
		return [
			MODIFIED,
			MOVING,
			RESIZING,
			ROTATING,
			SCALING,
			SKEWING,
			CHANGED,
			MODIFY_POLY,
			MODIFY_PATH
		].map((key) => object.on(key, (e) => this.performLayout(key === "modified" ? {
			type: LAYOUT_TYPE_OBJECT_MODIFIED,
			trigger: key,
			e,
			target
		} : {
			type: LAYOUT_TYPE_OBJECT_MODIFYING,
			trigger: key,
			e,
			target
		})));
	}
	/**
	* Subscribe an object to transform events that will trigger a layout change on the parent
	* This is important only for interactive groups.
	* @param object
	* @param context
	*/
	subscribe(object, context) {
		this.unsubscribe(object, context);
		const disposers = this.attachHandlers(object, context);
		this._subscriptions.set(object, disposers);
	}
	/**
	* unsubscribe object layout triggers
	*/
	unsubscribe(object, _context) {
		(this._subscriptions.get(object) || []).forEach((d) => d());
		this._subscriptions.delete(object);
	}
	unsubscribeTargets(context) {
		context.targets.forEach((object) => this.unsubscribe(object, context));
	}
	subscribeTargets(context) {
		context.targets.forEach((object) => this.subscribe(object, context));
	}
	onBeforeLayout(context) {
		const { target, type } = context;
		const { canvas } = target;
		if (type === "initialization" || type === "added") this.subscribeTargets(context);
		else if (type === "removed") this.unsubscribeTargets(context);
		target.fire("layout:before", { context });
		canvas && canvas.fire("object:layout:before", {
			target,
			context
		});
		if (type === "imperative" && context.deep) {
			const { strategy: _, ...tricklingContext } = context;
			target.forEachObject((object) => object.layoutManager && object.layoutManager.performLayout({
				...tricklingContext,
				bubbles: false,
				target: object
			}));
		}
	}
	getLayoutResult(context) {
		const { target, strategy, type } = context;
		const result = strategy.calcLayoutResult(context, target.getObjects());
		if (!result) return;
		const prevCenter = type === "initialization" ? new Point() : target.getRelativeCenterPoint();
		const { center: nextCenter, correction = new Point(), relativeCorrection = new Point() } = result;
		return {
			result,
			prevCenter,
			nextCenter,
			offset: prevCenter.subtract(nextCenter).add(correction).transform(type === "initialization" ? iMatrix : invertTransform(target.calcOwnMatrix()), true).add(relativeCorrection)
		};
	}
	commitLayout(context, layoutResult) {
		const { target } = context;
		const { result: { size }, nextCenter } = layoutResult;
		target.set({
			width: size.x,
			height: size.y
		});
		this.layoutObjects(context, layoutResult);
		if (context.type === "initialization") {
			var _context$x, _context$y;
			target.set({
				left: (_context$x = context.x) !== null && _context$x !== void 0 ? _context$x : nextCenter.x + size.x * resolveOrigin(target.originX),
				top: (_context$y = context.y) !== null && _context$y !== void 0 ? _context$y : nextCenter.y + size.y * resolveOrigin(target.originY)
			});
		} else {
			target.setPositionByOrigin(nextCenter, CENTER, CENTER);
			target.setCoords();
			target.set("dirty", true);
		}
	}
	layoutObjects(context, layoutResult) {
		const { target } = context;
		target.forEachObject((object) => {
			object.group === target && this.layoutObject(context, layoutResult, object);
		});
		context.strategy.shouldLayoutClipPath(context) && this.layoutObject(context, layoutResult, target.clipPath);
	}
	/**
	* @param {FabricObject} object
	* @param {Point} offset
	*/
	layoutObject(context, { offset }, object) {
		object.set({
			left: object.left + offset.x,
			top: object.top + offset.y
		});
	}
	onAfterLayout(context, layoutResult) {
		const { target, strategy, bubbles, prevStrategy: _, ...bubblingContext } = context;
		const { canvas } = target;
		target.fire("layout:after", {
			context,
			result: layoutResult
		});
		canvas && canvas.fire("object:layout:after", {
			context,
			result: layoutResult,
			target
		});
		const parent = target.parent;
		if (bubbles && (parent === null || parent === void 0 ? void 0 : parent.layoutManager)) {
			(bubblingContext.path || (bubblingContext.path = [])).push(target);
			parent.layoutManager.performLayout({
				...bubblingContext,
				target: parent
			});
		}
		target.set("dirty", true);
	}
	dispose() {
		const { _subscriptions } = this;
		_subscriptions.forEach((disposers) => disposers.forEach((d) => d()));
		_subscriptions.clear();
	}
	toObject() {
		return {
			type: LAYOUT_MANAGER,
			strategy: this.strategy.constructor.type
		};
	}
	toJSON() {
		return this.toObject();
	}
};
classRegistry.setClass(LayoutManager, LAYOUT_MANAGER);
//#endregion
export { LayoutManager };

//# sourceMappingURL=LayoutManager.mjs.map