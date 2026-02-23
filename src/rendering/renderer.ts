/**
 * WebGL2 heatmap renderer.
 * Uploads a Float32Array intensity image as R32F texture,
 * maps it through a viridis colormap using a fullscreen triangle.
 */

import { VERTEX_SHADER, FRAGMENT_SHADER } from "./shaders";
import { makeViridisTexture } from "./colormap";

const N = 256;

export class HeatmapRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private intensityTex: WebGLTexture;
  private colormapTex: WebGLTexture;
  private vao: WebGLVertexArrayObject;

  constructor(canvas: HTMLCanvasElement) {
    canvas.width = N;
    canvas.height = N;

    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      premultipliedAlpha: false,
    });

    if (!gl) throw new Error("WebGL2 not supported");

    this.gl = gl;

    // Check for float texture support
    const extColorBuf = gl.getExtension("EXT_color_buffer_float");
    // R32F textures are core in WebGL2, but we need the extension for rendering

    // Compile shaders
    this.program = this.createProgram(VERTEX_SHADER, FRAGMENT_SHADER);

    // Create empty VAO (fullscreen triangle uses gl_VertexID)
    this.vao = gl.createVertexArray()!;

    // Create intensity texture (R32F)
    this.intensityTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.intensityTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, N, N, 0, gl.RED, gl.FLOAT, null);

    // Create colormap texture (256x1 RGBA)
    this.colormapTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.colormapTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const viridisData = makeViridisTexture();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, viridisData);

    // Set uniform locations
    gl.useProgram(this.program);
    gl.uniform1i(gl.getUniformLocation(this.program, "uIntensity"), 0);
    gl.uniform1i(gl.getUniformLocation(this.program, "uColormap"), 1);
  }

  /** Upload new intensity data and redraw. */
  draw(intensity: Float32Array): void {
    const gl = this.gl;

    // Upload intensity texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.intensityTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, N, N, gl.RED, gl.FLOAT, intensity);

    // Bind colormap
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.colormapTex);

    // Draw
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.viewport(0, 0, N, N);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /** Resize the WebGL canvas (CSS-driven). */
  resize(width: number, height: number): void {
    // Keep the internal resolution at N×N; CSS handles display size
  }

  private createProgram(vsSrc: string, fsSrc: string): WebGLProgram {
    const gl = this.gl;
    const vs = this.compileShader(gl.VERTEX_SHADER, vsSrc);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, fsSrc);

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error("Shader link error: " + log);
    }

    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return program;
  }

  private compileShader(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error("Shader compile error: " + log);
    }

    return shader;
  }
}
