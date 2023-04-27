import { forwardRef } from 'react';
import { FXAAEffect, BlendFunction } from 'postprocessing'


const CustomFXAAEffect = forwardRef((_, ref) => {
  const fxaaEffect = new FXAAEffect()
  fxaaEffect.blendMode.setBlendFunction(BlendFunction.ALPHA);

  return <primitive ref={ref} object={fxaaEffect} />;
});

export default CustomFXAAEffect;
