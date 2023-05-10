import { useRef, memo, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import {
  MeshTransmissionMaterial,
  OrbitControls,
  Float,
  RoundedBox,
  Torus,
  Cone,
  Mask,
} from '@react-three/drei'
import { Flex, Box } from '@react-three/flex'
import { useMediaQuery } from 'react-responsive'
import { useControls, Leva } from 'leva'
import { useSpring, animated } from '@react-spring/three';
import { Perf } from 'r3f-perf';
import Quad, { useQuadContext } from './quad'

const MATERIAL_CONFIG = {

  transmissionSampler: false,
  // backside: true,
  //samples: { value: 10, min: 1, max: 32, step: 1 },
  resolution: { value: 512, min: 256, max: 2048, step: 256 },
  transmission: { value: .85, min: 0, max: 1 },
  roughness: { value: 0.08, min: 0, max: 1, step: 0.01 },
  thickness: { value: 2.41, min: 0, max: 10, step: 0.01 },
  ior: { value: 1.04, min: 1, max: 5, step: 0.01 },
  chromaticAberration: { value: 1.0, min: 0, max: 1 },
  anisotropy: { value: .0, min: 0, max: 1, step: 0.01 },
  distortion: { value: 0.23, min: 0, max: 1, step: 0.01 },
  distortionScale: { value: 0.63, min: 0.01, max: 1, step: 0.01 },
  temporalDistortion: { value: 0.3, min: 0, max: 1, step: 0.01 },
  clearcoat: { value: 0, min: 0, max: 1 },
  attenuationDistance: { value: 10., min: 0, max: 10, step: 0.01 },
  attenuationColor: '#ffffff',
  color: '#ffffff',

}


export default function Refract() {

  return (
    <div id="canvas-container" style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 0, 10], far: 20, }}  >
        <Scene />
        <Leva hidden />
      </Canvas>
    </div>

  )
}

function Scene() {

  const config = useControls({

    transmissionSampler: false,
    // backside: true,
    //samples: { value: 10, min: 1, max: 32, step: 1 },
    resolution: { value: 512, min: 256, max: 2048, step: 256 },
    transmission: { value: .85, min: 0, max: 1 },
    roughness: { value: 0.08, min: 0, max: 1, step: 0.01 },
    thickness: { value: 2.41, min: 0, max: 10, step: 0.01 },
    ior: { value: 1.04, min: 1, max: 5, step: 0.01 },
    chromaticAberration: { value: 1.0, min: 0, max: 1 },
    anisotropy: { value: .0, min: 0, max: 1, step: 0.01 },
    distortion: { value: 0.23, min: 0, max: 1, step: 0.01 },
    distortionScale: { value: 0.63, min: 0.01, max: 1, step: 0.01 },
    temporalDistortion: { value: 0.3, min: 0, max: 1, step: 0.01 },
    clearcoat: { value: 0, min: 0, max: 1 },
    attenuationDistance: { value: 10., min: 0, max: 10, step: 0.01 },
    attenuationColor: '#ffffff',
    color: '#ffffff',

  })

  const { size } = useThree()


  const orbitControlsRef = useRef()
  const startTimeRef = useRef(Date.now())

  useFrame(() => {

    if (orbitControlsRef.current) {
      const elapsedTime = (Date.now() - startTimeRef.current) / 1000;

      if (elapsedTime <= 4) {
        const easedProgress = easeInOutQuad((elapsedTime / 4) % 1);

        const initialPolarAngle = Math.PI / 2.1;
        const targetPolarAngle = initialPolarAngle + 0.08 * Math.sin(easedProgress * Math.PI * 2);
        orbitControlsRef.current.setPolarAngle(targetPolarAngle);

        const initialAzimuthalAngle = 0;
        const targetAzimuthalAngle = initialAzimuthalAngle + 0.05 * Math.sin(easedProgress * Math.PI * 2);
        orbitControlsRef.current.setAzimuthalAngle(targetAzimuthalAngle);

        orbitControlsRef.current.update();
      }
    }
  })

  const isTablet = useMediaQuery({ minWidth: 768 })

  return (
    <>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableDamping={true}
        dampingFactor={.05}
        minPolarAngle={-Math.PI / 8}
        maxPolarAngle={Math.PI / 1.6}
        minAzimuthAngle={-Math.PI / 2.5}
        maxAzimuthAngle={Math.PI / 4}
        makeDefault
        ref={orbitControlsRef} />

      <Quad />

      <Flex size={[size.width, size.height, 0]} flexDirection={isTablet ? 'row' : 'column'} position={isTablet ? [0, 0, 4] : [0, 0, 1]} >
        <Mask id={1}>
          <Box marginTop={isTablet ? -2 : -4} marginLeft={isTablet ? 2 : 1}>
            <Float speed={0} floatingRange={[-.3, 1.3]}  >
              <BoxMemo config={config} />
            </Float>
          </Box>
          <Box marginTop={isTablet ? 2 : 2} marginLeft={isTablet ? -4 : -1.5}>
            <Float floatingRange={[-.7, 1.8]} speed={0}>
              <TorusMemo config={config} />
            </Float>
          </Box>
          <Box marginTop={isTablet ? 1.5 : -3} marginLeft={isTablet ? 3.8 : 2.5} >
            <Float floatingRange={[-1., 2.]}  >
              <ConeMemo config={config} />
            </Float>
          </Box>
        </Mask>
      </Flex>
    </>
  )
}

const AnimatedTorus = animated(Torus);

function SpinningTorus(props) {
  const spinAnimation = useSpring({
    rotation: [0, Math.PI * 2, 0],
    from: { rotation: [0, 0, 0] },
    config: { duration: 20000, },
    loop: { reverse: false, reset: true }, // Loop the animation forever
  })

  return (
    <Torus
      args={[1, 0.4, 32, 64]}


    >
      <MeshTransmissionMaterial  {...props.config} toneMapped={false} >

      </MeshTransmissionMaterial>
    </Torus>
  );
}

const TorusMemo = memo(SpinningTorus)

const AnimatedRoundedBox = animated(RoundedBox);

function SpinningBox(props) {
  const spinAnimation = useSpring({
    rotation: [Math.PI * 4, 0, Math.PI * 4],
    from: { rotation: [0, 0, 0] },
    config: { duration: 25000, },
    loop: { reverse: false, reset: true }, // Loop the animation forever
  })
  console.log(MATERIAL_CONFIG)
  return (
    <AnimatedRoundedBox {...spinAnimation} castShadow smoothness={4} radius={0.22}>
      <MeshTransmissionMaterial  {...props.config} toneMapped={false} />
    </AnimatedRoundedBox>
  );
}

const BoxMemo = memo(SpinningBox)

function Pyramid(props) {
  const height = 2
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

      scale={1.2}
      rotation={[Math.PI / 3, 0, Math.PI / 4]}>
      <MeshTransmissionMaterial  {...props.config} toneMapped={false} />
    </Cone>
  )
}

const ConeMemo = memo(Pyramid)

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}