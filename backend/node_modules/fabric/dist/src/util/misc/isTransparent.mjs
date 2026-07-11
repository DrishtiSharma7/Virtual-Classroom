//#region src/util/misc/isTransparent.ts
/**
* Returns true if context has transparent pixel
* at specified location (taking tolerance into account)
* @param {CanvasRenderingContext2D} ctx context
* @param {Number} x x coordinate in canvasElementCoordinate, not fabric space. integer
* @param {Number} y y coordinate in canvasElementCoordinate, not fabric space. integer
* @param {Number} tolerance Tolerance pixels around the point, not alpha tolerance, integer
* @return {boolean} true if transparent
*/
const isTransparent = (ctx, x, y, tolerance) => {
	tolerance = Math.round(tolerance);
	const size = tolerance * 2 + 1;
	const { data } = ctx.getImageData(x - tolerance, y - tolerance, size, size);
	for (let i = 3; i < data.length; i += 4) if (data[i] > 0) return false;
	return true;
};
//#endregion
export { isTransparent };

//# sourceMappingURL=isTransparent.mjs.map