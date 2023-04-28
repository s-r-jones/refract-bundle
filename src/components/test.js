import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Mask, useMask, TransformControls, Float, Environment, OrbitControls, MeshDistortMaterial, ContactShadows, useGLTF, Qu, ScreenQuad } from '@react-three/drei'
import { useControls } from 'leva'
import ENV_REFRACT from '../assets/Refract_Small.hdr'
import REFRACT_PNG from '../assets/Refract.png'

function MaskedContent({ invert, ...props }) {
  /* The useMask hook has to refer to the mask id defined below, the content
   * will then be stamped out.
   */
  const stencil = useMask(1, invert)
  const group = useRef()
  const [hovered, hover] = useState(false)
  useFrame((state) => (group.current.rotation.y = state.clock.elapsedTime / 2))
  return (
    <group {...props}>
      <mesh position={[-0.75, 0, 0]} scale={1} ref={group}>
        <torusKnotGeometry args={[0.6, 0.2, 128, 64]} />
        <meshNormalMaterial {...stencil} />
      </mesh>
      <mesh position={[0.75, 0, 0]} onPointerOver={() => hover(true)} onPointerOut={() => hover(false)}>
        <sphereGeometry args={[0.8, 64, 64]} />
        <meshStandardMaterial {...stencil} color={hovered ? 'orange' : 'white'} />
      </mesh>
      {/* <Environment
        {...stencil}
        layers={[0]}
        files={ENV_REFRACT}
        toneMapped={false}
        background={true}

      /> */}

    </group>
  )
}

function Target(props) {
  const { scene } = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/target-stand/model.gltf')
  return <primitive object={scene} {...props} />
}

export default function () {
  const { invert, colorWrite, depthWrite } = useControls({ invert: false, colorWrite: true, depthWrite: false })
  return (
    <Canvas camera={{ position: [0, 0, 9.5], far: 50, }} renderer={{ alpha: true }}>
      <hemisphereLight intensity={1} groundColor="red" />
      <Suspense fallback={null}>
        <Float floatIntensity={5} rotationIntensity={2} speed={10}>
          {/* Mask sets the shape of the area that is shown, and cuts everything else out.
           * This is valid only for meshes that use useMask with the same id, everything else
           * is not affected.
           */}
          <Mask id={1} colorWrite={colorWrite} depthWrite={depthWrite} position={[-1.1, 0, 0]}>
            <ringGeometry args={[0.5, 1, 64]} />
          </Mask>
        </Float>

        <TransformControls position={[1.1, 0, 0]}>
          {/* You can build compound-masks using the same id. Masks are otherwise the same as
           *  meshes, you can deform or transition them any way you like
           */}
          <Mask id={1} colorWrite={colorWrite} depthWrite={depthWrite}>
            {(spread) => (
              <>
                <planeGeometry args={[2, 2, 128, 128]} />
                <MeshDistortMaterial distort={0.5} radius={1} speed={10} {...spread} />
              </>
            )}
          </Mask>
        </TransformControls>

        <MaskedContent invert={invert} />
        <Target position={[0, -1, -3]} scale={1.5} />
        <ContactShadows frames={1} scale={10} position={[0, -1, 0]} blur={8} opacity={0.55} />
        <Environment preset="city" />
        <OrbitControls makeDefault />
      </Suspense>
    </Canvas>
  )
}
