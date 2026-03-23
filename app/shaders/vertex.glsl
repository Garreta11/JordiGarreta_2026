uniform float spiralAngle;
uniform float uRadius;
uniform float uPlaneAspect;
uniform float uTextureAspect;
uniform float uDeform;
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

    pos.y = 1.0 * sin(pos.y);

    vUv = uv;

    // Cover mode: scale UVs to fill plane without distortion
    vec2 uv = vUv - 0.5;
    float planeAspect = uPlaneAspect;
    float texAspect = uTextureAspect;

    if(texAspect > planeAspect) {
        // texture is wider than plane → letterbox on sides
        uv.x *= planeAspect / texAspect;
    } else {
        // texture is taller than plane → letterbox top/bottom
        uv.y *= texAspect / planeAspect;
    }

    // Scroll deformation: wave in Z and Y driven by velocity
    pos.z += sin(position.y * 3.0) * uDeform * 0.05;
    pos.y += sin(position.x * 3.0) * uDeform * 0.08;

    vUvCorrected = uv + 0.5;

    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}