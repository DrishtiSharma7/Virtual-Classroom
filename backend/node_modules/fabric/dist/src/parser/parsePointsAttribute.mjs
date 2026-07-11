//#region src/parser/parsePointsAttribute.ts
/**
* Parses "points" attribute, returning an array of values
* @param {String} points points attribute string
* @return {Array} array of points
*/
function parsePointsAttribute(points) {
	if (!points) return [];
	const pointsSplit = points.replace(/,/g, " ").trim().split(/\s+/);
	const parsedPoints = [];
	for (let i = 0; i < pointsSplit.length; i += 2) parsedPoints.push({
		x: parseFloat(pointsSplit[i]),
		y: parseFloat(pointsSplit[i + 1])
	});
	return parsedPoints;
}
//#endregion
export { parsePointsAttribute };

//# sourceMappingURL=parsePointsAttribute.mjs.map