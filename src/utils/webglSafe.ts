import * as THREE from 'three';

export interface SafeWebGLAttempt {
  label: string;
  options: WebGLContextAttributes & {
    antialias: boolean;
    alpha: boolean;
    powerPreference: WebGLPowerPreference;
  };
}

export interface SafeWebGLRendererResult {
  renderer: THREE.WebGLRenderer | null;
  gl: WebGL2RenderingContext | null;
  isSoftware: boolean;
  error: string | null;
}

const SOFTWARE_RENDERER_RE = /swiftshader|llvmpipe|softpipe|software|mesa offscreen|microsoft basic render/i;

export function isSoftwareRendererString(rendererStr: string): boolean {
  return SOFTWARE_RENDERER_RE.test(String(rendererStr || ''));
}

export function getWebGL2ContextAttempts(): SafeWebGLAttempt[] {
  return [
    {
      label: 'webgl2-high-perf',
      options: {
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false,
        preserveDrawingBuffer: false,
        stencil: false,
        depth: true,
      },
    },
    {
      label: 'webgl2-compat',
      options: {
        antialias: false,
        alpha: false,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false,
        preserveDrawingBuffer: false,
        stencil: false,
        depth: true,
      },
    },
    {
      label: 'webgl2-minimal-alpha',
      options: {
        antialias: false,
        alpha: true,
        powerPreference: 'default',
        failIfMajorPerformanceCaveat: false,
        preserveDrawingBuffer: false,
        stencil: false,
        depth: true,
      },
    },
  ];
}

export function readRendererString(gl: WebGL2RenderingContext | WebGLRenderingContext): string {
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (ext) {
      const unmasked = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
      if (unmasked) return String(unmasked);
    }
    return String(gl.getParameter(gl.RENDERER) || '');
  } catch {
    return '';
  }
}

export function tryAcquireWebGL2Context(
  canvas: Pick<HTMLCanvasElement, 'getContext'>,
  attempts: SafeWebGLAttempt[] = getWebGL2ContextAttempts()
): { gl: WebGL2RenderingContext | null; attempt: SafeWebGLAttempt | null; lastError: string | null } {
  let lastError: string | null = null;
  for (const attempt of attempts) {
    try {
      const ctx = canvas.getContext('webgl2', attempt.options) as WebGL2RenderingContext | null;
      if (ctx && typeof ctx.isContextLost === 'function' && !ctx.isContextLost()) {
        return { gl: ctx, attempt, lastError: null };
      }
      if (ctx) {
        return { gl: ctx, attempt, lastError: null };
      }
    } catch (err: any) {
      lastError = err?.message || String(err);
    }
  }
  return {
    gl: null,
    attempt: null,
    lastError: lastError || 'WebGL2 context could not be initialized on this graphics driver.',
  };
}

export function createSafeWebGLRenderer(
  canvas?: HTMLCanvasElement,
  overrides?: Partial<THREE.WebGLRendererParameters>
): SafeWebGLRendererResult {
  if (typeof document === 'undefined') {
    return {
      renderer: null,
      gl: null,
      isSoftware: false,
      error: 'WebGL requires a browser DOM environment.',
    };
  }

  const targetCanvas = canvas || document.createElement('canvas');
  const { gl, attempt, lastError } = tryAcquireWebGL2Context(targetCanvas);

  if (!gl || !attempt) {
    return {
      renderer: null,
      gl: null,
      isSoftware: false,
      error: lastError || 'WebGL2 context unavailable.',
    };
  }

  const rendererStr = readRendererString(gl);
  const isSoftware = isSoftwareRendererString(rendererStr);

  try {
    const renderer = new THREE.WebGLRenderer({
      canvas: targetCanvas,
      context: gl,
      antialias: isSoftware ? false : attempt.options.antialias,
      alpha: overrides?.alpha ?? attempt.options.alpha,
      powerPreference: isSoftware ? 'default' : attempt.options.powerPreference,
      failIfMajorPerformanceCaveat: false,
      ...overrides,
    });
    return {
      renderer,
      gl,
      isSoftware,
      error: null,
    };
  } catch (err: any) {
    return {
      renderer: null,
      gl: null,
      isSoftware,
      error: err?.message || 'Failed to construct Three.js WebGLRenderer.',
    };
  }
}
