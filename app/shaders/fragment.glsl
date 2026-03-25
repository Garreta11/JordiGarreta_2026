uniform float distanceFromCenter;
uniform sampler2D texture1;
varying vec2 vUvCorrected;
uniform float opacity;
varying float vMouseInfluence;

void main() {
	// Zoom the texture slightly toward the UV center where the mouse bulge peaks
	vec2 centeredUV = vUvCorrected - 0.5;
	vec2 distortedUV = vUvCorrected + centeredUV * vMouseInfluence * 0.12;

	vec4 t = texture2D(texture1, distortedUV);

	float bw = (t.r + t.g + t.b) / 3.;
	vec4 another = vec4(bw, bw, bw, 1.0);

	gl_FragColor = mix(another, t, distanceFromCenter);
	gl_FragColor.a = clamp(distanceFromCenter, 0.1, 1.) * opacity;
}
