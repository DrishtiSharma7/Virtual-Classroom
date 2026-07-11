import { _defineProperty } from "../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
//#region src/Observable.ts
/**
* @see {@link http://fabric5.fabricjs.com/fabric-intro-part-2#events}
* @see {@link http://fabric5.fabricjs.com/events|Events demo}
*/
var Observable = class {
	constructor() {
		_defineProperty(this, "__eventListeners", {});
	}
	on(arg0, handler) {
		if (!this.__eventListeners) this.__eventListeners = {};
		if (typeof arg0 === "object") {
			Object.entries(arg0).forEach(([eventName, handler]) => {
				this.on(eventName, handler);
			});
			return () => this.off(arg0);
		} else if (handler) {
			const eventName = arg0;
			if (!this.__eventListeners[eventName]) this.__eventListeners[eventName] = [];
			this.__eventListeners[eventName].push(handler);
			return () => this.off(eventName, handler);
		} else return () => false;
	}
	once(arg0, handler) {
		if (typeof arg0 === "object") {
			const disposers = [];
			Object.entries(arg0).forEach(([eventName, handler]) => {
				disposers.push(this.once(eventName, handler));
			});
			return () => disposers.forEach((d) => d());
		} else if (handler) {
			const disposer = this.on(arg0, function onceHandler(...args) {
				handler.call(this, ...args);
				disposer();
			});
			return disposer;
		} else return () => false;
	}
	/**
	* @private
	* @param {string} eventName
	* @param {Function} [handler]
	*/
	_removeEventListener(eventName, handler) {
		if (!this.__eventListeners[eventName]) return;
		if (handler) {
			const eventListener = this.__eventListeners[eventName];
			const index = eventListener.indexOf(handler);
			index > -1 && eventListener.splice(index, 1);
		} else this.__eventListeners[eventName] = [];
	}
	off(arg0, handler) {
		if (!this.__eventListeners) return;
		if (typeof arg0 === "undefined") for (const eventName in this.__eventListeners) this._removeEventListener(eventName);
		else if (typeof arg0 === "object") Object.entries(arg0).forEach(([eventName, handler]) => {
			this._removeEventListener(eventName, handler);
		});
		else this._removeEventListener(arg0, handler);
	}
	/**
	* Fires event with an optional options object
	* @param {String} eventName Event name to fire
	* @param {Object} [options] Options object
	*/
	fire(eventName, options) {
		var _this$__eventListener;
		if (!this.__eventListeners) return;
		const listenersForEvent = (_this$__eventListener = this.__eventListeners[eventName]) === null || _this$__eventListener === void 0 ? void 0 : _this$__eventListener.concat();
		if (listenersForEvent) for (let i = 0; i < listenersForEvent.length; i++) listenersForEvent[i].call(this, options || {});
	}
};
//#endregion
export { Observable };

//# sourceMappingURL=Observable.mjs.map