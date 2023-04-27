import { forwardRef } from 'react';
import { Uniform } from 'three';
import { Effect, FXAAEffect, BlendMode, BlendFunction } from 'postprocessing';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
console.log(FXAAShader.fragmentShader)




export default forwardRef(function ({ blendFunction }, ref) {
  const fxaaEffect = new FXAAEffect({ blendFunction: BlendFunction.ALPHA });

  return <primitive ref={ref} object={fxaaEffect} />;
});
