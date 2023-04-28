import { useEffect, useRef, Suspense, useMemo, useState } from 'react';
import { Canvas, useThree, useFrame, extend } from '@react-three/fiber';
import {
  MeshTransmissionMaterial,
  Environment,
  OrbitControls,
  Float,
  RoundedBox,
  Torus,
  Cone,
  useTexture,
  RenderTexture,
  PerspectiveCamera,
  ScreenQuad
} from '@react-three/drei'
import { EffectComposer, SMAA, } from '@react-three/postprocessing';
import { useControls, Leva } from 'leva'
import { Vector2, Vector3, WebGLRenderTarget, Color, RGBAFormat, ShaderMaterial, UnsignedByteType, FloatType } from 'three';
import { useSpring, animated } from '@react-spring/three';
import ENV_REFRACT from '../assets/Refract_Small.hdr'
import RefractPostEffect from './post';
import { Perf } from 'r3f-perf';

import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';



export default function Refract() {

  return (

    <div id="canvas-container" style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 0, 9.5], far: 50, }} renderer={{ alpha: true }} >
        <Suspense>
          <ambientLight layers={[0]} />
          <Scene />
        </Suspense>

        <Perf />
      </Canvas>
    </div>

  )
}

export function Scene({ }) {
  const config = useControls({
    meshPhysicalMaterial: false,
    transmissionSampler: false,
    //backside: true,
    //samples: { value: 10, min: 1, max: 32, step: 1 },
    //resolution: { value: 32, min: 256, max: 2048, step: 256 },
    transmission: { value: 1, min: 0, max: 1 },
    roughness: { value: 0.2, min: 0, max: 1, step: 0.01 },
    thickness: { value: .97, min: 0, max: 10, step: 0.01 },
    ior: { value: 1.3, min: 1, max: 5, step: 0.01 },
    chromaticAberration: { value: 0.8, min: 0, max: 1 },
    anisotropy: { value: 0.1, min: 0, max: 1, step: 0.01 },
    distortion: { value: 0.1, min: 0, max: 1, step: 0.01 },
    distortionScale: { value: 0.1, min: 0.01, max: 1, step: 0.01 },
    temporalDistortion: { value: 0.5, min: 0, max: 1, step: 0.01 },
    clearcoat: { value: 1, min: 0, max: 1 },
    attenuationDistance: { value: 10., min: 0, max: 10, step: 0.01 },
    attenuationColor: '#ffffff',
    color: '#ffffff',

  })

  const { viewport, gl, size, camera, scene } = useThree()

  const pixelRatio = gl.getPixelRatio()
  const composerRef = useRef()

  const cam2RenderTarget = useMemo(() => {
    const renderTarget = new WebGLRenderTarget(size.width, size.height, { format: RGBAFormat })
    return renderTarget;
  }, [])

  useEffect(() => {
    const handleResize = () => {
      const newWidth = gl.domElement.clientWidth
      const newHeight = gl.domElement.clientHeight

      cam2RenderTarget.setSize(newWidth, newHeight)
    };

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    };
  }, [cam2RenderTarget, gl])


  const secondCamera = useRef()

  const textRef = useRef()

  const scale = Math.min(1, size.width / 16)

  const orbitControlsRef = useRef()
  const startTimeRef = useRef(Date.now())

  const originalBackground = useRef(scene.background)
  const clearColor = new Color(0x000000)


  useEffect(() => {
    if (textRef.current) {
      textRef.current.traverse((child) => {
        if (child.isObject3D) {
          child.layers.set(0)
          child.layers.enable(1)
        }
      })
    }
  }, [textRef])


  useEffect(() => {
    if (!camera) return
    camera.layers.enable(0)

    secondCamera.current = camera.clone()
    secondCamera.current.layers.set(1)
  }, [camera])


  useFrame(() => {


    if (!secondCamera.current) return
    originalBackground.current = scene.background;
    scene.background = null;
    gl.setClearColor(clearColor, 0)

    gl.setRenderTarget(cam2RenderTarget);
    gl.clear()
    gl.render(scene, secondCamera.current);
    gl.setRenderTarget(null);
    scene.background = originalBackground.current

    gl.setClearColor(clearColor, 0)
  })

  useFrame(() => {

    if (orbitControlsRef.current) {
      const elapsedTime = (Date.now() - startTimeRef.current) / 1000;

      if (elapsedTime <= 4) {
        const easedProgress = easeInOutQuad((elapsedTime / 4) % 1);

        const initialPolarAngle = Math.PI / 2.1;
        const targetPolarAngle = initialPolarAngle + 0.04 * Math.sin(easedProgress * Math.PI * 2);
        orbitControlsRef.current.setPolarAngle(targetPolarAngle);

        const initialAzimuthalAngle = 0;
        const targetAzimuthalAngle = initialAzimuthalAngle + 0.05 * Math.sin(easedProgress * Math.PI * 2);
        orbitControlsRef.current.setAzimuthalAngle(targetAzimuthalAngle);

        orbitControlsRef.current.update();
      } else {
        //orbitControlsRef.current.reset();
      }
    }


  })

  useEffect(() => {
    updateObjectPosition(camera, textRef.current, gl)

    const handleResize = () => {
      updateObjectPosition(camera, textRef.current, gl)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [camera, textRef, gl])


  function updateObjectPosition(camera, object, renderer) {
    // const topLeftOffset = new Vector2(60, 120) // Adjust these values to control the position relative to the top-left corner (in pixels)

    //const xOffset = 60
    const screenHeight = renderer.domElement.clientHeight
    const screenWidth = renderer.domElement.clientWidth
    const yOffset = screenHeight >= 900 ? 160 : 30 + (screenHeight - 375) * (130 / (900 - 375))
    const xOffset = screenWidth >= 900 ? 60 : 20 + (screenWidth - 375) * (40 / (900 - 375))
    const topLeftOffset = new Vector2(xOffset, yOffset)

    // Calculate the screen space position
    const screenPosition = new Vector2(-1, 1)
    screenPosition.x += (topLeftOffset.x / renderer.domElement.clientWidth) * 2
    screenPosition.y -= (topLeftOffset.y / renderer.domElement.clientHeight) * 2

    // Calculate the world position
    const worldPosition = new Vector3(screenPosition.x, screenPosition.y, 0.5)
    worldPosition.unproject(camera);

    const direction = worldPosition.sub(camera.position).normalize()
    const finalPosition = camera.position.clone().add(direction.multiplyScalar(10))

    // Update the object's position
    object.position.copy(finalPosition)
  }

  config.scale = scale

  const aspect = size.width / size.height;
  const scaleX = aspect > 1 ? aspect : 1;
  const scaleY = aspect > 1 ? 1 : 1 / aspect;

  return (
    <>
      <OrbitControls
        camera={secondCamera.current}
        enableZoom={false}
        enablePan={false}
        enableDamping={true}
        dampingFactor={.8}
        minPolarAngle={Math.PI / 2.4}
        maxPolarAngle={Math.PI / 1.9}
        minAzimuthAngle={-Math.PI / 20}
        maxAzimuthAngle={Math.PI / 16}
        makeDefault
        ref={orbitControlsRef} />
      {/* goofy remember to remove Leva when usin controls */}
      <Leva hidden />

      <Environment

        layers={[0]}
        files={ENV_REFRACT}
        toneMapped={false}
        background={true}

      />


      <group ref={textRef} >
        <Float floatingRange={[-.7, 1.8]} layers={[0, 1]}>
          <SpinningTorus config={config} position={[2.2 * scale, -2.5 * scale, -2.4 * scale]} />
        </Float>

        <Float speed={1.1} floatingRange={[-.3, 1.3]} layers={[0, 1]} >
          <SpinningBox config={config} position={[6.85 * scale, -.9 * scale, -2.7 * scale]} />
        </Float>

        <Float floatingRange={[-1., 2.]} layers={[0, 1]} >
          <Pyramid config={config} position={[11 * scale, -2 * scale, 1.3 * scale]} />
        </Float>
      </group >

      <ScreenQuad >
        <meshBasicMaterial map={cam2RenderTarget} />
      </ScreenQuad>


      {/* <EffectComposer multisampling={2} >
        <RefractPostEffect cam2RenderTarget={cam2RenderTarget} resolution={new Vector2(size.width, size.height)} />
        <SMAA />
      </EffectComposer> */}
    </>
  )
}

const AnimatedTorus = animated(Torus);

function SpinningTorus(props,) {
  const spinAnimation = useSpring({
    rotation: [0, Math.PI * 2, 0],
    from: { rotation: [0, 0, 0] },
    config: { duration: 20000, },
    loop: { reverse: false, reset: true }, // Loop the animation forever
  })

  return (
    <AnimatedTorus
      args={[1, 0.4, 16, 40]}
      position={props.position}
      {...spinAnimation}
      scale={1 * props.config.scale}
    >
      <MeshTransmissionMaterial  {...props.config} toneMapped={false} >
        <Torus />
      </MeshTransmissionMaterial>
    </AnimatedTorus>
  );
}

const AnimatedRoundedBox = animated(RoundedBox);

function SpinningBox(props) {
  const spinAnimation = useSpring({
    rotation: [Math.PI * 4, 0, Math.PI * 4],
    from: { rotation: [0, 0, 0] },
    config: { duration: 25000, },
    loop: { reverse: false, reset: true }, // Loop the animation forever
  })

  return (
    <AnimatedRoundedBox {...spinAnimation} castShadow position={props.position} smoothness={5} radius={0.2}>
      <MeshTransmissionMaterial  {...props.config} toneMapped={false} />
    </AnimatedRoundedBox>
  );
}

function Pyramid(props) {
  const height = 2
  const sides = 4
  const coneHeight = height / 2
  const coneRadius = 0.5
  const coneSegments = 32
  const deltaRadius = coneRadius / coneSegments

  const vertices = []
  for (let i = 0; i < coneSegments; i++) {
    const radius = coneRadius - deltaRadius * i
    const angle = (i / coneSegments) * Math.PI * 2
    vertices.push(radius * Math.sin(angle), -coneHeight, radius * Math.cos(angle))
  }
  vertices.push(0, coneHeight, 0)

  return (
    <Cone
      args={[0.5, 1, coneSegments, 4]}
      vertices={vertices}
      position={props.position}
      scale={1.2}
      rotation={[Math.PI / 3, 0, Math.PI / 4]}>
      <MeshTransmissionMaterial  {...props.config} toneMapped={false} />
    </Cone>
  )
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}