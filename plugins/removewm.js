const { cmd } = require('../NovaX_Mini');
const crypto = require("crypto");
const config = require('../config');

// ────────────────────────────────────────────────────────────────────────────
//  🛠️ WATERMARK REMOVER API CONFIG
// ────────────────────────────────────────────────────────────────────────────
const BASE_URL_WM = "https://api.watermarkremover.io";
const URL_REMOVE_WM = "/service/public/transformation/v1.0/predictions/wm/remove";
const URL_SECRET = "https://api.pixelbin.io/service/public/transformation/v1.0/predictions/wm/remove";
const SIGN_KEY = "A4nzUYcDOZ";

const shaderTypes = ["FRAGMENT_SHADER", "VERTEX_SHADER"];
const precisionLevels = ["LOW_FLOAT", "MEDIUM_FLOAT", "HIGH_FLOAT", "LOW_INT", "MEDIUM_INT", "HIGH_INT"];
const extensions = [
  "ANGLE_instanced_arrays", "EXT_blend_minmax", "EXT_clip_control",
  "EXT_color_buffer_half_float", "EXT_depth_clamp", "EXT_disjoint_timer_query",
  "OES_texture_float", "OES_texture_half_float", "WEBGL_draw_buffers"
];
const extensionParams = [
  "COLOR_ATTACHMENT0_WEBGL=36064", "COMPRESSED_RGBA_S3TC_DXT1_EXT=33777",
  "DEPTH_CLAMP_EXT=34383", "FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING_EXT=33296",
  "TEXTURE_MAX_ANISOTROPY_EXT=34046=16"
];

let k = [2277735313, 289559509];
let I = [1291169091, 658871167];
let P = [0, 5];
let C = [0, 1390208809];
let A = [0, 944331445];
let E = [4283543511, 3981806797];
let S = [3301882366, 444984403];

function fakeUserAgent() {
  const uas = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0"
  ];
  return uas[Math.floor(Math.random() * uas.length)];
}

const getHeadersListWm = () => ({
  "authority": "api.watermarkremover.io",
  "accept": "application/json, text/plain, */*",
  "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7,ru;q=0.6",
  "origin": "https://www.watermarkremover.io",
  "pixb-cl-id": "d6b7221dce0eb93bfa9641d48b72bef6",
  "priority": "u=1, i",
  "referer": "https://www.watermarkremover.io/",
  "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-site",
  "user-agent": fakeUserAgent()
});

function _delay(msec) {
  return new Promise(resolve => setTimeout(resolve, msec));
}

function randomChar(length = 5) {
  const chr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
  return Array.from({ length }).map(_ => chr.charAt(Math.floor(Math.random() * chr.length))).join("");
}

function generateRandomMathValues() {
  const x = Math.random() * 2 - 1;
  const y = Math.random() * 10;

  return {
    acos: Math.acos(Math.abs(x)),
    acosh: Math.acosh(y + 1),
    acoshPf: Math.acosh(y + 1),
    asin: Math.asin(x),
    asinh: Math.asinh(x),
    asinhPf: Math.asinh(x),
    atanh: Math.atanh(x * 0.9),
    atanhPf: Math.atanh(x * 0.9),
    atan: Math.atan(x),
    sin: Math.sin(y),
    sinh: Math.sinh(y),
    sinhPf: Math.sinh(y * 0.5),
    cos: Math.cos(y),
    cosh: Math.cosh(y),
    coshPf: Math.cosh(y),
    tan: Math.tan(y),
    tanh: Math.tanh(y),
    tanhPf: Math.tanh(y),
    exp: Math.exp(x),
    expm1: Math.expm1(x),
    expm1Pf: Math.expm1(x),
    log1p: Math.log1p(y),
    log1pPf: Math.log1p(y),
    powPI: Math.pow(Math.PI, -y)
  };
}

function getRandomParameter() {
  const keys = [
    "ACTIVE_ATTRIBUTES", "ACTIVE_TEXTURE", "ACTIVE_UNIFORMS", "ALIASED_LINE_WIDTH_RANGE",
    "ALIASED_POINT_SIZE_RANGE", "ALPHA", "ALPHA_BITS", "ALWAYS", "ARRAY_BUFFER",
    "ARRAY_BUFFER_BINDING", "ATTACHED_SHADERS", "BACK", "BLEND", "BLEND_COLOR",
    "BLEND_DST_ALPHA", "BLEND_DST_RGB", "BLEND_EQUATION", "BLEND_EQUATION_ALPHA",
    "BLEND_EQUATION_RGB", "BLEND_SRC_ALPHA", "BLEND_SRC_RGB", "BLUE_BITS",
    "BOOL", "BOOL_VEC2", "BOOL_VEC3", "BOOL_VEC4", "BROWSER_DEFAULT_WEBGL"
  ];

  const key = keys[Math.floor(Math.random() * keys.length)];
  const value = Math.random() > 0.5 ? Math.floor(Math.random() * 50000) : `${Math.floor(Math.random() * 1000)},${Math.floor(Math.random() * 1000)}`;
  return `"${key}=${value}"`;
}

function generateRandomParameters(count = 10) {
  const parameters = [];
  for (let i = 0; i < count; i++) {
    parameters.push(getRandomParameter());
  }
  return `{\n  "parameters": [\n    ${parameters.join(",\n    ")}\n  ]\n}`;
}

const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateShaderPrecisions = () => {
  return shaderTypes.flatMap(type =>
    precisionLevels.map(level => `${type}.${level}=${getRandomNumber(10, 200)},${getRandomNumber(10, 200)},${getRandomNumber(0, 50)}`)
  );
};

const generateExtensions = () => {
  return extensions.sort(() => Math.random() - 0.5).slice(0, getRandomNumber(5, extensions.length));
};

const generateExtensionParameters = () => {
  return extensionParams.sort(() => Math.random() - 0.5).slice(0, getRandomNumber(3, extensionParams.length));
};

const generateDummyData = () => {
  return {
    shaderPrecisions: generateShaderPrecisions(),
    extensions: generateExtensions(),
    extensionParameters: generateExtensionParameters()
  };
};

const getComponents = () => ({
  "applePay": [-1, 1, 0][Math.floor(Math.random() * 3)],
  "architecture": Math.floor(Math.random() * 255),
  "audio": Math.random() * 999.9999,
  "audioBaseLatency": [-1, -2, 1][Math.floor(Math.random() * 3)],
  "canvas": {
    "winding": [false, true][Math.floor(Math.random() * 2)],
    "geometry": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHoAAABuCAYAAADoHgdpAAAAAXNSR0IArs4c6QAAFKJJREFUeF7tXQt0XVWZ/vZN0jSlARkr2GAmTaqhDuA4pCxxRiGglIcBcRBK2qqURwsIWgUc6QyKukRmFEURoQEFURqrMDo1IzNgh7DUAoveTmdaZtosmqSGtmsKVdqUQnKTu+d+596TnHPueex97rnnXEn+tVwl3v349/7Ov/f/2nsLJEiyUTagGm0QOBESxwNogkADgFYPtnZAYi8EBgH0QWIbxpDG6i0zjPJV2XZINBn/LWS78a/EvEJb5r/8k/XzlG8LyGIQKfGU8d/j2UFxzSm9jVI2VANtAjhRIs+fgD9/Etgr8u33SWDbGJAeEmJPgtNcGGaMHMi3y1pk0QGJRRAgEF6A+nOVHQUy+/NlRvYAcwA0A3gHgAUEPNygRgH8B4DfAHgWwED9DGBuPdBQD8yekf83HBH0XgE8PhP45f8Iwa5iJRFHb7JFdgDozH3lS0L1ZwKbHZkE2K+hvwTwrgLoCh0S3F8CWB9U1gp865uDSvv9vhZAd78QPaU0olO3bEDLv5Az8DquA7AiNygue/o0PgyM7lcD1631twA4BcCpxVKeAfBQ7lv4CYB+fc6AaEDfAaBrJvDdckt55EBLSIEWfB4SN0BA/7M3pZdLclQ0C8D7cuvyaSB3uBfA/QBeiap9E/S2hvwHoEkS2C+AO/qB2yGE1KyuVDxSoOV8eRkkbjWUKl0iwATX3Ht16yuUf+Ro4K4zgRdPVigctgiXdP4v3H6+KwfIrTuFeDBs9171IgFaNsvjIfANANyL9YjL82uDAIEuE3Fp/lpB0TK6oMJ2LvJKXLmIkk0JD7eX90jgxgEhuLRHQiUDLefLFZD4LoAaLY4I7OuDwNiwVjXdwt05C+pLALgn24ia+fmFPVy3UZ3yBLzj+DBLekYA1+8UYo1Od2WRaNks10AYypY6lWMP9uj97wvKli9zVNYuVGc/VEmC3ToHaJurXV0CXQNCrNSu6KgQSqJlk5yLFNYWbGF1Hkb25vfhMtO+nKK1qmALK3VFG/wSAEcqlQ5fKCTgtMHHgKWlOF60gZbzJb1Yj2iZTDEt00SgD8Anw5hMNMVo6R8bHkflmlTUTp+nu5zvEMBHdwqxTbkfS0EtoOXb5cnIgka++hpEZetVTn/56XkAV+SAfilsV5Toj+UsWzphy03hpHtvCuh4QYjNuuwpA12Q5Me1QI5pqTYl+eOlgGzOHMG+LCbJZp/UzPX2bvrSF+lKthLQRvChxnADq3m4YlyqOVfck+lbHdD9zL3Kcxnn0hData3JiL5mvmMcOGOXEHtVe1IDulk+qax4EeTDO8pqFzsHR5AZhIiUqKBdGWmL/o1pgk0FbUCIM1Q5DARay4SKcT82B6hkQqnOhrNcHKaXtU99sJVNL1+g5Xy5EtJwDQdTAiDTGfIPwZyVVoI2NgGPizSVNAGs3ClEVxB7nkAX3JpblTxeCYBMtya9mGNBIyz1d3rQPlVmd6mTRz2wMxI4Kchd6g10i2SINth3nQDInJerrL7rUsEMqk/fOM2uOIlg09ZWC4709AtBh64nuQJdiEI9EDiuhEB+FMDnApmLuMBFucyEcka93NjVAFsAy/2iXkVAF+LJtFT8Q43Urg9xZY+XGKw9PSfRu+PtFjgawA1Gjlm8pK6g7epnQVH"
  },
  "colorDepth": Math.floor(Math.random() * 24),
  "colorGamut": ["srgb", "rgb", "rgba"][Math.floor(Math.random() * 3)],
  "contrast": Math.floor(Math.random() * 255),
  "cookiesEnabled": true,
  "deviceMemory": Math.floor(Math.random() * 24),
  "fontPreferences": {
    "default": Math.random() * 247.9999,
    "apple": Math.random() * 239.1013,
    "serif": Math.random() * 973.1287,
    "sans": Math.random() * 778.1238,
    "mono": Math.random() * 87.918351,
    "min": Math.random() * 9.23409,
    "system": Math.random() * 999.999999
  },
  "fonts": [
    "Agency FB", "Calibri", "Century", "Century Gothic", "Franklin Gothic",
    "Futura Bk BT", "Futura Md BT", "Haettenschweiler", "Humanst521 BT",
    "Leelawadee", "Lucida Bright", "Lucida Sans", "MS Outlook",
    "MS Reference Specialty", "MS UI Gothic", "MT Extra", "Marlett",
    "Microsoft Uighur", "Monotype Corsiva", "Pristina", "Segoe UI Light"
  ].slice(Math.random() * 5, Math.random() * 20),
  "forcedColors": false,
  "hardwareConcurrency": Math.floor(Math.random() * 12),
  "hdr": [false, true, false][Math.floor(Math.random() * 3)],
  "indexedDB": true,
  "languages": [
    [
      "id-ID", "en-EN", "us-US", "eu-EU"
    ][Math.floor(Math.random() * 4)]
  ],
  "localStorage": true,
  "math": generateRandomMathValues(),
  "monochrome": 0,
  "openDatabase": false,
  "pdfViewerEnabled": true,
  "platform": ["Win32", "Win64", "Linux", "MacOS"][Math.floor(Math.random() * 4)],
  "plugins": [
    {
      "name": "PDF Viewer",
      "description": "Portable Document Format",
      "mimeTypes": [
        { "type": "application/pdf", "suffixes": "pdf" },
        { "type": "text/pdf", "suffixes": "pdf" }
      ]
    }
  ],
  "reducedMotion": false,
  "reducedTransparency": false,
  "screenFrame": [0, 0, 50, 0],
  "screenResolution": [
    Math.random() * 4090,
    Math.random() * 3090
  ],
  "sessionStorage": true,
  "timezone": "Asia/Jakarta",
  "touchSupport": {
    "maxTouchPoints": 0,
    "touchEvent": false,
    "touchStart": false
  },
  "vendor": `${randomChar(10)}`,
  "vendorFlavors": ["chrome"],
  "webGlBasics": {
    "version": "WebGL 1.0 (OpenGL ES 2.0 Chromium)",
    "vendor": "WebKit",
    "vendorUnmasked": `${randomChar(10)} (NVIDIA)`,
    "renderer": "WebKit WebGL",
    "rendererUnmasked": `ANGLE (NVIDIA, NVIDIA GeForce RTX ${["3090", "4090", "5090", "360", "450", "720"][Math.floor(Math.random() * 6)]} (0x00001380) Direct3D11 vs_5_0 ps_5_0, D3D11)`,
    "shadingLanguageVersion": "WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)"
  },
  "webGlExtensions": {
    "contextAttributes": [
      `alpha=${Math.random() < 0.5}`,
      `antialias=${Math.random() < 0.5}`,
      `depth=${Math.random() < 0.5}`,
      `desynchronized=${Math.random() < 0.5}`,
      `failIfMajorPerformanceCaveat=${Math.random() < 0.5}`,
      `powerPreference=default`,
      `premultipliedAlpha=${Math.random() < 0.5}`,
      `preserveDrawingBuffer=${Math.random() < 0.5}`,
      `stencil=${Math.random() < 0.5}`,
      `xrCompatible=${Math.random() < 0.5}`
    ],
    "parameters": generateRandomParameters(15),
    ...generateDummyData(),
    "unsupportedExtensions": []
  }
});

function _(e, t) {
  if ((t %= 64) !== 0) {
    if (t < 32) {
      e[0] = e[1] >>> 32 - t;
      e[1] = e[1] << t;
    } else {
      e[0] = e[1] << t - 32;
      e[1] = 0;
    }
  }
}

function b(e, t) {
  let n = e[0] >>> 16;
  let r = e[0] & 65535;
  let o = e[1] >>> 16;
  let i = e[1] & 65535;
  let a = t[0] >>> 16;
  let s = t[0] & 65535;
  let l = t[1] >>> 16;
  let u = t[1] & 65535;
  let c = 0;
  let d = 0;
  let f = 0;
  let p = 0;
  f += (p += i * u) >>> 16;
  p &= 65535;
  d += (f += o * u) >>> 16;
  f &= 65535;
  d += (f += i * l) >>> 16;
  f &= 65535;
  c += (d += r * u) >>> 16;
  d &= 65535;
  c += (d += o * l) >>> 16;
  d &= 65535;
  c += (d += i * s) >>> 16;
  d &= 65535;
  c += n * u + r * l + o * s + i * a;
  c &= 65535;
  e[0] = c << 16 | d;
  e[1] = f << 16 | p;
}

function w(e, t) {
  let n = e[0];
  if ((t %= 64) === 32) {
    e[0] = e[1];
    e[1] = n;
  } else if (t < 32) {
    e[0] = n << t | e[1] >>> 32 - t;
    e[1] = e[1] << t | n >>> 32 - t;
  } else {
    t -= 32;
    e[0] = e[1] << t | n >>> 32 - t;
    e[1] = n << t | e[1] >>> 32 - t;
  }
}

function x(e, t) {
  e[0] ^= t[0];
  e[1] ^= t[1];
}

function y(e, t) {
  let n = e[0] >>> 16;
  let r = e[0] & 65535;
  let o = e[1] >>> 16;
  let i = e[1] & 65535;
  let a = t[0] >>> 16;
  let s = t[0] & 65535;
  let l = t[1] >>> 16;
  let u = 0;
  let c = 0;
  let d = 0;
  let f = 0;
  d += (f += i + (t[1] & 65535)) >>> 16;
  f &= 65535;
  c += (d += o + l) >>> 16;
  d &= 65535;
  u += (c += r + s) >>> 16;
  c &= 65535;
  u += n + a;
  u &= 65535;
  e[0] = u << 16 | c;
  e[1] = d << 16 | f;
}

function O(e) {
  let t = [0, e[0] >>> 1];
  x(e, t);
  b(e, E);
  t[1] = e[0] >>> 1;
  x(e, t);
  b(e, S);
  t[1] = e[0] >>> 1;
  x(e, t);
}

function _encrypt(e) {
  let n = function (e) {
    let t = new Uint8Array(e.length);
    for (let n = 0; n < e.length; n++) {
      let r = e.charCodeAt(n);
      if (r > 127) {
        return new TextEncoder().encode(e);
      }
      t[n] = r;
    }
    return t;
  }(e);
  let t = 0;
  let r;
  let o = [0, n.length];
  let i = o[1] % 16;
  let a = o[1] - i;
  let s = [0, t];
  let l = [0, t];
  let u = [0, 0];
  let c = [0, 0];
  for (r = 0; r < a; r += 16) {
    u[0] = n[r + 4] | n[r + 5] << 8 | n[r + 6] << 16 | n[r + 7] << 24;
    u[1] = n[r] | n[r + 1] << 8 | n[r + 2] << 16 | n[r + 3] << 24;
    c[0] = n[r + 12] | n[r + 13] << 8 | n[r + 14] << 16 | n[r + 15] << 24;
    c[1] = n[r + 8] | n[r + 9] << 8 | n[r + 10] << 16 | n[r + 11] << 24;
    b(u, k);
    w(u, 31);
    b(u, I);
    x(s, u);
    w(s, 27);
    y(s, l);
    b(s, P);
    y(s, C);
    b(c, I);
    w(c, 33);
    b(c, k);
    x(l, c);
    w(l, 31);
    y(l, s);
    b(l, P);
    y(l, A);
  }
  u[0] = 0;
  u[1] = 0;
  c[0] = 0;
  c[1] = 0;
  let d = [0, 0];
  switch (i) {
    case 15:
      d[1] = n[r + 14];
      _(d, 48);
      x(c, d);
    case 14:
      d[1] = n[r + 13];
      _(d, 40);
      x(c, d);
    case 13:
      d[1] = n[r + 12];
      _(d, 32);
      x(c, d);
    case 12:
      d[1] = n[r + 11];
      _(d, 24);
      x(c, d);
    case 11:
      d[1] = n[r + 10];
      _(d, 16);
      x(c, d);
    case 10:
      d[1] = n[r + 9];
      _(d, 8);
      x(c, d);
    case 9:
      d[1] = n[r + 8];
      x(c, d);
      b(c, I);
      w(c, 33);
      b(c, k);
      x(l, c);
    case 8:
      d[1] = n[r + 7];
      _(d, 56);
      x(u, d);
    case 7:
      d[1] = n[r + 6];
      _(d, 48);
      x(u, d);
    case 6:
      d[1] = n[r + 5];
      _(d, 40);
      x(u, d);
    case 5:
      d[1] = n[r + 4];
      _(d, 32);
      x(u, d);
    case 4:
      d[1] = n[r + 3];
      _(d, 24);
      x(u, d);
    case 3:
      d[1] = n[r + 2];
      _(d, 16);
      x(u, d);
    case 2:
      d[1] = n[r + 1];
      _(d, 8);
      x(u, d);
    case 1:
      d[1] = n[r];
      x(u, d);
      b(u, k);
      w(u, 31);
      b(u, I);
      x(s, u);
  }
  x(s, o);
  x(l, o);
  y(s, l);
  y(l, s);
  O(s);
  O(l);
  y(s, l);
  y(l, s);
  return ("00000000" + (s[0] >>> 0).toString(16)).slice(-8) + ("00000000" + (s[1] >>> 0).toString(16)).slice(-8) + ("00000000" + (l[0] >>> 0).toString(16)).slice(-8) + ("00000000" + (l[1] >>> 0).toString(16)).slice(-8);
}

function _objToStr(e) {
  let t = "";
  for (let n = 0, r = Object.keys(e).sort(); n < r.length; n++) {
    const o = r[n];
    const i = e[o];
    const a = typeof i == "string" ? i : JSON.stringify(i);
    t += `${t ? "|" : ""}${o.replace(/([:|\\])/g, "\\$1")}:${a}`;
  }
  return t;
}

function _visitorId() {
  const txt = _objToStr(getComponents());
  const enc = _encrypt(txt.trim());
  return enc;
}

async function _initSignature(vis, headWm) {
  const iso = new Date().toISOString();
  const params = Buffer.from(iso).toString("base64");
  const uri = new URL(URL_SECRET);
  const hm = `POST${encodeURI(uri.pathname + uri.search)}${iso}${vis}`;
  const sig = crypto.createHmac("sha256", SIGN_KEY).update(hm).digest("hex");
  headWm["x-ebg-param"] = params;
  headWm["x-ebg-signature"] = sig;
  headWm["pixb-cl-id"] = vis;
}

async function _approvalWm(headWm) {
  const res = await fetch(BASE_URL_WM + URL_REMOVE_WM, {
    method: "OPTIONS",
    headers: headWm
  });
  return res.status;
}

async function req(url, method = "GET", data = null, params = null, head = null) {
  try {
    let pUrl = url;
    if (params) {
      const cUrl = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => cUrl.append(k, v));
      pUrl = url + "?" + cUrl.toString();
    }
    const res = await fetch(pUrl, {
      method,
      headers: head ? head : getHeadersListWm(),
      ...(data ? { body: data } : {})
    });
    return res;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function Remove(buffer) {
  try {
    const headWm = getHeadersListWm();
    const status = await _approvalWm(headWm);
    if (status !== 204) {
      console.log("[ WARN ] Remove Watermark Request denied.");
    }
    
    const vis = _visitorId();
    await _initSignature(vis, headWm);
    
    const blob = new Blob([buffer], { type: "image/jpeg" });
    const form = new FormData();
    form.append("input.image", blob, `${crypto.randomUUID().toString()}.jpg`);
    form.append("input.rem_text", "false");
    form.append("input.rem_logo", "false");
    form.append("retention", "1d");

    const finalHeaders = {
      ...headWm
    };

    const ts = await fetch(BASE_URL_WM + URL_REMOVE_WM, {
      method: "POST",
      headers: finalHeaders,
      body: form
    });
    
    const jsn = await ts.json();
    let results = null;

    if (jsn.status && jsn.status === "ACCEPTED") {
      const uri = new URL(jsn.urls.get);
      const headOri = {
        origin: "https://" + uri.hostname,
        referer: jsn.urls.get,
        "user-agent": fakeUserAgent()
      };
      while (true) {
        const rm = await req(jsn.urls.get, "GET", null, null, headOri);
        const jj = await rm.json();
        if (jj.status && jj.status === "SUCCESS") {
          results = jj;
          break;
        }
        await _delay(3000);
      }
    }

    return results;
  } catch (error) {
    console.error(error);
    return null;
  }
}

// ────────────────────────────────────────────────────────────────────────────
//  🤖 WHATSAPP COMMAND REGISTRATION
// ────────────────────────────────────────────────────────────────────────────
cmd({
    pattern: 'removewm',
    alias: ['unwm', 'rw', 'delwm'],
    desc: 'Remove watermark from an image (Owner only/Public)',
    category: 'tools',
    react: '🧼',
    use: '.removewm (reply to an image)',
    filename: __filename
},
async (conn,  mek,  m, { text, reply }) => {
    const from = mek.key.remoteJid;
    try {
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';
        
        if (!/image/.test(mime)) {
            return conn.sendMessage(from, {
                text: `╭━━━〔 *⚠️ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Please reply to an image to remove its watermark!*\n╰━━━━━━━━━━━━━━━┈`,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363429597718924@newsletter',
                        newsletterName: 'ɴᴏᴠᴀ_x ᴍɪɴɪ',
                        serverMessageId: 143
                    }
                }
            }, { quoted: mek });
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        // Download the replied image
        const mediaPath = await conn.downloadAndSaveMediaMessage(quoted, 'temp_wm');
        const fs = require('fs');
        const buffer = fs.readFileSync(mediaPath);

        // Delete temporary file
        if (fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath);

        const result = await Remove(buffer);

        if (!result || !result.output || !result.output[0]) {
            throw new Error("Watermark removal failed to produce an output URL.");
        }

        const cleanImage = result.output[0];

        await conn.sendMessage(from, {
            image: { url: cleanImage },
            caption: `╭━━━〔 *🧼 ɴᴏᴠᴀ_x ᴜɴᴡᴍ* 〕━━━┈\n┃\n┃ ✅ *Watermark removed successfully!*\n┃\n╰━━━━━━━━━━━━━━━┈\n> © 𝘕𝘰𝘷α𝘟_𝘔𝘪𝘯𝘪`,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363429597718924@newsletter',
                    newsletterName: 'ɴᴏᴠᴀ_x ᴍɪɴɪ',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error('REMOVEWM CMD ERROR:', err);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await conn.sendMessage(from, {
            text: `╭━━━〔 *❌ ɴᴏᴠᴀ_x ᴍɪɴɪ* 〕━━━┈\n┃ *Watermark removal failed!*\n┃ 🛠 *Error:* ${err.message}\n╰━━━━━━━━━━━━━━━┈`,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363429597718924@newsletter',
                    newsletterName: 'ɴᴏᴠᴀ_x ᴍɪɴɪ',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });
    }
});
