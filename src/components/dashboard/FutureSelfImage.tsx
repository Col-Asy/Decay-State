"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface FutureSelfImageProps {
  integrity: number;
  shields: number;
  imageUrl?: string | null;
}

export function FutureSelfImage({
  integrity,
  shields,
  imageUrl,
}: FutureSelfImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvas2dRef = useRef<HTMLCanvasElement>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isThreeLoaded, setIsThreeLoaded] = useState(false);

  // Shared drag state
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const dragAngleY = useRef(0);
  const dragAngleX = useRef(0.18);

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
      const container = containerRef.current;
      if (!canvas || !container) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      interface Point3D {
        x: number;
        y: number;
        z: number;
      }
      const vertices: Point3D[] = [];
      const faces: { indices: [number, number, number, number]; modelY: number }[] = [];
      const rings = 22;
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
            const base = 0.34 + (0.58 - 0.34) * Math.sin((t * Math.PI) / 2);
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
            modelY: (vertices[v1].y + vertices[v2].y + vertices[v3].y + vertices[v4].y) / 4,
          });
        }
      }

      const update2DDimensions = () => {
        if (!canvas || !container) return;
        const w = container.clientWidth || 320;
        const h = container.clientHeight || 320;
        const dpr = window.devicePixelRatio || 1;
        if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
          canvas.width = w * dpr;
          canvas.height = h * dpr;
        }
      };

      const render2D = () => {
        if (!active) return;
        update2DDimensions();

        const dpr = window.devicePixelRatio || 1;
        const width = canvas.width / dpr;
        const height = canvas.height / dpr;
        const centerX = width / 2;
        const centerY = height / 2 - 5;
        const t = integrityRef.current / 100;

        ctx.save();
        ctx.scale(dpr, dpr);

        if (!isDragging.current) {
          dragAngleY.current += 0.005;
        }

        // Deep black background
        ctx.fillStyle = "#0c0c0e";
        ctx.fillRect(0, 0, width, height);

        // Cyber Grid Lines (matching screenshot style)
        ctx.strokeStyle = "rgba(212, 255, 0, 0.07)";
        ctx.lineWidth = 0.5;
        const gridSpacing = 16;
        for (let x = 0; x < width; x += gridSpacing) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSpacing) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        const rotated = vertices.map((v) => {
          const x1 = v.x * Math.cos(dragAngleY.current) - v.z * Math.sin(dragAngleY.current);
          const z1 = v.x * Math.sin(dragAngleY.current) + v.z * Math.cos(dragAngleY.current);
          const y2 = v.y * Math.cos(dragAngleX.current) - z1 * Math.sin(dragAngleX.current);
          const z2 = v.y * Math.sin(dragAngleX.current) + z1 * Math.cos(dragAngleX.current);
          const scale = (Math.min(width, height) * 0.62) / (2.5 + z2);
          return { px: centerX + x1 * scale, py: centerY - y2 * scale, rz: z2, modelY: v.y };
        });

        faces.forEach((f) => {
          const p1 = rotated[f.indices[0]];
          const p2 = rotated[f.indices[1]];
          const p3 = rotated[f.indices[2]];
          const p4 = rotated[f.indices[3]];

          const fillThreshold = -1.0 + t * 2.0;
          const faceLit = f.modelY < fillThreshold;

          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.lineTo(p2.px, p2.py);
          ctx.lineTo(p3.px, p3.py);
          ctx.lineTo(p4.px, p4.py);
          ctx.closePath();

          if (faceLit) {
            ctx.fillStyle = "rgba(212, 255, 0, 0.08)";
            ctx.strokeStyle = "rgba(212, 255, 0, 0.85)";
            ctx.lineWidth = 0.7;
          } else {
            ctx.fillStyle = "rgba(40, 40, 40, 0.05)";
            ctx.strokeStyle = "rgba(100, 100, 100, 0.3)";
            ctx.lineWidth = 0.4;
          }
          ctx.fill();
          ctx.stroke();
        });

        ctx.restore();
        animation2dId = requestAnimationFrame(render2D);
      };
      render2D();
    };

    runFallback2D();

    // --- THREE.JS HIGH QUALITY WEBGL RENDERING ---
    const initThree = async () => {
      try {
        const THREE = await import("three");
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");

        if (!active) return;
        const canvas = threeCanvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const getContainerDimensions = () => {
          const w = container.clientWidth || 320;
          const h = container.clientHeight || 320;
          return { width: w, height: h };
        };

        const dims = getContainerDimensions();
        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(40, dims.width / dims.height, 0.1, 100);
        camera.position.set(0, 0, 32);

        const renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          powerPreference: "high-performance",
          alpha: true,
        });
        renderer.setSize(dims.width, dims.height, false);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x0c0c0e, 1.0);

        // Ambient + Point lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const neonLight = new THREE.PointLight(0xd4ff00, 3, 15);
        neonLight.position.set(0, 2, 4);
        scene.add(neonLight);

        // Ground grid helper (matching screenshot box grid)
        const gridHelper = new THREE.GridHelper(50, 40, 0x4a4a4a, 0x222222);
        gridHelper.position.y = -6.5;
        scene.add(gridHelper);

        // Load Lee Perry Smith GLTF Model
        const loader = new GLTFLoader();
        loader.load(
          "/models/LeePerrySmith.glb",
          (gltf) => {
            if (!active) return;

            // Dark inner mesh
            const baseMaterial = new THREE.MeshStandardMaterial({
              color: 0x18181b,
              roughness: 0.7,
              metalness: 0.2,
              side: THREE.DoubleSide,
            });

            // Glowing neon yellow-green wireframe (#d4ff00)
            const wireframeMaterial = new THREE.MeshBasicMaterial({
              color: 0xd4ff00,
              wireframe: true,
              transparent: true,
              opacity: 0.8,
            });

            let wireframeMesh: any = null;

            gltf.scene.traverse((child: any) => {
              if (child.isMesh) {
                child.material = baseMaterial;
                const wfGeo = child.geometry.clone();
                wireframeMesh = new THREE.Mesh(wfGeo, wireframeMaterial);
                child.parent?.add(wireframeMesh);
              }
            });

            const headGroup = new THREE.Group();
            headGroup.add(gltf.scene);
            headGroup.scale.set(1.5, 1.5, 1.5);
            gltf.scene.position.y = -0.6;
            scene.add(headGroup);

            setIsThreeLoaded(true);
            cancelAnimationFrame(animation2dId);

            const resizeThree = () => {
              if (!container || !active) return;
              const w = container.clientWidth || 320;
              const h = container.clientHeight || 320;
              camera.aspect = w / h;
              camera.updateProjectionMatrix();
              renderer.setSize(w, h, false);
            };

            resizeThree();
            window.addEventListener("resize", resizeThree);

            const renderThree = () => {
              if (!active) return;

              const t = integrityRef.current / 100;

              if (wireframeMesh) {
                wireframeMaterial.opacity = 0.4 + t * 0.5;
                wireframeMaterial.color.setHex(t < 0.3 ? 0xef4444 : 0xd4ff00);
              }

              neonLight.color.setHex(t < 0.3 ? 0xef4444 : 0xd4ff00);

              if (!isDragging.current) {
                dragAngleY.current += 0.006;
              }
              headGroup.rotation.y = dragAngleY.current;
              headGroup.rotation.x = dragAngleX.current;

              renderer.render(scene, camera);
              animationThreeId = requestAnimationFrame(renderThree);
            };
            renderThree();
          },
          undefined,
          (err) => {
            console.error("Three.js GLTF load error:", err);
          }
        );
      } catch (e) {
        console.error("Three.js init error:", e);
      }
    };

    initThree();

    return () => {
      active = false;
      cancelAnimationFrame(animation2dId);
      cancelAnimationFrame(animationThreeId);
    };
  }, []);

  // Drag handlers
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

  const isCritical = integrity < 30;

  return (
    <div className="relative w-full max-w-[320px] sm:max-w-md mx-auto">
      {/* Hand-drawn Left Annotation Arrow & Note (matching user screenshot) */}
      <div className="hidden md:flex items-center gap-2 absolute -left-36 top-1/2 -translate-y-1/2 pointer-events-none z-30">
        <div className="font-handwritten text-xs text-zinc-400 tracking-wide rotate-[-6deg] w-28 text-right leading-tight">
          Interactive: drag to rotate view
        </div>
        <svg
          className="w-10 h-6 text-zinc-500 stroke-current fill-none -rotate-12"
          viewBox="0 0 40 20"
        >
          <path
            d="M 5 10 Q 20 2, 35 12 M 28 6 L 35 12 L 30 18"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Main Hologram Container Box */}
      <div
        ref={containerRef}
        className="relative w-full aspect-square overflow-hidden bg-[#0c0c0e] border border-white/15 cursor-grab active:cursor-grabbing flex items-center justify-center group shadow-2xl"
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
        {/* Top-Left Cyber HUD Box (matching user screenshot) */}
        <div className="absolute top-3 left-3 border border-white/20 bg-black/85 p-3 text-[10px] font-mono z-30 pointer-events-none space-y-1 shadow-lg">
          <div className="flex items-center gap-1.5 text-accent font-bold uppercase tracking-wider text-[11px]">
            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            PROTOCOL: ACTIVE
          </div>
          <div className="text-zinc-400 text-[9px] uppercase tracking-widest">
            TARGET: 3:00 AM
          </div>
        </div>

        {/* Bottom-Right Cyber HUD Box (matching user screenshot) */}
        <div className="absolute bottom-3 right-3 border border-white/20 bg-black/85 p-3 text-[10px] font-mono z-30 pointer-events-none text-right space-y-1 shadow-lg">
          <div className="text-zinc-400 text-[9px] uppercase tracking-widest">
            STATE: {isCritical ? "CRITICAL" : integrity < 60 ? "DEGRADED" : "STABLE"}
          </div>
          <div className="text-accent font-bold uppercase tracking-wider text-[11px]">
            NODE#8082
          </div>
        </div>

        {/* 3D WebGL Canvas for Three.js */}
        <canvas
          ref={threeCanvasRef}
          className={`w-full h-full bg-[#0c0c0e] ${isThreeLoaded ? "block" : "hidden"}`}
        />

        {/* Fallback 2D Wireframe Canvas */}
        <canvas
          ref={canvas2dRef}
          className={`w-full h-full bg-[#0c0c0e] ${isThreeLoaded ? "hidden" : "block"}`}
        />

        {/* Holographic Scanlines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40 z-20" />
      </div>
    </div>
  );
}
