import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Box, RoundedBox, Float, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';

const AvatarModel = ({ isSpeaking, audioAmplitude }) => {
  const headRef = useRef();
  const mouthRef = useRef();
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  // Mouse tracking for head rotation
  React.useEffect(() => {
    const handleMouseMove = (event) => {
      setMouse({
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state) => {
    // Idle movement
    const t = state.clock.getElapsedTime();
    
    if (headRef.current) {
      // Look at mouse
      const targetRotationX = mouse.y * 0.3;
      const targetRotationY = mouse.x * 0.5;
      
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, targetRotationX, 0.1);
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetRotationY, 0.1);
      
      // Floating effect
      headRef.current.position.y = Math.sin(t) * 0.05;
    }

    // Mouth animation based on audio
    if (mouthRef.current) {
      if (isSpeaking) {
        // Use audio amplitude to scale mouth or move it
        const mouthOpen = Math.min(0.2, audioAmplitude * 0.5);
        mouthRef.current.scale.y = 1 + audioAmplitude * 3;
        mouthRef.current.position.y = -0.3 - audioAmplitude * 0.1;
      } else {
        mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, 1, 0.2);
        mouthRef.current.position.y = THREE.MathUtils.lerp(mouthRef.current.position.y, -0.3, 0.2);
      }
    }
  });

  return (
    <group position={[0, -0.5, 0]}>
      {/* Body / Chest */}
      <RoundedBox args={[0.8, 0.6, 0.4]} radius={0.1} smoothness={4}>
        <meshStandardMaterial color="#1e293b" />
      </RoundedBox>

      {/* Head */}
      <group ref={headRef} position={[0, 0.6, 0]}>
        {/* Face */}
        <RoundedBox args={[0.6, 0.6, 0.4]} radius={0.15} smoothness={4}>
          <meshStandardMaterial color="#334155" />
        </RoundedBox>

        {/* Eyes */}
        <group position={[0, 0.1, 0.21]}>
          <Box args={[0.1, 0.05, 0.01]} position={[-0.15, 0, 0]}>
            <meshBasicMaterial color="#38bdf8" />
          </Box>
          <Box args={[0.1, 0.05, 0.01]} position={[0.15, 0, 0]}>
            <meshBasicMaterial color="#38bdf8" />
          </Box>
        </group>

        {/* Mouth */}
        <Box ref={mouthRef} args={[0.15, 0.02, 0.01]} position={[0, -0.15, 0.21]}>
          <meshBasicMaterial color="#38bdf8" />
        </Box>
      </group>

      {/* Background Glow */}
      <pointLight position={[0, 0, -1]} intensity={1} color="#38bdf8" />
    </group>
  );
};

const AitutorAvatar = ({ isSpeaking, audioAmplitude }) => {
  return (
    <div style={{ width: '100%', height: '200px', cursor: 'grab' }}>
      <Canvas camera={{ position: [0, 0, 3], fov: 40 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        <Environment preset="city" />
        
        <AvatarModel isSpeaking={isSpeaking} audioAmplitude={audioAmplitude} />
        
        <ContactShadows resolution={1024} scale={10} blur={2} opacity={0.25} far={10} color="#000000" />
      </Canvas>
    </div>
  );
};

export default AitutorAvatar;
