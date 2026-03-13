import { shaderMaterial, useTexture } from "@react-three/drei";
import { extend, useFrame, useThree } from "@react-three/fiber";
import { Component, type ReactNode, Suspense, useRef } from "react";
import * as THREE from "three";
import { useCursor } from "../context/CursorContext";

// ─── GLSL shaders (velocity-based cloth — no time loop) ──────────────────────

const vertexShader = /* glsl */ `
  uniform vec2  uMouseUV;
  uniform float uVelocity;

  varying vec2 vUv;

  void main() {
    vUv = uv;

    // Localised cloth-drag: push vertices away from cursor, proportional to velocity
    vec2  delta     = uv - uMouseUV;
    float dist      = length(delta);
    float influence = exp(-dist * dist * 8.0);
    vec2  drag      = normalize(delta + 0.0001) * influence * uVelocity * 0.007;

    vec3 pos = position;
    pos.x   += drag.x;
    pos.y   += drag.y;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uTexture;
  uniform vec2      uMouseUV;
  uniform float     uVelocity;

  varying vec2 vUv;

  vec3 mod289v3(vec3 x){ return x - floor(x*(1.0/289.0))*289.0; }
  vec2 mod289v2(vec2 x){ return x - floor(x*(1.0/289.0))*289.0; }
  vec3 permute(vec3 x){ return mod289v3(((x*34.0)+1.0)*x); }

  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1  = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy  -= i1;
    i  = mod289v2(i);
    vec3 p = permute(permute(i.y + vec3(0.0,i1.y,1.0))
             + i.x + vec3(0.0,i1.x,1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x  = 2.0*fract(p*C.www) - 1.0;
    vec3 h  = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314*(a0*a0+h*h);
    vec3 g;
    g.x  = a0.x *x0.x  + h.x *x0.y;
    g.yz = a0.yz*x12.xz + h.yz*x12.yw;
    return 130.0*dot(m,g);
  }

  void main() {
    // Radial falloff around cursor
    vec2  delta     = vUv - uMouseUV;
    float dist      = length(delta);
    float influence = exp(-dist * dist * 8.0);

    // Fabric-grain UV warp — only near cursor, proportional to velocity
    float warpAmt = influence * uVelocity * 0.004;
    vec2 warpedUV = vUv + vec2(
      snoise(vUv * 6.0) * warpAmt,
      snoise(vUv * 6.0 + vec2(3.7, 1.3)) * warpAmt
    );

    gl_FragColor = texture2D(uTexture, warpedUV);
  }
`;

// ─── Shader material factory ──────────────────────────────────────────────────

const ClothMaterial = shaderMaterial(
  {
    uTexture: new THREE.Texture(),
    uMouseUV: new THREE.Vector2(0.5, 0.5),
    uVelocity: 0,
  },
  vertexShader,
  fragmentShader,
);

extend({ ClothMaterial });

type ClothMaterialType = InstanceType<typeof ClothMaterial>;

declare module "@react-three/fiber" {
  interface ThreeElements {
    clothMaterial: {
      ref?: React.Ref<ClothMaterialType>;
      uTexture?: THREE.Texture;
      uMouseUV?: THREE.Vector2;
      uVelocity?: number;
      attach?: string;
      key?: React.Key;
    };
  }
}

// ─── Inner plane ──────────────────────────────────────────────────────────────

interface MeltingPlaneInnerProps {
  imageUrl: string;
  index: number;
  baseY: number;
}

function MeltingPlaneInner({
  imageUrl,
  index: _index,
  baseY,
}: MeltingPlaneInnerProps) {
  const texture = useTexture(imageUrl);
  const matRef = useRef<ClothMaterialType | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const prevMouseUV = useRef(new THREE.Vector2(0.5, 0.5));
  const velocityRef = useRef(0);
  const { setCursorLabel } = useCursor();
  const { gl } = useThree();

  const planeW = 5.5;
  const planeH = 3.09375;

  useFrame(() => {
    if (!matRef.current) return;
    // Strong decay — distortion gone in ~0.4 s at 60 fps
    velocityRef.current *= 0.85;
    if (velocityRef.current < 0.001) velocityRef.current = 0;
    matRef.current.uVelocity = velocityRef.current;
    matRef.current.uMouseUV = prevMouseUV.current;
  });

  const handlePointerMove = (e: { point: THREE.Vector3 }) => {
    if (!meshRef.current) return;
    const localX = e.point.x - meshRef.current.position.x;
    const localY = e.point.y - meshRef.current.position.y;
    const u = localX / planeW + 0.5;
    const v = localY / planeH + 0.5;
    const newUV = new THREE.Vector2(u, v);
    const delta = newUV.distanceTo(prevMouseUV.current);
    velocityRef.current = Math.min(velocityRef.current + delta * 5, 0.4);
    prevMouseUV.current = newUV;
  };

  return (
    <mesh
      ref={meshRef}
      position={[0, baseY, 0]}
      onPointerOver={() => {
        setCursorLabel("Interact");
        gl.domElement.style.cursor = "none";
      }}
      onPointerOut={() => {
        velocityRef.current = 0;
        setCursorLabel("");
      }}
      onPointerMove={handlePointerMove}
    >
      <planeGeometry args={[planeW, planeH, 32, 32]} />
      <clothMaterial
        ref={matRef}
        uTexture={texture}
        uMouseUV={new THREE.Vector2(0.5, 0.5)}
        uVelocity={0}
      />
    </mesh>
  );
}

// ─── Fallback placeholder ─────────────────────────────────────────────────────

function FallbackPlane({ baseY }: { baseY: number }) {
  return (
    <mesh position={[0, baseY, 0]}>
      <planeGeometry args={[5.5, 3.09375]} />
      <meshBasicMaterial color="#111111" />
    </mesh>
  );
}

// ─── Error boundary ───────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
}

class TextureErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

// ─── Public export ────────────────────────────────────────────────────────────

export interface MeltingPlaneProps {
  imageUrl: string;
  index: number;
  baseY: number;
}

export function MeltingPlane({ imageUrl, index, baseY }: MeltingPlaneProps) {
  return (
    <TextureErrorBoundary fallback={<FallbackPlane baseY={baseY} />}>
      <Suspense fallback={<FallbackPlane baseY={baseY} />}>
        <MeltingPlaneInner imageUrl={imageUrl} index={index} baseY={baseY} />
      </Suspense>
    </TextureErrorBoundary>
  );
}
