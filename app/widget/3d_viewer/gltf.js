import React, { useRef } from 'react';
import { useGLTF } from '@react-three/drei';

const GLTF = ({ url, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], onLoad }) => {

  const { scene } = useGLTF(url, true, true, (e) => {
    e.manager.onLoad = () => {
      if (onLoad) {
        onLoad(url);
      }
    };
  });
  const ref = useRef(null);
  const modelRef = useRef();

  return (
    <>
      <group ref={ref} position={position} rotation={rotation} scale={scale}>
        <primitive ref={modelRef} object={scene} scale={scale} />
      </group>
    </>
  );
};

export default GLTF;
