//#region src/filters/shaders/brightness.ts
const fragmentSource = `
  precision highp float;
  uniform sampler2D uTexture;
  uniform float uBrightness;
  varying vec2 vTexCoord;
  void main() {
    vec4 color = texture2D(uTexture, vTexCoord);
    color.rgb += uBrightness;
    gl_FragColor = color;
  }
`;
//#endregion
export { fragmentSource };

//# sourceMappingURL=brightness.mjs.map