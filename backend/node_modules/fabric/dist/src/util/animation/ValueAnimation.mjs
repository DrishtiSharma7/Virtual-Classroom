import { AnimationBase } from "./AnimationBase.mjs";
//#region src/util/animation/ValueAnimation.ts
var ValueAnimation = class extends AnimationBase {
	constructor({ startValue = 0, endValue = 100, ...otherOptions }) {
		super({
			...otherOptions,
			startValue,
			byValue: endValue - startValue
		});
	}
	calculate(timeElapsed) {
		const value = this.easing(timeElapsed, this.startValue, this.byValue, this.duration);
		return {
			value,
			valueProgress: Math.abs((value - this.startValue) / this.byValue)
		};
	}
};
//#endregion
export { ValueAnimation };

//# sourceMappingURL=ValueAnimation.mjs.map