//#region src/util/typeAssertions.ts
const isFiller = (filler) => {
	return !!filler && filler.toLive !== void 0;
};
const isSerializableFiller = (filler) => {
	return !!filler && typeof filler.toObject === "function";
};
const isPattern = (filler) => {
	return !!filler && filler.offsetX !== void 0 && "source" in filler;
};
const isTextObject = (fabricObject) => {
	return !!fabricObject && typeof fabricObject._renderText === "function";
};
const isPath = (fabricObject) => {
	return !!fabricObject && typeof fabricObject._renderPathCommands === "function";
};
const isActiveSelection = (fabricObject) => !!fabricObject && "multiSelectionStacking" in fabricObject;
//#endregion
export { isActiveSelection, isFiller, isPath, isPattern, isSerializableFiller, isTextObject };

//# sourceMappingURL=typeAssertions.mjs.map