//#region src/filters/shaders/baseFilter.ts
const highPsourceCode = `precision highp float`;
const identityFragmentShader = `
    ${highPsourceCode};
    varying vec2 vTexCoord;
    uniform sampler2D uTexture;
    void main() {
      gl_FragColor = texture2D(uTexture, vTexCoord);
    }`;
const vertexSource = `
    attribute vec2 aPosition;
    varying vec2 vTexCoord;
    void main() {
      vTexCoord = aPosition;
      gl_Position = vec4(aPosition * 2.0 - 1.0, 0.0, 1.0);
    }`;
//#endregion
export { highPsourceCode, identityFragmentShader, vertexSource };

//# sourceMappingURL=baseFilter.mjs.map