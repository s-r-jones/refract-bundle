import { forwardRef, useMemo } from 'react'
import { Uniform } from 'three'
import { Effect } from 'postprocessing'

const fragmentShader = /*glsl*/`
  uniform mediump sampler2D map; 
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor)
  {
    vec4 cam2 = texture2D(map, uv);
    float test = cam2.a;
    outputColor = cam2;
  }


`


// Effect implementation
class RefractEffect extends Effect {
  constructor({ map }) {
    super(
      'RefractEffect',
      fragmentShader,
      {
        uniforms: new Map([
          ['map', new Uniform(map.texture)]
        ])
      }
    )
  }
}

// Effect component
export default forwardRef(function ({ cam2RenderTarget }, ref) {

  const refractEffect = new RefractEffect({ map: cam2RenderTarget })

  return <primitive ref={ref} object={refractEffect} />
})

