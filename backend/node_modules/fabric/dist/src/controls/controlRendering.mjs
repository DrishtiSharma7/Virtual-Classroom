import { twoMathPi } from "../constants.mjs";
//#region src/controls/controlRendering.ts
/**
* Render a round control, as per fabric features.
* This function is written to respect object properties like transparentCorners, cornerSize
* cornerColor, cornerStrokeColor
* plus the addition of offsetY and offsetX.
* @param {CanvasRenderingContext2D} ctx context to render on
* @param {Number} left x coordinate where the control center should be
* @param {Number} top y coordinate where the control center should be
* @param {Object} styleOverride override for FabricObject controls style
* @param {FabricObject} fabricObject the fabric object for which we are rendering controls
*/
function renderCircleControl(ctx, left, top, styleOverride, fabricObject) {
	ctx.save();
	const { stroke, xSize, ySize, opName } = this.commonRenderProps(ctx, left, top, fabricObject, styleOverride);
	let size = xSize;
	if (xSize > ySize) ctx.scale(1, ySize / xSize);
	else if (ySize > xSize) {
		size = ySize;
		ctx.scale(xSize / ySize, 1);
	}
	ctx.beginPath();
	ctx.arc(0, 0, size / 2, 0, twoMathPi, false);
	ctx[opName]();
	if (stroke) ctx.stroke();
	ctx.restore();
}
/**
* Render a square control, as per fabric features.
* This function is written to respect object properties like transparentCorners, cornerSize
* cornerColor, cornerStrokeColor
* plus the addition of offsetY and offsetX.
* @param {CanvasRenderingContext2D} ctx context to render on
* @param {Number} left x coordinate where the control center should be
* @param {Number} top y coordinate where the control center should be
* @param {Object} styleOverride override for FabricObject controls style
* @param {FabricObject} fabricObject the fabric object for which we are rendering controls
*/
function renderSquareControl(ctx, left, top, styleOverride, fabricObject) {
	ctx.save();
	const { stroke, xSize, ySize, opName } = this.commonRenderProps(ctx, left, top, fabricObject, styleOverride), xSizeBy2 = xSize / 2, ySizeBy2 = ySize / 2;
	ctx[`${opName}Rect`](-xSizeBy2, -ySizeBy2, xSize, ySize);
	if (stroke) ctx.strokeRect(-xSizeBy2, -ySizeBy2, xSize, ySize);
	ctx.restore();
}
//#endregion
export { renderCircleControl, renderSquareControl };

//# sourceMappingURL=controlRendering.mjs.map