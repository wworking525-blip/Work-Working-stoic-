import React, { useRef, useState, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { getBodyPartFromPosition, VALID_PART_IDS } from '../src/utils/regionMapper';
import { defaultAnatomyData } from '../src/utils/human3dBodyData';
import { BodyPartId } from '../src/utils/human3dBodyTypes';

interface AnatomyCanvasNativeProps {
  onSelectRegion?: (partId: BodyPartId, info: any) => void;
  selectedRegionId?: BodyPartId | null;
}

/**
 * Native 3D Human Anatomy Viewer component optimized for iOS and Android
 * using @react-three/fiber/native and expo-gl hardware acceleration.
 */
function BodyMeshNative({ onSelectRegion, selectedRegionId }: AnatomyCanvasNativeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 3D Anatomical Body Silhouette for mobile GPU */}
      <mesh
        ref={meshRef}
        onClick={(e: any) => {
          if (e.point) {
            const region = getBodyPartFromPosition(e.point);
            const info = defaultAnatomyData[region];
            if (onSelectRegion) onSelectRegion(region, info);
          }
        }}
      >
        <capsuleGeometry args={[0.3, 1.2, 16, 32]} />
        <meshStandardMaterial
          color={selectedRegionId ? '#38bdf8' : '#e0e7ff'}
          roughness={0.3}
          metalness={0.1}
          wireframe={false}
        />
      </mesh>
    </group>
  );
}

export function AnatomyCanvasNative({ onSelectRegion, selectedRegionId }: AnatomyCanvasNativeProps) {
  const [activeInfo, setActiveInfo] = useState<any>(null);

  const handleSelect = (region: BodyPartId, info: any) => {
    setActiveInfo(info);
    if (onSelectRegion) onSelectRegion(region, info);
  };

  return (
    <View style={styles.container}>
      <Canvas
        camera={{ position: [0, 0.5, 2.5], fov: 45 }}
        style={styles.canvas}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 4]} intensity={1.5} />
        <directionalLight position={[-3, -2, -3]} intensity={0.6} />
        <BodyMeshNative onSelectRegion={handleSelect} selectedRegionId={selectedRegionId} />
      </Canvas>

      {/* Touch HUD */}
      <View style={styles.hud}>
        <Text style={styles.hudTitle}>
          {activeInfo ? activeInfo.name : 'Tap 3D Body Region'}
        </Text>
        <Text style={styles.hudDesc}>
          {activeInfo
            ? activeInfo.description
            : 'Interactive @react-three/fiber/native with expo-gl hardware acceleration.'}
        </Text>
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 420,
    backgroundColor: '#090d16',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  canvas: {
    flex: 1,
  },
  hud: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  hudTitle: {
    color: '#38bdf8',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  hudDesc: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 16,
  },
});
