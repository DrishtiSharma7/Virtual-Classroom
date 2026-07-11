//#region src/util/internals/console.ts
const log = (severity, ...optionalParams) => console[severity]("fabric", ...optionalParams);
var FabricError = class extends Error {
	constructor(message, options) {
		super(`fabric: ${message}`, options);
	}
};
var SignalAbortedError = class extends FabricError {
	constructor(context) {
		super(`${context} 'options.signal' is in 'aborted' state`);
	}
};
//#endregion
export { FabricError, SignalAbortedError, log };

//# sourceMappingURL=console.mjs.map