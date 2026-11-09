import * as THREE from 'three';

/**
 * Creates the iconic Innerbody-style full human body silhouette.
 * Semi-transparent, anatomically proportioned human figure (head, neck, shoulders,
 * arms, hands, sculpted chest, waist, hips, thighs, knees, calves, and feet).
 */
export function createHumanBodySilhouette(): THREE.Group {
  const bodyGroup = new THREE.Group();
  bodyGroup.name = 'InnerbodyHumanSilhouette';

  // Pearlescent translucent frosted glass shader matching Innerbody reference
  const silhouetteMat = new THREE.MeshStandardMaterial({
    color: 0xecf2f8,
    transparent: true,
    opacity: 0.28,
    roughness: 0.35,
    metalness: 0.08,
    depthWrite: false, // Prevents z-fighting and preserves crisp visibility of interior organs
    side: THREE.FrontSide,
  });

  const subtleLineMat = new THREE.MeshBasicMaterial({
    color: 0x94a3b8,
    transparent: true,
    opacity: 0.18,
    wireframe: true,
  });

  // 1. Head & Cranium
  const craniumGeo = new THREE.SphereGeometry(0.32, 28, 24);
  craniumGeo.scale(1, 1.25, 1.15);
  const cranium = new THREE.Mesh(craniumGeo, silhouetteMat);
  cranium.position.set(0, 1.72, 0);
  bodyGroup.add(cranium);

  // Chin / Jawline taper
  const jawGeo = new THREE.ConeGeometry(0.22, 0.28, 20);
  jawGeo.rotateX(Math.PI);
  const jaw = new THREE.Mesh(jawGeo, silhouetteMat);
  jaw.position.set(0, 1.48, 0.08);
  bodyGroup.add(jaw);

  // 2. Neck
  const neckGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.24, 20);
  const neck = new THREE.Mesh(neckGeo, silhouetteMat);
  neck.position.set(0, 1.34, 0);
  bodyGroup.add(neck);

  // 3. Upper Torso (Chest & Ribcage)
  const chestGeo = new THREE.CylinderGeometry(0.52, 0.44, 0.65, 24);
  chestGeo.scale(1.15, 1, 0.75); // Flatter anteroposteriorly
  const chest = new THREE.Mesh(chestGeo, silhouetteMat);
  chest.position.set(0, 0.98, 0);
  bodyGroup.add(chest);

  // Clavicle / Shoulder shelf
  const shoulderGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.25, 16);
  shoulderGeo.rotateZ(Math.PI / 2);
  shoulderGeo.scale(1, 0.5, 0.8);
  const shoulder = new THREE.Mesh(shoulderGeo, silhouetteMat);
  shoulder.position.set(0, 1.22, -0.02);
  bodyGroup.add(shoulder);

  // 4. Mid Torso (Waist & Abdomen)
  const waistGeo = new THREE.CylinderGeometry(0.42, 0.46, 0.5, 24);
  waistGeo.scale(1.08, 1, 0.72);
  const waist = new THREE.Mesh(waistGeo, silhouetteMat);
  waist.position.set(0, 0.45, 0);
  bodyGroup.add(waist);

  // 5. Pelvis & Hips
  const pelvisGeo = new THREE.CylinderGeometry(0.46, 0.42, 0.42, 24);
  pelvisGeo.scale(1.18, 1, 0.78);
  const pelvis = new THREE.Mesh(pelvisGeo, silhouetteMat);
  pelvis.position.set(0, 0.04, 0);
  bodyGroup.add(pelvis);

  // 6. Arms (Bilateral Shoulders, Upper Arms, Forearms, Hands)
  [-1, 1].forEach((side) => {
    // Shoulder cap / Deltoid contour
    const deltoidGeo = new THREE.SphereGeometry(0.16, 18, 18);
    const deltoid = new THREE.Mesh(deltoidGeo, silhouetteMat);
    deltoid.position.set(side * 0.64, 1.15, 0);
    bodyGroup.add(deltoid);

    // Upper Arm (Humerus region)
    const upperArmGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.52, 18);
    const upperArm = new THREE.Mesh(upperArmGeo, silhouetteMat);
    upperArm.position.set(side * 0.68, 0.82, 0);
    upperArm.rotation.z = side * -0.08;
    bodyGroup.add(upperArm);

    // Elbow
    const elbowGeo = new THREE.SphereGeometry(0.09, 14, 14);
    const elbow = new THREE.Mesh(elbowGeo, silhouetteMat);
    elbow.position.set(side * 0.72, 0.52, 0);
    bodyGroup.add(elbow);

    // Forearm
    const forearmGeo = new THREE.CylinderGeometry(0.095, 0.075, 0.5, 18);
    const forearm = new THREE.Mesh(forearmGeo, silhouetteMat);
    forearm.position.set(side * 0.76, 0.24, 0);
    forearm.rotation.z = side * -0.06;
    bodyGroup.add(forearm);

    // Hand & Fingers
    const handGeo = new THREE.BoxGeometry(0.11, 0.22, 0.05);
    const hand = new THREE.Mesh(handGeo, silhouetteMat);
    hand.position.set(side * 0.79, -0.09, 0);
    bodyGroup.add(hand);
  });

  // 7. Legs (Thighs, Knees, Calves, Feet)
  [-1, 1].forEach((side) => {
    // Thigh (Femur region)
    const thighGeo = new THREE.CylinderGeometry(0.22, 0.16, 0.78, 20);
    thighGeo.scale(1, 1, 0.9);
    const thigh = new THREE.Mesh(thighGeo, silhouetteMat);
    thigh.position.set(side * 0.26, -0.48, 0);
    thigh.rotation.z = side * -0.03;
    bodyGroup.add(thigh);

    // Patella / Knee Joint
    const kneeGeo = new THREE.SphereGeometry(0.14, 18, 18);
    const knee = new THREE.Mesh(kneeGeo, silhouetteMat);
    knee.position.set(side * 0.26, -0.92, 0.03);
    bodyGroup.add(knee);

    // Calf / Lower Leg (Tibia & Gastrocnemius region)
    const calfGeo = new THREE.CylinderGeometry(0.15, 0.11, 0.78, 20);
    calfGeo.scale(1, 1, 0.88);
    const calf = new THREE.Mesh(calfGeo, silhouetteMat);
    calf.position.set(side * 0.26, -1.36, -0.01);
    bodyGroup.add(calf);

    // Ankle & Foot
    const footGeo = new THREE.BoxGeometry(0.16, 0.12, 0.36);
    const foot = new THREE.Mesh(footGeo, silhouetteMat);
    foot.position.set(side * 0.26, -1.82, 0.08);
    bodyGroup.add(foot);
  });

  return bodyGroup;
}
