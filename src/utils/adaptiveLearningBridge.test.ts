import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { adaptiveLearningBridge } from './adaptiveLearningBridge.ts';

describe('AdaptiveLearningBridge', () => {
  const testUserId = `bridge_user_${Date.now()}`;
  const testTopic = 'femoral_artery';
  let createdResourceId = '';

  it('adds resource successfully and enforces character boundaries', async () => {
    const text = 'The femoral artery is the main arterial supply to the lower limb, transitioning from the external iliac artery at the inguinal ligament.';
    createdResourceId = await adaptiveLearningBridge.addResource(testUserId, testTopic, text);
    assert.ok(createdResourceId && typeof createdResourceId === 'string');
  });

  it('rejects unapproved resources in retrieve', async () => {
    const chunks = await adaptiveLearningBridge.retrieve(testUserId, testTopic, 'femoral artery');
    assert.strictEqual(chunks.length, 0);
  });

  it('approves resource and allows retrieval', async () => {
    const approved = await adaptiveLearningBridge.approveResource(createdResourceId);
    assert.strictEqual(approved, true);

    const chunks = await adaptiveLearningBridge.retrieve(testUserId, testTopic, 'arterial supply inguinal');
    assert.ok(chunks.length > 0);
    assert.strictEqual(chunks[0].source_id, createdResourceId);
  });

  it('updates performance and computes learning plan', async () => {
    const initialPlan = await adaptiveLearningBridge.getLearningPlan(testUserId, testTopic);
    assert.strictEqual(initialPlan.attempts, 0);
    assert.strictEqual(initialPlan.difficulty, 'beginner');
    assert.strictEqual(initialPlan.recommend_3d_review, true);

    const updatedPlan = await adaptiveLearningBridge.recordAnswer(testUserId, testTopic, true);
    assert.strictEqual(updatedPlan.attempts, 1);
    assert.ok(updatedPlan.mastery_estimate > 0.6);
  });

  it('adds and retrieves 3D anatomy mesh labels', async () => {
    const modelId = 'skeletal_model_v1';
    const meshName = 'femur_shaft_right';
    const label = 'Right Femoral Shaft';
    const description = 'Cylindrical bone shaft subject to bending and compressive loads.';

    const labeled = await adaptiveLearningBridge.addAnatomyLabel(
      createdResourceId,
      modelId,
      meshName,
      label,
      description
    );
    assert.strictEqual(labeled, true);

    const labels = await adaptiveLearningBridge.getAnatomyLabels(testUserId, modelId);
    assert.ok(labels.length >= 1);
    const found = labels.find((l) => l.mesh_name === meshName);
    assert.ok(found);
    assert.strictEqual(found?.label, label);
  });
});
