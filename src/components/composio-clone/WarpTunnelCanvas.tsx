"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

// Exact color palette from composio.dev chunk 57831
const PANEL_COLORS: [number, number, number][] = [
  [0.12, 0.21, 1],
  [0.12, 0.22, 0.92],
  [0.15, 0.22, 0.95],
  [0.08, 0.3, 0.26],
  [0.25, 0.05, 0.85],
  [0.18, 0.25, 0.43],
  [0, 1, 1],
  [0, 0.537, 1],
];
const ALL_COLOR_INDICES = PANEL_COLORS.map((_, i) => i);
const EDGE_GLOW_INDICES = [0, 1, 2, 4, 5, 7];

// Panel vertex shader — exact from composio.dev module 81257
const PANEL_VS = `
attribute vec3 aOffset;
attribute vec2 aScale;
attribute vec3 aColor;
attribute float aSpeed;
attribute float aColorMode;
attribute float aOpacity;
attribute float aGrain;
attribute float aEdgeGlow;
uniform float uTime;
uniform float uBaseSpeed;
uniform float uShrink;
uniform float uVertical;

varying vec2 vUv;
varying vec3 vColor;
varying float vColorMode;
varying float vFade;
varying float vOpacity;
varying float vGrain;
varying float vEdgeGlow;

void main() {
  vUv = uv;
  vColor = aColor;
  vGrain = aGrain;
  vEdgeGlow = aEdgeGlow;
  vColorMode = aColorMode;

  vec2 scaled = position.xy * aScale;

  float totalDepth = 100.0;
  float zOffset = mod(aOffset.z - uTime * uBaseSpeed * aSpeed, totalDepth);
  float centerZ = -(zOffset - 6.0);
  float z = centerZ + scaled.x;

  float centerDepth = max(0.0, -centerZ);
  float t = smoothstep(0.0, 94.0, centerDepth);
  float pinch = mix(1.0, 0.4, t);

  float shrinkScale = 1.0 - uShrink * 0.3;
  float minGap = 18.0 * shrinkScale;

  vec3 center;
  vec3 local;

  if (uVertical > 0.5) {
    center.x = aOffset.x * pinch * shrinkScale;
    center.y = aOffset.y * pinch * shrinkScale + sign(aOffset.y) * minGap;
    center.z = centerZ;
    local.x = scaled.y * pinch;
    local.y = 0.0;
    local.z = scaled.x;
  } else {
    center.x = aOffset.x * pinch * shrinkScale + sign(aOffset.x) * minGap;
    center.y = aOffset.y * pinch * shrinkScale;
    center.z = centerZ;
    local.x = 0.0;
    local.y = scaled.y * pinch;
    local.z = scaled.x;
  }

  vec3 wallPos = center + local;

  float normalizedDepth = zOffset / totalDepth;
  vFade = smoothstep(1.0, 0.7, normalizedDepth);
  vOpacity = aOpacity;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(wallPos, 1.0);
}
`;

// Panel fragment shader — exact from composio.dev module 98862
const PANEL_FS = `
uniform float uTime;

varying vec2 vUv;
varying vec3 vColor;
varying float vColorMode;
varying float vFade;
varying float vOpacity;
varying float vGrain;
varying float vEdgeGlow;

float random(vec2 st) {
  return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;

  float dx = min(uv.x, 1.0 - uv.x);
  float dy = min(uv.y, 1.0 - uv.y);
  float edgeDist = min(dx, dy);

  vec3 fill = vColor;

  vec3 gradFill = mix(fill * 0.5, fill * 1.5, uv.x);
  fill = mix(fill, gradFill, step(0.5, vColorMode));

  float grain = random(uv * 64.0 + floor(uTime * 0.5));
  fill += (grain - 0.5) * 0.08 * step(0.5, vGrain);

  float t = clamp(edgeDist / 0.5, 0.0, 1.0);
  float glow = (1.0 - t) * (1.0 - t) * (1.0 - t);
  fill = mix(fill, fill * 1.8, glow * step(0.5, vEdgeGlow));

  gl_FragColor = vec4(fill, vOpacity * vFade);
}
`;

// LED post-processing shader — exact from composio.dev module 7831
const LED_SHADER = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uPixelSize: { value: 6 },
    uTime: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform float uPixelSize;
    uniform float uTime;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    void main() {
      vec2 pixelCoord = vUv * uResolution;
      vec2 cell = floor(pixelCoord / uPixelSize);
      vec2 cellCenter = (cell + 0.5) * uPixelSize;
      vec2 cellUv = cellCenter / uResolution;

      float caOffset = 0.8 / uResolution.x;
      float r = texture2D(tDiffuse, cellUv + vec2(caOffset, 0.0)).r;
      float g = texture2D(tDiffuse, cellUv).g;
      float b = texture2D(tDiffuse, cellUv - vec2(caOffset, 0.0)).b;
      vec4 color = vec4(r, g, b, 1.0);

      vec2 localPos = fract(pixelCoord / uPixelSize);

      float subPixelWidth = 1.0 / 3.0;
      float subPixelX = localPos.x / subPixelWidth;
      int subPixelIdx = int(floor(subPixelX));
      float subLocalX = fract(subPixelX);

      float subGapX = smoothstep(0.0, 0.08, subLocalX) * smoothstep(1.0, 0.92, subLocalX);
      float subGapY = smoothstep(0.0, 0.06, localPos.y) * smoothstep(1.0, 0.94, localPos.y);
      float subGap = subGapX * subGapY;

      vec3 subColor = vec3(0.0);
      float brightness = max(color.r, max(color.g, color.b));

      if (subPixelIdx == 0) {
        subColor = vec3(color.r, color.r * 0.05, color.r * 0.02);
      } else if (subPixelIdx == 1) {
        subColor = vec3(color.g * 0.02, color.g, color.g * 0.05);
      } else {
        subColor = vec3(color.b * 0.05, color.b * 0.02, color.b);
      }

      float subPixelStrength = 0.3 + brightness * 0.4;
      vec3 combined = mix(color.rgb, subColor, subPixelStrength);

      float pixelNoise = 0.92 + hash(cell) * 0.08;

      vec2 edge = abs(localPos - 0.5);
      float maxEdge = max(edge.x, edge.y);
      float dotShape = smoothstep(0.48, 0.44, maxEdge);

      float scanY = fract(uTime * 0.12);
      float scanDist = abs(vUv.y - scanY);
      float scanLine = 1.0 + smoothstep(0.06, 0.0, scanDist) * 0.7;

      vec3 result = combined * subGap * dotShape * pixelNoise * scanLine;
      result += color.rgb * brightness * 0.08;

      gl_FragColor = vec4(result, 1.0);
    }
  `,
};

const CLEAR_COLOR = new THREE.Color(0x1a1a2e);

function buildPanelBuffers(count: number, isMobile: boolean) {
  const offsets = new Float32Array(3 * count);
  const scales = new Float32Array(2 * count);
  const colors = new Float32Array(3 * count);
  const speeds = new Float32Array(count);
  const colorModes = new Float32Array(count);
  const opacities = new Float32Array(count);
  const grains = new Float32Array(count);
  const edgeGlows = new Float32Array(count);

  // Exact from composio.dev: minDist + random * maxRange
  const minDist = isMobile ? 40 : 108;
  const maxRange = isMobile ? 80 : 160;

  for (let i = 0; i < count; i++) {
    const side = i < count / 2 ? -1 : 1;
    const dist = minDist + Math.random() * maxRange;

    if (isMobile) {
      const spread = 20 + (dist / (minDist + maxRange)) * 100;
      offsets[3 * i + 0] = (Math.random() - 0.5) * spread;
      offsets[3 * i + 1] = side * dist;
    } else {
      offsets[3 * i + 0] = side * dist;
      const spread = 60 + (dist / (minDist + maxRange)) * 280;
      offsets[3 * i + 1] = (Math.random() - 0.5) * spread;
    }
    offsets[3 * i + 2] = 100 * Math.random();

    scales[2 * i + 0] = isMobile ? 15 + 30 * Math.random() : 25 + 50 * Math.random();
    scales[2 * i + 1] = isMobile ? 5 + 10 * Math.random() : 8 + 16 * Math.random();

    speeds[i] = 1.2 + 0.8 * Math.random();
    colorModes[i] = +(Math.random() < 0.3);
    opacities[i] = isMobile
      ? Math.random() < 0.3 ? 0.95 : 0.55 + 0.3 * Math.random()
      : Math.random() < 0.3 ? 0.85 : 0.4 + 0.25 * Math.random();
    grains[i] = +(Math.random() < 0.6);
    edgeGlows[i] = +(Math.random() < 0.3);

    const pool = edgeGlows[i] > 0.5 ? EDGE_GLOW_INDICES : ALL_COLOR_INDICES;
    const ci = pool[Math.floor(Math.random() * pool.length)] ?? 0;
    const c = PANEL_COLORS[ci] ?? ([0.9, 0.9, 0.95] as [number, number, number]);
    colors[3 * i + 0] = c[0];
    colors[3 * i + 1] = c[1];
    colors[3 * i + 2] = c[2];
  }

  return { offsets, scales, colors, speeds, colorModes, opacities, grains, edgeGlows };
}

function CameraRig() {
  const { camera } = useThree();
  const rot = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    const px = state.pointer.x;
    const py = state.pointer.y;
    rot.current.x += (0.015 * py - rot.current.x) * 0.03;
    rot.current.y += (-0.02 * px - rot.current.y) * 0.03;
    camera.rotation.x = rot.current.x;
    camera.rotation.y = rot.current.y;
    (camera as THREE.PerspectiveCamera).fov = 75;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  });

  return null;
}

function WallPanels({ instanceCount, isMobile }: { instanceCount: number; isMobile: boolean }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const timeRef = useRef(0);

  const buffers = useMemo(
    () => buildPanelBuffers(instanceCount, isMobile),
    [instanceCount, isMobile]
  );

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBaseSpeed: { value: 1 },
      uShrink: { value: 0 },
      uVertical: { value: isMobile ? 1.0 : 0.0 },
    }),
    [isMobile]
  );

  useFrame((state, delta) => {
    const mat = matRef.current;
    if (!mat) return;
    const dt = Math.min(delta, 0.1);
    const elapsed = state.clock.elapsedTime;
    let speed: number;
    if (elapsed < 4) {
      const t = elapsed / 4;
      speed = 30 - 18 * (1 - Math.pow(1 - t, 3));
    } else {
      speed = 12;
    }
    timeRef.current += dt * speed;
    // Update through the actual Three.js material ref — guaranteed to reach the GPU
    mat.uniforms.uTime.value = timeRef.current;
  });

  return (
    <instancedMesh
      args={[undefined, undefined, instanceCount]}
      frustumCulled={false}
    >
      <planeGeometry args={[1, 1]}>
        <instancedBufferAttribute args={[buffers.offsets, 3]} attach="attributes-aOffset" />
        <instancedBufferAttribute args={[buffers.scales, 2]} attach="attributes-aScale" />
        <instancedBufferAttribute args={[buffers.colors, 3]} attach="attributes-aColor" />
        <instancedBufferAttribute args={[buffers.speeds, 1]} attach="attributes-aSpeed" />
        <instancedBufferAttribute args={[buffers.colorModes, 1]} attach="attributes-aColorMode" />
        <instancedBufferAttribute args={[buffers.opacities, 1]} attach="attributes-aOpacity" />
        <instancedBufferAttribute args={[buffers.grains, 1]} attach="attributes-aGrain" />
        <instancedBufferAttribute args={[buffers.edgeGlows, 1]} attach="attributes-aEdgeGlow" />
      </planeGeometry>
      <shaderMaterial
        ref={matRef}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        fragmentShader={PANEL_FS}
        side={THREE.DoubleSide}
        transparent={true}
        uniforms={uniforms}
        vertexShader={PANEL_VS}
      />
    </instancedMesh>
  );
}

function LEDPostProcessing({ isMobile }: { isMobile: boolean }) {
  const { gl, scene, camera, size } = useThree();

  const { composer, ledPass } = useMemo(() => {
    gl.setClearColor(0x1a1a2e, 1);
    scene.background = CLEAR_COLOR;

    const comp = new EffectComposer(gl);
    const rp = new RenderPass(scene, camera);
    rp.clearColor = CLEAR_COLOR;
    rp.clearAlpha = 1;
    comp.addPass(rp);
    comp.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.15, 0.8, 0.1));

    const led = new ShaderPass(LED_SHADER);
    led.uniforms.uPixelSize.value = isMobile ? 4 : 6;
    comp.addPass(led);

    return { composer: comp, ledPass: led };
  }, [gl, scene, camera, isMobile]);

  useEffect(() => {
    composer.setSize(size.width, size.height);
    ledPass.uniforms.uResolution.value.set(size.width, size.height);
  }, [composer, ledPass, size.width, size.height]);

  useFrame((state) => {
    ledPass.uniforms.uTime.value = state.clock.elapsedTime;
    composer.render();
  }, 1);

  return null;
}

function useMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

export function WarpTunnelCanvas() {
  const isMobile = useMobile();

  return (
    <Canvas
      camera={{ position: [0, -2, 0], fov: 85, near: 0.1, far: 100 }}
      dpr={1}
      gl={{ antialias: false, powerPreference: "high-performance", alpha: true }}
      style={{ width: "100%", height: "100%", display: "block", background: "transparent" }}
    >
      <CameraRig />
      <WallPanels instanceCount={isMobile ? 60 : 120} isMobile={isMobile} />
      <LEDPostProcessing isMobile={isMobile} />
    </Canvas>
  );
}
