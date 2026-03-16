uniform float spiralAngle;
uniform float uRadius;
uniform float uPlaneAspect;   // add this: width / height of the plane geometry
uniform float uTextureAspect; // add this: texture width / height
varying vec2 vUv;
varying vec2 vUvCorrected;    // add this
varying vec3 vPosition;

void main() {
    vec3 pos = position;

    float radius = uRadius;
    float localBend = pos.x;
    float angle = spiralAngle + localBend;

    pos.x = radius * sin(angle);
    pos.z = radius * cos(angle);

    vUv = uv;

    // Cover mode: scale UVs to fill plane without distortion
    vec2 uv = vUv - 0.5;
    float planeAspect = uPlaneAspect;
    float texAspect   = uTextureAspect;

    if (texAspect > planeAspect) {
        // texture is wider than plane → letterbox on sides
        uv.x *= planeAspect / texAspect;
    } else {
        // texture is taller than plane → letterbox top/bottom
        uv.y *= texAspect / planeAspect;
    }

    vUvCorrected = uv + 0.5;

    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}