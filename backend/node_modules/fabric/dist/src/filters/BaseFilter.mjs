import { _defineProperty } from "../../_virtual/_@oxc-project_runtime@0.126.0/helpers/defineProperty.mjs";
import { FabricError } from "../util/internals/console.mjs";
import { getEnv } from "../env/index.mjs";
import { createCanvasElementFor } from "../util/misc/dom.mjs";
import { isWebGLPipelineState } from "./utils.mjs";
import { highPsourceCode, identityFragmentShader, vertexSource } from "./shaders/baseFilter.mjs";
//#region src/filters/BaseFilter.ts
const regex = new RegExp(highPsourceCode, "g");
var BaseFilter = class {
	/**
	* Filter type
	*/
	get type() {
		return this.constructor.type;
	}
	/**
	* Constructor
	* @param {Object} [options] Options object
	*/
	constructor({ type, ...options } = {}) {
		Object.assign(this, this.constructor.defaults, options);
	}
	getFragmentSource() {
		return identityFragmentShader;
	}
	getVertexSource() {
		return vertexSource;
	}
	/**
	* Compile this filter's shader program.
	*
	* @param {WebGLRenderingContext} gl The GL canvas context to use for shader compilation.
	* @param {String} fragmentSource fragmentShader source for compilation
	* @param {String} vertexSource vertexShader source for compilation
	*/
	createProgram(gl, fragmentSource = this.getFragmentSource(), vertexSource = this.getVertexSource()) {
		const { WebGLProbe: { GLPrecision = "highp" } } = getEnv();
		if (GLPrecision !== "highp") fragmentSource = fragmentSource.replace(regex, highPsourceCode.replace("highp", GLPrecision));
		const vertexShader = gl.createShader(gl.VERTEX_SHADER);
		const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
		const program = gl.createProgram();
		if (!vertexShader || !fragmentShader || !program) throw new FabricError("Vertex, fragment shader or program creation error");
		gl.shaderSource(vertexShader, vertexSource);
		gl.compileShader(vertexShader);
		if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) throw new FabricError(`Vertex shader compile error for ${this.type}: ${gl.getShaderInfoLog(vertexShader)}`);
		gl.shaderSource(fragmentShader, fragmentSource);
		gl.compileShader(fragmentShader);
		if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) throw new FabricError(`Fragment shader compile error for ${this.type}: ${gl.getShaderInfoLog(fragmentShader)}`);
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new FabricError(`Shader link error for "${this.type}" ${gl.getProgramInfoLog(program)}`);
		const uniformLocations = this.getUniformLocations(gl, program) || {};
		uniformLocations.uStepW = gl.getUniformLocation(program, "uStepW");
		uniformLocations.uStepH = gl.getUniformLocation(program, "uStepH");
		return {
			program,
			attributeLocations: this.getAttributeLocations(gl, program),
			uniformLocations
		};
	}
	/**
	* Return a map of attribute names to WebGLAttributeLocation objects.
	*
	* @param {WebGLRenderingContext} gl The canvas context used to compile the shader program.
	* @param {WebGLShaderProgram} program The shader program from which to take attribute locations.
	* @returns {Object} A map of attribute names to attribute locations.
	*/
	getAttributeLocations(gl, program) {
		return { aPosition: gl.getAttribLocation(program, "aPosition") };
	}
	/**
	* Return a map of uniform names to WebGLUniformLocation objects.
	*
	* @param {WebGLRenderingContext} gl The canvas context used to compile the shader program.
	* @param {WebGLShaderProgram} program The shader program from which to take uniform locations.
	* @returns {Object} A map of uniform names to uniform locations.
	*/
	getUniformLocations(gl, program) {
		const locations = this.constructor.uniformLocations;
		const uniformLocations = {};
		for (let i = 0; i < locations.length; i++) uniformLocations[locations[i]] = gl.getUniformLocation(program, locations[i]);
		return uniformLocations;
	}
	/**
	* Send attribute data from this filter to its shader program on the GPU.
	*
	* @param {WebGLRenderingContext} gl The canvas context used to compile the shader program.
	* @param {Object} attributeLocations A map of shader attribute names to their locations.
	*/
	sendAttributeData(gl, attributeLocations, aPositionData) {
		const attributeLocation = attributeLocations.aPosition;
		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.enableVertexAttribArray(attributeLocation);
		gl.vertexAttribPointer(attributeLocation, 2, gl.FLOAT, false, 0, 0);
		gl.bufferData(gl.ARRAY_BUFFER, aPositionData, gl.STATIC_DRAW);
	}
	_setupFrameBuffer(options) {
		const gl = options.context;
		if (options.passes > 1) {
			const width = options.destinationWidth;
			const height = options.destinationHeight;
			if (options.sourceWidth !== width || options.sourceHeight !== height) {
				gl.deleteTexture(options.targetTexture);
				options.targetTexture = options.filterBackend.createTexture(gl, width, height);
			}
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, options.targetTexture, 0);
		} else {
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.finish();
		}
	}
	_swapTextures(options) {
		options.passes--;
		options.pass++;
		const temp = options.targetTexture;
		options.targetTexture = options.sourceTexture;
		options.sourceTexture = temp;
	}
	/**
	* Generic isNeutral implementation for one parameter based filters.
	* Used only in image applyFilters to discard filters that will not have an effect
	* on the image
	* Other filters may need their own version ( ColorMatrix, HueRotation, gamma, ComposedFilter )
	* @param {Object} options
	**/
	isNeutralState(options) {
		return false;
	}
	/**
	* Apply this filter to the input image data provided.
	*
	* Determines whether to use WebGL or Canvas2D based on the options.webgl flag.
	*
	* @param {Object} options
	* @param {Number} options.passes The number of filters remaining to be executed
	* @param {Boolean} options.webgl Whether to use webgl to render the filter.
	* @param {WebGLTexture} options.sourceTexture The texture setup as the source to be filtered.
	* @param {WebGLTexture} options.targetTexture The texture where filtered output should be drawn.
	* @param {WebGLRenderingContext} options.context The GL context used for rendering.
	* @param {Object} options.programCache A map of compiled shader programs, keyed by filter type.
	*/
	applyTo(options) {
		if (isWebGLPipelineState(options)) {
			this._setupFrameBuffer(options);
			this.applyToWebGL(options);
			this._swapTextures(options);
		} else this.applyTo2d(options);
	}
	applyTo2d(_options) {}
	/**
	* Returns a string that represent the current selected shader code for the filter.
	* Used to force recompilation when parameters change or to retrieve the shader from cache
	* @type string
	**/
	getCacheKey() {
		return this.type;
	}
	/**
	* Retrieves the cached shader.
	* @param {Object} options
	* @param {WebGLRenderingContext} options.context The GL context used for rendering.
	* @param {Object} options.programCache A map of compiled shader programs, keyed by filter type.
	* @return {WebGLProgram} the compiled program shader
	*/
	retrieveShader(options) {
		const key = this.getCacheKey();
		if (!options.programCache[key]) options.programCache[key] = this.createProgram(options.context);
		return options.programCache[key];
	}
	/**
	* Apply this filter using webgl.
	*
	* @param {Object} options
	* @param {Number} options.passes The number of filters remaining to be executed
	* @param {Boolean} options.webgl Whether to use webgl to render the filter.
	* @param {WebGLTexture} options.originalTexture The texture of the original input image.
	* @param {WebGLTexture} options.sourceTexture The texture setup as the source to be filtered.
	* @param {WebGLTexture} options.targetTexture The texture where filtered output should be drawn.
	* @param {WebGLRenderingContext} options.context The GL context used for rendering.
	* @param {Object} options.programCache A map of compiled shader programs, keyed by filter type.
	*/
	applyToWebGL(options) {
		const gl = options.context;
		const shader = this.retrieveShader(options);
		if (options.pass === 0 && options.originalTexture) gl.bindTexture(gl.TEXTURE_2D, options.originalTexture);
		else gl.bindTexture(gl.TEXTURE_2D, options.sourceTexture);
		gl.useProgram(shader.program);
		this.sendAttributeData(gl, shader.attributeLocations, options.aPosition);
		gl.uniform1f(shader.uniformLocations.uStepW, 1 / options.sourceWidth);
		gl.uniform1f(shader.uniformLocations.uStepH, 1 / options.sourceHeight);
		this.sendUniformData(gl, shader.uniformLocations);
		gl.viewport(0, 0, options.destinationWidth, options.destinationHeight);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}
	bindAdditionalTexture(gl, texture, textureUnit) {
		gl.activeTexture(textureUnit);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.activeTexture(gl.TEXTURE0);
	}
	unbindAdditionalTexture(gl, textureUnit) {
		gl.activeTexture(textureUnit);
		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.activeTexture(gl.TEXTURE0);
	}
	/**
	* Send uniform data from this filter to its shader program on the GPU.
	*
	* Intended to be overridden by subclasses.
	*
	* @param {WebGLRenderingContext} _gl The canvas context used to compile the shader program.
	* @param {Object} _uniformLocations A map of shader uniform names to their locations.
	*/
	sendUniformData(_gl, _uniformLocations) {}
	/**
	* If needed by a 2d filter, this functions can create an helper canvas to be used
	* remember that options.targetCanvas is available for use till end of chain.
	*/
	createHelpLayer(options) {
		if (!options.helpLayer) {
			const { sourceWidth, sourceHeight } = options;
			options.helpLayer = createCanvasElementFor({
				width: sourceWidth,
				height: sourceHeight
			});
		}
	}
	/**
	* Returns object representation of an instance
	* It will automatically export the default values of a filter,
	* stored in the static defaults property.
	* @return {Object} Object representation of an instance
	*/
	toObject() {
		const defaultKeys = Object.keys(this.constructor.defaults || {});
		return {
			type: this.type,
			...defaultKeys.reduce((acc, key) => {
				acc[key] = this[key];
				return acc;
			}, {})
		};
	}
	/**
	* Returns a JSON representation of an instance
	* @return {Object} JSON
	*/
	toJSON() {
		return this.toObject();
	}
	static async fromObject({ type, ...filterOptions }, _options) {
		return new this(filterOptions);
	}
};
_defineProperty(BaseFilter, "type", "BaseFilter");
_defineProperty(BaseFilter, "uniformLocations", []);
//#endregion
export { BaseFilter };

//# sourceMappingURL=BaseFilter.mjs.map