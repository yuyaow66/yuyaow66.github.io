window.ChairsPoetryEffects = window.ChairsPoetryEffects || {};
(function () {
  window.ChairsPoetryEffects = window.ChairsPoetryEffects || {};
  window.ChairsPoetryEffects.peel = function (env) {
    const { ctx, width, height, drawChair } = env;
    const random = env.random || ((a, b) => a + Math.random() * (b - a));
    const chairCount = Math.max(1, Math.floor(Number(env.chairCount) || 1));
    const primaryChair = Math.max(0, Math.floor(Number(env.chairIndex) || 0)) % chairCount;
    const ratio = Math.max(1, Number(env.pixelRatio) || 2);
    const physicalWidth = Math.max(1, Math.round(width * ratio));
    const physicalHeight = Math.max(1, Math.round(height * ratio));
    const scale = Math.min(width / 450, height / 600);
    const source = env.text || (env.words || []).map(word => word.text).join(' ');
    const makeCanvas = () => typeof document !== 'undefined' && document.createElement ? document.createElement('canvas') : new OffscreenCanvas(physicalWidth, physicalHeight);
    const canvas = makeCanvas();
    canvas.width = physicalWidth;
    canvas.height = physicalHeight;
    const attributes = { alpha: true, antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true, depth: false, stencil: false, powerPreference: 'high-performance' };
    let gl = canvas.getContext('webgl', attributes);
    let renderer = 'webgl';
    if (!gl) { gl = canvas.getContext('webgl2', attributes); renderer = 'webgl2'; }
    if (!gl) throw new Error('The poetry burn requires a working WebGL renderer.');
    if (renderer === 'webgl' && !gl.getExtension('OES_standard_derivatives')) throw new Error('The poetry burn requires WebGL fragment derivatives.');
    if (!gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT)?.precision) throw new Error('The poetry burn requires high precision WebGL fragment shaders.');
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    if (physicalWidth > maxTextureSize || physicalHeight > maxTextureSize) throw new Error('The poetry burn exceeds this device’s native WebGL texture resolution.');
    const textureCanvas = makeCanvas();
    textureCanvas.width = physicalWidth;
    textureCanvas.height = physicalHeight;
    const textCtx = textureCanvas.getContext('2d');
    if (!textCtx) throw new Error('The poetry burn could not create its native-resolution text texture.');
    textCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const gl2 = renderer === 'webgl2';
    const vertexSource = `${gl2 ? '#version 300 es\n' : ''}precision highp float;
${gl2 ? 'in' : 'attribute'} vec2 a_position;
${gl2 ? 'out' : 'varying'} vec2 v_uv;
void main() {
  v_uv = vec2(a_position.x * 0.5 + 0.5, 0.5 - a_position.y * 0.5);
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;
    const fragmentSource = `${gl2 ? '#version 300 es\n' : '#extension GL_OES_standard_derivatives : enable\n'}precision highp float;
${gl2 ? 'in' : 'varying'} vec2 v_uv;
${gl2 ? 'out vec4 finalColor;' : ''}
uniform sampler2D u_text;
uniform vec2 u_size;
uniform float u_ratio;
uniform float u_time;
uniform float u_seed;
uniform int u_count;
uniform vec4 u_origins[4];
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }
float simplex(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = x0.x > x0.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float fbm(vec2 p) {
  return 0.5 + 0.5 * (0.57 * simplex(p) + 0.29 * simplex(p * 2.03 + vec2(7.1, 3.8)) + 0.14 * simplex(p * 4.17 - vec2(9.2, 1.3)));
}
vec3 flame(float s) {
  vec3 c0 = vec3(0.05098, 0.10588, 0.16471);
  vec3 c1 = vec3(0.10588, 0.14902, 0.23137);
  vec3 c2 = vec3(0.15294, 0.25098, 0.37647);
  vec3 c3 = vec3(0.2, 0.36078, 0.50588);
  vec3 c4 = vec3(0.36078, 0.55686, 0.94902);
  vec3 c5 = vec3(0.56471, 0.71373, 1.0);
  vec3 c6 = vec3(0.83922, 0.89412, 1.0);
  vec3 c7 = vec3(1.0);
  if (s > 1.55) return c0;
  if (s > 1.2) return mix(c1, c0, (s - 1.2) / 0.35);
  if (s > 0.95) return mix(c2, c1, (s - 0.95) / 0.25);
  if (s > 0.65) return mix(c3, c2, (s - 0.65) / 0.3);
  if (s > 0.25) return mix(c4, c3, (s - 0.25) / 0.4);
  if (s > 0.0) return mix(c5, c4, s / 0.25);
  if (s > -0.35) return mix(c6, c5, (s + 0.35) / 0.35);
  return mix(c7, c6, smoothstep(-0.65, -0.35, s));
}
void main() {
  vec2 uv = v_uv;
  float gap = 2.0;
  bool finished = false;
  if (u_count > 0) {
    vec2 p = uv * vec2(4.5, 1.8) + vec2(u_seed, u_seed * 0.37);
    vec2 q = vec2(fbm(p * 0.67 + vec2(u_time * 0.014, 1.3)), fbm(p * 0.67 + vec2(5.2, -u_time * 0.009)));
    float density = fbm(p + (q - 0.5) * 1.6);
    density = clamp(0.5 + (density - 0.5) * 1.75, 0.0, 1.0);
    density += simplex(p * vec2(2.9, 2.2) + q * 0.7) * 0.006;
    for (int i = 0; i < 4; i++) {
      if (i < u_count) {
        float progress = clamp((u_time - u_origins[i].z) / 8.0, 0.0, 1.0);
        if (progress >= 1.0) finished = true;
        float distanceFromImpact = length((uv - u_origins[i].xy) * u_size);
        float radial = distanceFromImpact / u_origins[i].w;
        float ignition = exp(-pow(distanceFromImpact / (u_size.x * 0.1), 2.0)) * 0.06;
        float field = radial * 0.92 + (density - 0.5) * 0.42 * smoothstep(0.025, 0.13, radial) - ignition;
        gap = min(gap, field - pow(progress, 1.2) * 1.18);
      }
    }
  }
  float footprint = max(fwidth(gap), 0.000025);
  float signedDistance = gap / footprint / u_ratio;
  float aa = 0.85 / u_ratio;
  float sheet = u_count == 0 ? 1.0 : smoothstep(-aa, aa, signedDistance);
  if (finished) sheet = 0.0;
  vec2 heatUV = uv;
  if (u_count > 0 && !finished) heatUV.x += sin(uv.y * 113.0 + u_time * 9.0) * 0.00115 * exp(-abs(signedDistance) * 0.06);
  vec4 ink = ${gl2 ? 'texture' : 'texture2D'}(u_text, heatUV);
  vec3 navy = vec3(0.10588, 0.16863, 0.28235);
  float tintAlpha = 0.115;
  float baseAlpha = (ink.a + tintAlpha * (1.0 - ink.a)) * sheet;
  vec3 baseRGB = (ink.rgb * ink.a + navy * tintAlpha * (1.0 - ink.a)) / max(0.00001, ink.a + tintAlpha * (1.0 - ink.a));
  float band = u_count == 0 || finished ? 0.0 : smoothstep(-1.0, -0.65, signedDistance) * (1.0 - smoothstep(1.85, 2.2, signedDistance));
  float flicker = 0.94 + 0.06 * sin(u_time * 21.0 + uv.y * 143.0 + uv.x * 79.0);
  float edgeAlpha = band * flicker;
  float alpha = edgeAlpha + baseAlpha * (1.0 - edgeAlpha);
  vec3 premultiplied = flame(signedDistance) * edgeAlpha + baseRGB * baseAlpha * (1.0 - edgeAlpha);
  ${gl2 ? 'finalColor' : 'gl_FragColor'} = alpha > 0.00001 ? vec4(premultiplied / alpha, alpha) : vec4(0.0);
}`;
    const compile = (type, sourceText) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, sourceText);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`The poetry burn shader could not compile: ${log}`);
      }
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, vertexSource);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(`The poetry burn renderer could not link: ${gl.getProgramInfoLog(program)}`);
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.viewport(0, 0, physicalWidth, physicalHeight);
    const uniforms = Object.fromEntries(['u_text', 'u_size', 'u_ratio', 'u_time', 'u_seed', 'u_count', 'u_origins[0]'].map(name => [name, gl.getUniformLocation(program, name)]));
    gl.uniform1i(uniforms.u_text, 0);
    gl.uniform2f(uniforms.u_size, width, height);
    gl.uniform1f(uniforms.u_ratio, ratio);
    gl.uniform1f(uniforms.u_seed, random(0, 43));
    if (env.stage?.dataset) {
      env.stage.dataset.renderer = renderer;
      env.stage.dataset.renderResolution = `${physicalWidth}×${physicalHeight}`;
      env.stage.dataset.pixelRatio = String(ratio);
      env.stage.dataset.textureWidth = String(physicalWidth);
      env.stage.dataset.textureHeight = String(physicalHeight);
    }
    let age = 0;
    let typed = -1;
    let typeLength = 0;
    let lastRender = -1;
    let lastEmission = 0;
    let lastDrag = null;
    let disposed = false;
    let lost = false;
    let fontSize = 21 * scale;
    let font = '';
    let lines = [];
    const origins = [];
    const particles = [];
    const originData = new Float32Array(16);
    const center = { x: width * 0.5, y: height * 0.49 };
    const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
    const smooth = n => { const v = clamp(n, 0, 1); return v * v * (3 - 2 * v); };
    const onContextLost = event => { event.preventDefault(); if (!disposed) lost = true; };
    canvas.addEventListener?.('webglcontextlost', onContextLost);

    function layout() {
      const margin = 34 * scale;
      const available = width - margin * 2;
      let wrapped;
      do {
        font = `400 ${fontSize}px ChairsSupporting, sans-serif`;
        textCtx.font = font;
        wrapped = [];
        source.split('\n').forEach(paragraph => {
          if (!paragraph.trim()) { wrapped.push({ text: '', justify: false }); return; }
          const words = paragraph.trim().split(/\s+/);
          let line = '';
          words.forEach(word => {
            const next = line ? `${line} ${word}` : word;
            if (line && textCtx.measureText(next).width > available) { wrapped.push({ text: line, justify: true }); line = word; }
            else line = next;
          });
          wrapped.push({ text: line, justify: false });
        });
        if (wrapped.length * fontSize * 1.52 <= height - 112 * scale || fontSize <= 14 * scale) break;
        fontSize -= 0.5 * scale;
      } while (true);
      const top = Math.max(62 * scale, (height - wrapped.length * fontSize * 1.52) * 0.4);
      let index = 0;
      lines = wrapped.map((item, i) => {
        const line = { ...item, x: margin, y: top + fontSize + i * fontSize * 1.52, start: index, width: available };
        index += item.text.length + 1;
        return line;
      });
      typeLength = Math.max(0, index - 1);
    }

    function updateText(count) {
      if (typed === count) return false;
      typed = count;
      textCtx.clearRect(0, 0, width, height);
      textCtx.font = font;
      textCtx.textBaseline = 'alphabetic';
      textCtx.fillStyle = '#d2dfff';
      lines.forEach(line => {
        const visible = clamp(count - line.start, 0, line.text.length);
        if (!visible) return;
        if (!line.justify) { textCtx.fillText(line.text.slice(0, visible), line.x, line.y); return; }
        const parts = line.text.split(' ');
        const space = parts.length > 1 ? (line.width - parts.reduce((sum, word) => sum + textCtx.measureText(word).width, 0)) / (parts.length - 1) : 0;
        let x = line.x;
        let cursor = 0;
        parts.forEach(word => {
          const length = clamp(visible - cursor, 0, word.length);
          if (length) textCtx.fillText(word.slice(0, length), x, line.y);
          x += textCtx.measureText(word).width + space;
          cursor += word.length + 1;
        });
      });
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureCanvas);
      return true;
    }

    function spawn(x, y, impact = false) {
      if (particles.length >= 600) particles.shift();
      const chance = random(0, 1);
      particles.push({ x, y, vx: random(-31, 31) * scale * (impact ? 2 : 1), vy: random(-119, -26) * scale, life: random(0.9, 2.15), age: 0, size: random(0.65, chance > 0.98 ? 5.5 : 2.1) * scale, angle: random(-3.14, 3.14), spin: random(-3, 3), phase: random(0, 6.28), kind: chance > 0.98 ? 2 : chance > 0.88 ? 1 : 0, chairVariant: chance > 0.98 && chairCount > 1 ? Math.floor(random(0, chairCount)) : primaryChair, color: ['#5c8ef2', '#90b6ff', '#d6e4ff', '#335c81'][Math.floor(random(0, 4))] });
    }

    function ignite(x, y) {
      if (origins.length >= 4 || origins.some(origin => age - origin.start >= 8)) return;
      const origin = { x: clamp(x, 1, width - 1), y: clamp(y, 1, height - 1), start: age };
      origin.radius = Math.max(Math.hypot(origin.x, origin.y), Math.hypot(width - origin.x, origin.y), Math.hypot(origin.x, height - origin.y), Math.hypot(width - origin.x, height - origin.y));
      origins.push(origin);
      center.x = origin.x;
      center.y = origin.y;
      lastRender = -1;
      for (let i = 0; i < 45; i += 1) spawn(origin.x + random(-6, 6) * scale, origin.y + random(-6, 6) * scale, true);
    }

    function renderShader(force) {
      if (!force && lastRender >= 0 && age - lastRender < 1 / 30) return;
      lastRender = age;
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      originData.fill(0);
      origins.forEach((origin, i) => {
        originData[i * 4] = origin.x / width;
        originData[i * 4 + 1] = origin.y / height;
        originData[i * 4 + 2] = origin.start;
        originData[i * 4 + 3] = origin.radius;
      });
      gl.uniform1f(uniforms.u_time, age);
      gl.uniform1i(uniforms.u_count, origins.length);
      gl.uniform4fv(uniforms['u_origins[0]'], originData);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    function drawMatch(progress, resting) {
      const p = clamp(progress, 0, 1);
      const elapsed = origins.length ? age - origins[0].start : 0;
      const alpha = resting ? clamp(1 - elapsed / 1.6, 0, 1) : 1;
      if (!alpha) return;
      const y = resting ? center.y : -84 * scale + (center.y + 84 * scale) * p * p;
      ctx.save();
      ctx.translate(center.x + (resting ? 0 : Math.sin(p * Math.PI) * 7 * scale), y);
      ctx.rotate(0.015);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#080c12';
      ctx.lineWidth = 4.5 * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, -69 * scale);
      ctx.lineTo(0, -5 * scale);
      ctx.stroke();
      ctx.fillStyle = '#8c1e1e';
      ctx.beginPath();
      ctx.ellipse(0, -1.5 * scale, 5 * scale, 7.5 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(215,117,103,0.6)';
      ctx.beginPath();
      ctx.ellipse(-1.5 * scale, -3.5 * scale, 1.3 * scale, 2.4 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawParticles(dt) {
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.age += dt;
        if (p.age >= p.life) { particles.splice(i, 1); continue; }
        p.vx += Math.sin(age * 6 + p.phase) * dt * 16 * scale;
        p.vy -= 9 * scale * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.angle += p.spin * dt;
        const fraction = p.age / p.life;
        const alpha = Math.sin(Math.PI * fraction) * 0.88;
        const size = p.size * (1 - fraction * 0.6);
        if (p.kind === 2 && drawChair) { drawChair(p.x, p.y, size * 2.5, p.angle, p.color, alpha, p.chairVariant); continue; }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        if (p.kind === 1) {
          ctx.beginPath();
          ctx.moveTo(-size, -size * 0.25);
          ctx.lineTo(size * 0.3, -size * 0.7);
          ctx.lineTo(size * 0.65, size * 0.2);
          ctx.lineTo(-size * 0.1, size * 0.7);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 2 * scale;
          ctx.fillRect(-size * 0.35, -size * 0.6, Math.max(0.6, size * 0.7), Math.max(0.6, size * 1.2));
        }
        ctx.restore();
      }
    }

    function restart() {
      age = 0;
      typed = -1;
      origins.length = 0;
      particles.length = 0;
      lastRender = -1;
      lastEmission = 0;
      lastDrag = null;
      center.x = width * 0.5;
      center.y = height * 0.49;
    }

    layout();
    return {
      renderer,
      frame(dt) {
        if (disposed) return;
        if (lost || gl.isContextLost()) throw new Error('The poetry burn WebGL context was lost.');
        const step = clamp(dt, 0, 0.04);
        age += step;
        if (!origins.length && age >= 3.6) ignite(center.x, center.y);
        const count = origins.length ? typeLength : Math.floor(typeLength * smooth((age - 0.1) / 2.2));
        const changed = updateText(count);
        const finished = origins.some(origin => age - origin.start >= 8);
        if (!finished) {
          renderShader(changed);
          ctx.drawImage(canvas, 0, 0, width, height);
        }
        if (!origins.length && age >= 2.6) drawMatch((age - 2.6) / 1, false);
        if (origins.length && !finished) drawMatch(1, true);
        if (origins.length && !finished && age - lastEmission >= 0.015) {
          const batch = Math.min(10, Math.ceil((age - lastEmission) * 270));
          for (let i = 0; i < batch; i += 1) {
            const origin = origins[Math.floor(random(0, origins.length))];
            const progress = clamp((age - origin.start) / 8, 0, 1);
            const baseRadius = origin.radius * Math.pow(progress, 1.2) * 1.18 / 0.92;
            const waviness = origin.radius * 0.12 * smooth(progress / 0.18);
            for (let attempt = 0; attempt < 7; attempt += 1) {
              const angle = random(0, Math.PI * 2);
              const variation = (Math.sin(angle * 3 + origin.x * 0.01) * 0.6 + Math.sin(angle * 5 + age * 0.17) * 0.4) * waviness;
              const radius = Math.max(0, baseRadius + variation + random(-7, 7) * scale);
              const x = origin.x + Math.cos(angle) * radius;
              const y = origin.y + Math.sin(angle) * radius;
              if (x >= 0 && x <= width && y >= 0 && y <= height) { spawn(x, y); break; }
            }
          }
          lastEmission = age;
        }
        drawParticles(step);
      },
      isIdle() { return origins.some(origin => age - origin.start >= 8) && !particles.length; },
      pointer(type, point) {
        if (disposed) return;
        if (type === 'down') {
          age = Math.max(age, 3.6);
          ignite(point.x, point.y);
          lastDrag = { x: point.x, y: point.y };
        } else if (type === 'move' && point.pressed && lastDrag && Math.hypot(point.x - lastDrag.x, point.y - lastDrag.y) > 82 * scale) {
          ignite(point.x, point.y);
          lastDrag = { x: point.x, y: point.y };
        } else if (type === 'up' || type === 'leave') lastDrag = null;
      },
      burst() {
        if (!origins.length && age < 3.6) { age = 2.6; lastRender = -1; }
        else restart();
      },
      dispose() {
        if (disposed) return;
        disposed = true;
        particles.length = 0;
        origins.length = 0;
        canvas.removeEventListener?.('webglcontextlost', onContextLost);
        gl.deleteTexture(texture);
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        gl.deleteShader(vertex);
        gl.deleteShader(fragment);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        canvas.width = 1;
        canvas.height = 1;
        textureCanvas.width = 1;
        textureCanvas.height = 1;
      }
    };
  };
}());

(() => {
  const registry = window.ChairsPoetryEffects = window.ChairsPoetryEffects || {};
  registry.weave = env => {
    const { ctx, width, height, drawChair } = env;
    const random = env.random || ((min, max) => min + Math.random() * (max - min));
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const blue = '#d5e3ff';
    const source = Array.from((env.text || (env.words || []).map(word => word.text).join(' ') || 'A chair holds the shape of someone who has gone. ').replace(/\s+/g, ' '));
    const cols = width >= 390 ? 50 : 42;
    const rows = 65;
    const marginX = Math.min(25, width * 0.058);
    const marginY = Math.min(31, height * 0.055);
    const cellX = (width - marginX * 2) / (cols - 1);
    const cellY = (height - marginY * 2) / (rows - 1);
    const fontSize = Math.min(cellX * 1.2, cellY * 1.15);
    const nodes = [];
    const links = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = marginX + col * cellX;
        const y = marginY + row * cellY;
        nodes.push({
          x,
          y,
          px: x,
          py: y,
          rx: x,
          ry: y,
          char: source[(row * cols + col) % source.length],
          pinned: col === 0 || col === cols - 1 || row === 0 || row === rows - 1,
          shed: -5
        });
      }
    }
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col;
        if (col < cols - 1) links.push({ a: index, b: index + 1, length: cellX, strength: 0.88 });
        if (row < rows - 1) links.push({ a: index, b: index + cols, length: cellY, strength: 0.88 });
        if (col < cols - 1 && row < rows - 1 && (row + col) % 2 === 0) links.push({ a: index, b: index + cols + 1, length: Math.hypot(cellX, cellY), strength: 0.22 });
      }
    }
    const chairSize = Math.min(width * 0.224, height * 0.168);
    const chairHeight = chairSize * 1.18;
    const suppliedShape = Array.isArray(env.chairShape) ? env.chairShape : env.chairShape?.polygon;
    const defaultShape = [[-0.33, -0.48], [0.05, -0.55], [0.15, -0.1], [0.4, 0.08], [0.42, 0.45], [-0.27, 0.49], [-0.42, 0.32], [-0.32, 0.1]];
    const rawShape = suppliedShape?.length >= 3 ? suppliedShape : defaultShape;
    const shapeStep = Math.max(1, Math.ceil(rawShape.length / 64));
    const chairShape = rawShape.filter((_, index) => index % shapeStep === 0).map(point => ({ x: Number(point.x ?? point[0]), y: Number(point.y ?? point[1]) }));
    const chair = { x: width * 0.53, y: height * 0.51, vx: 88, vy: 68, angle: 0 };
    const shapeEdges = chairShape.map((b, index) => {
      const a = chairShape[(index + chairShape.length - 1) % chairShape.length];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      return { a, b, dx, dy, lengthSquared: dx * dx + dy * dy };
    });
    let rotationAngle = NaN;
    let cosine = 1;
    let sine = 0;
    const updateRotation = () => {
      if (rotationAngle === chair.angle) return;
      rotationAngle = chair.angle;
      cosine = Math.cos(rotationAngle);
      sine = Math.sin(rotationAngle);
    };
    const localPoint = (x, y) => {
      updateRotation();
      const dx = (x - chair.x) / chairHeight;
      const dy = (y - chair.y) / chairHeight;
      return { x: dx * cosine + dy * sine, y: -dx * sine + dy * cosine };
    };
    const worldPoint = point => {
      updateRotation();
      return { x: chair.x + (point.x * cosine - point.y * sine) * chairHeight, y: chair.y + (point.x * sine + point.y * cosine) * chairHeight };
    };
    const shapeContact = (x, y) => {
      const point = localPoint(x, y);
      let inside = false;
      let nearestX = 0;
      let nearestY = 0;
      let nearestSquared = Infinity;
      for (const { a, b, dx, dy, lengthSquared } of shapeEdges) {
        if ((a.y > point.y) !== (b.y > point.y) && point.x < dx * (point.y - a.y) / dy + a.x) inside = !inside;
        const fraction = lengthSquared > 0 ? clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared, 0, 1) : 0;
        const edgeX = a.x + dx * fraction;
        const edgeY = a.y + dy * fraction;
        const distanceSquared = (edgeX - point.x) ** 2 + (edgeY - point.y) ** 2;
        if (distanceSquared < nearestSquared) {
          nearestSquared = distanceSquared;
          nearestX = edgeX;
          nearestY = edgeY;
        }
      }
      const distance = Math.sqrt(nearestSquared);
      const outwardX = inside && distance > 0.0001 ? (nearestX - point.x) / distance * 0.006 : 0;
      const outwardY = inside && distance > 0.0001 ? (nearestY - point.y) / distance * 0.006 : 0;
      const edge = worldPoint({ x: nearestX + outwardX, y: nearestY + outwardY });
      return { inside, x: edge.x, y: edge.y, distance: distance * chairHeight };
    };
    const chairExtents = () => {
      updateRotation();
      const xs = chairShape.map(point => (point.x * cosine - point.y * sine) * chairHeight);
      const ys = chairShape.map(point => (point.x * sine + point.y * cosine) * chairHeight);
      return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
    };
    const pointerState = { x: -1000, y: -1000, active: false, pressed: false };
    const particles = [];
    const wake = [];
    let wakeClock = 0;
    let grab = null;
    let age = 0;
    let boost = 0;
    let pulse = null;
    let emission = 0;
    let disposed = false;
    const spawnParticle = (x, y, char, fragment = false, energetic = false) => {
      if (particles.length >= 155) particles.shift();
      const life = random(1.1, 2.5);
      particles.push({
        x,
        y,
        vx: chair.vx * 0.27 + random(-62, 62) * (energetic ? 1.8 : 1),
        vy: random(-120, -35) * (energetic ? 1.45 : 1),
        angle: random(-Math.PI, Math.PI),
        spin: random(-5, 5),
        life,
        total: life,
        char: char === ' ' ? source[Math.floor(random(0, source.length))] : char,
        fragment,
        size: fragment ? random(7, 18) : random(9, 13),
        bounced: false
      });
    };
    const moveChair = dt => {
      if (age < 0.64) return;
      boost = Math.max(0, boost - dt);
      const extents = chairExtents();
      const left = marginX - extents.left + 5;
      const right = width - marginX - extents.right - 5;
      const top = marginY - extents.top + 5;
      const bottom = height - marginY - extents.bottom - 5;
      if (pointerState.active && dt > 0) {
        const targetX = clamp(pointerState.x, left, right);
        const targetY = clamp(pointerState.y, top, bottom);
        const follow = 1 - Math.exp(-dt * 7);
        const dx = clamp((targetX - chair.x) * follow, -420 * dt, 420 * dt);
        const dy = clamp((targetY - chair.y) * follow, -420 * dt, 420 * dt);
        chair.vx = dx / dt;
        chair.vy = dy / dt;
        chair.x += dx;
        chair.y += dy;
      } else {
        chair.vx += Math.sin(age * 0.91) * dt * 11;
        chair.vy += Math.cos(age * 0.73) * dt * 10;
        const targetSpeed = boost > 0 ? 320 : 86;
        const speed = Math.hypot(chair.vx, chair.vy);
        const correction = 1 + (targetSpeed / Math.max(speed, 1) - 1) * Math.min(1, dt * (boost > 0 ? 1.2 : 0.8));
        chair.vx *= correction;
        chair.vy *= correction;
        chair.x += clamp(chair.vx, -390, 390) * dt;
        chair.y += clamp(chair.vy, -390, 390) * dt;
      }
      wake.forEach(point => { point.age += dt; });
      while (wake.length && wake[0].age > 2) wake.shift();
      wakeClock += dt;
      if (wakeClock >= 0.12) {
        wakeClock %= 0.12;
        wake.push({ x: chair.x, y: chair.y, age: 0 });
      }
      let bounced = false;
      if (chair.x < left || chair.x > right) {
        chair.x = clamp(chair.x, left, right);
        chair.vx = (chair.x <= left ? 1 : -1) * Math.abs(chair.vx);
        bounced = true;
      }
      if (chair.y < top || chair.y > bottom) {
        chair.y = clamp(chair.y, top, bottom);
        chair.vy = (chair.y <= top ? 1 : -1) * Math.abs(chair.vy);
        bounced = true;
      }
      if (bounced && age > 1.3) {
        spawnParticle(chair.x, chair.y + chairHeight * 0.3, '—', true);
        spawnParticle(chair.x, chair.y + chairHeight * 0.3, '—', true);
      }
      chair.angle += (clamp(chair.vx * 0.001 + chair.vy * 0.0004, -0.22, 0.22) - chair.angle) * Math.min(1, dt * 5);
      if (env.stage?.dataset) {
        env.stage.dataset.chairX = chair.x.toFixed(2);
        env.stage.dataset.chairY = chair.y.toFixed(2);
        env.stage.dataset.chairControl = pointerState.active ? 'pointer' : 'drift';
      }
    };
    const integrate = dt => {
      const drag = Math.pow(0.982, dt * 60);
      const deltaSquared = dt * dt;
      const active = age > 0.64;
      const reach = chairHeight * 0.43;
      const wakeSegments = [];
      if (active) {
        for (let index = 1; index < wake.length; index++) {
          const a = wake[index - 1];
          const b = wake[index];
          if (b.age < 0.15) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const lengthSquared = dx * dx + dy * dy;
          if (lengthSquared >= 4) wakeSegments.push({ a, b, dx, dy, lengthSquared });
        }
      }
      nodes.forEach(node => {
        if (node.pinned) return;
        const vx = clamp((node.x - node.px) * drag, -15, 15);
        const vy = clamp((node.y - node.py) * drag, -15, 15);
        node.px = node.x;
        node.py = node.y;
        node.x += vx + (node.rx - node.x) * 3.7 * deltaSquared;
        node.y += vy + ((node.ry - node.y) * 3.7 + 9) * deltaSquared;
        if (active) {
          let nearestWake = null;
          let wakeDistanceSquared = reach * reach;
          for (const { a, b, dx, dy, lengthSquared } of wakeSegments) {
            const fraction = ((node.x - a.x) * dx + (node.y - a.y) * dy) / lengthSquared;
            if (fraction < 0 || fraction > 1) continue;
            const x = a.x + dx * fraction;
            const y = a.y + dy * fraction;
            const distanceSquared = (x - node.x) ** 2 + (y - node.y) ** 2;
            if (distanceSquared < wakeDistanceSquared) {
              wakeDistanceSquared = distanceSquared;
              nearestWake = { x, y, age: b.age };
            }
          }
          if (nearestWake) {
            const distance = Math.sqrt(wakeDistanceSquared);
            const weight = Math.pow(1 - distance / reach, 1.8) * Math.max(0, 1 - nearestWake.age / 1.4);
            const force = Math.min(0.09, dt * 3.2 * weight);
            node.x += (nearestWake.x - node.x) * force;
            node.y += (nearestWake.y - node.y) * force;
          }
        }
        if (pulse) {
          const dx = node.x - pulse.x;
          const dy = node.y - pulse.y;
          const along = dx * pulse.dx + dy * pulse.dy;
          const across = -dx * pulse.dy + dy * pulse.dx;
          const front = pulse.age * 270;
          const wave = Math.exp(-(((along - front) / 32) ** 2 + (across / 70) ** 2)) * Math.max(0, 1 - pulse.age / 1.4);
          node.x += pulse.dx * wave * dt * 105;
          node.y += pulse.dy * wave * dt * 105;
        }
      });
      if (grab) {
        grab.forEach(item => {
          item.node.x += (pointerState.x + item.ox - item.node.x) * item.weight * 0.64;
          item.node.y += (pointerState.y + item.oy - item.node.y) * item.weight * 0.64;
        });
      }
      for (let iteration = 0; iteration < 2; iteration++) {
        links.forEach(link => {
          const a = nodes[link.a];
          const b = nodes[link.b];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 0.001) return;
          const factor = (distance - link.length) / distance * link.strength;
          const share = a.pinned || b.pinned ? 1 : 0.5;
          const cx = dx * factor * share;
          const cy = dy * factor * share;
          if (!a.pinned) {
            a.x += cx;
            a.y += cy;
          }
          if (!b.pinned) {
            b.x -= cx;
            b.y -= cy;
          }
        });
        if (active) {
          nodes.forEach(node => {
            if (node.pinned) return;
            if (Math.abs(node.x - chair.x) > chairHeight * 0.7 || Math.abs(node.y - chair.y) > chairHeight * 0.7) return;
            const contact = shapeContact(node.x, node.y);
            if (!contact.inside) return;
            const correctionX = contact.x - node.x;
            const correctionY = contact.y - node.y;
            node.x += correctionX * 0.93;
            node.y += correctionY * 0.93;
            node.px += correctionX * 0.74;
            node.py += correctionY * 0.74;
          });
        }
      }
      nodes.forEach(node => {
        if (node.pinned) {
          node.x = node.px = node.rx;
          node.y = node.py = node.ry;
        } else {
          node.x = clamp(node.x, 3, width - 3);
          node.y = clamp(node.y, 3, height - 3);
        }
      });
      emission += active ? dt * (boost > 0 ? 26 : 11) : 0;
      if (emission >= 1) {
        emission %= 1;
        let candidate = null;
        let count = 0;
        nodes.forEach(node => {
          if (node.pinned || age - node.shed < 1.4 || node.char === ' ') return;
          if (Math.abs(node.x - chair.x) > chairHeight * 0.7 || Math.abs(node.y - chair.y) > chairHeight * 0.7) return;
          const contact = shapeContact(node.x, node.y);
          if (contact.distance < cellX * 1.4) {
            count++;
            if (random(0, count) < 1) candidate = node;
          }
        });
        if (candidate) {
          candidate.shed = age;
          spawnParticle(candidate.x, candidate.y, candidate.char, random(0, 1) < 0.22, boost > 0);
        }
      }
    };
    const drawFabric = () => {
      const reveal = clamp((age - 0.04) / 1.1, 0, 1);
      ctx.save();
      ctx.strokeStyle = '#bcafe3';
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = (pointerState.pressed ? 0.39 : 0.3) * reveal;
      ctx.beginPath();
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const node = nodes[row * cols + col];
          if (col === 0) ctx.moveTo(node.x, node.y);
          else ctx.lineTo(node.x, node.y);
        }
      }
      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
          const node = nodes[row * cols + col];
          if (row === 0) ctx.moveTo(node.x, node.y);
          else ctx.lineTo(node.x, node.y);
        }
      }
      ctx.stroke();
      ctx.font = `600 ${fontSize.toFixed(2)}px ChairsSupporting, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = blue;
      const count = Math.min(nodes.length, Math.ceil(reveal * nodes.length));
      for (let i = 0; i < count; i++) {
        const node = nodes[i];
        if (node.char === ' ') continue;
        const shedFade = age - node.shed < 0.72 ? 0.3 + (age - node.shed) / 0.72 * 0.7 : 1;
        ctx.globalAlpha = shedFade;
        ctx.fillText(node.char, node.x, node.y);
      }
      ctx.restore();
    };
    const drawParticles = dt => {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let index = particles.length - 1; index >= 0; index--) {
        const particle = particles[index];
        particle.life -= dt;
        if (particle.life <= 0) {
          particles.splice(index, 1);
          continue;
        }
        particle.vy += dt * 195;
        particle.vx *= Math.exp(-dt * 0.18);
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.angle += particle.spin * dt;
        if (particle.y > height - 12 && !particle.bounced) {
          particle.y = height - 12;
          particle.vy *= -0.3;
          particle.vx *= 0.6;
          particle.spin *= 0.6;
          particle.bounced = true;
        }
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.angle);
        ctx.globalAlpha = Math.min(1, particle.life / 0.55) * 0.8;
        ctx.fillStyle = particle.fragment ? '#bc6b7e' : blue;
        if (particle.fragment) {
          ctx.fillRect(-particle.size / 2, -1.25, particle.size, 2.5);
          if (particle.size > 12) ctx.fillRect(particle.size * 0.15, -particle.size * 0.42, 2.2, particle.size * 0.5);
        } else {
          ctx.font = `${particle.size.toFixed(1)}px ChairsSupporting, sans-serif`;
          ctx.fillText(particle.char, 0, 0);
        }
        ctx.restore();
      }
      ctx.restore();
    };
    return {
      frame(dt) {
        if (disposed) return;
        dt = clamp(dt, 0, 0.04);
        age += dt;
        if (pulse) {
          pulse.age += dt;
          if (pulse.age > 1.4) pulse = null;
        }
        moveChair(dt);
        integrate(dt);
        drawFabric();
        const alpha = clamp((age - 0.52) * 2.5, 0, 1);
        if (alpha > 0) {
          drawChair(chair.x, chair.y, chairHeight, chair.angle, blue, alpha);
        }
        drawParticles(dt);
      },
      pointer(type, point) {
        pointerState.x = point.x;
        pointerState.y = point.y;
        pointerState.active = type !== 'leave' && point.active !== false;
        pointerState.pressed = type === 'down' || (type !== 'up' && type !== 'leave' && !!point.pressed);
        if (type === 'down') {
          let nearest = null;
          let nearestDistance = 50;
          nodes.forEach(node => {
            if (node.pinned) return;
            const distance = Math.hypot(node.x - point.x, node.y - point.y);
            if (distance < nearestDistance) {
              nearest = node;
              nearestDistance = distance;
            }
          });
          grab = nearest ? nodes.filter(node => !node.pinned && Math.hypot(node.x - nearest.x, node.y - nearest.y) < 86).map(node => ({
            node,
            ox: node.x - point.x,
            oy: node.y - point.y,
            weight: Math.pow(1 - Math.hypot(node.x - nearest.x, node.y - nearest.y) / 86, 1.8)
          })) : null;
        }
        if (type === 'up' || type === 'leave') grab = null;
      },
      burst() {
        age = Math.max(age, 1.2);
        boost = 2.6;
        chair.vx = (random(0, 1) < 0.5 ? -1 : 1) * random(240, 330);
        chair.vy = (random(0, 1) < 0.5 ? -1 : 1) * random(150, 230);
        const speed = Math.max(1, Math.hypot(chair.vx, chair.vy));
        pulse = { x: chair.x, y: chair.y, dx: chair.vx / speed, dy: chair.vy / speed, age: 0 };
        for (let i = 0; i < 22; i++) {
          const index = Math.floor(random(0, chairShape.length));
          const a = chairShape[index];
          const b = chairShape[(index + 1) % chairShape.length];
          const fraction = random(0, 1);
          const point = worldPoint({ x: a.x + (b.x - a.x) * fraction, y: a.y + (b.y - a.y) * fraction });
          spawnParticle(point.x, point.y, source[Math.floor(random(0, source.length))], i % 4 === 0, true);
        }
      },
      dispose() {
        disposed = true;
        grab = null;
        particles.length = 0;
        wake.length = 0;
      }
    };
  };
})();

(function () {
  window.ChairsPoetryEffects = window.ChairsPoetryEffects || {};
  window.ChairsPoetryEffects.flight = function (env) {
    const { ctx, width: W, height: H } = env;
    const ink = '#d7e6ff';
    const paper = '#203553';
    const random = env.random || ((a, b) => a + Math.random() * (b - a));
    const chairCount = Math.max(1, Math.floor(Number(env.chairCount) || 1));
    const primaryChair = ((Math.floor(Number(env.chairIndex) || 0) % chairCount) + chairCount) % chairCount;
    let chairSerial = primaryChair;
    const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
    const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
    const mix = (a, b, t) => a + (b - a) * t;
    const S = Math.min(W / 450, H / 600);
    const page = { x: W * 0.09, y: H * 0.065, w: W * 0.82, h: H * 0.805 };
    const pointer = { x: W * 0.5, y: H * 0.4, active: false };
    const words = [];
    const furniture = [];
    const letters = [];
    const meteors = [];
    let age = 0;
    let previousAge = 0;
    let meteorCarry = 0;
    let fontSize = 13 * S;
    let lineHeight = 16 * S;
    let textTop = page.y + 24 * S;
    const source = String(env.text || env.words && env.words.map(w => w.text).join(' ') || 'The Table and the Chair');

    function layout(size) {
      const result = [];
      const margin = 21 * S;
      const maxWidth = page.w - margin * 2;
      const lh = size * 1.32;
      let y = textTop;
      ctx.font = `${size}px ChairsSupporting, sans-serif`;
      const space = ctx.measureText(' ').width;
      const lines = source.replace(/\r/g, '').split('\n');
      for (const line of lines) {
        if (!line.trim()) { y += lh * 0.52; continue; }
        let x = page.x + margin;
        for (const text of line.trim().split(/\s+/)) {
          const width = ctx.measureText(text).width;
          if (x + width > page.x + margin + maxWidth && x > page.x + margin) {
            x = page.x + margin;
            y += lh;
          }
          result.push({ text, x, y, width, start: 0, released: false, forced: Infinity });
          x += width + space;
        }
        y += lh;
      }
      return { result, bottom: y, lh };
    }

    let measured = layout(fontSize);
    while (measured.bottom > page.y + page.h - 23 * S && fontSize > 7.5 * S) {
      fontSize -= 0.35 * S;
      measured = layout(fontSize);
    }
    lineHeight = measured.lh;
    words.push(...measured.result);
    words.forEach((word, i) => { word.start = 4.65 + i / Math.max(1, words.length - 1) * 4.1; });

    function polygon(points, fill, stroke, alpha = 1) {
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.beginPath();
      points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
      ctx.restore();
    }

    function chair(x, y, size, angle, alpha, unfold = 0, variant = primaryChair) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle - unfold * 0.055);
      ctx.scale(1 + unfold * 0.025, 1 - unfold * 0.12);
      if (typeof env.drawChair === 'function') env.drawChair(0, 0, size * 1.9, 0, null, alpha, variant);
      ctx.restore();
    }

    function sheet(open, alpha) {
      if (alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      const pw = page.w * mix(0.22, 1, open);
      const ph = page.h * mix(0.025, 1, open);
      const x = W * 0.5 - pw * 0.5;
      const y = mix(H * 0.64, page.y, open);
      ctx.shadowColor = 'rgba(5,12,28,.22)';
      ctx.shadowBlur = 22 * S;
      ctx.shadowOffsetY = 9 * S;
      ctx.fillStyle = paper;
      ctx.fillRect(x, y, pw, ph);
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(183,203,230,.28)';
      ctx.lineWidth = 0.6 * S;
      ctx.strokeRect(x, y, pw, ph);
      if (open > 0.55) {
        ctx.globalAlpha *= 0.16;
        ctx.beginPath();
        ctx.moveTo(x + pw * 0.5, y); ctx.lineTo(x + pw * 0.5, y + ph);
        ctx.moveTo(x, y + ph * 0.54); ctx.lineTo(x + pw, y + ph * 0.54);
        ctx.strokeStyle = ink; ctx.stroke();
      }
      ctx.restore();
    }

    function text(alpha, typing, returnText) {
      ctx.save();
      ctx.font = `${fontSize}px ChairsSupporting, sans-serif`;
      ctx.textBaseline = 'top';
      ctx.fillStyle = ink;
      const total = Math.floor(words.length * typing);
      for (let i = 0; i < words.length; i++) {
        if (i > total) break;
        const word = words[i];
        const departure = Math.min(word.start, word.forced);
        const gone = returnText ? 0 : ease((age - departure) / 0.32);
        ctx.globalAlpha = alpha * (1 - gone);
        if (ctx.globalAlpha < 0.01) continue;
        const lift = returnText ? 0 : gone * 8 * S;
        ctx.fillText(word.text, word.x, word.y - lift);
      }
      if (typing > 0 && typing < 1 && words.length) {
        const w = words[Math.min(words.length - 1, total)];
        ctx.globalAlpha = alpha * (0.45 + Math.sin(age * 18) * 0.3);
        ctx.fillRect(w.x + w.width + 2 * S, w.y, 0.8 * S, fontSize);
      }
      ctx.restore();
    }

    function launch(word, index) {
      furniture.push({
        x: word.x + word.width * 0.5, y: word.y + fontSize * 0.5,
        born: age, seed: random(0, Math.PI * 2), side: index % 2 ? 1 : -1,
        size: random(14, 25) * S,
        variant: chairSerial++ % chairCount,
        drift: random(0.72, 1.18), letter: word.text.slice(0, 1)
      });
      for (let n = 0; n < 2; n++) letters.push({
        ch: word.text[Math.floor(random(0, word.text.length))],
        x: word.x + random(0, word.width), y: word.y,
        vx: random(-18, 18) * S, vy: random(-21, -8) * S,
        spin: random(-2, 2), angle: random(-0.2, 0.2), life: random(1.4, 2.2), born: age
      });
    }

    function drawFlights(dt) {
      for (let i = furniture.length - 1; i >= 0; i--) {
        const f = furniture[i];
        const t = age - f.born;
        const p = clamp(t / 2.6);
        if (p >= 1) { furniture.splice(i, 1); continue; }
        const spiral = t * 2.6 + f.seed;
        const reach = (35 + 125 * p) * S;
        let x = f.x + f.side * reach * Math.sin(spiral * 0.58) + Math.cos(spiral) * 18 * S * p;
        let y = f.y - p * H * 0.74 + Math.sin(spiral * 1.2) * 24 * S * p;
        if (pointer.active) {
          const influence = Math.sin(p * Math.PI) * 0.25;
          x += (pointer.x - x) * influence;
          y += (pointer.y - y) * influence;
        }
        const alpha = ease(t / 0.2) * (1 - ease((p - 0.78) / 0.22));
        const scale = mix(0.3, 1.5, ease(p * 2.2));
        const angle = Math.sin(spiral) * 0.32 + f.side * p * 0.45;
        chair(x, y, f.size * scale, angle, alpha, 0, f.variant);
        if (Math.random() < dt * 3 && letters.length < 180) letters.push({
          ch: f.letter, x, y, vx: random(-13, 13) * S, vy: 8 * S,
          spin: random(-2, 2), angle, life: 1.8, born: age
        });
      }
      ctx.save();
      ctx.font = `${9 * S}px ChairsSupporting, sans-serif`;
      ctx.fillStyle = ink;
      for (let i = letters.length - 1; i >= 0; i--) {
        const l = letters[i];
        const t = age - l.born;
        if (t > l.life) { letters.splice(i, 1); continue; }
        l.x += l.vx * dt;
        l.y += l.vy * dt;
        l.vy += 28 * S * dt;
        l.angle += l.spin * dt;
        ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.angle);
        ctx.globalAlpha = 0.6 * (1 - t / l.life);
        ctx.fillText(l.ch, 0, 0); ctx.restore();
      }
      ctx.restore();
    }

    function shower(dt) {
      if (age > 10.75 && age < 13.55) {
        meteorCarry += dt * 29;
        while (meteorCarry >= 1) {
          meteorCarry--;
          meteors.push({
            x: random(-W * 0.15, W * 1.15), y: random(-110, -15) * S,
            targetX: W * 0.5 + random(-22, 22) * S,
            targetY: H * 0.66 + random(-15, 15) * S,
            born: age, life: random(0.65, 1.2), size: random(6, 12) * S,
            variant: chairSerial++ % chairCount,
            phase: random(0, 6), ch: 'CHAIR'[Math.floor(random(0, 5))]
          });
        }
      }
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        const p = (age - m.born) / m.life;
        if (p >= 1) { meteors.splice(i, 1); continue; }
        const x = mix(m.x, m.targetX, p) + Math.sin(p * 7 + m.phase) * 12 * S * Math.sin(p * Math.PI);
        const y = mix(m.y, m.targetY, p * p);
        ctx.save();
        ctx.strokeStyle = 'rgba(211,227,255,.3)'; ctx.lineWidth = 0.8 * S;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (m.x - m.targetX) * 0.1, y - 44 * S); ctx.stroke();
        if (i % 3) chair(x, y, m.size, p * 2 + m.phase, 0.7 * (1 - p * 0.3), 0, m.variant);
        else {
          ctx.translate(x, y); ctx.rotate(p * 5 + m.phase);
          ctx.fillStyle = ink; ctx.globalAlpha = 0.65; ctx.font = `${m.size * 1.5}px ChairsSupporting, sans-serif`;
          ctx.fillText(m.ch, 0, 0);
        }
        ctx.restore();
      }
    }

    function reset() {
      age = 0;
      previousAge = 0;
      meteorCarry = 0;
      chairSerial = primaryChair;
      furniture.length = 0;
      letters.length = 0;
      meteors.length = 0;
      words.forEach(word => { word.released = false; word.forced = Infinity; });
    }

    return {
      frame(dt) {
        previousAge = age;
        age = Math.min(16.4, age + dt);
        ctx.save();
        ctx.strokeStyle = 'rgba(211,227,255,.025)';
        ctx.lineWidth = 0.5 * S;
        for (let i = 0; i < 44; i++) {
          const y = (i + 0.5) * H / 44;
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y + 0.5 * S); ctx.stroke();
        }
        ctx.restore();
        const opening = ease((age - 0.6) / 1.65);
        const closing = ease((age - 14.35) / 1.7);
        const sheetOpacity = opening * (1 - closing);
        const paperAfterFlight = age < 9.9 ? 1 : 1 - ease((age - 9.9) / 0.75);
        const returnPaper = ease((age - 13.35) / 0.65);
        const visiblePaper = Math.max(paperAfterFlight, returnPaper) * sheetOpacity;
        sheet(opening * (1 - closing), visiblePaper);
        if (age < 2.5) {
          const alpha = 1 - ease((age - 1.15) / 1.25);
          chair(W * 0.5, H * 0.64, 110 * S, Math.sin(age * 2) * 0.025, alpha, opening);
        }
        if (age > 1.9 && age < 10.65) text(visiblePaper * ease((age - 1.9) / 0.4), clamp((age - 2) / 2.35), false);
        if (age >= 4.5 && age < 10) {
          for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const depart = Math.min(word.start, word.forced);
            if (!word.released && age >= depart) {
              word.released = true;
              if (i % 3 === 0 || word.forced < word.start) launch(word, i);
            }
          }
        }
        drawFlights(dt);
        if (age > 10.45 && age < 14.4) {
          const alpha = ease((age - 10.45) / 0.5) * (1 - ease((age - 13.8) / 0.6));
          chair(W * 0.5, H * 0.66, mix(72, 92, ease((age - 10.6) / 3)) * S, 0, alpha);
          ctx.save(); ctx.globalAlpha = alpha * 0.2; ctx.fillStyle = ink;
          ctx.beginPath(); ctx.ellipse(W * 0.5, H * 0.83, 63 * S, 5 * S, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }
        shower(dt);
        if (age > 13.6 && age < 15.2) text(ease((age - 13.6) / 0.45) * (1 - closing), 1, true);
        if (age > 14.35) chair(W * 0.5, H * 0.64, 110 * S, 0, closing, 1 - closing);
        ctx.save();
        ctx.fillStyle = ink;
        ctx.globalAlpha = age < 0.8 ? 0.5 : age > 15.7 ? 0.48 : 0.24;
        ctx.textAlign = 'center'; ctx.font = `${9 * S}px ChairsSupporting, sans-serif`;
        ctx.fillText(age > 15.7 ? 'CLICK TO UNFOLD AGAIN' : 'WORDS TAKE A WALK', W * 0.5, H * 0.945);
        ctx.restore();
      },
      isIdle() { return age >= 16.4 && !furniture.length && !letters.length && !meteors.length; },
      pointer(type, p) {
        if (p && Number.isFinite(p.x)) { pointer.x = p.x; pointer.y = p.y; }
        pointer.active = type !== 'leave';
        if (type !== 'down') return;
        if (age >= 14) { reset(); return; }
        if (age < 2.2) { age = 2.2; return; }
        let nearest = [];
        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          if (word.released) continue;
          const dx = word.x + word.width * 0.5 - pointer.x;
          const dy = word.y - pointer.y;
          const distance = dx * dx + dy * dy;
          if (distance < 130 * 130 * S * S) nearest.push({ word, distance });
        }
        nearest.sort((a, b) => a.distance - b.distance);
        if (age < 4.5) age = 4.5;
        nearest.slice(0, 13).forEach((item, i) => { item.word.forced = age + i * 0.028; });
      },
      burst() { reset(); },
      dispose() { furniture.length = 0; letters.length = 0; meteors.length = 0; }
    };
  };
})();

(function () {
  window.ChairsPoetryEffects = window.ChairsPoetryEffects || {};
  window.ChairsPoetryEffects.rain = function (env) {
    const { ctx, width: W, height: H } = env;
    const blue = '#d3e3ff';
    const S = Math.min(W / 450, H / 600);
    const random = env.random || ((a, b) => a + Math.random() * (b - a));
    const chairCount = Math.max(1, Math.floor(Number(env.chairCount) || 1));
    const primaryChair = ((Math.floor(Number(env.chairIndex) || 0) % chairCount) + chairCount) % chairCount;
    let chairSerial = primaryChair;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const source = String(env.text || env.words && env.words.map(w => w.text).join(' ') || 'A Chair on a Highway on a Rainy Afternoon').replace(/\s+/g, ' ').trim();
    const left = 27 * S;
    const right = W - left;
    const top = 33 * S;
    const floor = H * 0.904;
    let size = 14 * S;
    let advance = size * 0.68;
    let columns = Math.max(1, Math.floor((right - left) / advance));
    let lineHeight = size * 0.98;
    while (Math.ceil(source.length / columns) * lineHeight > H * 0.64 && size > 8.7 * S) {
      size -= 0.25 * S;
      advance = size * 0.68;
      columns = Math.max(1, Math.floor((right - left) / advance));
      lineHeight = size * 0.98;
    }
    const glyphs = [];
    const bodies = [];
    const droplets = [];
    const ripples = [];
    const fragments = [];
    const pointer = { x: W * 0.5, y: H * 0.4, active: false, pressed: false, dx: 0 };
    let age = 0;
    let typed = 0;
    let releaseCarry = 0;
    let dragCooldown = 0;
    let ending = false;
    let remaining = 0;

    for (let i = 0; i < source.length; i++) {
      const row = Math.floor(i / columns);
      glyphs.push({
        ch: source[i], x: left + (i % columns) * advance,
        y: top + row * lineHeight, typedAt: i / Math.max(1, source.length) * 1.5,
        dropped: source[i] === ' ',
        deadline: 0
      });
    }

    function reset() {
      age = 0;
      typed = 0;
      releaseCarry = 0;
      dragCooldown = 0;
      ending = false;
      remaining = 0;
      chairSerial = primaryChair;
      bodies.length = 0;
      droplets.length = 0;
      ripples.length = 0;
      fragments.length = 0;
      glyphs.forEach((g, i) => {
        g.dropped = g.ch === ' ';
        const early = random(0, 1) < 0.3;
        g.deadline = Math.max(g.typedAt + 0.12, early ? random(0.4, 2.3) : random(1.6, 12.4));
        if (!g.dropped) remaining++;
      });
    }

    function detach(g, force) {
      if (g.dropped || g.typedAt > age || bodies.length >= 250) return false;
      g.dropped = true;
      remaining--;
      const gust = pointer.active ? clamp(pointer.dx, -35, 35) * 1.7 : 0;
      bodies.push({
        ch: g.ch, x: g.x + advance * 0.5, y: g.y + size * 0.5,
        vx: (random(-38, 38) + gust + (force ? random(-50, 50) : 0)) * S,
        vy: random(-32, 22) * S, angle: random(-0.25, 0.25),
        spin: random(-4.8, 4.8), seed: random(0, 6), age: 0
      });
      return true;
    }

    function splash(x, strength) {
      if (ripples.length > 80) ripples.shift();
      ripples.push({ x, y: floor + random(-1.8, 1.8) * S, age: 0, life: random(0.7, 1.1), scale: random(0.75, 1.3) });
      const count = Math.round(random(7, 12) * strength);
      for (let i = 0; i < count; i++) {
        if (droplets.length >= 850) droplets.shift();
        droplets.push({
          x, y: floor - 1 * S, vx: random(-86, 86) * S * strength,
          vy: random(-175, -46) * S * strength,
          radius: random(0.8, 2.5) * S, age: 0, life: random(0.4, 0.85)
        });
      }
      if (random(0, 1) < 0.28 && fragments.length < 55) fragments.push({
        x, y: floor - 2 * S, vx: random(-55, 55) * S,
        vy: random(-120, -70) * S, angle: random(-0.8, 0.8), spin: random(-5, 5),
        size: random(5.2, 9) * S, age: 0, life: random(0.55, 0.95), variant: chairSerial++ % chairCount
      });
    }

    function smallChair(f, alpha) {
      ctx.save();
      if (typeof env.drawChair === 'function') env.drawChair(f.x, f.y, f.size * 1.41, f.angle, null, alpha, f.variant);
      ctx.restore();
    }

    function localRelease(x, y, force) {
      const nearest = [];
      const radius = 100 * S;
      for (let i = 0; i < typed; i++) {
        const g = glyphs[i];
        if (g.dropped) continue;
        const dx = g.x + advance * 0.5 - x;
        const dy = g.y + size * 0.5 - y;
        const distance = dx * dx + dy * dy;
        if (distance < radius * radius) nearest.push({ g, distance });
      }
      nearest.sort((a, b) => a.distance - b.distance);
      nearest.slice(0, force ? 32 : 9).forEach(item => detach(item.g, true));
    }

    reset();

    return {
      frame(dt) {
        age += dt;
        dragCooldown = Math.max(0, dragCooldown - dt);
        typed = Math.min(glyphs.length, Math.floor(glyphs.length * age / 1.5) + 1);
        if (pointer.pressed && dragCooldown <= 0) {
          localRelease(pointer.x, pointer.y, false);
          dragCooldown = 0.07;
        }
        ctx.save();
        ctx.fillStyle = blue;
        ctx.textBaseline = 'top';
        ctx.font = `bold ${size}px ChairsSupporting, sans-serif`;
        for (let i = 0; i < typed; i++) {
          const g = glyphs[i];
          if (!g.dropped && age >= g.deadline) detach(g, false);
          if (!g.dropped) ctx.fillText(g.ch, g.x, g.y);
        }
        if (age < 1.5 && typed && glyphs.length) {
          const last = glyphs[Math.min(typed - 1, glyphs.length - 1)];
          ctx.globalAlpha = 0.7;
          ctx.fillRect(last.x + advance, last.y, 1.2 * S, size);
          ctx.globalAlpha = 1;
        }
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (let i = bodies.length - 1; i >= 0; i--) {
          const b = bodies[i];
          b.age += dt;
          b.vx += Math.sin(age * 4.5 + b.seed) * 8 * S * dt;
          b.vy += 330 * S * dt;
          b.x += b.vx * dt; b.y += b.vy * dt; b.angle += b.spin * dt;
          if (b.x < left * 0.34) { b.x = left * 0.34; b.vx = Math.abs(b.vx) * 0.72; b.spin *= -0.7; }
          if (b.x > W - left * 0.34) { b.x = W - left * 0.34; b.vx = -Math.abs(b.vx) * 0.72; b.spin *= -0.7; }
          if (b.y >= floor - size * 0.25) {
            splash(b.x, clamp(b.vy / (380 * S), 0.65, 1.2));
            bodies.splice(i, 1);
            continue;
          }
          ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.angle);
          ctx.fillText(b.ch, 0, 0); ctx.restore();
        }
        ctx.strokeStyle = blue;
        ctx.lineWidth = 0.9 * S;
        for (let i = ripples.length - 1; i >= 0; i--) {
          const r = ripples[i];
          r.age += dt;
          if (r.age >= r.life) { ripples.splice(i, 1); continue; }
          for (let ring = 0; ring < 3; ring++) {
            const t = r.age - ring * 0.085;
            if (t <= 0) continue;
            const p = t / r.life;
            const radius = (4 + p * 49) * S * r.scale;
            ctx.globalAlpha = (1 - p) * 0.38 / (1 + ring * 0.42);
            ctx.beginPath(); ctx.ellipse(r.x, r.y, radius, radius * 0.14, 0, 0, Math.PI * 2); ctx.stroke();
          }
        }
        ctx.fillStyle = blue;
        for (let i = droplets.length - 1; i >= 0; i--) {
          const d = droplets[i];
          d.age += dt;
          d.vy += 390 * S * dt;
          d.x += d.vx * dt; d.y += d.vy * dt;
          if (d.age >= d.life || d.y > floor + 10 * S) { droplets.splice(i, 1); continue; }
          const alpha = 1 - d.age / d.life;
          ctx.globalAlpha = alpha * 0.75;
          ctx.beginPath(); ctx.ellipse(d.x, d.y, d.radius * alpha, d.radius * (1.1 + Math.abs(d.vy) / (140 * S)) * alpha, Math.atan2(d.vx, -d.vy), 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
        for (let i = fragments.length - 1; i >= 0; i--) {
          const f = fragments[i];
          f.age += dt;
          f.vy += 310 * S * dt;
          f.x += f.vx * dt; f.y += f.vy * dt; f.angle += f.spin * dt;
          if (f.age > f.life || f.y > floor + 12 * S) { fragments.splice(i, 1); continue; }
          smallChair(f, 0.7 * (1 - f.age / f.life));
        }
        ending = remaining === 0 && !bodies.length && age > 10;
        ctx.save();
        ctx.fillStyle = blue; ctx.globalAlpha = ending ? 0.44 : 0.27;
        ctx.textAlign = 'center'; ctx.font = `${9 * S}px ChairsSupporting, sans-serif`;
        ctx.fillText(ending ? 'CLICK TO LET THE WORDS FALL AGAIN' : 'LETTERS BECOME RAIN', W * 0.5, H * 0.965);
        ctx.restore();
      },
      isIdle() { return ending && !droplets.length && !ripples.length && !fragments.length; },
      pointer(type, p) {
        if (p && Number.isFinite(p.x)) {
          pointer.x = p.x; pointer.y = p.y;
          pointer.dx = Number.isFinite(p.dx) ? p.dx / Math.max(S, 0.1) : 0;
        }
        pointer.active = type !== 'leave';
        if (type === 'down') {
          if (ending) reset();
          pointer.pressed = true;
          localRelease(pointer.x, pointer.y, true);
          dragCooldown = 0.07;
        }
        if (type === 'up' || type === 'leave') pointer.pressed = false;
      },
      burst() { reset(); },
      dispose() { bodies.length = 0; droplets.length = 0; ripples.length = 0; fragments.length = 0; }
    };
  };
})();
