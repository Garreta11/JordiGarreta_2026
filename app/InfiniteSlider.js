import * as THREE from 'three';
import fragment from './shaders/fragment.glsl';
import vertex from './shaders/vertex.glsl';
import { urlFor } from "@/lib/sanity.image";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';

import gsap from 'gsap';

export default class InfiniteSlider {
  constructor(options) {
    this.scene = new THREE.Scene();
    /* this.scene.background = new THREE.Color(0x181818); */
    this.container = options.dom;
    this.images = options.images;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1 });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x181818, 0);
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.1, 1000);
    this.camera.position.set(0, 0, 5);

    const ambient = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(ambient);
    
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.loader = new THREE.TextureLoader();
    this.gltfLoader = new GLTFLoader();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.time = 0;
    this.isPlaying = true;

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
    this._onMouseMove = this.handleMouseMove.bind(this);

    window.addEventListener('click', this._onClick, false);
    window.addEventListener('mousemove', this._onMouseMove, false);
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
        uPlaneAspect: { value: 1.5 },
        uTextureAspect: { value: 1.0 },
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

      const geo = new THREE.PlaneGeometry(1.5, 1, 20, 20);
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
      }
    );
  }

  updateMeshes(position = 0, loops = 2, verticalSpacing = 4, radius = 5) {
    const objs = Array(this.meshes.length).fill({});

    objs.forEach((_, i) => {
      const t = i - position;
      const angle = (t / objs.length) * Math.PI * 2 * loops;
      const height = -t * verticalSpacing;

      const mesh = this.meshes[i];
      mesh.position.set(0, height, 0);
      mesh.material.uniforms.distanceFromCenter.value = 1 - Math.min(Math.abs(t), 1) ** 2;
      mesh.material.uniforms.spiralAngle.value = angle;
      mesh.material.uniforms.spiralHeight.value = height;

      mesh.material.uniforms.uRadius.value = radius;
    });
  }
  
  handleMouseMove(e) {
    this.mouse.x = (e.clientX / this.width) * 2 - 1;
    this.mouse.y = -(e.clientY / this.height) * 2 + 1;

    // Rotate model
    if (this.model) {
      gsap.to(this.model.rotation, {
        y: this.mouse.x * 0.5,
        x: -this.mouse.y * 0.5,
        duration: 1,
      });
    }

    if (!this.meshes || this.meshes.length === 0) return;

    // Raycast to find hovered mesh
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.meshes);

    // Track which mesh is currently hovered
    const hoveredMesh = intersects.length > 0 ? intersects[0].object : null;

    this.meshes.forEach(mesh => {
      if (mesh === hoveredMesh) {
        // Hovered mesh → expand
        gsap.to(mesh.material.uniforms.progress, {
          value: 1,
          ease: 'power2.inOut',
        });
      } else {
        // Non-hovered meshes → shrink back
        gsap.to(mesh.material.uniforms.progress, {
          value: 0.1,
          ease: 'power2.inOut',
        });
      }
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

  setupClick() {
    if (this.meshes) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      var intersects = this.raycaster.intersectObjects(this.meshes);
      // console.log(this.scene.children);
      if (intersects.length > 0) {
        // console.log(intersects[0].object);
        const slug = intersects[0].object.userData.slug;
        if (slug) {
          // console.log(slug);
          // this.router.push(url, { scroll: false });
        }
      }
    }
  }

  setupPostProcessing() {

    this.composer = new EffectComposer(this.renderer);
  
    // Base render pass
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.afterimagePass = new AfterimagePass();
    this.afterimagePass.uniforms['damp'].value = 1.;

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

  exitAnimation(currentPosition, onComplete) {
    const target = { position: currentPosition, spacing: 0.5 };
  
    gsap.to(target, {
      position: currentPosition + 30,
      spacing: 10,
      duration: 1.4,
      ease: "expo.in",
      onUpdate: () => {
        this.updateMeshes(target.position, 4.5, target.spacing, 1);
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
        ease: "power2.in",
        delay: i * 0.03,
      });
    });
  }

  render() {
    if (!this.isPlaying) return;
  
    this.time += 0.05;
    this.materials.forEach(m => m.uniforms.time.value = this.time);

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
    window.removeEventListener('mousemove', this._onMouseMove);
  
    // Dispose geometries, materials, textures
    this.meshes.forEach(mesh => {
      mesh.geometry.dispose();
      if (mesh.material.uniforms.texture1.value) {
        mesh.material.uniforms.texture1.value.dispose();
      }
    });
    this.materials.forEach(mat => mat.dispose());
  
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