import { _defineProperty } from "../../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { getFabricWindow } from "../../env/index.mjs";
import { noop } from "../../constants.mjs";
import { runningAnimations } from "./AnimationRegistry.mjs";
import { requestAnimFrame } from "./AnimationFrameProvider.mjs";
import { defaultEasing } from "./easing.mjs";
//#region src/util/animation/AnimationBase.ts
const defaultAbort = () => false;
var AnimationBase = class {
	constructor({ startValue, byValue, duration = 500, delay = 0, easing = defaultEasing, onStart = noop, onChange = noop, onComplete = noop, abort = defaultAbort, target }) {
		_defineProperty(this, "_state", "pending");
		_defineProperty(
			this,
			/**
			* Time %, or the ratio of `timeElapsed / duration`
			* @see tick
			*/
			"durationProgress",
			0
		);
		_defineProperty(
			this,
			/**
			* Value %, or the ratio of `(currentValue - startValue) / (endValue - startValue)`
			*/
			"valueProgress",
			0
		);
		this.tick = this.tick.bind(this);
		this.duration = duration;
		this.delay = delay;
		this.easing = easing;
		this._onStart = onStart;
		this._onChange = onChange;
		this._onComplete = onComplete;
		this._abort = abort;
		this.target = target;
		this.startValue = startValue;
		this.byValue = byValue;
		this.value = this.startValue;
		this.endValue = Object.freeze(this.calculate(this.duration).value);
	}
	get state() {
		return this._state;
	}
	isDone() {
		return this._state === "aborted" || this._state === "completed";
	}
	start() {
		const firstTick = (timestamp) => {
			if (this._state !== "pending") return;
			this.startTime = timestamp || +/* @__PURE__ */ new Date();
			this._state = "running";
			this._onStart();
			this.tick(this.startTime);
		};
		this.register();
		if (this.delay > 0) this.timeout = getFabricWindow().setTimeout(() => requestAnimFrame(firstTick), this.delay);
		else requestAnimFrame(firstTick);
	}
	tick(t) {
		const durationMs = (t || +/* @__PURE__ */ new Date()) - this.startTime;
		const boundDurationMs = Math.min(durationMs, this.duration);
		this.durationProgress = boundDurationMs / this.duration;
		const { value, valueProgress } = this.calculate(boundDurationMs);
		this.value = Object.freeze(value);
		this.valueProgress = valueProgress;
		if (this._state === "aborted") return;
		else if (this._abort(this.value, this.valueProgress, this.durationProgress)) {
			this._state = "aborted";
			this.unregister();
		} else if (durationMs >= this.duration) {
			this.durationProgress = this.valueProgress = 1;
			this._onChange(this.endValue, this.valueProgress, this.durationProgress);
			this._state = "completed";
			this._onComplete(this.endValue, this.valueProgress, this.durationProgress);
			this.unregister();
			this.timeout = null;
		} else {
			this._onChange(this.value, this.valueProgress, this.durationProgress);
			requestAnimFrame(this.tick);
		}
	}
	register() {
		runningAnimations.push(this);
	}
	unregister() {
		runningAnimations.remove(this);
	}
	abort() {
		this._state = "aborted";
		this.unregister();
		this.timeout && getFabricWindow().clearTimeout(this.timeout);
	}
};
//#endregion
export { AnimationBase };

//# sourceMappingURL=AnimationBase.mjs.map