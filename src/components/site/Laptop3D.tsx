import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RotateCw, Loader2, Sparkles } from "lucide-react";
import fallbackImage from "@/assets/hero-laptop.png";

export function Laptop3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(
      38,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    // Position camera for a beauty 3/4 showcase view
    camera.position.set(0, 1.1, 4.2);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false; // keep page scroll smooth
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;
    controls.minPolarAngle = Math.PI / 3.8;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minAzimuthAngle = -Math.PI / 2.5;
    controls.maxAzimuthAngle = Math.PI / 2.5;

    controls.addEventListener("start", () => {
      setHasInteracted(true);
      controls.autoRotate = false;
    });

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
    fillLight.position.set(-4, 2, 2);
    scene.add(fillLight);

    // Cyan rim light (left side)
    const cyanRim = new THREE.PointLight(0x00f5ff, 4.5, 12);
    cyanRim.position.set(-3.5, 2.5, -2);
    scene.add(cyanRim);

    // Purple rim light (right side)
    const purpleRim = new THREE.PointLight(0x9d4edd, 4.5, 12);
    purpleRim.position.set(3.5, 2.5, -2);
    scene.add(purpleRim);

    // Bottom soft reflection
    const floorBounce = new THREE.DirectionalLight(0x00c2d6, 0.8);
    floorBounce.position.set(0, -3, 2);
    scene.add(floorBounce);

    // Load Model
    const loader = new GLTFLoader();
    let loadedModel: THREE.Group | null = null;

    loader.load(
      "/models/laptop.glb",
      (gltf) => {
        const model = gltf.scene;
        loadedModel = model;

        // Auto-center and normalize size
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        model.position.x -= center.x;
        model.position.y -= center.y;
        model.position.z -= center.z;

        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const targetSize = 2.6;
          const scale = targetSize / maxDim;
          model.scale.setScalar(scale);
        }

        // Slight initial tilt for elegance
        model.rotation.y = -Math.PI / 10;
        model.position.y -= 0.15;

        // Enhance material reflections
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              if (mat.isMeshStandardMaterial) {
                mat.envMapIntensity = 1.2;
                mat.needsUpdate = true;
              }
            }
          }
        });

        scene.add(model);
        setIsLoaded(true);
      },
      (xhr) => {
        if (xhr.total > 0) {
          const pct = Math.round((xhr.loaded / xhr.total) * 100);
          setLoadingProgress(pct);
        }
      },
      (error) => {
        console.error("Failed to load 3D laptop model:", error);
      }
    );

    // Resize Observer
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Render loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      scene.clear();
    };
  }, []);

  return (
    <div className="relative w-full h-[360px] sm:h-[440px] lg:h-[480px] xl:h-[520px] flex items-center justify-center select-none">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className={`absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing transition-opacity duration-700 ${
          isLoaded ? "opacity-100 z-10" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Instant High-Res Poster Fallback (displayed while 3D model downloads) */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
          isLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <img
          src={fallbackImage}
          alt="SELLORA Performance Laptop"
          className="w-full h-auto max-h-[460px] object-contain drop-shadow-[0_25px_60px_rgba(0,0,0,0.8)] filter"
        />

        {/* Loading Overlay Pill */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border border-white/20 bg-black/70 backdrop-blur-md px-3.5 py-1.5 text-xs font-mono text-slate-300 shadow-lg">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          <span>
            Loading 3D Rig {loadingProgress > 0 ? `${loadingProgress}%` : "..."}
          </span>
        </div>
      </div>

      {/* Interactive 3D Model Badge (visible when loaded) */}
      {isLoaded && !hasInteracted && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 rounded-full border border-primary/40 bg-black/60 backdrop-blur-md px-3 py-1 text-[11px] font-mono text-primary animate-fade-up">
          <RotateCw className="h-3 w-3 animate-spin [animation-duration:6s]" />
          <span>Interactive 3D · Drag to Rotate</span>
        </div>
      )}

      {/* Subtle indicator in top corner when 3D is active */}
      {isLoaded && (
        <div className="pointer-events-none absolute top-2 right-2 z-20 flex items-center gap-1 rounded-full border border-white/10 bg-black/40 backdrop-blur-md px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-slate-400">
          <Sparkles className="h-2.5 w-2.5 text-primary" />
          <span>Real-Time 3D</span>
        </div>
      )}
    </div>
  );
}
