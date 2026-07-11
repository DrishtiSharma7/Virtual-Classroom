import { FabricError } from "./util/internals/console.mjs";
//#region src/ClassRegistry.ts
const JSON = "json";
var ClassRegistry = class {
	constructor() {
		this[JSON] = /* @__PURE__ */ new Map();
		this["svg"] = /* @__PURE__ */ new Map();
	}
	has(classType) {
		return this[JSON].has(classType);
	}
	getClass(classType) {
		const constructor = this[JSON].get(classType);
		if (!constructor) throw new FabricError(`No class registered for ${classType}`);
		return constructor;
	}
	setClass(classConstructor, classType) {
		if (classType) this[JSON].set(classType, classConstructor);
		else {
			this[JSON].set(classConstructor.type, classConstructor);
			this[JSON].set(classConstructor.type.toLowerCase(), classConstructor);
		}
	}
	getSVGClass(SVGTagName) {
		return this["svg"].get(SVGTagName);
	}
	setSVGClass(classConstructor, SVGTagName) {
		this["svg"].set(SVGTagName !== null && SVGTagName !== void 0 ? SVGTagName : classConstructor.type.toLowerCase(), classConstructor);
	}
};
const classRegistry = new ClassRegistry();
//#endregion
export { classRegistry };

//# sourceMappingURL=ClassRegistry.mjs.map