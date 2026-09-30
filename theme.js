(function () {
  'use strict';

  const DEFAULTS = {
    appearance: 'light', sync: '0', bg: '1', bgPasses: '8', bgWarp: '100', bgBright: '100', bgSat: '150', bgMotion: '30',
    opacity: '15', glassBlur: '0',
    minimal: '0', controls: 'default', radius: '14', accent: 'cover', custom: 'FF5A1F', tone: '40',
  };
  const ACCENTS = [
    { name: 'Cover art (Spicy Lyrics colors)', value: 'cover' },
    { name: 'Spicy orange', value: 'FF5A1F' },
    { name: 'Spotify green', value: '1DB954' },
    { name: 'White', value: 'FFFFFF' },
    { name: 'Pink', value: 'F16D8C' },
    { name: 'Blue', value: '4A99E9' },
    { name: 'Custom color', value: 'custom' },
  ];
  const APPEARANCES = {
    light: { name: 'Light', desc: 'Bright cover colors with see-through panels.', values: { bgBright: '100', opacity: '15' } },
    dark: { name: 'Dark', desc: 'Dimmed colors and deeper panels for night listening.', values: { bgBright: '55', opacity: '50' } },
  };
  const CONTROLS = [
    { name: 'Default', value: 'default' },
    { name: 'Clair', value: 'clair' },
    { name: 'No controls', value: 'hidden' },
  ];
  const SPICY_MODES = {
    off: 'Dynamic background',
    auto: 'Static background: Auto',
    artistHeader: 'Static background: Artist header',
    coverArt: 'Static background: Cover art',
    color: 'Static background: Color',
  };
  const ICON = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.25c.73.01 1.46.1 2.18.25a.75.75 0 0 1 .58.65l.17 1.53a1.38 1.38 0 0 0 1.93 1.12l1.4-.62a.75.75 0 0 1 .85.18 9.8 9.8 0 0 1 2.2 3.79.75.75 0 0 1-.27.83l-1.24.91a1.38 1.38 0 0 0 0 2.23l1.24.91a.75.75 0 0 1 .27.83 9.8 9.8 0 0 1-2.2 3.79.75.75 0 0 1-.85.18l-1.4-.62a1.38 1.38 0 0 0-1.93 1.11l-.17 1.53a.75.75 0 0 1-.57.65 9.5 9.5 0 0 1-4.41 0 .75.75 0 0 1-.57-.65l-.17-1.52a1.38 1.38 0 0 0-1.93-1.11l-1.4.62a.75.75 0 0 1-.85-.18 9.8 9.8 0 0 1-2.2-3.8.75.75 0 0 1 .27-.82l1.24-.92a1.38 1.38 0 0 0 0-2.22l-1.24-.92a.75.75 0 0 1-.27-.82 9.8 9.8 0 0 1 2.2-3.8.75.75 0 0 1 .85-.17l1.4.61a1.39 1.39 0 0 0 1.93-1.12l.17-1.52a.75.75 0 0 1 .58-.65c.72-.16 1.45-.25 2.2-.25ZM12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z"/></svg>';
  const CLOSE = '<svg width="18" height="18" viewBox="0 0 32 32" aria-hidden="true"><path d="M31.1 29.8 16.96 15.65 31.1 1.51 29.68.09 15.54 14.24 1.4.09-.02 1.51l14.15 14.14L-.02 29.8l1.42 1.41 14.14-14.14 14.14 14.14" fill="currentColor"/></svg>';
  const SEARCH = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.5"/><path d="m9.5 9.5 3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

  const colorCache = new Map();
  const headerCache = new Map();
  let accentToken = 0;

  const get = (key) => {
    try {
      const value = Spicetify.LocalStorage.get('clair:' + key);
      if (value !== null && value !== undefined) return String(value);
    } catch {}
    return DEFAULTS[key];
  };

  const set = (key, value) => {
    try { Spicetify.LocalStorage.set('clair:' + key, String(value)); } catch {}
  };

  const state = () => Object.fromEntries(Object.keys(DEFAULTS).map((key) => [key, get(key)]));

  const spicySettings = () => {
    try { return JSON.parse(Spicetify.LocalStorage.get('SL:settings')) || {}; } catch { return {}; }
  };

  const hexToRgb = (hex) => [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));

  const rgbToHsl = ([r, g, b]) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    if (!d) return [0, 0, l];
    const s = d / (1 - Math.abs(2 * l - 1));
    const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [(h * 60 + 360) % 360, s, l];
  };

  const hslToRgb = ([h, s, l]) => {
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min((n + h / 30) % 12 - 3, 9 - (n + h / 30) % 12, 1));
    return [f(0), f(8), f(4)].map((v) => Math.round(v * 255));
  };

  const readable = (rgb) => {
    const [h, s, l] = rgbToHsl(rgb);
    return hslToRgb([h, s < 0.25 ? s : Math.max(s, 0.6), Math.min(Math.max(l, 0.55), 0.68)]);
  };

  const image = (label) => Spicetify.Player.data?.item?.images?.find((img) => img.label === label)?.url;

  const coverUri = () => image('large');

  const httpImage = (uri) => uri && uri.replace('spotify:image:', 'https://i.scdn.co/image/');

  const dynamicColors = (uri) => {
    if (!colorCache.has(uri)) {
      colorCache.set(uri, Spicetify.GraphQL.Request(Spicetify.GraphQL.Definitions.getDynamicColorsByUris, { imageUris: [uri] })
        .then((res) => {
          const colors = res.data.dynamicColors[0];
          const scheme = colors[colors.bestFit === 'LIGHT' ? 'light' : 'dark'];
          return [scheme.minContrast, scheme.highContrast, scheme.higherContrast]
            .map(({ backgroundBase: { red, green, blue } }) => [red, green, blue]);
        })
        .catch((error) => {
          colorCache.delete(uri);
          throw error;
        }));
    }
    return colorCache.get(uri);
  };

  const fetchCoverColor = async (uri) => {
    try {
      return readable((await dynamicColors(uri))[1]);
    } catch {
      const palette = await Spicetify.colorExtractor(Spicetify.Player.data.item.uri);
      return readable(hexToRgb((palette.PROMINENT || palette.VIBRANT).slice(1)));
    }
  };

  const artistHeader = async () => {
    const item = Spicetify.Player.data?.item;
    const artist = item?.artists?.[0]?.uri;
    if (!artist || !item.uri?.startsWith('spotify:track:')) return null;
    if (!headerCache.has(artist)) {
      headerCache.set(artist, Spicetify.GraphQL.Request(Spicetify.GraphQL.Definitions.queryNpvArtist, {
        artistUri: artist, trackUri: item.uri, enableRelatedVideos: false, enableRelatedAudioTracks: false,
      }).then((res) => res?.data?.artistUnion?.headerImage?.data?.sources?.[0]?.url || null).catch(() => null));
    }
    return headerCache.get(artist);
  };

  const surfaces = (rgb, tint) => {
    const [h, s] = rgbToHsl(rgb);
    const strength = tint / 100;
    const sat = Math.min(0.5, 0.15 + s * 0.5) * strength;
    const tone = (l) => hslToRgb([h, sat, l]);
    return {
      main: tone(0.07),
      sidebar: tone(0.05),
      player: tone(0.09),
      card: tone(0.12),
      'selected-row': tone(0.19),
      'button-disabled': tone(0.25),
      'tab-active': tone(0.15),
      glow: hslToRgb([h, Math.min(0.7, s) * strength, 0.22]),
    };
  };

  const paint = (rgb, tint) => {
    const style = document.getElementById('clair-colors') || document.head.appendChild(Object.assign(document.createElement('style'), { id: 'clair-colors' }));
    if (!rgb) {
      style.textContent = '';
      return;
    }
    const [h, s, l] = rgbToHsl(rgb);
    const vars = { button: rgb, 'button-active': hslToRgb([h, s, Math.min(0.8, l + 0.1)]) };
    if (tint > 0) Object.assign(vars, surfaces(rgb, tint));
    const css = Object.entries(vars).map(([name, value]) =>
      name === 'glow'
        ? '--clair-glow: rgb(' + value + ');'
        : '--spice-' + name + ': rgb(' + value + ');--spice-rgb-' + name + ': ' + value.join(', ') + ';'
    );
    const text = ':root:root{--clair-accent: rgb(' + rgb + ');--clair-accent-rgb: ' + rgb.join(', ') + ';' + css.join('') + '}';
    if (style.textContent !== text) style.textContent = text;
  };

  const applyAccent = async () => {
    const token = ++accentToken;
    const { accent, custom, tone } = state();
    let rgb = null;
    try {
      if (accent === 'cover') {
        const uri = coverUri();
        if (uri) rgb = await fetchCoverColor(uri);
      } else {
        rgb = hexToRgb(accent === 'custom' ? custom : accent);
      }
    } catch {}
    if (token === accentToken) paint(rgb, parseInt(tone, 10) || 0);
  };

  const images = new Map();
  const loadImage = (url) => {
    if (!images.has(url)) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      images.set(url, img.decode().then(() => img, (error) => {
        images.delete(url);
        throw error;
      }));
    }
    return images.get(url);
  };

  let analysis = { uri: '', data: null };

  const fetchAnalysis = async (uri) => {
    const id = uri.split(':')[2];
    try {
      const hit = await caches.match('/' + id, { cacheName: 'SpicyLyrics_AudioAnalysis' });
      const content = hit && (await hit.json()).Content;
      if (content?.analysis) return content.analysis;
      if (content?.notFound) return null;
    } catch {}
    try {
      const data = await Spicetify.CosmosAsync.get('https://spclient.wg.spotify.com/audio-attributes/v1/audio-analysis/' + id + '?format=json');
      return data?.track && Array.isArray(data.sections) && Array.isArray(data.beats) ? data : null;
    } catch {
      return null;
    }
  };

  const loadAnalysis = async () => {
    const uri = Spicetify.Player.data?.item?.uri || '';
    if (analysis.uri === uri) return;
    analysis = { uri, data: null };
    if (!uri.startsWith('spotify:track:')) return;
    const data = await fetchAnalysis(uri);
    if (analysis.uri === uri) analysis.data = data;
  };

  const speedAt = (data, t) => {
    const active = (list) => list.find((e) => t >= e.start && t < e.start + e.duration);
    const loudness = (db) => 0.5 + Math.max(0, (db + 40) / 40) * 0.7;
    const section = active(data.sections) || data.track;
    let speed = section.tempo / 120 * loudness(section.loudness);
    const beat = active(data.beats);
    if (beat && beat.confidence > 0.4) speed += 1.5 * Math.exp(-5 * (t - beat.start) / beat.duration) * beat.confidence;
    return Math.max(0.1, Math.min(speed, 3));
  };

  const lyricsRect = () => {
    const r = document.querySelector('.Root__main-view')?.getBoundingClientRect();
    if (!r || !r.width) return [0, 0, 0, 0];
    return [r.left / innerWidth, 1 - r.bottom / innerHeight, r.width / innerWidth, r.height / innerHeight];
  };

  const spicySpeed = () => {
    const player = Spicetify.Player.data;
    if (!player || player.isPaused) return 0.1;
    const data = analysis.uri === player.item?.uri && analysis.data;
    return data ? speedAt(data, Spicetify.Player.getProgress() / 1000) : 1;
  };

  const VERT = 'attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  const BLUR = 'precision highp float;uniform sampler2D t;uniform float o;varying vec2 uv;void main(){vec2 s=vec2(o/128.);'
    + 'gl_FragColor=(texture2D(t,uv-s)+texture2D(t,uv+vec2(s.x,-s.y))+texture2D(t,uv+vec2(-s.x,s.y))+texture2D(t,uv+s))*.25;}';
  const MAIN = `precision highp float;
uniform sampler2D a,b;uniform float blend,time,warp,sat,sat2,bright,dither;uniform vec2 size;uniform vec4 rect;varying vec2 uv;
vec2 cover(vec2 p){vec2 r=size/max(size.x,size.y);return (p-.5)*r+.5;}
vec3 m289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec2 m289(vec2 x){return x-floor(x*(1./289.))*289.;}
vec3 perm(vec3 x){return m289(((x*34.)+1.)*x);}
float sn(vec2 v){
  const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
  vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
  vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=m289(i);
  vec3 p=perm(perm(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
  vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);m=m*m;m=m*m;
  vec3 x=2.*fract(p*C.www)-1.;vec3 h=abs(x)-.5;vec3 ox=floor(x+.5);vec3 a0=x-ox;
  m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
  vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.*dot(m,g);
}
float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.zyx+31.32);return fract((p.x+p.y)*p.z);}
void main(){
  vec2 p=rect.z>0.?(uv-rect.xy)/rect.zw:cover(uv);
  float t=time*.05;vec2 c=p-.5;float w=1.-smoothstep(0.,.7,length(c));
  float n1=sn(p*.35+vec2(t,t*.7)),n2=sn(p*.35+vec2(-t*.8,t*.5)+50.);
  float n3=sn(p*.9+vec2(t*1.2,-t)+vec2(100.,0.)),n4=sn(p*.9+vec2(-t,t*1.1)+vec2(0.,100.));
  vec2 q=clamp(p+vec2(n1*.65+n3*.35,n2*.65+n4*.35)*w*warp,0.,1.);
  vec3 col=mix(texture2D(a,q).rgb,texture2D(b,q).rgb,blend)*(1.-min(dot(c,c),1.)*.3);
  col=mix(vec3(dot(col,vec3(.299,.587,.114))),col,sat);
  col=clamp(col+(hash(vec3(floor(uv*size),floor(time*60.)))-.5)*dither,0.,1.);
  col=clamp(mix(vec3(dot(col,vec3(.2126,.7152,.0722))),col,sat2),0.,1.)*bright;
  gl_FragColor=vec4(col,1.);
}`;
  const RES = 0.5;

  const createBackground = () => {
    const canvas = Object.assign(document.createElement('canvas'), { id: 'clair-bg' });
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power' });
    if (!gl) return null;
    const half = gl.getExtension('OES_texture_half_float');
    const texType = half && gl.getExtension('OES_texture_half_float_linear') ? half.HALF_FLOAT_OES : gl.UNSIGNED_BYTE;

    const program = (frag) => {
      const p = gl.createProgram();
      [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, frag]].forEach(([type, src]) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        gl.attachShader(p, shader);
      });
      gl.bindAttribLocation(p, 0, 'p');
      gl.linkProgram(p);
      const cache = {};
      return { p, u: (name) => cache[name] || (cache[name] = gl.getUniformLocation(p, name)) };
    };
    const blurProgram = program(BLUR);
    const mainProgram = program(MAIN);
    if (!gl.getProgramParameter(mainProgram.p, gl.LINK_STATUS)) return null;

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const draw = () => gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    const texture = () => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((k) => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
      [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach((k) => gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR));
      return tex;
    };
    const target = () => {
      const tex = texture();
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 128, 128, 0, gl.RGBA, texType, null);
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      return { tex, fb };
    };
    const source = texture();
    const tmp = [target(), target()];
    let cur = target();
    let next = target();
    let opts = { on: false, speed: () => 0, warp: 1, sat: 1, sat2: 1, bright: 1, dither: 0 };
    let fade = 500;
    let fadeStart = -fade;
    let speed = 0;
    let time = 0;
    let last = 0;
    let raf = 0;

    const render = () => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(mainProgram.p);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, next.tex);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, cur.tex);
      gl.uniform1i(mainProgram.u('a'), 0);
      gl.uniform1i(mainProgram.u('b'), 1);
      gl.uniform1f(mainProgram.u('blend'), Math.min(1, (performance.now() - fadeStart) / fade));
      gl.uniform1f(mainProgram.u('time'), time);
      gl.uniform2f(mainProgram.u('size'), canvas.width, canvas.height);
      gl.uniform4fv(mainProgram.u('rect'), opts.rect ? opts.rect() : [0, 0, 0, 0]);
      ['warp', 'sat', 'sat2', 'bright', 'dither'].forEach((k) => gl.uniform1f(mainProgram.u(k), opts[k]));
      draw();
    };

    const loop = (now) => {
      raf = 0;
      if (document.hidden || !(opts.on || now - fadeStart < fade)) return;
      raf = requestAnimationFrame(loop);
      if (now - last < 33) return;
      const dt = Math.min(now - last, 100);
      last = now;
      speed += (opts.speed() - speed) * (1 - Math.pow(0.95, dt / 16.67));
      time += dt / 1000 * speed;
      render();
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const resize = () => {
      canvas.width = Math.max(1, Math.round(innerWidth * RES));
      canvas.height = Math.max(1, Math.round(innerHeight * RES));
      render();
    };
    addEventListener('resize', resize);
    document.addEventListener('visibilitychange', () => {
      render();
      start();
    });

    return {
      canvas,
      resize,
      set(values) {
        opts = values;
        render();
        start();
      },
      load(img, passes) {
        gl.bindTexture(gl.TEXTURE_2D, source);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        [cur, next] = [next, cur];
        gl.useProgram(blurProgram.p);
        gl.viewport(0, 0, 128, 128);
        gl.activeTexture(gl.TEXTURE0);
        const pass = (from, to, offset) => {
          gl.bindFramebuffer(gl.FRAMEBUFFER, to.fb);
          gl.bindTexture(gl.TEXTURE_2D, from);
          gl.uniform1f(blurProgram.u('o'), offset);
          draw();
          return to.tex;
        };
        let tex = pass(source, tmp[0], 0);
        for (let i = 0; i < passes; i++) tex = pass(tex, tmp[(i + 1) % 2], i + 0.5);
        pass(tex, next, 0);
        if (fadeStart > 0) fade = 1000;
        fadeStart = performance.now();
        render();
        start();
      },
    };
  };

  let bg = null;
  let bgArt = '';
  let bgToken = 0;
  const staticBg = Object.assign(document.createElement('div'), { id: 'clair-bg-static' });
  const controlsBg = Object.assign(document.createElement('div'), { id: 'clair-wc' });

  const backgroundMode = (cfg) => {
    if (cfg.bg !== '1') return 'none';
    if (cfg.sync !== '1') return 'off';
    const mode = spicySettings().staticBackgroundMode;
    return SPICY_MODES[mode] ? mode : 'off';
  };

  const applyBackground = async () => {
    const token = ++bgToken;
    const cfg = state();
    const spicy = cfg.sync === '1';
    const mode = backgroundMode(cfg);
    const isImage = mode === 'auto' || mode === 'artistHeader' || mode === 'coverArt';
    const body = document.body.classList;
    body.toggle('clair-bg', mode !== 'off' ? mode !== 'none' : !!bg);
    body.toggle('clair-bg-color', mode === 'color');
    body.toggle('clair-bg-image', isImage);
    document.documentElement.style.setProperty('--clair-static-blur', (Number(spicySettings().staticBackgroundBlur) || 0) + 'px');

    if (bg) {
      const motion = cfg.bgMotion / 100;
      bg.set(mode !== 'off'
        ? { on: false, speed: () => 0, warp: 1, sat: 1, sat2: 1, bright: 1, dither: 0 }
        : spicy
          ? { on: true, speed: spicySpeed, rect: lyricsRect, warp: 1, sat: 1.5, sat2: 2.5, bright: 0.65, dither: 0.008 }
          : { on: motion > 0, speed: () => motion, warp: cfg.bgWarp / 100, sat: cfg.bgSat / 100, sat2: 1, bright: cfg.bgBright / 100, dither: 0 });
    }

    try {
      if (mode === 'color') {
        const uri = coverUri();
        const [min, high] = uri ? await dynamicColors(uri) : [[18, 18, 18], [18, 18, 18]];
        if (token !== bgToken) return;
        staticBg.style.setProperty('--clair-min', min.join(', '));
        staticBg.style.setProperty('--clair-high', high.join(', '));
      } else if (isImage) {
        const cover = httpImage(image('xlarge') || coverUri());
        const url = (mode !== 'coverArt' && await artistHeader()) || cover;
        if (!url) return;
        await loadImage(url);
        if (token !== bgToken) return;
        staticBg.style.backgroundImage = 'url("' + url + '")';
      } else if (mode === 'off' && bg) {
        if (spicy) setTimeout(loadAnalysis, 1200);
        const passes = spicy ? 8 : Math.max(1, Math.min(40, parseInt(cfg.bgPasses, 10) || 8));
        const url = httpImage(image('standard') || coverUri());
        if (!url || bgArt === url + passes) return;
        const img = await createImageBitmap(await loadImage(url), { resizeWidth: 128, resizeHeight: 128, resizeQuality: 'medium' });
        if (token !== bgToken) return img.close();
        bg.load(img, passes);
        img.close();
        bgArt = url + passes;
      }
    } catch {}
  };

  let buttonsHidden = false;
  const nativeButtons = (show) => {
    try {
      Spicetify.Platform.NativeAPI?.setWindowButtonsVisibility(show);
      Spicetify.Platform.ControlMessageAPI?.setTitlebarHeight(show ? 64 : 1);
    } catch {}
  };
  const setButtons = (show) => {
    if (show === !buttonsHidden) return;
    buttonsHidden = !show;
    nativeButtons(show);
    if (show) return;
    let tries = 0;
    const id = setInterval(() => {
      if (!buttonsHidden || ++tries > 30) clearInterval(id);
      else nativeButtons(false);
    }, 300);
  };
  document.addEventListener('fullscreenchange', () => buttonsHidden && nativeButtons(false));
  addEventListener('beforeunload', () => setButtons(true));

  const apply = () => {
    const cfg = state();
    const radius = Math.max(0, Math.min(24, parseInt(cfg.radius, 10) || 0));
    const root = document.documentElement.style;
    document.body.classList.toggle('clair-sync', cfg.sync === '1');
    document.body.classList.toggle('clair-glass', cfg.bg === '1' && cfg.glassBlur !== '0');
    document.body.classList.toggle('clair-minimal', cfg.minimal === '1');
    document.body.classList.toggle('clair-wc-clair', cfg.controls === 'clair');
    document.body.classList.toggle('clair-wc-hidden', cfg.controls === 'hidden');
    setButtons(cfg.controls !== 'hidden');
    root.setProperty('--clair-radius', radius + 'px');
    root.setProperty('--clair-radius-sm', Math.max(4, Math.round(radius * 0.66)) + 'px');
    root.setProperty('--clair-opacity', cfg.opacity / 100);
    root.setProperty('--clair-glass-blur', cfg.glassBlur + 'px');
    applyAccent();
    applyBackground();
  };


  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const row = (title, description, control) => {
    const text = el('div', 'clair-label-wrap');
    text.append(el('span', 'clair-label', title), el('span', 'clair-desc', description));
    const box = el('div', 'clair-control');
    box.append(control);
    const wrap = el('div', 'clair-row');
    wrap.append(text, box);
    return wrap;
  };

  const toggle = (key, title, description, rerender) => {
    const label = el('label', 'clair-toggle');
    const input = el('input');
    input.type = 'checkbox';
    input.checked = get(key) === '1';
    input.setAttribute('aria-label', title);
    input.onchange = () => {
      set(key, input.checked ? '1' : '0');
      apply();
      if (rerender) render();
    };
    label.append(input, el('span', 'clair-toggle-track'));
    return row(title, description, label);
  };

  const select = (key, title, description, options) => {
    const control = el('select', 'clair-select');
    control.setAttribute('aria-label', title);
    options.forEach(({ name, value }) => {
      const option = el('option', '', name);
      option.value = value;
      option.selected = value === get(key);
      control.append(option);
    });
    control.onchange = () => {
      set(key, control.value);
      apply();
    };
    return row(title, description, control);
  };

  const range = (key, title, description, min, max, unit = '') => {
    const control = el('input', 'clair-range');
    const value = el('span', 'clair-value', get(key) + unit);
    const wrap = el('div', 'clair-range-wrap');
    control.type = 'range';
    control.min = min;
    control.max = max;
    control.value = get(key);
    control.setAttribute('aria-label', title);
    control.oninput = () => {
      value.textContent = control.value + unit;
      set(key, control.value);
      apply();
    };
    wrap.append(control, value);
    return row(title, description, wrap);
  };

  const action = (title, description, label, ghost, onClick, disabled) => {
    const button = el('button', 'clair-btn' + (ghost ? ' clair-btn-ghost' : ''), label);
    button.disabled = !!disabled;
    button.onclick = onClick;
    return row(title, description, button);
  };

  const colorInput = (key, title, description) => {
    const control = el('input', 'clair-color');
    control.type = 'color';
    control.value = '#' + get(key);
    control.setAttribute('aria-label', title);
    control.oninput = () => {
      set(key, control.value.slice(1).toUpperCase());
      set('accent', 'custom');
      apply();
    };
    control.onchange = () => render();
    return row(title, description, control);
  };

  const resetDefaults = () => {
    Object.keys(DEFAULTS).forEach((key) => set(key, DEFAULTS[key]));
    apply();
  };

  const dialog = el('dialog', 'clair-modal');
  const content = el('div', 'clair-modal-body');
  let query = '';

  const openSpicySettings = () => {
    dialog.close();
    if (window.SpicyLyrics?.panels?.settings) return window.SpicyLyrics.panels.settings.open();
    if (Spicetify.Platform.History.location.pathname !== '/SpicyLyrics') Spicetify.Platform.History.push('/SpicyLyrics');
    let tries = 0;
    const click = () => {
      const button = document.querySelector('#SettingsToggle');
      if (button) button.click();
      else if (++tries < 25) setTimeout(click, 200);
    };
    click();
  };

  const spicyRows = () => {
    const installed = !!window._spicy_lyrics;
    const sl = spicySettings();
    const blur = Number(sl.staticBackgroundBlur) || 0;
    const summary = SPICY_MODES[sl.staticBackgroundMode] || SPICY_MODES.off;
    return [
      action('Spicy Lyrics background',
        installed
          ? summary + (blur && sl.staticBackgroundMode !== 'off' ? ', ' + blur + 'px blur' : '') + '. Change it in Spicy Lyrics and Clair follows instantly.'
          : 'Spicy Lyrics is not installed, so Clair uses its default dynamic background.',
        'Open Spicy settings', false, openSpicySettings, !installed),
    ];
  };

  const sections = () => {
    const spicy = get('sync') === '1';
    const syncRow = window._spicy_lyrics
      ? [toggle('sync', 'Sync with Spicy Lyrics', 'Clair uses the Spicy Lyrics background and follows its settings, so the app and the lyrics page match.', true)]
      : [];
    return {
      Background: [
        toggle('bg', 'Background', 'Cover art background behind the whole app.'),
        ...syncRow,
        ...(spicy ? spicyRows() : [
          range('bgPasses', 'Blur', 'Blur passes. Spicy Lyrics uses 8.', 1, 40),
          range('bgWarp', 'Warp', 'How much the colors flow and bend.', 0, 100, '%'),
          range('bgMotion', 'Motion', 'Animation speed. 0 is still and uses no GPU.', 0, 100),
          range('bgSat', 'Saturation', 'Color intensity. Spicy Lyrics uses 150.', 50, 300, '%'),
          range('bgBright', 'Brightness', 'Lower keeps text readable.', 20, 120, '%'),
        ]),
      ],
      Glass: [
        range('opacity', 'Panel opacity', 'How much the panels cover the background. 100 is solid.', 0, 100, '%'),
        range('glassBlur', 'Glass blur', 'Frosted blur behind panels. 0 is off and cheapest.', 0, 40, 'px'),
        range('radius', 'Corner radius', 'Roundness of panels, cards and buttons.', 0, 24, 'px'),
      ],
      Color: [
        select('accent', 'Accent', 'Cover art uses the same Spotify colors as Spicy Lyrics.', ACCENTS),
        colorInput('custom', 'Custom color', 'Picking a color switches Accent to Custom color.'),
        range('tone', 'Surface tint', 'How much of the accent hue colors the panels. 0 keeps them neutral.', 0, 100),
      ],
      More: [
        select('controls', 'Window controls', 'Minimize, maximize and close: Spotify default, Clair glass, or hidden.', CONTROLS),
        toggle('minimal', 'Minimal mode', 'Hides the friend activity button and panel.'),
        action('Maximum performance', 'Still background and no glass blur.', 'Apply', false, () => {
          set('bgMotion', '0');
          set('glassBlur', '0');
          apply();
          render();
        }),
        action('Reset', 'Restore default settings.', 'Reset', true, () => {
          resetDefaults();
          render();
        }),
      ],
    };
  };

  const filter = () => {
    const q = query.trim().toLowerCase();
    content.querySelectorAll('.clair-group').forEach((group) => {
      let any = false;
      group.querySelectorAll('.clair-row').forEach((item) => {
        item.hidden = !!q && !item.textContent.toLowerCase().includes(q);
        any = any || !item.hidden;
      });
      group.hidden = !any;
    });
  };

  const appearancePicker = () => {
    const wrap = el('div', 'clair-styles');
    wrap.setAttribute('role', 'radiogroup');
    wrap.setAttribute('aria-label', 'Appearance');
    Object.entries(APPEARANCES).forEach(([value, { name, desc, values }]) => {
      const button = el('button', 'clair-style');
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-checked', String(get('appearance') === value));
      button.append(el('span', 'clair-style-name', name), el('span', 'clair-style-desc', desc));
      button.onclick = () => {
        set('appearance', value);
        Object.entries(values).forEach(([key, v]) => set(key, v));
        apply();
        render();
      };
      wrap.append(button);
    });
    return wrap;
  };

  function render() {
    const scroll = content.scrollTop;
    const search = el('label', 'clair-search');
    search.innerHTML = SEARCH;
    const input = el('input', 'clair-search-input');
    input.type = 'text';
    input.placeholder = 'Search settings…';
    input.spellcheck = false;
    input.value = query;
    input.setAttribute('aria-label', 'Search settings');
    input.oninput = () => {
      query = input.value;
      filter();
    };
    search.append(input);
    const groups = Object.entries(sections()).map(([name, rows]) => {
      const group = el('section', 'clair-group');
      group.append(el('p', 'clair-section', name), ...rows);
      return group;
    });
    content.replaceChildren(appearancePicker(), search, ...groups);
    filter();
    content.scrollTop = scroll;
  }

  const buildDialog = () => {
    const head = el('div', 'clair-modal-header');
    const close = el('button', 'clair-close');
    close.innerHTML = CLOSE;
    close.setAttribute('aria-label', 'Close');
    close.onclick = () => dialog.close();
    head.append(el('h1', 'clair-modal-title', 'Clair'), close);
    dialog.setAttribute('aria-label', 'Clair settings');
    dialog.append(head, content);
    dialog.onclick = (event) => {
      if (event.target === dialog) dialog.close();
    };
    document.body.append(dialog);
  };

  const openSettings = () => {
    render();
    if (!dialog.open) dialog.showModal();
  };

  const settingsButton = el('button', 'clair-cog');
  settingsButton.innerHTML = ICON;
  settingsButton.title = 'Clair settings';
  settingsButton.setAttribute('aria-label', 'Clair settings');
  settingsButton.onclick = openSettings;

  const placeButton = () => {
    const user = document.querySelector('.main-userWidget-box');
    if (user && settingsButton.nextElementSibling !== user) user.before(settingsButton);
  };

  const watchSpicy = () => {
    const storage = Spicetify.LocalStorage;
    const original = storage.set;
    try {
      storage.set = wrapped;
    } catch {}
    function wrapped(key) {
      const result = original.apply(this, arguments);
      if (key === 'SL:settings' && get('sync') === '1') {
        applyBackground();
        if (dialog.open) render();
      }
      return result;
    }
  };

  const boot = () => {
    if (!(document.body && window.Spicetify?.Player?.addEventListener && Spicetify.GraphQL && Spicetify.LocalStorage)) {
      setTimeout(boot, 200);
      return;
    }
    try {
      bg = createBackground();
    } catch {}
    document.body.prepend(staticBg);
    document.body.append(controlsBg);
    if (bg) {
      document.body.prepend(bg.canvas);
      bg.resize();
    }
    buildDialog();
    watchSpicy();
    apply();
    const firstTrack = () => (Spicetify.Player.data?.item ? apply() : setTimeout(firstTrack, 300));
    firstTrack();
    Spicetify.Player.addEventListener('songchange', () => requestIdleCallback(() => {
      applyAccent();
      applyBackground();
    }, { timeout: 300 }));
    placeButton();
    new MutationObserver(placeButton).observe(document.querySelector('.Root__globalNav') || document.body, { childList: true, subtree: true });
  };

  boot();

  window.ClairTheme = { openSettings, state, reset: resetDefaults };
})();
