import { createContext, useContext, useState } from 'react'

const QuadContext = createContext({ loaded: false })
export const useQuadContext = () => useContext(QuadContext)

import { Plane, useTexture, useMask, Billboard } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import map from '../assets/refract_3.png'

export default function () {
  const { size, camera } = useThree()
  const aspectRatio = size.width / size.height

  const cameraDistance = camera.position.z - camera.near
  const planeHeight = 2 * cameraDistance * Math.tan(camera.fov * Math.PI / 360) + 23
  const planeWidth = planeHeight * aspectRatio

  const [loaded, setLoaded] = useState(false)
  const texture = useTexture(map, () => {
    setLoaded(true)
  })


  const stencil = useMask(1)

  return (
    <QuadContext.Provider value={{ loaded }}>
      <Billboard>
        <Plane
          args={[planeWidth, planeHeight, 1, 1]}
          position={[0, 0, camera.position.z - cameraDistance - 5]}
        >
          <meshBasicMaterial map={texture} {...stencil} />
        </Plane>
      </Billboard>
    </QuadContext.Provider>
  )
}
