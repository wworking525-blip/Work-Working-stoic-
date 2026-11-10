import * as THREE from 'three';

export interface AntigravityConfig {
  yBias: number;
  expansionRadius: number;
  cameraGlideSpeed: number;
}

export const DEFAULT_ANTIGRAVITY_CONFIG: AntigravityConfig = {
  yBias: 0.35,
  expansionRadius: 2.4,
  cameraGlideSpeed: 6.0,
};

export interface AnatomyPartTrajectory {
  id: string;
  initialPos: THREE.Vector3;
  initialWorldCenter: THREE.Vector3;
  trajectory: THREE.Vector3;
  radius: number;
}

/**
 * AntiGravityExplodedController
 *
 * Computes outward zero-g floating trajectory vectors with upward Y-bias
 * and provides frame-rate independent camera isolation glide when inspecting parts.
 */
export class AntiGravityExplodedController {
  private readonly _cfg: AntigravityConfig;
  private readonly _nodes: Map<string, AnatomyPartTrajectory> = new Map();

  // Isolation and camera glide states
  private _isolating = false;
  private _isolationId: string | null = null;
  private _camAnimating = false;

  private readonly _camTargetPos = new THREE.Vector3();
  private readonly _camTargetLook = new THREE.Vector3();
  private readonly _tmpDir = new THREE.Vector3();
  private readonly _tmpVec = new THREE.Vector3();
  private readonly _tmpRoot = new THREE.Vector3();

  constructor(cfg: Partial<AntigravityConfig> = {}) {
    this._cfg = { ...DEFAULT_ANTIGRAVITY_CONFIG, ...cfg };
  }

  /**
   * Register anatomical parts with their centers and compute unit outward trajectories.
   */
  registerParts(parts: { id: string; center: THREE.Vector3; size?: THREE.Vector3 }[]): void {
    this._nodes.clear();
    if (parts.length === 0) return;

    // Calculate root collective centroid
    this._tmpRoot.set(0, 0, 0);
    for (const p of parts) {
      this._tmpRoot.add(p.center);
    }
    this._tmpRoot.divideScalar(parts.length);

    for (const p of parts) {
      const traj = new THREE.Vector3().subVectors(p.center, this._tmpRoot);
      const rawLen = traj.length();
      traj.y += this._cfg.yBias * Math.max(0.02, rawLen);

      if (traj.lengthSq() > 0.0001) {
        traj.normalize();
      } else {
        traj.set(
          (Math.random() - 0.5) * 2,
          0.8 + Math.random() * 0.4,
          (Math.random() - 0.5) * 2
        ).normalize();
      }

      const size = p.size || new THREE.Vector3(0.2, 0.2, 0.2);
      const radius = Math.max(size.x, size.y, size.z) * 0.5;

      this._nodes.set(p.id, {
        id: p.id,
        initialPos: p.center.clone(),
        initialWorldCenter: p.center.clone(),
        trajectory: traj,
        radius,
      });
    }
  }

  /**
   * Calculate displacement offset for a given part id at factor [0..1].
   */
  getOffset(id: string, factor: number, out: THREE.Vector3): boolean {
    const node = this._nodes.get(id);
    if (!node) {
      out.set(0, 0, 0);
      return false;
    }
    const r = Math.max(0, Math.min(1, factor)) * this._cfg.expansionRadius;
    out.copy(node.trajectory).multiplyScalar(r);
    return true;
  }

  /**
   * Begin smooth camera glide to frame the given part at worldCenter.
   */
  beginIsolation(
    id: string,
    worldCenter: THREE.Vector3,
    worldSize: number,
    camera: THREE.PerspectiveCamera
  ): void {
    this._isolating = true;
    this._isolationId = id;
    this._camAnimating = true;

    const halfFovRad = THREE.MathUtils.degToRad(camera.fov / 2);
    const dist = Math.max(0.15, (worldSize * 0.5) / Math.tan(halfFovRad) * 1.5);

    this._camTargetLook.copy(worldCenter);
    this._tmpDir.set(0.25, 0.1, 1).normalize();
    this._camTargetPos.copy(worldCenter).addScaledVector(this._tmpDir, dist);
  }

  resetIsolation(): void {
    this._isolating = false;
    this._isolationId = null;
    this._camAnimating = false;
  }

  /**
   * Advances camera glide by delta time `dt`.
   */
  updateCameraGlide(
    camera: THREE.PerspectiveCamera,
    controls: { target: THREE.Vector3; update: () => void },
    dt: number
  ): boolean {
    if (!this._camAnimating) return false;

    const alpha = 1 - Math.exp(-this._cfg.cameraGlideSpeed * dt);
    camera.position.lerp(this._camTargetPos, alpha);
    controls.target.lerp(this._camTargetLook, alpha);
    controls.update();

    const settled =
      camera.position.distanceToSquared(this._camTargetPos) < 1e-5 &&
      controls.target.distanceToSquared(this._camTargetLook) < 1e-5;

    if (settled) {
      this._camAnimating = false;
    }
    return !settled;
  }

  get isolating(): boolean {
    return this._isolating;
  }

  get isolationId(): string | null {
    return this._isolationId;
  }

  get cameraAnimating(): boolean {
    return this._camAnimating;
  }

  get count(): number {
    return this._nodes.size;
  }
}
