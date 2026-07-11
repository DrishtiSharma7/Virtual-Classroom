import { halfPI } from "../../constants.mjs";
//#region src/util/misc/cos.ts
/**
* Calculate the cos of an angle, avoiding returning floats for known results
* This function is here just to avoid getting 0.999999999999999 when dealing
* with numbers that are really 1 or 0.
* @param {TRadian} angle the angle
* @return {Number} the cosin value for angle.
*/
const cos = (angle) => {
	if (angle === 0) return 1;
	switch (Math.abs(angle) / halfPI) {
		case 1:
		case 3: return 0;
		case 2: return -1;
	}
	return Math.cos(angle);
};
//#endregion
export { cos };

//# sourceMappingURL=cos.mjs.map