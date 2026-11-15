import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Rotate3d, Sparkles, Loader2, RefreshCw } from "lucide-react";
import heroLaptopFallback from "@/assets/hero-laptop.png";

interface Laptop3DProps {
  className?: string;
}

export function Laptop3D({ className = "" }: Laptop3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const initialCamPos = useRef<THREE.Vector3>(new THREE.Vector3(1.2, 0.6, 1.8));

  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.copy(initialCamPos.current);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.minDistance = 1.2;
    controls.maxDistance = 3.5;
    controls.maxPolarAngle = Math.PI / 2 + 0.08; // Keep above floor
    controls.minPolarAngle = Math.PI / 6;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;
    controlsRef.current = controls;

    controls.addEventListener("start", () => setIsInteracting(true));
    controls.addEventListener("end", () => {
      // Resume gentle auto-rotate after interaction
      setTimeout(() => setIsInteracting(false), 2000);
    });

    // 5. Studio Lighting
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    // Main key light (crisp white)
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.0);
    keyLight.position.set(3, 4, 3);
    scene.add(keyLight);

    // Cyan accent light (SELLORA signature cyan)
    const cyanLight = new THREE.DirectionalLight(0x00c2d6, 4.0);
    cyanLight.position.set(-4, 2, 2);
    scene.add(cyanLight);

    // Purple rim light (SELLORA signature purple)
    const purpleLight = new THREE.DirectionalLight(0x8b5cf6, 3.5);
    purpleLight.position.set(2, 3, -3);
    scene.add(purpleLight);

    // Front soft fill
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.5);
    fillLight.position.set(0, 1, 4);
    scene.add(fillLight);

    // 6. Load Model
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    const loader = new GLTFLoader();
    loader.load(
      "/models/laptop.glb",
      (gltf) => {
        const root = gltf.scene;

        // Compute bounding box and center model
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Offset to center
        root.position.x -= center.x;
        root.position.y -= center.y;
        root.position.z -= center.z;

        // Normalize scale to fit viewer nicely
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetScale = 1.25 / (maxDim || 1);
        modelGroup.scale.setScalar(targetScale);

        // Natural default viewing angle
        modelGroup.rotation.y = -Math.PI / 4 + 0.2;
        modelGroup.rotation.x = 0.05;

        // Enhance material reflectivity
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.material) {
              const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              materials.forEach((mat) => {
                if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
                  const stdMat = mat as THREE.MeshStandardMaterial;
                  stdMat.envMapIntensity = 1.2;
                  stdMat.roughness = Math.min(stdMat.roughness, 0.7);
                }
              });
            }
          }
        });

        modelGroup.add(root);
        setIsLoading(false);
      },
      (xhr) => {
        if (xhr.total > 0) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100);
          setLoadProgress(percent);
        }
      },
      (error) => {
        console.error("Failed to load 3D laptop model:", error);
        setHasError(true);
        setIsLoading(false);
      }
    );

    // 7. Animation Loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 8. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        const newHeight = entry.contentRect.height;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });
    resizeObserver.observe(container);

    // 9. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => m.dispose());
          }
        }
      });
    };
  }, []);

  const handleResetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.autoRotate = true;
    }
  };

  return (
    <div className={`relative w-full h-full min-h-[380px] sm:min-h-[440px] lg:min-h-[480px] flex items-center justify-center ${className}`}>
      {/* 3D Canvas Mount Point */}
      <div
        ref={containerRef}
        className={`w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing transition-opacity duration-700 ${
          isLoading || hasError ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      />

      {/* Loading State with Fallback High-Res Image underneath */}
      {(isLoading || hasError) && (
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={heroLaptopFallback}
            alt="SELLORA Flagship Performance Laptop"
            className="w-full h-auto max-h-[460px] object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.7)]"
            loading="eager"
          />

          {isLoading && !hasError && (
            <div className="absolute inset-0 bg-background/40 backdrop-blur-xs flex flex-col items-center justify-center gap-3 rounded-2xl">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/90 border border-primary/40 text-primary font-mono text-xs font-semibold shadow-lg">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Loading 3D Model ({loadProgress > 0 ? `${loadProgress}%` : "Initializing..."})</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interactive HUD Overlay Badges */}
      {!isLoading && !hasError && (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between text-[10px] font-mono z-20">
          <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/85 backdrop-blur-md border border-border shadow-sm text-muted-foreground hover:text-foreground transition-colors">
            <Rotate3d className="h-3.5 w-3.5 text-primary" />
            <span>Interactive 3D · Drag to Rotate</span>
          </div>

          <button
            onClick={handleResetView}
            className="pointer-events-auto flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-card/85 backdrop-blur-md border border-border shadow-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            title="Reset 3D camera angle"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        </div>
      )}

      {/* Top right 3D Live Indicator */}
      {!isLoading && !hasError && (
        <div className="pointer-events-none absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 backdrop-blur-md border border-primary/25 text-primary font-mono text-[10px] font-bold z-20">
          <Sparkles className="h-3 w-3 animate-pulse" />
          <span>REAL-TIME 3D</span>
        </div>
      )}
    </div>
  );
}
