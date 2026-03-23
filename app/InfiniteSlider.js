import * as THREE from 'three';
import fragment from './shaders/fragment.glsl';
import vertex from './shaders/vertex.glsl';
import { urlFor } from '@/lib/sanity.image';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';

import gsap from 'gsap';

export default class InfiniteSlider {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.container = options.dom;
    this.images = options.images;

    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      toneMapping: THREE.ACESFilmicToneMapping,
      toneMappingExposure: 1,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x181818, 0);
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      this.width / this.height,
      0.1,
      1000,
    );
    this.camera.position.set(0, 0, 5);

    const ambient = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(ambient);

    this.loader = new THREE.TextureLoader();
    this.gltfLoader = new GLTFLoader();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.time = 0;
    this.isPlaying = true;

    this.introProgress = 0; // 0 = flat, 1 = spiral
    this.currentPosition = 0;

    this.meshes = [];
    this.materials = [];
    this.groups = [];

    this.addObjects();
    this.handleImages();
    // this.setModel()

    // this.setupPostProcessing();
    // this.setupClick();

    this.setupResize();
    this.render();

    // Store bound references so they can be removed later
    this._onClick = this.setupClick.bind(this);

    window.addEventListener('click', this._onClick, false);
  }

  addObjects() {
    this.material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      uniforms: {
        time: { value: 0 },
        distanceFromCenter: { value: 0 },
        spiralAngle: { value: 0 },
        spiralHeight: { value: 0 },
        texture1: { value: null },
        uRadius: { value: 1 },
        uPlaneAspect: { value: 1.0 },
        uTextureAspect: { value: 1.0 },
        uDeform: { value: 0.0 },
        opacity: { value: 1.0 },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
    });
  }

  handleImages() {
    this.images.forEach((im, i) => {
      const mat = this.material.clone();
      this.materials.push(mat);

      const group = new THREE.Group();

      this.loader.load(urlFor(im.mainImage).url(), (texture) => {
        mat.uniforms.texture1.value = texture;
        const imgW = texture.image.width;
        const imgH = texture.image.height;
        mat.uniforms.uTextureAspect.value = imgW / imgH;
      });

      // const geo = new THREE.PlaneGeometry(0.77, 1.5, 20, 20);
      const geo = new THREE.PlaneGeometry(1.0, 1.95, 20, 20);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData.slug = im.slug;

      group.add(mesh);
      this.scene.add(group);

      this.meshes.push(mesh);
      this.groups.push(group);
    });
  }

  setModel() {
    Promise.all([this.gltfLoader.loadAsync('/model/jordi.glb')]).then(
      ([model]) => {
        this.model = model.scene.children[0];
        this.model.geometry.rotateX(-Math.PI / 2);
        this.model.geometry.rotateY(-Math.PI / 8);
        this.model.geometry.scale(0.25, 0.25, 0.25);
        this.model.material = new THREE.MeshPhysicalMaterial({
          side: THREE.DoubleSide,
          roughness: 0,
          metalness: 1,
          transmission: 1,
          thickness: 0.1,
          clearcoat: 1,
          envMapIntensity: 1,
        });
        this.model.receiveShadow = true;
        this.model.castShadow = true;
        this.scene.add(this.model);

        // Optional: small environment for reflections
        const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
          format: THREE.RGBAFormat,
          generateMipmaps: true,
          minFilter: THREE.LinearMipmapLinearFilter,
        });
        this.cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
        this.cubeCamera.position.copy(this.model.position);
      },
    );
  }

  updateMeshes(
    position = 0,
    loops = 2,
    verticalSpacing = 0.8,
    horizontalSpacing = 1.0,
    radius = 1,
  ) {
    const count = this.meshes.length;
    const t = this.introProgress;
    this.currentPosition = position;
    this.currentSpacing = verticalSpacing;
    this.currentHSpacing = horizontalSpacing;
    this.currentRadius = radius;

    // Auto-fit the flat row to the camera's visible width at z=0
    const fovRad = (70 * Math.PI) / 180;
    const visibleWidth = 2 * Math.tan(fovRad / 2) * this.camera.position.z;
    const gap = (visibleWidth * 1) / (count - 1); // 85% of screen width

    const totalWidth = (count - 1) * gap;

    this.meshes.forEach((mesh, i) => {
      const delta = i - position;
      const angle = (delta / count) * Math.PI * 2 * loops * horizontalSpacing;
      const spiralY = -delta * verticalSpacing;
      const flatX = i * gap - totalWidth / 2;

      mesh.position.x = flatX * (1 - t);
      mesh.position.y = flatX * 0 + (spiralY - 0) * t; // flatY = 0
      mesh.position.z = 0;

      mesh.material.uniforms.spiralAngle.value = angle * t;
      mesh.material.uniforms.uRadius.value = radius * t;
      mesh.material.uniforms.distanceFromCenter.value =
        t * (1 - Math.min(Math.abs(delta), 1) ** 2);
      mesh.material.uniforms.spiralHeight.value = spiralY * t;
    });
  }

  introAnimation(onComplete) {
    const target = { progress: 0 };

    gsap.to(target, {
      progress: 1,
      duration: 1.6,
      ease: 'power3.inOut',
      onUpdate: () => {
        this.introProgress = target.progress;
      },
      onComplete: () => {
        this.introProgress = 1;
        onComplete?.();
      },
    });
  }

  setupResize() {
    window.addEventListener('resize', () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.renderer.setSize(this.width, this.height);
      if (this.composer) {
        this.composer.setSize(this.width, this.height);
        this.bloomPass.setSize(this.width, this.height);
      }
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
    });
  }

  setupClick(event) {
    if (!this.meshes.length) return;

    const rect = this.container.getBoundingClientRect();
    const mouseNDC = new THREE.Vector2(
      ((event.clientX - rect.left) / this.width) * 2 - 1,
      -((event.clientY - rect.top) / this.height) * 2 + 1,
    );

    // The vertex shader displaces each mesh center to:
    //   x = radius * sin(spiralAngle)   (localBend=0 at center)
    //   y = mesh.position.y
    //   z = radius * cos(spiralAngle)
    // Raycasting against the flat geometry would miss these positions,
    // so we project each actual center to NDC and find the nearest one.
    const candidates = [];

    this.meshes.forEach((mesh) => {
      const angle = mesh.material.uniforms.spiralAngle.value;
      const radius = mesh.material.uniforms.uRadius.value;

      const worldPos = new THREE.Vector3(
        radius * Math.sin(angle),
        mesh.position.y,
        radius * Math.cos(angle),
      );
      worldPos.project(this.camera);

      const dist = Math.hypot(worldPos.x - mouseNDC.x, worldPos.y - mouseNDC.y);
      if (dist < 0.2) {
        candidates.push({ mesh, dist, ndcZ: worldPos.z });
      }
    });

    // Among hits, prefer the one closest to the camera (smallest NDC z)
    candidates.sort((a, b) => a.ndcZ - b.ndcZ);
    const closestMesh = candidates[0]?.mesh ?? null;

    if (closestMesh) {
      const slug = closestMesh.userData.slug;
      if (slug) {
        console.log(slug);
      }
    }
  }

  setupPostProcessing() {
    this.composer = new EffectComposer(this.renderer);

    // Base render pass
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.afterimagePass = new AfterimagePass();
    this.afterimagePass.uniforms['damp'].value = 1;

    this.composer.addPass(this.afterimagePass);
  }

  getVelocity(velocity) {
    if (this.composer) {
      const damp = Math.min(Math.max(Math.abs(velocity), 0), 0.9);
      gsap.to(this.afterimagePass.uniforms['damp'], {
        duration: 0.5,
        value: damp,
      });
    }
  }

  setDeform(velocity) {
    this.materials.forEach((mat) => {
      mat.uniforms.uDeform.value = velocity;
    });
  }

  exitAnimation(currentPosition, onComplete) {
    const target = {
      position: currentPosition,
      spacing: this.currentSpacing ?? 0.8,
      hSpacing: this.currentHSpacing ?? 1.0,
      radius: this.currentRadius ?? 1,
    };

    gsap.to(target, {
      position: currentPosition + 30,
      spacing: 10,
      hSpacing: 3.0,
      radius: 1,
      duration: 1.4,
      ease: 'expo.in',
      onUpdate: () => {
        this.updateMeshes(
          target.position,
          5,
          target.spacing,
          target.hSpacing,
          target.radius,
        );
      },
      onComplete: () => {
        // Small delay lets Next.js prepare the incoming page
        setTimeout(onComplete, 50);
      },
    });

    this.meshes.forEach((mesh, i) => {
      gsap.to(mesh.material.uniforms.opacity, {
        value: 0,
        duration: 1,
        ease: 'power2.in',
        delay: i * 0.03,
      });
    });
  }

  render() {
    if (!this.isPlaying) return;

    this.time += 0.05;
    this.materials.forEach((m) => (m.uniforms.time.value = this.time));

    if (this.model) {
      // Update model environment
      this.model.visible = false; // hide model for its own env map
      this.cubeCamera.update(this.renderer, this.scene);
      this.model.visible = true;
      this.model.material.envMap = this.cubeCamera.renderTarget.texture;
    }

    // Render the scene
    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }

    // Orbital Controls
    if (this.controls) {
      this.controls.update();
    }

    requestAnimationFrame(this.render.bind(this));
  }

  destroy() {
    this.isPlaying = false;

    // Remove event listeners
    window.removeEventListener('click', this._onClick);

    // Dispose geometries, materials, textures
    this.meshes.forEach((mesh) => {
      mesh.geometry.dispose();
      if (mesh.material.uniforms.texture1.value) {
        mesh.material.uniforms.texture1.value.dispose();
      }
    });
    this.materials.forEach((mat) => mat.dispose());

    // Dispose composer if used
    if (this.composer) {
      this.composer.dispose();
    }

    // Destroy renderer and remove canvas
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }

    this.scene.clear();
  }
}
