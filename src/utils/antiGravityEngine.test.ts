import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { AntiGravityExplodedController } from './antiGravityEngine.ts';
import { createExplosionLayout } from './explosionLayout.ts';

describe('AntiGravityExplodedController', () => {
  it('registers parts and calculates upward biased trajectories', () => {
    const controller = new AntiGravityExplodedController({ yBias: 0.4 });
    const parts = [
      { id: 'heart', center: new THREE.Vector3(0, 1.2, 0.1), size: new THREE.Vector3(0.2, 0.3, 0.2) },
      { id: 'femur_l', center: new THREE.Vector3(-0.3, -1.1, 0), size: new THREE.Vector3(0.1, 1.5, 0.1) },
      { id: 'skull', center: new THREE.Vector3(0, 2.5, 0), size: new THREE.Vector3(0.3, 0.4, 0.3) },
    ];

    controller.registerParts(parts);
    assert.equal(controller.count, 3);

    const offset = new THREE.Vector3();
    const hasHeart = controller.getOffset('heart', 0.5, offset);
    assert.equal(hasHeart, true);
    assert.ok(offset.length() > 0);

    // Factor 0 results in zero offset
    controller.getOffset('heart', 0, offset);
    assert.equal(offset.length(), 0);
  });

  it('manages isolation and camera glide lifecycle', () => {
    const controller = new AntiGravityExplodedController({ cameraGlideSpeed: 10 });
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 5);

    const controls = {
      target: new THREE.Vector3(0, 0, 0),
      update: () => {},
    };

    const targetPos = new THREE.Vector3(0.5, 1.0, 0);
    controller.beginIsolation('test-organ', targetPos, 0.4, camera);

    assert.equal(controller.isolating, true);
    assert.equal(controller.isolationId, 'test-organ');
    assert.equal(controller.cameraAnimating, true);

    // Step animation
    const stillAnimating = controller.updateCameraGlide(camera, controls, 0.05);
    assert.equal(typeof stillAnimating, 'boolean');

    controller.resetIsolation();
    assert.equal(controller.isolating, false);
    assert.equal(controller.isolationId, null);
  });
});

describe('createExplosionLayout', () => {
  it('packs cards cleanly into a 2D grid', () => {
    const items = [
      { id: 'skull', width: 0.3, height: 0.4 },
      { id: 'spine', width: 0.1, height: 0.8 },
      { id: 'pelvis', width: 0.4, height: 0.3 },
    ];

    const result = createExplosionLayout(items, 1.5);
    assert.equal(result.cells.size, 3);
    assert.ok(result.width > 0);
    assert.ok(result.height > 0);

    const skullCell = result.cells.get('skull');
    assert.ok(skullCell);
    assert.ok(skullCell.width > 0);
    assert.ok(skullCell.height > 0);
  });

  it('handles empty cards array gracefully', () => {
    const result = createExplosionLayout([]);
    assert.equal(result.cells.size, 0);
    assert.equal(result.width, 0);
    assert.equal(result.height, 0);
  });
});
