/**
 * WebGL Renderer Module
 * 
 * Provides optimized WebGL rendering for the Figma clone.
 * Works alongside Fabric.js to improve performance for specific operations.
 */

// WebGL context and state
const webglState = {
  gl: null,
  program: null,
  buffers: {},
  textures: {},
  shaders: {},
  initialized: false,
  objectCache: new Map(), // Cache for WebGL-rendered objects
  framebuffers: {}, // For layer-based rendering
  currentLayer: 'main'
};

// Initialize WebGL
function initWebGL(canvas) {
  // Try to get WebGL context
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) {
    console.warn('WebGL not supported, falling back to Canvas API');
    return false;
  }
  
  webglState.gl = gl;
  
  // Initialize shaders
  initShaders();
  
  // Initialize buffers
  initBuffers();
  
  // Set up initial WebGL state
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  
  webglState.initialized = true;
  return true;
}

// Initialize shaders
function initShaders() {
  const gl = webglState.gl;
  
  // Vertex shader for basic shapes
  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;
    
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    
    varying lowp vec4 vColor;
    
    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
    }
  `;
  
  // Fragment shader for basic shapes
  const fsSource = `
    precision mediump float;
    varying lowp vec4 vColor;
    
    void main(void) {
      gl_FragColor = vColor;
    }
  `;
  
  // Create shader program
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
  
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return;
  }
  
  webglState.program = shaderProgram;
  
  // Store program info for easy access
  webglState.programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    },
  };
}

// Load shader
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  
  return shader;
}

// Initialize buffers
function initBuffers() {
  const gl = webglState.gl;
  
  // Create position buffer for rectangles
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  
  // Rectangle vertices (will be updated for each rectangle)
  const positions = [
    -1.0, -1.0,
     1.0, -1.0,
     1.0,  1.0,
    -1.0,  1.0,
  ];
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
  webglState.buffers.position = positionBuffer;
  
  // Create color buffer
  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  
  // Default white color (will be updated for each shape)
  const colors = [
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0,
  ];
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
  webglState.buffers.color = colorBuffer;
  
  // Create index buffer for drawing rectangles
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  
  // Define rectangle indices
  const indices = [
    0, 1, 2,
    0, 2, 3,
  ];
  
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  webglState.buffers.indices = indexBuffer;
}

// Draw a rectangle using WebGL
function drawRectangle(x, y, width, height, color, rotation = 0) {
  if (!webglState.initialized) return;
  
  const gl = webglState.gl;
  const programInfo = webglState.programInfo;
  
  // Convert color from hex to RGB
  const rgbColor = hexToRgb(color);
  
  // Update position buffer for this rectangle
  gl.bindBuffer(gl.ARRAY_BUFFER, webglState.buffers.position);
  
  // Calculate half dimensions for vertices
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  
  // Define rectangle vertices
  const positions = [
    -halfWidth, -halfHeight,
     halfWidth, -halfHeight,
     halfWidth,  halfHeight,
    -halfWidth,  halfHeight,
  ];
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
  
  // Update color buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, webglState.buffers.color);
  
  // Create color array with the specified color
  const colors = [
    rgbColor.r, rgbColor.g, rgbColor.b, rgbColor.a,
    rgbColor.r, rgbColor.g, rgbColor.b, rgbColor.a,
    rgbColor.r, rgbColor.g, rgbColor.b, rgbColor.a,
    rgbColor.r, rgbColor.g, rgbColor.b, rgbColor.a,
  ];
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
  
  // Set up shader program
  gl.useProgram(programInfo.program);
  
  // Set up projection matrix (orthographic projection)
  const projectionMatrix = mat4.create();
  mat4.ortho(projectionMatrix, 0, gl.canvas.width, gl.canvas.height, 0, -1, 1);
  
  // Set up model-view matrix
  const modelViewMatrix = mat4.create();
  mat4.translate(modelViewMatrix, modelViewMatrix, [x + halfWidth, y + halfHeight, 0]);
  
  if (rotation !== 0) {
    mat4.rotateZ(modelViewMatrix, modelViewMatrix, rotation * Math.PI / 180);
  }
  
  // Set uniforms
  gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
  gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
  
  // Set up vertex attributes
  gl.bindBuffer(gl.ARRAY_BUFFER, webglState.buffers.position);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexPosition,
    2,        // 2 components per vertex
    gl.FLOAT, // 32-bit floats
    false,    // don't normalize
    0,        // stride
    0         // offset
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, webglState.buffers.color);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexColor,
    4,        // 4 components per color (RGBA)
    gl.FLOAT, // 32-bit floats
    false,    // don't normalize
    0,        // stride
    0         // offset
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
  
  // Draw the rectangle
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, webglState.buffers.indices);
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}

// Draw a circle using WebGL
function drawCircle(x, y, radius, color) {
  if (!webglState.initialized) return;
  
  const gl = webglState.gl;
  const programInfo = webglState.programInfo;
  
  // Convert color from hex to RGB
  const rgbColor = hexToRgb(color);
  
  // Create vertices for circle
  const segments = 32; // Number of segments to approximate circle
  const positions = [];
  const colors = [];
  
  // Center vertex
  positions.push(0, 0);
  colors.push(rgbColor.r, rgbColor.g, rgbColor.b, rgbColor.a);
  
  // Create circle vertices
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const xPos = Math.cos(theta) * radius;
    const yPos = Math.sin(theta) * radius;
    
    positions.push(xPos, yPos);
    colors.push(rgbColor.r, rgbColor.g, rgbColor.b, rgbColor.a);
  }
  
  // Create position buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, webglState.buffers.position);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
  
  // Create color buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, webglState.buffers.color);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
  
  // Set up shader program
  gl.useProgram(programInfo.program);
  
  // Set up projection matrix (orthographic projection)
  const projectionMatrix = mat4.create();
  mat4.ortho(projectionMatrix, 0, gl.canvas.width, gl.canvas.height, 0, -1, 1);
  
  // Set up model-view matrix
  const modelViewMatrix = mat4.create();
  mat4.translate(modelViewMatrix, modelViewMatrix, [x + radius, y + radius, 0]);
  
  // Set uniforms
  gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
  gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
  
  // Set up vertex attributes
  gl.bindBuffer(gl.ARRAY_BUFFER, webglState.buffers.position);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexPosition,
    2,        // 2 components per vertex
    gl.FLOAT, // 32-bit floats
    false,    // don't normalize
    0,        // stride
    0         // offset
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, webglState.buffers.color);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexColor,
    4,        // 4 components per color (RGBA)
    gl.FLOAT, // 32-bit floats
    false,    // don't normalize
    0,        // stride
    0         // offset
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
  
  // Draw the circle as a triangle fan
  gl.drawArrays(gl.TRIANGLE_FAN, 0, segments + 2);
}

// Batch render multiple rectangles for performance
function batchRenderRectangles(rectangles) {
  if (!webglState.initialized || rectangles.length === 0) return;
  
  const gl = webglState.gl;
  const programInfo = webglState.programInfo;
  
  // Set up shader program
  gl.useProgram(programInfo.program);
  
  // Set up projection matrix (orthographic projection)
  const projectionMatrix = mat4.create();
  mat4.ortho(projectionMatrix, 0, gl.canvas.width, gl.canvas.height, 0, -1, 1);
  
  // Render each rectangle with minimal state changes
  rectangles.forEach(rect => {
    // Set up model-view matrix for this rectangle
    const modelViewMatrix = mat4.create();
    const halfWidth = rect.width / 2;
    const halfHeight = rect.height / 2;
    
    mat4.translate(modelViewMatrix, modelViewMatrix, [rect.x + halfWidth, rect.y + halfHeight, 0]);
    
    if (rect.rotation) {
      mat4.rotateZ(modelViewMatrix, modelViewMatrix, rect.rotation * Math.PI / 180);
    }
    
    // Update position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, webglState.buffers.position);
    
    const positions = [
      -halfWidth, -halfHeight,
       halfWidth, -halfHeight,
       halfWidth,  halfHeight,
      -halfWidth,  halfHeight,
    ];
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.DYNAMIC_DRAW);
    
    // Update color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, webglState.buffers.color);
    
    const rgbColor = hexToRgb(rect.color);
    const colors = [
      rgbColor.r, rgbColor.g, rgbColor.b, rgbColor.a,
      rgbColor.r, rgbColor.g, rgbColor.b, rgbColor.a,
      rgbColor.r, rgbColor.g, rgbColor.b, rgbColor.a,
      rgbColor.r, rgbColor.g, rgbColor.b, rgbColor.a,
    ];
    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
    
    // Set uniforms
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);
    
    // Set up vertex attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, webglState.buffers.position);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      2,        // 2 components per vertex
      gl.FLOAT, // 32-bit floats
      false,    // don't normalize
      0,        // stride
      0         // offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, webglState.buffers.color);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexColor,
      4,        // 4 components per color (RGBA)
      gl.FLOAT, // 32-bit floats
      false,    // don't normalize
      0,        // stride
      0         // offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
    
    // Draw the rectangle
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, webglState.buffers.indices);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  });
}

// Convert hex color to RGB
function hexToRgb(hex) {
  // Default to white if no color provided
  if (!hex) return { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };
  
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Handle alpha if present
  let a = 1.0;
  if (hex.length === 8) {
    a = parseInt(hex.substring(6, 8), 16) / 255;
  }
  
  return { r, g, b, a };
}

// Create a WebGL texture from an image
function createTexture(image) {
  if (!webglState.initialized) return null;
  
  const gl = webglState.gl;
  
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  
  // Set texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  
  // Upload image to texture
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  
  return texture;
}

// Create a framebuffer for layer-based rendering
function createLayer(name, width, height) {
  if (!webglState.initialized) return;
  
  const gl = webglState.gl;
  
  // Create texture for the layer
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  
  // Set texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  
  // Create framebuffer
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  
  // Store layer information
  webglState.framebuffers[name] = {
    framebuffer,
    texture,
    width,
    height
  };
  
  // Reset framebuffer binding
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

// Set the current layer for rendering
function setCurrentLayer(name) {
  if (!webglState.initialized) return;
  
  webglState.currentLayer = name;
  
  const gl = webglState.gl;
  
  if (name === 'main') {
    // Render to canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  } else if (webglState.framebuffers[name]) {
    // Render to layer framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, webglState.framebuffers[name].framebuffer);
  }
}

// Composite all layers to the main canvas
function compositeLayers() {
  if (!webglState.initialized) return;
  
  const gl = webglState.gl;
  
  // Bind to main canvas
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  // TODO: Implement layer compositing with proper blending
  // This would require additional shaders for texture rendering
}

// Clean up WebGL resources
function cleanupWebGL() {
  if (!webglState.initialized) return;
  
  const gl = webglState.gl;
  
  // Delete buffers
  gl.deleteBuffer(webglState.buffers.position);
  gl.deleteBuffer(webglState.buffers.color);
  gl.deleteBuffer(webglState.buffers.indices);
  
  // Delete shaders and program
  gl.deleteProgram(webglState.program);
  
  // Delete textures and framebuffers
  Object.values(webglState.textures).forEach(texture => {
    gl.deleteTexture(texture);
  });
  
  Object.values(webglState.framebuffers).forEach(layer => {
    gl.deleteTexture(layer.texture);
    gl.deleteFramebuffer(layer.framebuffer);
  });
  
  webglState.initialized = false;
}

// Export functions
window.webglRenderer = {
  init: initWebGL,
  drawRectangle,
  drawCircle,
  batchRenderRectangles,
  createTexture,
  createLayer,
  setCurrentLayer,
  compositeLayers,
  cleanup: cleanupWebGL
}; 