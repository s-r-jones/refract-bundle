import { forwardRef, useMemo } from 'react'
import { Uniform } from 'three'
import { Effect } from 'postprocessing'

const fragmentShader = /*glsl*/`
  uniform mediump sampler2D map;
  uniform vec2 resolution;
  // FXAA parameters
  #define FXAA_REDUCE_MIN   (1.0/2.0)
  #define FXAA_REDUCE_MUL   (1.0/1.)
  #define FXAA_SPAN_MAX     20


  void texcoords(vec2 fragCoord, vec2 resolution,
    out vec2 v_rgbNW, out vec2 v_rgbNE,
    out vec2 v_rgbSW, out vec2 v_rgbSE,
    out vec2 v_rgbM) {
    vec2 inverseVP = 1.0 / resolution.xy;
    v_rgbNW = (fragCoord + vec2(-1.0, -1.0)) * inverseVP;
    v_rgbNE = (fragCoord + vec2(1.0, -1.0)) * inverseVP;
    v_rgbSW = (fragCoord + vec2(-1.0, 1.0)) * inverseVP;
    v_rgbSE = (fragCoord + vec2(1.0, 1.0)) * inverseVP;
    v_rgbM = vec2(fragCoord * inverseVP);
    }
      
    float luma(vec3 rgb) {
      const vec3 lumaCoeff = vec3(0.299, 0.587, 0.114);
      return dot(rgb, lumaCoeff);
  }
    
      vec4 fxaa(sampler2D tex, vec2 fragCoord, vec2 resolution,
        vec2 v_rgbNW, vec2 v_rgbNE, 
        vec2 v_rgbSW, vec2 v_rgbSE, 
        vec2 v_rgbM) {
    vec4 color;
    mediump vec2 inverseVP = vec2(1.0 / resolution.x, 1.0 / resolution.y);
    vec3 rgbNW = texture2D(tex, v_rgbNW).xyz;
    vec3 rgbNE = texture2D(tex, v_rgbNE).xyz;
    vec3 rgbSW = texture2D(tex, v_rgbSW).xyz;
    vec3 rgbSE = texture2D(tex, v_rgbSE).xyz;
    vec4 texColor = texture2D(tex, v_rgbM);
    vec3 rgbM  = texColor.xyz;
    vec3 luma = vec3(0.299, 0.587, 0.114);
    float lumaNW = dot(rgbNW, luma);
    float lumaNE = dot(rgbNE, luma);
    float lumaSW = dot(rgbSW, luma);
    float lumaSE = dot(rgbSE, luma);
    float lumaM  = dot(rgbM,  luma);
    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));

    mediump vec2 dir;
    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
    dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));

    float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) *
                      (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);

    float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
    dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX),
          max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),
          dir * rcpDirMin)) * inverseVP;

    vec3 rgbA = 0.5 * (
    texture2D(tex, fragCoord * inverseVP + dir * (1.0 / 3.0 - 0.5)).xyz +
    texture2D(tex, fragCoord * inverseVP + dir * (2.0 / 3.0 - 0.5)).xyz);
    vec3 rgbB = rgbA * 0.5 + 0.25 * (
    texture2D(tex, fragCoord * inverseVP + dir * -0.5).xyz +
    texture2D(tex, fragCoord * inverseVP + dir * 0.5).xyz);

    float lumaB = dot(rgbB, luma);
    if ((lumaB < lumaMin) || (lumaB > lumaMax))
    color = vec4(rgbA, texColor.a);
    else
    color = vec4(rgbB, texColor.a);
    return color;
    }


  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor)
  {
    vec4 cam2 = texture2D(map, uv);
    // float test = cam2.a;


    mediump vec2 v_rgbNW;
    mediump vec2 v_rgbNE;
    mediump vec2 v_rgbSW;
    mediump vec2 v_rgbSE;
    mediump vec2 v_rgbM;
    mediump vec2 fragCoord = uv * resolution;
    //compute the texture coords
    texcoords(fragCoord, resolution, v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);

    //compute FXAA
    outputColor = fxaa(map, fragCoord, resolution, v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);
    //outputColor = cam2;
   // outputColor = applyFXAA(uv);
  }
`


// Effect implementation
class RefractEffect extends Effect {
  constructor({ map, resolution }) {
    super(
      'RefractEffect',
      fragmentShader,
      {
        uniforms: new Map([
          ['map', new Uniform(map.texture)],
          ['resolution', new Uniform(resolution)],
        ])
      }
    )
  }
}

// Effect component
export default forwardRef(function ({ cam2RenderTarget, resolution }, ref) {
  console.log(resolution)
  const refractEffect = new RefractEffect({ map: cam2RenderTarget, resolution })

  return <primitive ref={ref} object={refractEffect} />
})

