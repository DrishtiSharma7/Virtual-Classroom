import { AnimationBase } from "./AnimationBase.mjs";
//#region src/util/animation/ArrayAnimation.ts
var ArrayAnimation = class extends AnimationBase {
	constructor({ startValue = [0], endValue = [100], ...options }) {
		super({
			...options,
			startValue,
			byValue: endValue.map((value, i) => value - startValue[i])
		});
	}
	calculate(timeElapsed) {
		const values = this.startValue.map((value, i) => this.easing(timeElapsed, value, this.byValue[i], this.duration, i));
		return {
			value: values,
			valueProgress: Math.abs((values[0] - this.startValue[0]) / this.byValue[0])
		};
	}
};
//#endregion
export { ArrayAnimation };

//# sourceMappingURL=ArrayAnimation.mjs.map