import { getDistanceList } from "./basic.mjs";
//#region extensions/aligning_guidelines/util/collect-point.ts
function collectVerticalPoint(props) {
	const { target, isScale, isUniform, corner, point, diagonalPoint, list, isCenter } = props;
	const { dis, arr } = getDistanceList(point, list, "x");
	if (dis > this.margin / this.canvas.getZoom()) return [];
	let v = arr[arr.length - 1].x - point.x;
	const dirX = corner.includes("l") ? -1 : 1;
	v *= dirX;
	const { width, height, scaleX, scaleY } = target;
	const dStrokeWidth = target.strokeUniform ? 0 : target.strokeWidth;
	const scaleWidth = scaleX * width + dStrokeWidth;
	const sx = (v + scaleWidth) / scaleWidth;
	if (sx == 0) return [];
	if (isScale) {
		target.set("scaleX", scaleX * sx);
		if (isUniform) target.set("scaleY", scaleY * sx);
	} else {
		target.set("width", width * sx);
		if (isUniform) target.set("height", height * sx);
	}
	if (isCenter) target.setRelativeXY(diagonalPoint, "center", "center");
	else {
		const originArr = this.contraryOriginMap;
		target.setRelativeXY(diagonalPoint, ...originArr[corner]);
	}
	target.setCoords();
	return arr.map((target) => ({
		origin: point,
		target
	}));
}
function collectHorizontalPoint(props) {
	const { target, isScale, isUniform, corner, point, diagonalPoint, list, isCenter } = props;
	const { dis, arr } = getDistanceList(point, list, "y");
	if (dis > this.margin / this.canvas.getZoom()) return [];
	let v = arr[arr.length - 1].y - point.y;
	const dirY = corner.includes("t") ? -1 : 1;
	v *= dirY;
	const { width, height, scaleX, scaleY } = target;
	const dStrokeWidth = target.strokeUniform ? 0 : target.strokeWidth;
	const scaleHeight = scaleY * height + dStrokeWidth;
	const sy = (v + scaleHeight) / scaleHeight;
	if (sy == 0) return [];
	if (isScale) {
		target.set("scaleY", scaleY * sy);
		if (isUniform) target.set("scaleX", scaleX * sy);
	} else {
		target.set("height", height * sy);
		if (isUniform) target.set("width", width * sy);
	}
	if (isCenter) target.setRelativeXY(diagonalPoint, "center", "center");
	else {
		const originArr = this.contraryOriginMap;
		target.setRelativeXY(diagonalPoint, ...originArr[corner]);
	}
	target.setCoords();
	return arr.map((target) => ({
		origin: point,
		target
	}));
}
//#endregion
export { collectHorizontalPoint, collectVerticalPoint };

//# sourceMappingURL=collect-point.mjs.map