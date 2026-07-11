import { getFabricWindow } from "../../env/index.mjs";
//#region src/util/animation/AnimationFrameProvider.ts
function requestAnimFrame(callback) {
	return getFabricWindow().requestAnimationFrame(callback);
}
function cancelAnimFrame(handle) {
	return getFabricWindow().cancelAnimationFrame(handle);
}
//#endregion
export { cancelAnimFrame, requestAnimFrame };

//# sourceMappingURL=AnimationFrameProvider.mjs.map