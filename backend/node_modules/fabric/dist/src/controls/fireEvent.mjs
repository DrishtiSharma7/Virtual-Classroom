//#region src/controls/fireEvent.ts
const fireEvent = (eventName, options) => {
	var _target$canvas;
	const { transform: { target } } = options;
	(_target$canvas = target.canvas) === null || _target$canvas === void 0 || _target$canvas.fire(`object:${eventName}`, {
		...options,
		target
	});
	target.fire(eventName, options);
};
//#endregion
export { fireEvent };

//# sourceMappingURL=fireEvent.mjs.map