import { Plane, useTexture, useMask, Billboard } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import map from '../assets/Refract_Small.png'

export default function () {
  const { size, camera } = useThree()
  const aspectRatio = size.width / size.height

  const cameraDistance = camera.position.z - camera.near
  const planeHeight = 2 * cameraDistance * Math.tan(camera.fov * Math.PI / 360) + 23
  const planeWidth = planeHeight * aspectRatio

  const texture = useTexture(map)

  const stencil = useMask(1)

  return (
    <Billboard>
      <Plane
        args={[planeWidth, planeHeight, 1, 1]}
        position={[0, 0, camera.position.z - cameraDistance - 5]}
      >
        <meshBasicMaterial map={texture} {...stencil} />
      </Plane>
    </Billboard>
  )
}
