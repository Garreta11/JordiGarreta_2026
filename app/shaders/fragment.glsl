uniform float time;
uniform float progress;
uniform float distanceFromCenter;
uniform sampler2D texture1;

varying vec2 vUv;
varying vec2 vUvCorrected;
varying vec3 vPosition;

void main() {
	vec4 t = texture2D(texture1, vUvCorrected);

	float bw = (t.r + t.g + t.b) / 3.;
	vec4 another = vec4(bw, bw, bw, 1.0);

	gl_FragColor = mix(another, t, distanceFromCenter);
	gl_FragColor.a = clamp(distanceFromCenter, 0.1, 1.);
}