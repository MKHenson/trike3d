export const _Math = {
  DEG2RAD: Math.PI / 180,
  RAD2DEG: 180 / Math.PI,

  generateUUID: (function() {
    var lut: string[] = [];

    for (var i = 0; i < 256; i++) {
      lut[i] = (i < 16 ? '0' : '') + i.toString(16);
    }

    return function generateUUID() {
      var d0 = (Math.random() * 0xffffffff) | 0;
      var d1 = (Math.random() * 0xffffffff) | 0;
      var d2 = (Math.random() * 0xffffffff) | 0;
      var d3 = (Math.random() * 0xffffffff) | 0;
      var uuid =
        lut[d0 & 0xff] +
        lut[(d0 >> 8) & 0xff] +
        lut[(d0 >> 16) & 0xff] +
        lut[(d0 >> 24) & 0xff] +
        '-' +
        lut[d1 & 0xff] +
        lut[(d1 >> 8) & 0xff] +
        '-' +
        lut[((d1 >> 16) & 0x0f) | 0x40] +
        lut[(d1 >> 24) & 0xff] +
        '-' +
        lut[(d2 & 0x3f) | 0x80] +
        lut[(d2 >> 8) & 0xff] +
        '-' +
        lut[(d2 >> 16) & 0xff] +
        lut[(d2 >> 24) & 0xff] +
        lut[d3 & 0xff] +
        lut[(d3 >> 8) & 0xff] +
        lut[(d3 >> 16) & 0xff] +
        lut[(d3 >> 24) & 0xff];

      // .toUpperCase() here flattens concatenated strings to save heap memory space.
      return uuid.toUpperCase();
    };
  })(),

  clamp: function(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
  },

  // compute euclidian modulo of m % n
  // https://en.wikipedia.org/wiki/Modulo_operation
  euclideanModulo: function(n: number, m: number) {
    return ((n % m) + m) % m;
  },

  // Linear mapping from range <a1, a2> to range <b1, b2>
  mapLinear: function(x: number, a1: number, a2: number, b1: number, b2: number) {
    return b1 + ((x - a1) * (b2 - b1)) / (a2 - a1);
  },

  // https://en.wikipedia.org/wiki/Linear_interpolation
  lerp: function(x: number, y: number, t: number) {
    return (1 - t) * x + t * y;
  },

  // http://en.wikipedia.org/wiki/Smoothstep
  smoothstep: function(x: number, min: number, max: number) {
    if (x <= min) return 0;
    if (x >= max) return 1;

    x = (x - min) / (max - min);

    return x * x * (3 - 2 * x);
  },

  smootherstep: function(x: number, min: number, max: number) {
    if (x <= min) return 0;
    if (x >= max) return 1;

    x = (x - min) / (max - min);

    return x * x * x * (x * (x * 6 - 15) + 10);
  },

  randInt: function(low: number, high: number) {
    return low + Math.floor(Math.random() * (high - low + 1));
  },

  randFloat: function(low: number, high: number) {
    return low + Math.random() * (high - low);
  },

  randFloatSpread: function(range: number) {
    return range * (0.5 - Math.random());
  },

  degToRad: function(degrees: number) {
    return degrees * _Math.DEG2RAD;
  },

  radToDeg: function(radians: number) {
    return radians * _Math.RAD2DEG;
  },

  isPowerOfTwo: function(value: number) {
    return (value & (value - 1)) === 0 && value !== 0;
  },

  ceilPowerOfTwo: function(value: number) {
    return Math.pow(2, Math.ceil(Math.log(value) / Math.LN2));
  },

  floorPowerOfTwo: function(value: number) {
    return Math.pow(2, Math.floor(Math.log(value) / Math.LN2));
  }
};
