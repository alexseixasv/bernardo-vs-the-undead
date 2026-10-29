export class WebGLInitError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'WebGLInitError';
  }
}

export interface WebGLContextHost {
  getContext(contextId: string): unknown;
}

export function isWebGL2Available(
  createHost: () => WebGLContextHost = () => document.createElement('canvas'),
): boolean {
  try {
    return createHost().getContext('webgl2') !== null;
  } catch {
    return false;
  }
}
