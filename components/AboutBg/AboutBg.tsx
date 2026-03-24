"use client";
import { forwardRef, useEffect, useRef } from "react";
import * as THREE from "three";
import styles from "./AboutBg.module.scss";
import vertShader from "./bg.vert";
import fragShader from "./bg.frag";

const TRAIL_LEN       = 50;
const DISTORTION_STRENGTH = 0.05;

interface Props {
  src: string;
}

const AboutBg = forwardRef<HTMLCanvasElement, Props>(({ src }, ref) => {
  const internalRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = (ref as React.RefObject<HTMLCanvasElement>) ?? internalRef;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !src) return;

    let w = window.innerWidth;
    let h = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 10);
    camera.position.z = 1;

    // Trail: ring of smoothed mouse positions
    const trail = Array.from({ length: TRAIL_LEN }, () => new THREE.Vector2(0.5, 0.5));

    const uniforms = {
      uTexture:       { value: null as THREE.Texture | null },
      uTrail:         { value: trail },
      uTime:          { value: 0 },
      uResolution:    { value: new THREE.Vector2(w, h) },
      uTextureAspect: { value: 1 },
      uDistortion:    { value: DISTORTION_STRENGTH },
    };

    const geometry = new THREE.PlaneGeometry(w, h);
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: vertShader,
      fragmentShader: fragShader,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    new THREE.TextureLoader().load(src, (texture) => {
      uniforms.uTexture.value = texture;
      uniforms.uTextureAspect.value = texture.image.width / texture.image.height;
    });

    // Mouse tracking
    const rawMouse    = new THREE.Vector2(0.5, 0.5);
    const smoothMouse = new THREE.Vector2(0.5, 0.5);

    const onMouseMove = (e: MouseEvent) => {
      rawMouse.set(e.clientX / w, 1 - e.clientY / h);
    };
    window.addEventListener("mousemove", onMouseMove);

    // RAF loop
    const clock = new THREE.Clock();
    let rafId: number;

    const tick = () => {
      rafId = requestAnimationFrame(tick);
      uniforms.uTime.value += clock.getDelta();

      // Smooth mouse
      smoothMouse.lerp(rawMouse, 0.04);

      // Shift trail and insert new head
      for (let i = TRAIL_LEN - 1; i > 0; i--) {
        trail[i].copy(trail[i - 1]);
      }
      trail[0].copy(smoothMouse);

      renderer.render(scene, camera);
    };
    rafId = requestAnimationFrame(tick);

    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      renderer.setSize(w, h);
      camera.left = -w / 2; camera.right = w / 2;
      camera.top = h / 2;   camera.bottom = -h / 2;
      camera.updateProjectionMatrix();
      mesh.geometry.dispose();
      mesh.geometry = new THREE.PlaneGeometry(w, h);
      uniforms.uResolution.value.set(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      uniforms.uTexture.value?.dispose();
      material.dispose();
      geometry.dispose();
      renderer.dispose();
    };
  }, [src]);

  return <canvas ref={canvasRef} className={styles.canvas} />;
});

AboutBg.displayName = "AboutBg";
export default AboutBg;
