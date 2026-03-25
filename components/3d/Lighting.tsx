"use client";

export function Lighting() {
  return (
    <>
      {/* Ambient light for overall illumination */}
      <ambientLight intensity={0.5} />

      {/* Main directional light (simulating window light) */}
      <directionalLight
        position={[8, 10, 2]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />

      {/* Fill light from opposite side */}
      <directionalLight position={[-5, 8, -3]} intensity={0.4} />

      {/* Subtle overhead light */}
      <pointLight position={[6, 2.5, 2.5]} intensity={0.3} />
    </>
  );
}
