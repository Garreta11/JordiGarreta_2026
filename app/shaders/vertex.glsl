uniform float spiralAngle;
uniform float uRadius;
uniform float uPlaneAspect;
uniform float uTextureAspect;
uniform float uDeform;
uniform vec2 uMouseNDC;
uniform float uMouseStrength;
varying vec2 vUv;
varying vec2 vUvCorrected;
varying vec3 vPosition;
varying float vMouseInfluence;

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
    pos.z += sin(position.y * 3.0 + 100.) * uDeform * 0.07;
    pos.y += sin(position.x * 3.0) * uDeform * 0.04;

    // Mouse distortion: project this vertex to NDC, measure distance to mouse,
    // then bulge toward the camera with a gaussian falloff
    vec4 proj = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    vec2 ndcPos = proj.xy / proj.w;
    float mouseDist = length(ndcPos - uMouseNDC);
    float bulge = exp(-mouseDist * mouseDist * 5.0) * uMouseStrength;
    pos.z += bulge * 0.5;

    vMouseInfluence = bulge;
    vUvCorrected = uv + 0.5;

    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
