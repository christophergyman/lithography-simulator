/**
 * GLSL shaders for the heatmap renderer.
 * Fullscreen quad vertex shader + viridis colormap fragment shader.
 */

export const VERTEX_SHADER = `#version 300 es
precision highp float;

// Fullscreen triangle trick — 3 vertices, no buffers needed
const vec2 positions[3] = vec2[3](
  vec2(-1.0, -1.0),
  vec2( 3.0, -1.0),
  vec2(-1.0,  3.0)
);

out vec2 vUV;

void main() {
  vec2 pos = positions[gl_VertexID];
  vUV = pos * 0.5 + 0.5;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D uIntensity;  // R32F intensity data
uniform sampler2D uColormap;   // 256x1 RGBA viridis lookup

in vec2 vUV;
out vec4 fragColor;

void main() {
  float val = texture(uIntensity, vUV).r;
  val = clamp(val, 0.0, 1.0);
  fragColor = texture(uColormap, vec2(val, 0.5));
}
`;
