import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isSoftwareRendererString,
  getWebGL2ContextAttempts,
  tryAcquireWebGL2Context,
  createSafeWebGLRenderer,
} from './webglSafe.ts';

describe('webglSafe', () => {
  it('identifies software WebGL renderers accurately', () => {
    assert.equal(isSoftwareRendererString('ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)))'), true);
    assert.equal(isSoftwareRendererString('llvmpipe (LLVM 15.0.7, 256 bits)'), true);
    assert.equal(isSoftwareRendererString('Microsoft Basic Render Driver'), true);
    assert.equal(isSoftwareRendererString('ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11)'), false);
  });

  it('orders fallback WebGL2 attribute tiers from high-perf MSAA to safe compat', () => {
    const attempts = getWebGL2ContextAttempts();
    assert.equal(attempts.length, 3);
    assert.equal(attempts[0].options.antialias, true);
    assert.equal(attempts[0].options.failIfMajorPerformanceCaveat, false);
    assert.equal(attempts[1].options.antialias, false);
    assert.equal(attempts[1].options.powerPreference, 'default');
    assert.equal(attempts[2].options.alpha, true);
  });

  it('falls back through attribute tiers when primary WebGL2 context fails', () => {
    let calls = 0;
    const mockCanvas = {
      getContext(_type: string, opts?: WebGLContextAttributes) {
        calls += 1;
        if (opts?.antialias) {
          throw new Error('BindToCurrentSequence failed');
        }
        return {
          isContextLost: () => false,
        } as unknown as WebGL2RenderingContext;
      },
    };

    const res = tryAcquireWebGL2Context(mockCanvas as unknown as HTMLCanvasElement);
    assert.equal(calls, 2);
    assert.ok(res.gl);
    assert.equal(res.attempt?.label, 'webgl2-compat');
    assert.equal(res.lastError, null);
  });

  it('returns structured error without throwing when all WebGL2 attempts fail', () => {
    const mockCanvas = {
      getContext() {
        return null;
      },
    };

    const res = tryAcquireWebGL2Context(mockCanvas as unknown as HTMLCanvasElement);
    assert.equal(res.gl, null);
    assert.equal(res.attempt, null);
    assert.ok(res.lastError && res.lastError.length > 0);

    const rendererRes = createSafeWebGLRenderer();
    assert.equal(rendererRes.renderer, null);
    assert.ok(rendererRes.error && rendererRes.error.length > 0);
  });
});
