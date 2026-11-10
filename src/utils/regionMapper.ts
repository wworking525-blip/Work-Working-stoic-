import * as THREE from 'three';
import { BodyPartId } from './human3dBodyTypes';

export const VALID_PART_IDS: readonly BodyPartId[] = [
  'head', 'neck', 'leftShoulder', 'rightShoulder', 'chest', 'heart',
  'leftLung', 'rightLung', 'spine', 'leftArm', 'rightArm', 'liver',
  'leftKidney', 'rightKidney', 'lowerBack', 'abdomen', 'hip',
  'leftLeg', 'rightLeg', 'leftFoot', 'rightFoot'
] as const;

/**
 * Maps 3D coordinates (local model space or normalized point) to one of the 21 physical body regions
 * extracted from wworking525-blip/human-3d-body.
 */
export function getBodyPartFromPosition(point: THREE.Vector3): BodyPartId {
  const x = point.x;
  const y = point.y;
  const z = point.z;

  if (y > 0.36) {
    return 'head';
  }
  if (y > 0.30) {
    return 'neck';
  }

  if (y > 0.22) {
    if (Math.abs(z) > 0.08) {
      return z < 0 ? 'leftShoulder' : 'rightShoulder';
    }
    if (x < -0.03) return 'spine';
    if (z < -0.03) return 'leftLung';
    if (z > 0.03) return 'rightLung';
    return 'heart';
  }

  if (y > 0.12) {
    if (Math.abs(z) > 0.10) {
      return z < 0 ? 'leftArm' : 'rightArm';
    }
    if (x < -0.03) return 'spine';
    if (z < -0.03) return 'leftLung';
    if (z > 0.03) return 'rightLung';
    return 'chest';
  }

  if (y > -0.04) {
    if (Math.abs(z) > 0.10) {
      return z < 0 ? 'leftArm' : 'rightArm';
    }
    if (x < -0.03) {
      if (z < -0.02) return 'leftKidney';
      if (z > 0.02) return 'rightKidney';
      return 'lowerBack';
    }
    if (z > 0.02) return 'liver';
    return 'abdomen';
  }

  if (y > -0.18) {
    return 'hip';
  }

  if (y > -0.42) {
    return z < 0 ? 'leftLeg' : 'rightLeg';
  }

  return z < 0 ? 'leftFoot' : 'rightFoot';
}
