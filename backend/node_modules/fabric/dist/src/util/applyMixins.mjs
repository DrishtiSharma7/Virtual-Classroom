//#region src/util/applyMixins.ts
/***
* https://www.typescriptlang.org/docs/handbook/mixins.html#alternative-pattern
*/
function applyMixins(derivedCtor, constructors) {
	constructors.forEach((baseCtor) => {
		Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
			name !== "constructor" && Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name) || Object.create(null));
		});
	});
	return derivedCtor;
}
//#endregion
export { applyMixins };

//# sourceMappingURL=applyMixins.mjs.map