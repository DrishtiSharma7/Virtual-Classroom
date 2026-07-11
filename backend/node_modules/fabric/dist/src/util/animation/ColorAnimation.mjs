import { halfPI } from "../../constants.mjs";
import { Color } from "../../color/Color.mjs";
import { capValue } from "../misc/capValue.mjs";
import { AnimationBase } from "./AnimationBase.mjs";
//#region src/util/animation/ColorAnimation.ts
const defaultColorEasing = (timeElapsed, startValue, byValue, duration) => {
	return startValue + byValue * (1 - Math.cos(timeElapsed / duration * halfPI));
};
const wrapColorCallback = (callback) => callback && ((rgba, valueProgress, durationProgress) => callback(new Color(rgba).toRgba(), valueProgress, durationProgress));
var ColorAnimation = class extends AnimationBase {
	constructor({ startValue, endValue, easing = defaultColorEasing, onChange, onComplete, abort, ...options }) {
		const startColor = new Color(startValue).getSource();
		const endColor = new Color(endValue).getSource();
		super({
			...options,
			startValue: startColor,
			byValue: endColor.map((value, i) => value - startColor[i]),
			easing,
			onChange: wrapColorCallback(onChange),
			onComplete: wrapColorCallback(onComplete),
			abort: wrapColorCallback(abort)
		});
	}
	calculate(timeElapsed) {
		const [r, g, b, a] = this.startValue.map((value, i) => this.easing(timeElapsed, value, this.byValue[i], this.duration, i));
		const value = [...[
			r,
			g,
			b
		].map(Math.round), capValue(0, a, 1)];
		return {
			value,
			valueProgress: value.map((p, i) => this.byValue[i] !== 0 ? Math.abs((p - this.startValue[i]) / this.byValue[i]) : 0).find((p) => p !== 0) || 0
		};
	}
};
//#endregion
export { ColorAnimation };

//# sourceMappingURL=ColorAnimation.mjs.map