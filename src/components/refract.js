import { Canvas, useThree, useFrame } from '@react-three/fiber';
import {
  MeshTransmissionMaterial,
  Environment,
  OrbitControls,
  Float,
  Text,
  RoundedBox,
  Plane,
  Torus,
  Html,
  Cone
} from '@react-three/drei'
import { useControls, Leva } from 'leva'
import { useEffect, useRef, Suspense } from 'react';
import { Vector2, Vector3, } from 'three';
import { useSpring, animated } from '@react-spring/three';
import RefractGradient from '../assets/refract_gradient.png'
import MontserratFont from '../assets/montserrat-v25-latin-800.woff'


export default function Refract() {

  return (


    <div id="canvas-container" style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 0, 9.5], far: 50, }} >
        <ambientLight shadows />

        <Scene />

        <Environment
          preset='studio'
          toneMapped={false}
          background
        >

        </Environment>

        {/* <Perf position="top-left" /> */}

      </Canvas>
    </div>

  )
}

export function Scene(props) {
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



  const { viewport, camera, gl, size } = useThree()

  const textRef = useRef()

  const scale = Math.min(1, viewport.width / 16)

  const orbitControlsRef = useRef()
  const startTimeRef = useRef(Date.now())

  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }

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

  const textScaleFactor = Math.log2(viewport.width) / 4
  config.scale = scale



  return (
    <>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableDamping={true}
        minPolarAngle={Math.PI / 2.4}
        maxPolarAngle={Math.PI / 1.9}
        minAzimuthAngle={-Math.PI / 20}
        maxAzimuthAngle={Math.PI / 16}
        makeDefault
        ref={orbitControlsRef} />
      {/* goofy remember to remove Leva when usin controls */}
      <Leva hidden />
      <Plane
        args={[4000, 2000]}
        position={[0, 0, -10]}
      >
        <meshBasicMaterial
          toneMapped={false}
          transparent
          //map={planeTexture}
          color={("white")}
        />
      </Plane>

      <Html
        fullscreen
        occlude={false}
        style={{
          background: `url('${RefractGradient}') no-repeat center center fixed`,
          backgroundSize: '102% 102%',
          transform: 'translateY(0px)'
        }}
      />

      <group ref={textRef}>

        <Suspense>
          <Text
            // fillOpacity={.1}
            outlineColor={'#2C2C2C'}
            outlineWidth={.01}
            position={[0, 0, -.15 * textScaleFactor]}
            anchorX="left"
            anchorY="top"
            castShadow
            fontSize={1.1 * textScaleFactor}
            font={MontserratFont}
            lineHeight={1.1}
            letterSpacing={.03}
          >

            {`REFRACT`}
            <meshBasicMaterial color='#2C2C2C' toneMapped={false} />
          </Text>

          <Text
            fillOpacity={0}
            strokeColor='#2C2C2C'
            position={[0, -1.2 * textScaleFactor, 0]}
            anchorX="left"
            anchorY="top"
            castShadow
            fontSize={1.1 * textScaleFactor}
            strokeWidth={'2.5%'}
            font={MontserratFont}
            lineHeight={1.1}
            letterSpacing={.03}
          >

            STUDIO

          </Text>

        </Suspense>

        <Float floatingRange={[-.7, 1.8]}>
          <SpinningTorus config={config} position={[2.2 * scale, -2.5 * scale, -2.4 * scale]} />
        </Float>

        <Float speed={1.1} floatingRange={[-.3, 1.3]} >
          <SpinningBox config={config} position={[6.85 * scale, -.9 * scale, -2.7 * scale]} />
        </Float>

        <Float floatingRange={[-1., 2.]}  >
          <Pyramid config={config} position={[11 * scale, -2 * scale, 1.3 * scale]} />
        </Float>

      </group >

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
      args={[1, 0.4, 64, 200]}
      position={props.position}
      {...spinAnimation}
      scale={1 * props.config.scale}
    //scale={1 * props.config.scale}
    >
      <MeshTransmissionMaterial  {...props.config} toneMapped={false} />
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
    <AnimatedRoundedBox {...spinAnimation} castShadow position={props.position} smoothness={64} radius={0.2}>
      <MeshTransmissionMaterial  {...props.config} toneMapped={false} />
    </AnimatedRoundedBox>


  );
}



function Pyramid(props) {
  const height = 2
  const sides = 4
  const coneHeight = height / 2
  const coneRadius = 0.5
  const coneSegments = 64
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
      args={[0.5, 1, coneSegments, 6]}
      vertices={vertices}
      position={props.position}
      scale={1.2}
      rotation={[Math.PI / 3, 0, Math.PI / 4]}>
      <MeshTransmissionMaterial  {...props.config} toneMapped={false} />
    </Cone>
  )
}
