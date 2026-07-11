import { log } from "../../util/internals/console.mjs";
import { GLProbe } from "./GLProbe.mjs";
//#region src/filters/GLProbes/WebGLProbe.ts
/**
* Lazy initialize WebGL constants
*/
var WebGLProbe = class extends GLProbe {
	/**
	* Tests if webgl supports certain precision
	* @param {WebGL} Canvas WebGL context to test on
	* @param {GLPrecision} Precision to test can be any of following
	* @returns {Boolean} Whether the user's browser WebGL supports given precision.
	*/
	testPrecision(gl, precision) {
		const fragmentSource = `precision ${precision} float;\nvoid main(){}`;
		const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
		if (!fragmentShader) return false;
		gl.shaderSource(fragmentShader, fragmentSource);
		gl.compileShader(fragmentShader);
		return !!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);
	}
	/**
	* query browser for WebGL
	*/
	queryWebGL(canvas) {
		const gl = canvas.getContext("webgl");
		if (gl) {
			this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
			this.GLPrecision = [
				"highp",
				"mediump",
				"lowp"
			].find((precision) => this.testPrecision(gl, precision));
			gl.getExtension("WEBGL_lose_context").loseContext();
			log("log", `WebGL: max texture size ${this.maxTextureSize}`);
		}
	}
	isSupported(textureSize) {
		return !!this.maxTextureSize && this.maxTextureSize >= textureSize;
	}
};
//#endregion
export { WebGLProbe };

//# sourceMappingURL=WebGLProbe.mjs.map