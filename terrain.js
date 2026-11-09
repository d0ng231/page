// A height field lit from the side, with contour lines drawn at equal elevations.
(() => {
  const terrain = document.querySelector('.terrain');
  if (!terrain || !window.IntersectionObserver || !window.ResizeObserver) return;

  const canvas = terrain.querySelector('canvas');
  const intro = terrain.closest('.intro');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  // Skyline heights sampled left to right from the middle and top panels of Matt's
  // "Karst in three frames". Depth and lighting are composed for this view.
  const farRidge = [
    76, 76, 73, 69, 58, 49, 42, 52, 62, 67, 72, 77, 80, 83, 84, 79,
    70, 61, 47, 34, 23, 29, 24, 23, 35, 44, 47, 51, 54, 45, 34, 30,
    31, 27, 17, 17, 18, 18, 9, 13, 13, 12, 6, 4, 0, 0, 6, 24,
    19, 15, 15, 19, 21, 35, 61, 75, 95, 98, 100, 94, 87, 72, 50, 33, 25,
  ];
  const nearRidge = [
    89, 69, 48, 38, 45, 61, 77, 79, 65, 46, 35, 33, 35, 35, 32, 27, 22,
    18, 13, 14, 26, 37, 36, 30, 38, 57, 67, 65, 60, 50, 38, 33, 38,
  ];
  function ridgeHeight(samples, x) {
    const position = Math.max(0, Math.min(1, x)) * (samples.length - 1);
    const left = Math.floor(position);
    const right = Math.min(left + 1, samples.length - 1);
    return (samples[left] + (samples[right] - samples[left]) * (position - left)) / 100;
  }

  function bell(distance) {
    return Math.exp(-distance * distance);
  }

  function elevation(x, z) {
    const spine = -.47 + .23 * Math.sin(x * 1.23) + .13 * Math.sin(x * 2.1 + .4);
    const offset = z - spine;
    const slope = offset / (offset > 0 ? .68 : 1.03);
    const crest = .36 + 1.03 * ridgeHeight(farRidge, .5 + (x - .28 * offset) / 7.2);
    const summit = crest * Math.exp(.10 - Math.sqrt(slope * slope + .01)) * bell(slope * .44);
    const shoulder = (.16 + .51 * ridgeHeight(nearRidge, .56 + x / 8.6))
      * bell((z - .48 - .24 * Math.sin(x * 1.4)) / .66);
    const taper = Math.exp(-((x / 4.1) ** 6));
    return taper * (.65 * (summit + shoulder) + .35 * Math.hypot(summit - shoulder, .12));
  }

  const vertexSource = `#version 300 es
    layout(location = 0) in vec3 position;
    uniform vec2 viewAngles;
    uniform vec2 viewport;
    out vec3 land;
    void main() {
      land = position;
      float yaw = viewAngles.x;
      float pitch = viewAngles.y;
      float across = position.x * cos(yaw) - position.z * sin(yaw);
      float forward = position.x * sin(yaw) + position.z * cos(yaw);
      float up = position.y * cos(pitch) - forward * sin(pitch);
      float depth = forward * cos(pitch) + position.y * sin(pitch);
      float perspective = 1.0 / (1.0 - depth * .035);
      gl_Position = vec4(vec2(across / viewport.x, up - .43) * .88 * perspective, -depth * .2, 1.0);
    }
  `;

  const fragmentSource = `#version 300 es
    precision highp float;
    in vec3 land;
    uniform vec2 viewport;
    uniform float lightPosition;
    out vec4 color;
    void main() {
      vec3 normal = normalize(cross(dFdx(land), dFdy(land)));
      if (normal.y < 0.0) normal = -normal;
      vec3 light = normalize(vec3(-.93 + lightPosition * .16, .57, .42));
      float lit = max(dot(normal, light), 0.0);
      float level = land.y * 23.0;
      float pixels = max(fwidth(level) * viewport.y, .0001);
      float distanceToLine = abs(fract(level + .5) - .5) / pixels;
      float line = (1.0 - smoothstep(.10, .87, distanceToLine)) * (1.0 - smoothstep(.45, 1.1, pixels));
      float major = step(.95, cos(floor(level + .5) * 1.256637));
      float band = (land.x - .65 * land.z - lightPosition) / 1.38;
      float highlight = exp(-band * band);
      float ink = .085 + .34 * lit + .28 * lit * highlight + .14 * major;
      float paper = .008 + .063 * lit * lit + .055 * highlight * lit;
      float edge = (1.0 - smoothstep(3.7, 5.5, abs(land.x))) * (1.0 - smoothstep(1.38, 1.92, abs(land.z)));
      float alpha = (paper + line * ink) * edge * smoothstep(.018, .17, land.y);
      color = vec4(vec3(.95, .96, .95) * alpha, alpha);
    }
  `;

  function createRenderer() {
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' });
    if (!gl) return null;
    const program = gl.createProgram();
    for (const [type, source] of [[gl.VERTEX_SHADER, vertexSource], [gl.FRAGMENT_SHADER, fragmentSource]]) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      gl.attachShader(program, shader);
      gl.deleteShader(shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return null;
    }
    gl.useProgram(program);

    const columns = 176;
    const rows = 80;
    const vertices = [];
    const indices = [];
    for (let row = 0; row <= rows; row++) {
      const z = (row / rows - .5) * 3.84;
      for (let column = 0; column <= columns; column++) {
        const x = (column / columns - .5) * 11;
        vertices.push(x, elevation(x, z), z);
        if (row < rows && column < columns) {
          const a = row * (columns + 1) + column;
          const b = a + columns + 1;
          indices.push(a, b, a + 1, a + 1, b, b + 1);
        }
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    gl.enable(gl.DEPTH_TEST);
    const count = indices.length;
    const angles = gl.getUniformLocation(program, 'viewAngles');
    const viewport = gl.getUniformLocation(program, 'viewport');
    const lightPosition = gl.getUniformLocation(program, 'lightPosition');
    return (yaw, pitch, light) => {
      const density = Math.min(window.devicePixelRatio || 1, 1.75);
      const width = Math.max(1, Math.round(canvas.clientWidth * density));
      const height = Math.max(1, Math.round(canvas.clientHeight * density));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
      gl.uniform2f(viewport, width / height, density);
      gl.uniform2f(angles, yaw, pitch);
      gl.uniform1f(lightPosition, light);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
    };
  }

  let draw;
  let unavailable = false;
  let visible = false;
  let frame = 0;
  let lastTime = 0;
  let elapsed = 0;
  let pointerX = 0;
  let pointerY = 0;
  let targetScroll = 0;
  let x = 0;
  let y = 0;
  let scroll = 0;

  function schedule() {
    if (visible && !document.hidden && !reducedMotion.matches && !unavailable && !frame) {
      frame = requestAnimationFrame(render);
    }
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
  }

  function render(now) {
    frame = 0;
    if (!draw) {
      try { draw = createRenderer(); } catch { draw = null; }
    }
    if (!draw) {
      unavailable = true;
      return;
    }
    const dt = lastTime ? (now - lastTime) / 1000 : 1 / 60;
    lastTime = now;
    elapsed = Math.min(3.8, elapsed + dt);
    const blend = 1 - Math.exp(-dt * 6.5);
    x += (pointerX - x) * blend;
    y += (pointerY - y) * blend;
    scroll += (targetScroll - scroll) * blend;
    const sweep = .5 - .5 * Math.cos(Math.PI * elapsed / 3.8);
    draw(-.13 + .095 * sweep + .12 * x, .31 + .045 * y + .09 * scroll, -2.2 + 3.4 * sweep + 1.7 * x);
    terrain.toggleAttribute('data-live', true);
    if (elapsed < 3.8 || Math.max(Math.abs(pointerX - x), Math.abs(pointerY - y), Math.abs(targetScroll - scroll)) > .001) {
      schedule();
    } else {
      lastTime = 0;
    }
  }

  function updateScroll() {
    if (!visible || reducedMotion.matches || unavailable) return;
    const bounds = intro.getBoundingClientRect();
    targetScroll = Math.min(1, Math.max(0, -bounds.top / bounds.height));
    schedule();
  }

  function syncVisibility() {
    if (reducedMotion.matches) terrain.removeAttribute('data-live');
    if (!visible || document.hidden || reducedMotion.matches) stop();
    else updateScroll();
  }
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    syncVisibility();
  }).observe(terrain);
  new ResizeObserver(updateScroll).observe(terrain);
  document.addEventListener('visibilitychange', syncVisibility);
  reducedMotion.addEventListener('change', syncVisibility);
  window.addEventListener('scroll', updateScroll, { passive: true });
  intro.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || !visible || reducedMotion.matches || unavailable) return;
    const bounds = intro.getBoundingClientRect();
    pointerX = 2 * (event.clientX - bounds.left) / bounds.width - 1;
    pointerY = 1 - 2 * (event.clientY - bounds.top) / bounds.height;
    schedule();
  });
  intro.addEventListener('pointerleave', () => {
    pointerX = 0;
    pointerY = 0;
    schedule();
  });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    stop();
    unavailable = true;
    terrain.removeAttribute('data-live');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    draw = null;
    unavailable = false;
    syncVisibility();
  });
})();
