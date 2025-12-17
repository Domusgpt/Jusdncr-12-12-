import '@testing-library/jest-dom';

// Mock WebGL context for tests
class WebGLRenderingContextMock {
  canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  createShader() { return {}; }
  shaderSource() {}
  compileShader() {}
  getShaderParameter() { return true; }
  createProgram() { return {}; }
  attachShader() {}
  linkProgram() {}
  getProgramParameter() { return true; }
  useProgram() {}
  getUniformLocation() { return {}; }
  getAttribLocation() { return 0; }
  createBuffer() { return {}; }
  bindBuffer() {}
  bufferData() {}
  enableVertexAttribArray() {}
  vertexAttribPointer() {}
  viewport() {}
  uniform1f() {}
  uniform2f() {}
  uniform3f() {}
  drawArrays() {}
  clearColor() {}
  clear() {}
}

// Mock canvas.getContext to return WebGL mock
const originalGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function(type: string, options?: any) {
  if (type === 'webgl' || type === 'experimental-webgl') {
    return new WebGLRenderingContextMock(this) as any;
  }
  return originalGetContext.call(this, type, options);
};

// Mock AudioContext
class AudioContextMock {
  state = 'running';
  createAnalyser() {
    return {
      fftSize: 256,
      frequencyBinCount: 128,
      smoothingTimeConstant: 0.8,
      getByteFrequencyData: (array: Uint8Array) => {
        array.fill(128);
      },
    };
  }
  createMediaElementSource() {
    return {
      connect: () => {},
      disconnect: () => {},
    };
  }
  createMediaStreamSource() {
    return {
      connect: () => {},
      disconnect: () => {},
    };
  }
  createMediaStreamDestination() {
    return {
      stream: {
        getAudioTracks: () => [],
      },
    };
  }
  resume() { return Promise.resolve(); }
  close() { return Promise.resolve(); }
}

(global as any).AudioContext = AudioContextMock;
(global as any).webkitAudioContext = AudioContextMock;

// Mock MediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: () => Promise.resolve({
      getTracks: () => [{ stop: () => {} }],
    }),
  },
});

// Mock URL.createObjectURL
URL.createObjectURL = () => 'blob:mock-url';
URL.revokeObjectURL = () => {};

// Mock crypto.randomUUID
if (!crypto.randomUUID) {
  crypto.randomUUID = (): `${string}-${string}-${string}-${string}-${string}` => {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    return uuid as `${string}-${string}-${string}-${string}-${string}`;
  };
}
