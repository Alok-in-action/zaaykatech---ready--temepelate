/**
 * Polyfill for DOMMatrix in Node.js server environments.
 * Prevents "ReferenceError: DOMMatrix is not defined" when libraries
 * like pdfjs-dist / pdf-parse are bundled or evaluated in serverless runtimes.
 */
if (typeof globalThis !== 'undefined' && typeof globalThis.DOMMatrix === 'undefined') {
  class DOMMatrixPolyfill {
    a = 1;
    b = 0;
    c = 0;
    d = 1;
    e = 0;
    f = 0;
    m11 = 1;
    m12 = 0;
    m13 = 0;
    m14 = 0;
    m21 = 0;
    m22 = 1;
    m23 = 0;
    m24 = 0;
    m31 = 0;
    m32 = 0;
    m33 = 1;
    m34 = 0;
    m41 = 0;
    m42 = 0;
    m43 = 0;
    m44 = 1;
    is2D = true;
    isIdentity = true;

    constructor(init?: number[] | string) {
      if (Array.isArray(init) && init.length >= 6) {
        this.a = this.m11 = init[0];
        this.b = this.m12 = init[1];
        this.c = this.m21 = init[2];
        this.d = this.m22 = init[3];
        this.e = this.m41 = init[4];
        this.f = this.m42 = init[5];
        this.isIdentity =
          this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.e === 0 && this.f === 0;
      }
    }

    translate(tx = 0, ty = 0): this {
      this.e += tx * this.a;
      this.f += ty * this.d;
      return this;
    }

    scale(sx = 1, sy = sx): this {
      this.a *= sx;
      this.d *= sy;
      return this;
    }

    rotate(): this {
      return this;
    }

    multiply(): this {
      return this;
    }

    multiplySelf(): this {
      return this;
    }

    preMultiplySelf(): this {
      return this;
    }

    invertSelf(): this {
      return this;
    }

    setTransform(): this {
      return this;
    }

    getTransform(): this {
      return this;
    }
  }

  (globalThis as any).DOMMatrix = DOMMatrixPolyfill;
}
