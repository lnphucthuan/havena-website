/* Havena — water surface effect for photos (WebGL).
   Any <img data-water> is swapped for a canvas that draws the photo through a moving water surface:
   gentle ambient waves, ripples that spread from the pointer, stronger ripples on click/tap. */
(function () {
  'use strict';
  if (!window.H || !H.ready) return;

  var VERT = [
    'attribute vec2 aPos;',
    'varying vec2 vUv;',
    'void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }'
  ].join('\n');

  var MAX_RIPPLES = 10;
  var FRAG = [
    'precision highp float;',
    'uniform sampler2D uTex;',
    'uniform vec2 uRes;',     // canvas size (px)
    'uniform vec2 uImg;',     // photo size (px)
    'uniform float uTime;',
    'uniform float uHover;',  // 0..1
    'uniform vec2 uMouse;',   // pointer in uv space
    'uniform vec4 uRip[' + MAX_RIPPLES + '];', // xy = origin (uv), z = start time, w = strength
    'varying vec2 vUv;',

    // object-fit: cover
    'vec2 cover(vec2 uv) {',
    '  float rs = uRes.x / uRes.y, ri = uImg.x / uImg.y;',
    '  vec2 s = rs < ri ? vec2(rs / ri, 1.0) : vec2(1.0, ri / rs);',
    '  return (uv - 0.5) * s + 0.5;',
    '}',

    'void main() {',
    '  vec2 uv = vUv;',
    '  float asp = uRes.x / uRes.y;',
    '  float t = uTime;',

    // ambient surface: a few crossing sine swells
    '  vec2 w = vec2(',
    '    sin(uv.y * 17.0 + t * 1.2) + sin(uv.y * 7.0 - t * 0.8 + uv.x * 5.0),',
    '    cos(uv.x * 15.0 - t * 1.05) + cos(uv.x * 8.0 + t * 0.7 + uv.y * 4.0)',
    '  );',
    '  vec2 disp = w * (0.0015 + 0.0032 * uHover);',
    '  float shade = (w.x + w.y) * 0.004 * (0.4 + uHover);',

    // ripples
    '  for (int i = 0; i < ' + MAX_RIPPLES + '; i++) {',
    '    vec4 r = uRip[i];',
    '    float age = t - r.z;',
    '    if (r.w <= 0.0 || age < 0.0 || age > 3.0) continue;',
    '    vec2 d = uv - r.xy; d.x *= asp;',
    '    float dist = length(d);',
    '    float band = dist - age * 0.32;',
    '    float wave = sin(band * 55.0) * exp(-band * band * 70.0) * exp(-age * 1.4) * r.w;',
    '    vec2 dir = d / (dist + 0.0001);',
    '    disp += dir * wave * 0.011 * vec2(1.0 / asp, 1.0);',
    '    shade += wave * 0.07;',
    '  }',

    // soft lens under the pointer while hovering
    '  vec2 md = uv - uMouse; md.x *= asp;',
    '  float ml = length(md);',
    '  disp -= (md / (ml + 0.0001)) * vec2(1.0 / asp, 1.0) * smoothstep(0.28, 0.0, ml) * 0.008 * uHover;',

    // slight chromatic split, like light bending through water
    '  vec3 col;',
    '  col.r = texture2D(uTex, cover(uv + disp * 1.3)).r;',
    '  col.g = texture2D(uTex, cover(uv + disp)).g;',
    '  col.b = texture2D(uTex, cover(uv + disp * 0.7)).b;',
    '  col += shade;',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  var DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  var clock0 = performance.now();
  function now() { return (performance.now() - clock0) / 1000; }
  var list = [];

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  function Water(img) {
    var canvas = document.createElement('canvas');
    // alpha: true so the canvas is see-through (not black) until the photo is ready
    var gl = canvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power' });
    if (!gl) return;
    try {
      var prog = gl.createProgram();
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (e) {
      return; // keep the plain photo
    }
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    this.u = {};
    ['uTex', 'uRes', 'uImg', 'uTime', 'uHover', 'uMouse', 'uRip'].forEach(function (n) {
      this.u[n] = gl.getUniformLocation(prog, n);
    }, this);

    this.gl = gl;
    this.img = img;
    this.canvas = canvas;
    this.hover = 0;
    this.mouse = [0.5, 0.5];
    this.rip = new Float32Array(MAX_RIPPLES * 4);
    this.ripIdx = 0;
    this.ready = false;
    this.visible = false;
    this.lastSpawn = { x: -1, y: -1, t: 0 };
    this.nextAuto = now() + 1.5;

    canvas.className = img.className + ' water';
    canvas.setAttribute('aria-hidden', 'true');
    img.parentNode.replaceChild(canvas, img);

    var self = this;

    // put the plain photo back (keeping whatever position/scale GSAP had given the canvas)
    function restore() {
      self.ready = false;
      self.dead = true;
      if (!canvas.parentNode) return;
      img.style.cssText = canvas.style.cssText;
      canvas.parentNode.replaceChild(img, canvas);
    }

    function upload() {
      if (!img.naturalWidth || self.dead) return;
      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      } catch (e) {
        restore(); // e.g. the browser refuses to hand the pixels to WebGL
        return;
      }
      if (gl.getError() !== gl.NO_ERROR) { restore(); return; }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.uniform1i(self.u.uTex, 0);
      gl.uniform2f(self.u.uImg, img.naturalWidth, img.naturalHeight);
      self.ready = true;
      self.resize();
      self.draw();
    }
    if (img.complete && img.naturalWidth) upload();
    else img.addEventListener('load', upload, { once: true });

    // if the GPU drops the context, fall back to the photo
    canvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault();
      restore();
    });

    if ('ResizeObserver' in window) new ResizeObserver(function () { self.resize(); self.draw(); }).observe(canvas);

    var host = canvas.parentNode; // listen on the wrapper: overlays (gradients, links) may sit above the canvas
    ScrollTrigger.create({
      trigger: host,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: function (st) { self.visible = st.isActive; }
    });

    function toUv(e) {
      var r = canvas.getBoundingClientRect();
      return [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
    }
    host.addEventListener('pointerenter', function () { gsap.to(self, { hover: 1, duration: 0.8, ease: 'power2.out' }); });
    host.addEventListener('pointerleave', function () { gsap.to(self, { hover: 0, duration: 1.2, ease: 'power2.out' }); });
    host.addEventListener('pointermove', function (e) {
      var p = toUv(e);
      self.mouse = p;
      var t = now(), L = self.lastSpawn;
      var dx = (p[0] - L.x) * (canvas.clientWidth / canvas.clientHeight), dy = p[1] - L.y;
      if (Math.sqrt(dx * dx + dy * dy) > 0.07 && t - L.t > 0.09) {
        self.ripple(p[0], p[1], 0.55);
        self.lastSpawn = { x: p[0], y: p[1], t: t };
      }
    });
    host.addEventListener('pointerdown', function (e) {
      var p = toUv(e);
      self.ripple(p[0], p[1], 1.5);
    });

    list.push(this);
  }

  Water.prototype.ripple = function (x, y, strength) {
    var i = this.ripIdx * 4;
    this.rip[i] = x; this.rip[i + 1] = y; this.rip[i + 2] = now(); this.rip[i + 3] = strength;
    this.ripIdx = (this.ripIdx + 1) % MAX_RIPPLES;
  };

  Water.prototype.resize = function () {
    var c = this.canvas;
    var w = Math.max(1, Math.round(c.clientWidth * DPR));
    var h = Math.max(1, Math.round(c.clientHeight * DPR));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  };

  Water.prototype.draw = function () {
    if (!this.ready) return;
    var gl = this.gl, u = this.u, t = now();
    // idle surfaces get an occasional drop so they never look frozen (also covers touch screens)
    if (this.hover < 0.05 && t > this.nextAuto) {
      this.ripple(0.2 + Math.random() * 0.6, 0.25 + Math.random() * 0.5, 0.45);
      this.nextAuto = t + 2.2 + Math.random() * 2;
    }
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uTime, t);
    gl.uniform1f(u.uHover, this.hover);
    gl.uniform2f(u.uMouse, this.mouse[0], this.mouse[1]);
    gl.uniform4fv(u.uRip, this.rip);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  gsap.ticker.add(function () {
    for (var i = 0; i < list.length; i++) if (list[i].visible) list[i].draw();
  });

  H.water = function (root) {
    if (H.RM) return; // reduced motion: keep still photos
    // Opened straight from disk (file://): browsers won't let WebGL read local photos, so keep plain images.
    // Serve the folder over http (e.g. python3 -m http.server) to get the water effect.
    if (location.protocol === 'file:') return;
    [].forEach.call((root || document).querySelectorAll('img[data-water]'), function (img) { new Water(img); });
  };
})();
