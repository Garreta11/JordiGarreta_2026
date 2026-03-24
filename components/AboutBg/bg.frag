#define TRAIL_LEN 24

uniform sampler2D uTexture;
uniform vec2 uTrail[TRAIL_LEN];
uniform float uTime;
uniform float uTextureAspect;
uniform vec2 uResolution;
uniform float uDistortion;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;

  // Cover-fit UV correction
  float screenAspect = uResolution.x / uResolution.y;
  vec2 coverUv = uv - 0.5;
  if (uTextureAspect > screenAspect) {
    coverUv.x *= screenAspect / uTextureAspect;
  } else {
    coverUv.y *= uTextureAspect / screenAspect;
  }
  coverUv += 0.5;

  float ar = uResolution.x / uResolution.y;
  vec2 distort = vec2(0.0);

  for (int i = 0; i < TRAIL_LEN - 1; i++) {
    // Age: smooth cubic falloff from head to tail
    float t = 1.0 - float(i) / float(TRAIL_LEN - 1);
    float age = t * t * (3.0 - 2.0 * t); // smoothstep curve

    // Aspect-correct distance from this trail point to current UV
    vec2 toPoint = (uv - uTrail[i]) * vec2(ar, 1.0);
    float dist = length(toPoint);
    float spatial = exp(-dist * dist * 3.0); // wider, softer blob

    // Motion direction between consecutive trail points
    vec2 motion = uTrail[i] - uTrail[i + 1];
    float speed = length(motion) * float(TRAIL_LEN);

    // Warp along motion direction
    distort += motion * spatial * age * 10.0;

    // Perpendicular swirl for liquid feel
    vec2 perp = vec2(-motion.y, motion.x);
    distort += perp * spatial * age * 5.0;

    // Ripple rings outward from each trail point
    vec2 dir = toPoint / (dist + 0.001);
    float ripple = sin(dist * 10.0 - uTime * 1.5 + float(i) * 0.2)
                 * exp(-dist * 3.0) * speed;
    distort += dir * ripple * 0.2 * age;
  }

  coverUv -= distort * uDistortion;

  gl_FragColor = texture2D(uTexture, coverUv);
}
