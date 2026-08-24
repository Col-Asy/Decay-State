"use client";

import React, { useEffect, useRef, useState } from "react";

interface FutureSelfImageProps {
  integrity: number;
  shields: number; // 0–3, drives visual degradation/glitch frequency
  imageUrl?: string | null;
}

export function FutureSelfImage({
  integrity,
  shields,
}: FutureSelfImageProps) {
  const canvas2dRef = useRef<HTMLCanvasElement>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Shared drag state for both 2D and Three.js
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const dragAngleY = useRef(0);
  const dragAngleX = useRef(0.18);

  // Dynamic values to trigger updates in Three.js
  const integrityRef = useRef(integrity);
  const shieldsRef = useRef(shields);
  useEffect(() => {
    integrityRef.current = integrity;
    shieldsRef.current = shields;
  }, [integrity, shields]);

  useEffect(() => {
    let active = true;
    let animation2dId: number;
    let animationThreeId: number;

    // --- FALLBACK 2D CANVAS GENERATOR ---
    const runFallback2D = () => {
      const canvas = canvas2dRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      interface Point3D {
        x: number;
        y: number;
        z: number;
      }
      const vertices: Point3D[] = [];
      const faces: { indices: [number, number, number, number]; modelY: number }[] = [];
      const rings = 20;
      const segments = 24;

      for (let r = 0; r <= rings; r++) {
        const pct = r / rings;
        const y = -1.0 + pct * 2.0;

        let rx = 0.0;
        let rz = 0.0;

        if (y < -0.25) {
          const neckPct = (-0.25 - y) / 0.75;
          rx = 0.34 + 0.96 * Math.pow(neckPct, 2);
          rz = 0.34 + 0.45 * Math.pow(neckPct, 2);
        } else {
          const skullPct = (y - 0.3) / 0.7;
          if (y >= 0.3) {
            const base = 0.58 * Math.sqrt(Math.max(0, 1 - skullPct * skullPct));
            rx = base; rz = base;
          } else {
            const t = (y - (-0.25)) / 0.55;
            const base = 0.34 + (0.58 - 0.34) * Math.sin(t * Math.PI / 2);
            rx = base; rz = base;
          }
        }

        for (let s = 0; s < segments; s++) {
          const angle = (s / segments) * Math.PI * 2;
          const cosAng = Math.cos(angle);
          const sinAng = Math.sin(angle);

          let vertexRx = rx;
          let vertexRz = rz;

          if (y >= -0.25) {
            if (y > 0.0 && y < 0.35) {
              const earPct = 1 - Math.abs(y - 0.175) / 0.175;
              const angleWeight = Math.pow(Math.abs(sinAng), 8);
              vertexRx += 0.16 * earPct * angleWeight;
              vertexRz -= 0.05 * earPct * angleWeight * cosAng;
            }
            if (cosAng > 0) {
              if (y > 0.08 && y < 0.35) {
                const nosePct = 1 - Math.abs(y - 0.22) / 0.14;
                vertexRz += 0.25 * Math.pow(cosAng, 6) * nosePct;
              }
              if (y > -0.08 && y < 0.08) {
                const lipsPct = 1 - Math.abs(y - 0.0) / 0.08;
                vertexRz += 0.08 * Math.pow(cosAng, 10) * lipsPct;
              }
            }
          }

          vertices.push({
            x: vertexRx * sinAng,
            y: y,
            z: vertexRz * cosAng,
          });
        }
      }

      for (let r = 0; r < rings; r++) {
        for (let s = 0; s < segments; s++) {
          const v1 = r * segments + s;
          const v2 = r * segments + ((s + 1) % segments);
          const v3 = (r + 1) * segments + ((s + 1) % segments);
          const v4 = (r + 1) * segments + s;
          faces.push({
            indices: [v1, v2, v3, v4],
            modelY: (vertices[v1].y + vertices[v2].y + vertices[v3].y + vertices[v4].y) / 4
          });
        }
      }

      const resize2D = () => {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * (window.devicePixelRatio || 1);
        canvas.height = rect.height * (window.devicePixelRatio || 1);
        ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
      };
      resize2D();

      const render2D = () => {
        if (!active) return;
        if (!isDragging.current) {
          dragAngleY.current += 0.005;
        }

        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);
        const centerX = width / 2;
        const centerY = height / 2 - 10;
        const t = integrityRef.current / 100; // 0 = full decay, 1 = full integrity

        // Background
        ctx.fillStyle = "#1c1c1c";
        ctx.fillRect(0, 0, width, height);

        // Grid — neon tint at high integrity
        const gridR = Math.round(44 + t * (212 - 44));
        const gridG = Math.round(44 + t * (255 - 44));
        const gridB = Math.round(44 + t * 0);
        ctx.strokeStyle = `rgba(${gridR},${gridG},${gridB},${0.06 + t * 0.12})`;
        ctx.lineWidth = 0.5;
        const gridSpacing = 20;
        for (let x = 0; x < width; x += gridSpacing) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSpacing) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }

        const rotated = vertices.map((v) => {
          const x1 = v.x * Math.cos(dragAngleY.current) - v.z * Math.sin(dragAngleY.current);
          const z1 = v.x * Math.sin(dragAngleY.current) + v.z * Math.cos(dragAngleY.current);
          const y2 = v.y * Math.cos(dragAngleX.current) - z1 * Math.sin(dragAngleX.current);
          const z2 = v.y * Math.sin(dragAngleX.current) + z1 * Math.cos(dragAngleX.current);
          const scale = (Math.min(width, height) * 0.65) / (2.6 + z2);
          return { px: centerX + x1 * scale, py: centerY - y2 * scale, rz: z2, modelY: v.y };
        });

        // Color per-face based on integrity + vertical fill
        faces.forEach((f) => {
          const p1 = rotated[f.indices[0]];
          const p2 = rotated[f.indices[1]];
          const p3 = rotated[f.indices[2]];
          const p4 = rotated[f.indices[3]];

          // Vertical fill: face is lit if modelY < threshold driven by integrity
          const fillThreshold = -1.0 + t * 2.0;
          const faceLit = f.modelY < fillThreshold;

          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.lineTo(p2.px, p2.py);
          ctx.lineTo(p3.px, p3.py);
          ctx.lineTo(p4.px, p4.py);
          ctx.closePath();

          if (faceLit) {
            // Neon fill at high integrity, red at decay
            const neonR = t > 0.4 ? Math.round(212 * t) : 239;
            const neonG = t > 0.4 ? Math.round(255 * t) : Math.round(68 * (t / 0.4));
            const neonB = 0;
            ctx.fillStyle = `rgba(${neonR},${neonG},${neonB},0.08)`;
            ctx.strokeStyle = `rgba(${neonR},${neonG},${neonB},${0.4 + t * 0.5})`;
          } else {
            ctx.fillStyle = "rgba(100,100,100,0.05)";
            ctx.strokeStyle = "rgba(80,80,80,0.2)";
          }
          ctx.lineWidth = 0.4;
          ctx.fill();
          ctx.stroke();
        });

        animation2dId = requestAnimationFrame(render2D);
      };
      render2D();
    };

    // Start fallback immediately
    runFallback2D();

    // --- THREE.JS HIGH QUALITY WEBGL RENDERING ---
    const initThree = async () => {
      try {
        const THREE = await import("three");
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");

        if (!active) return;
        const canvas = threeCanvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(40, rect.width / rect.height, 0.1, 100);
        camera.position.set(0, 0, 32);

        const renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          powerPreference: "high-performance",
        });
        renderer.setSize(rect.width, rect.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x1c1c1c, 1.0); // Solid dark grey background matching the screenshot

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
        scene.add(ambientLight);

        const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight1.position.set(10, 15, 20);
        scene.add(dirLight1);

        const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.35);
        dirLight2.position.set(-10, -5, -20);
        scene.add(dirLight2);

        // Ground grid helper matching the screenshot
        const gridHelper = new THREE.GridHelper(50, 40, 0x4a4a4a, 0x2b2b2b);
        gridHelper.position.y = -6.5;
        scene.add(gridHelper);

        // Coordinate axes helper (RGB representation) matching the screenshot
        const axesHelper = new THREE.AxesHelper(15);
        scene.add(axesHelper);

        // Load high-quality Lee Perry Smith human head model
        const loader = new GLTFLoader();
        loader.load(
          "https://unpkg.com/three@0.160.0/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb",
          (gltf) => {
            if (!active) return;

            // Base material — grey clay
            const headMaterial = new THREE.MeshStandardMaterial({
              color: 0x5a5a5a,
              roughness: 0.55,
              metalness: 0.08,
              emissive: new THREE.Color(0x000000),
              side: THREE.DoubleSide,
            });

            // Neon wireframe overlay for integrity glow
            const wireframeMaterial = new THREE.MeshBasicMaterial({
              color: 0xd4ff00,
              wireframe: true,
              transparent: true,
              opacity: 0,
            });

            let headMesh: any = null;
            let wireframeMesh: any = null;

            gltf.scene.traverse((child: any) => {
              if (child.isMesh && child.name === "LeePerrySmith") {
                child.material = headMaterial;
                headMesh = child;

                // Clone geometry for wireframe overlay
                const wfGeo = child.geometry.clone();
                wireframeMesh = new THREE.Mesh(wfGeo, wireframeMaterial);
                child.parent?.add(wireframeMesh);
              }
            });

            const headGroup = new THREE.Group();
            headGroup.add(gltf.scene);
            headGroup.scale.set(1.45, 1.45, 1.45);
            gltf.scene.position.y = -0.6;
            scene.add(headGroup);
            setIsLoaded(true);
            cancelAnimationFrame(animation2dId);

            // Neon point light for glow effect
            const neonLight = new THREE.PointLight(0xd4ff00, 0, 8);
            neonLight.position.set(0, 2, 4);
            scene.add(neonLight);

            const renderThree = () => {
              if (!active) return;

              const t = integrityRef.current / 100; // 0–1

              // Base color: grey at decay → neon-tinted at full integrity
              const r = 0.35 + t * (0.83 - 0.35);
              const g = 0.35 + t * (1.0  - 0.35);
              const b = 0.35 + t * (0.0  - 0.35);
              headMaterial.color.setRGB(r, g, b);

              // Emissive neon glow
              const emR = t > 0.3 ? (t - 0.3) / 0.7 * 0.18 : 0;
              const emG = t > 0.3 ? (t - 0.3) / 0.7 * 0.35 : 0;
              headMaterial.emissive.setRGB(emR, emG, 0);

              // Wireframe overlay opacity — subtly visible, more at high integrity
              if (wireframeMesh) {
                wireframeMaterial.opacity = t * 0.12;
                wireframeMaterial.color.setHex(t < 0.4 ? 0xff4444 : 0xd4ff00);
              }

              // Neon point light intensity
              neonLight.intensity = t * 2.5;
              neonLight.color.setHex(t < 0.4 ? 0xff4444 : 0xd4ff00);

              if (!isDragging.current) {
                dragAngleY.current += 0.005;
              }
              headGroup.rotation.y = dragAngleY.current;
              headGroup.rotation.x = dragAngleX.current;

              renderer.render(scene, camera);
              animationThreeId = requestAnimationFrame(renderThree);
            };
            renderThree();
          },
          undefined,
          (err) => { console.error("Three.js GLTF loader error: ", err); }
        );

        // Handle resize
        const resizeThree = () => {
          if (!canvas) return;
          const r = canvas.getBoundingClientRect();
          camera.aspect = r.width / r.height;
          camera.updateProjectionMatrix();
          renderer.setSize(r.width, r.height);
        };
        window.addEventListener("resize", resizeThree);

      } catch (e) {
        console.error("Three.js initialization failure: ", e);
      }
    };

    // Load Three.js client side
    initThree();

    return () => {
      active = false;
      cancelAnimationFrame(animation2dId);
      cancelAnimationFrame(animationThreeId);
    };
  }, []);

  // Drag interaction events
  const handleStart = (clientX: number, clientY: number) => {
    isDragging.current = true;
    previousMousePosition.current = { x: clientX, y: clientY };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging.current) return;
    const deltaX = clientX - previousMousePosition.current.x;
    const deltaY = clientY - previousMousePosition.current.y;
    dragAngleY.current += deltaX * 0.012;
    dragAngleX.current = Math.max(-0.5, Math.min(0.5, dragAngleX.current + deltaY * 0.012));
    previousMousePosition.current = { x: clientX, y: clientY };
  };

  const handleEnd = () => {
    isDragging.current = false;
  };

  return (
    <div
      className="relative w-full aspect-square max-w-[280px] sm:max-w-md mx-auto overflow-hidden bg-[#1c1c1c] border border-white/10 cursor-grab active:cursor-grabbing flex items-center justify-center"
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => {
        if (e.touches[0]) handleStart(e.touches[0].clientX, e.touches[0].clientY);
      }}
      onTouchMove={(e) => {
        if (e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }}
      onTouchEnd={handleEnd}
    >
      {/* 3D WebGL Canvas for Three.js */}
      <canvas
        ref={threeCanvasRef}
        className={`w-full h-full bg-[#1c1c1c] ${isLoaded ? "block" : "hidden"}`}
      />
      
      {/* Fallback/Loading 2D Canvas */}
      {!isLoaded && (
        <canvas
          ref={canvas2dRef}
          className="w-full h-full block bg-[#1c1c1c]"
        />
      )}
    </div>
  );
}
