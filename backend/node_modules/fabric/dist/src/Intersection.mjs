import { Point } from "./Point.mjs";
import { createVector } from "./util/misc/vectors.mjs";
//#region src/Intersection.ts
var Intersection = class Intersection {
	constructor(status) {
		this.status = status;
		this.points = [];
	}
	/**
	* Used to verify if a point is alredy in the collection
	* @param {Point} point
	* @returns {boolean}
	*/
	includes(point) {
		return this.points.some((p) => p.eq(point));
	}
	/**
	* Appends points of intersection
	* @param {...Point[]} points
	* @return {Intersection} thisArg
	*/
	append(...points) {
		this.points = this.points.concat(points.filter((point) => {
			return !this.includes(point);
		}));
		return this;
	}
	/**
	* check if point T is on the segment or line defined between A and B
	*
	* @param {Point} T the point we are checking for
	* @param {Point} A one extremity of the segment
	* @param {Point} B the other extremity of the segment
	* @param [infinite] if true checks if `T` is on the line defined by `A` and `B`
	* @returns true if `T` is contained
	*/
	static isPointContained(T, A, B, infinite = false) {
		if (A.eq(B)) return T.eq(A);
		else if (A.x === B.x) return T.x === A.x && (infinite || T.y >= Math.min(A.y, B.y) && T.y <= Math.max(A.y, B.y));
		else if (A.y === B.y) return T.y === A.y && (infinite || T.x >= Math.min(A.x, B.x) && T.x <= Math.max(A.x, B.x));
		else {
			const AB = createVector(A, B);
			const s = createVector(A, T).divide(AB);
			return infinite ? Math.abs(s.x) === Math.abs(s.y) : s.x === s.y && s.x >= 0 && s.x <= 1;
		}
	}
	/**
	* Use the ray casting algorithm to determine if point is in the polygon defined by points
	* @see https://en.wikipedia.org/wiki/Point_in_polygon
	* @param point
	* @param points polygon points
	* @returns
	*/
	static isPointInPolygon(point, points) {
		const other = new Point(point).setX(Math.min(point.x - 1, ...points.map((p) => p.x)));
		let hits = 0;
		for (let index = 0; index < points.length; index++) {
			const inter = this.intersectSegmentSegment(points[index], points[(index + 1) % points.length], point, other);
			if (inter.includes(point)) return true;
			hits += Number(inter.status === "Intersection");
		}
		return hits % 2 === 1;
	}
	/**
	* Checks if a line intersects another
	* @see {@link https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection line intersection}
	* @see {@link https://en.wikipedia.org/wiki/Cramer%27s_rule Cramer's rule}
	* @param {Point} a1
	* @param {Point} a2
	* @param {Point} b1
	* @param {Point} b2
	* @param {boolean} [aInfinite=true] check segment intersection by passing `false`
	* @param {boolean} [bInfinite=true] check segment intersection by passing `false`
	* @return {Intersection}
	*/
	static intersectLineLine(a1, a2, b1, b2, aInfinite = true, bInfinite = true) {
		const a2xa1x = a2.x - a1.x, a2ya1y = a2.y - a1.y, b2xb1x = b2.x - b1.x, b2yb1y = b2.y - b1.y, a1xb1x = a1.x - b1.x, a1yb1y = a1.y - b1.y, uaT = b2xb1x * a1yb1y - b2yb1y * a1xb1x, ubT = a2xa1x * a1yb1y - a2ya1y * a1xb1x, uB = b2yb1y * a2xa1x - b2xb1x * a2ya1y;
		if (uB !== 0) {
			const ua = uaT / uB, ub = ubT / uB;
			if ((aInfinite || 0 <= ua && ua <= 1) && (bInfinite || 0 <= ub && ub <= 1)) return new Intersection("Intersection").append(new Point(a1.x + ua * a2xa1x, a1.y + ua * a2ya1y));
			else return new Intersection();
		} else if (uaT === 0 || ubT === 0) return new Intersection(aInfinite || bInfinite || Intersection.isPointContained(a1, b1, b2) || Intersection.isPointContained(a2, b1, b2) || Intersection.isPointContained(b1, a1, a2) || Intersection.isPointContained(b2, a1, a2) ? "Coincident" : void 0);
		else return new Intersection("Parallel");
	}
	/**
	* Checks if a segment intersects a line
	* @see {@link intersectLineLine} for line intersection
	* @param {Point} s1 boundary point of segment
	* @param {Point} s2 other boundary point of segment
	* @param {Point} l1 point on line
	* @param {Point} l2 other point on line
	* @return {Intersection}
	*/
	static intersectSegmentLine(s1, s2, l1, l2) {
		return Intersection.intersectLineLine(s1, s2, l1, l2, false, true);
	}
	/**
	* Checks if a segment intersects another
	* @see {@link intersectLineLine} for line intersection
	* @param {Point} a1 boundary point of segment
	* @param {Point} a2 other boundary point of segment
	* @param {Point} b1 boundary point of segment
	* @param {Point} b2 other boundary point of segment
	* @return {Intersection}
	*/
	static intersectSegmentSegment(a1, a2, b1, b2) {
		return Intersection.intersectLineLine(a1, a2, b1, b2, false, false);
	}
	/**
	* Checks if line intersects polygon
	*
	* @todo account for stroke
	*
	* @see {@link intersectSegmentPolygon} for segment intersection
	* @param {Point} a1 point on line
	* @param {Point} a2 other point on line
	* @param {Point[]} points polygon points
	* @param {boolean} [infinite=true] check segment intersection by passing `false`
	* @return {Intersection}
	*/
	static intersectLinePolygon(a1, a2, points, infinite = true) {
		const result = new Intersection();
		const length = points.length;
		for (let i = 0, b1, b2, inter; i < length; i++) {
			b1 = points[i];
			b2 = points[(i + 1) % length];
			inter = Intersection.intersectLineLine(a1, a2, b1, b2, infinite, false);
			if (inter.status === "Coincident") return inter;
			result.append(...inter.points);
		}
		if (result.points.length > 0) result.status = "Intersection";
		return result;
	}
	/**
	* Checks if segment intersects polygon
	* @see {@link intersectLinePolygon} for line intersection
	* @param {Point} a1 boundary point of segment
	* @param {Point} a2 other boundary point of segment
	* @param {Point[]} points polygon points
	* @return {Intersection}
	*/
	static intersectSegmentPolygon(a1, a2, points) {
		return Intersection.intersectLinePolygon(a1, a2, points, false);
	}
	/**
	* Checks if polygon intersects another polygon
	*
	* @todo account for stroke
	*
	* @param {Point[]} points1
	* @param {Point[]} points2
	* @return {Intersection}
	*/
	static intersectPolygonPolygon(points1, points2) {
		const result = new Intersection(), length = points1.length;
		const coincidences = [];
		for (let i = 0; i < length; i++) {
			const a1 = points1[i], a2 = points1[(i + 1) % length], inter = Intersection.intersectSegmentPolygon(a1, a2, points2);
			if (inter.status === "Coincident") {
				coincidences.push(inter);
				result.append(a1, a2);
			} else result.append(...inter.points);
		}
		if (coincidences.length > 0 && coincidences.length === points1.length) return new Intersection("Coincident");
		else if (result.points.length > 0) result.status = "Intersection";
		return result;
	}
	/**
	* Checks if polygon intersects rectangle
	* @see {@link intersectPolygonPolygon} for polygon intersection
	* @param {Point[]} points polygon points
	* @param {Point} r1 top left point of rect
	* @param {Point} r2 bottom right point of rect
	* @return {Intersection}
	*/
	static intersectPolygonRectangle(points, r1, r2) {
		const min = r1.min(r2), max = r1.max(r2), topRight = new Point(max.x, min.y), bottomLeft = new Point(min.x, max.y);
		return Intersection.intersectPolygonPolygon(points, [
			min,
			topRight,
			max,
			bottomLeft
		]);
	}
};
//#endregion
export { Intersection };

//# sourceMappingURL=Intersection.mjs.map