const e=`precision highp float`,t=`\n    ${e};\n    varying vec2 vTexCoord;\n    uniform sampler2D uTexture;\n    void main() {\n      gl_FragColor = texture2D(uTexture, vTexCoord);\n    }`,n=`
    attribute vec2 aPosition;
    varying vec2 vTexCoord;
    void main() {
      vTexCoord = aPosition;
      gl_Position = vec4(aPosition * 2.0 - 1.0, 0.0, 1.0);
    }`;export{e as highPsourceCode,t as identityFragmentShader,n as vertexSource};
//# sourceMappingURL=baseFilter.min.mjs.map