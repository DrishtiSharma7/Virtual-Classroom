import { _defineProperty } from "../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { log } from "../util/internals/console.mjs";
import { classRegistry } from "../ClassRegistry.mjs";
import { LAYOUT_TYPE_ADDED } from "../LayoutManager/constants.mjs";
import { Group } from "./Group.mjs";
import { ActiveSelectionLayoutManager } from "../LayoutManager/ActiveSelectionLayoutManager.mjs";
//#region src/shapes/ActiveSelection.ts
const activeSelectionDefaultValues = { multiSelectionStacking: "canvas-stacking" };
/**
* Used by Canvas to manage selection.
*
* @example
* class MyActiveSelection extends ActiveSelection {
*   ...
* }
*
* // override the default `ActiveSelection` class
* classRegistry.setClass(MyActiveSelection)
*/
var ActiveSelection = class ActiveSelection extends Group {
	static getDefaults() {
		return {
			...super.getDefaults(),
			...ActiveSelection.ownDefaults
		};
	}
	constructor(objects = [], options = {}) {
		super();
		Object.assign(this, ActiveSelection.ownDefaults);
		this.setOptions(options);
		const { left, top, layoutManager } = options;
		this.groupInit(objects, {
			left,
			top,
			layoutManager: layoutManager !== null && layoutManager !== void 0 ? layoutManager : new ActiveSelectionLayoutManager()
		});
	}
	/**
	* @private
	*/
	_shouldSetNestedCoords() {
		return true;
	}
	/**
	* @private
	* @override we don't want the selection monitor to be active
	*/
	__objectSelectionMonitor() {}
	/**
	* Adds objects with respect to {@link multiSelectionStacking}
	* @param targets object to add to selection
	*/
	multiSelectAdd(...targets) {
		if (this.multiSelectionStacking === "selection-order") this.add(...targets);
		else targets.forEach((target) => {
			const index = this._objects.findIndex((obj) => obj.isInFrontOf(target));
			const insertAt = index === -1 ? this.size() : index;
			this.insertAt(insertAt, target);
		});
	}
	/**
	* @override block ancestors/descendants of selected objects from being selected to prevent a circular object tree
	*/
	canEnterGroup(object) {
		if (this.getObjects().some((o) => o.isDescendantOf(object) || object.isDescendantOf(o))) {
			log("error", "ActiveSelection: circular object trees are not supported, this call has no effect");
			return false;
		}
		return super.canEnterGroup(object);
	}
	/**
	* Change an object so that it can be part of an active selection.
	* this method is called by multiselectAdd from canvas code.
	* @private
	* @param {FabricObject} object
	* @param {boolean} [removeParentTransform] true if object is in canvas coordinate plane
	*/
	enterGroup(object, removeParentTransform) {
		if (object.parent && object.parent === object.group) object.parent._exitGroup(object);
		else if (object.group && object.parent !== object.group) object.group.remove(object);
		this._enterGroup(object, removeParentTransform);
	}
	/**
	* we want objects to retain their canvas ref when exiting instance
	* @private
	* @param {FabricObject} object
	* @param {boolean} [removeParentTransform] true if object should exit group without applying group's transform to it
	*/
	exitGroup(object, removeParentTransform) {
		this._exitGroup(object, removeParentTransform);
		object.parent && object.parent._enterGroup(object, true);
	}
	/**
	* @private
	* @param {'added'|'removed'} type
	* @param {FabricObject[]} targets
	*/
	_onAfterObjectsChange(type, targets) {
		super._onAfterObjectsChange(type, targets);
		const groups = /* @__PURE__ */ new Set();
		targets.forEach((object) => {
			const { parent } = object;
			parent && groups.add(parent);
		});
		if (type === "removed") groups.forEach((group) => {
			group._onAfterObjectsChange(LAYOUT_TYPE_ADDED, targets);
		});
		else groups.forEach((group) => {
			group._set("dirty", true);
		});
	}
	/**
	* @override remove all objects
	*/
	onDeselect() {
		this.removeAll();
		return false;
	}
	/**
	* Returns string representation of a group
	* @return {String}
	*/
	toString() {
		return `#<ActiveSelection: (${this.complexity()})>`;
	}
	/**
	* Decide if the object should cache or not. The Active selection never caches
	* @return {Boolean}
	*/
	shouldCache() {
		return false;
	}
	/**
	* Check if this group or its parent group are caching, recursively up
	* @return {Boolean}
	*/
	isOnACache() {
		return false;
	}
	/**
	* Renders controls and borders for the object
	* @param {CanvasRenderingContext2D} ctx Context to render on
	* @param {Object} [styleOverride] properties to override the object style
	* @param {Object} [childrenOverride] properties to override the children overrides
	*/
	_renderControls(ctx, styleOverride, childrenOverride) {
		ctx.save();
		ctx.globalAlpha = this.isMoving ? this.borderOpacityWhenMoving : 1;
		const options = {
			hasControls: false,
			...childrenOverride,
			forActiveSelection: true
		};
		for (let i = 0; i < this._objects.length; i++) this._objects[i]._renderControls(ctx, options);
		super._renderControls(ctx, styleOverride);
		ctx.restore();
	}
};
_defineProperty(ActiveSelection, "type", "ActiveSelection");
_defineProperty(ActiveSelection, "ownDefaults", activeSelectionDefaultValues);
classRegistry.setClass(ActiveSelection);
classRegistry.setClass(ActiveSelection, "activeSelection");
//#endregion
export { ActiveSelection };

//# sourceMappingURL=ActiveSelection.mjs.map