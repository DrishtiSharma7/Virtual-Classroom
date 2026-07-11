import { ValueAnimation } from "./ValueAnimation.mjs";
import { ArrayAnimation } from "./ArrayAnimation.mjs";
import { ColorAnimation } from "./ColorAnimation.mjs";
//#region src/util/animation/animate.ts
const isArrayAnimation = (options) => {
	return Array.isArray(options.startValue) || Array.isArray(options.endValue);
};
function animate(options) {
	const animation = isArrayAnimation(options) ? new ArrayAnimation(options) : new ValueAnimation(options);
	animation.start();
	return animation;
}
function animateColor(options) {
	const animation = new ColorAnimation(options);
	animation.start();
	return animation;
}
//#endregion
export { animate, animateColor };

//# sourceMappingURL=animate.mjs.map