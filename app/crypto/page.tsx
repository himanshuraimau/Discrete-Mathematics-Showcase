"use client"

import { useState, useEffect, useRef } from "react"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Text, Html, Environment } from "@react-three/drei"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, RefreshCw } from "lucide-react"
import * as THREE from "three"

// Rotating gear component for modular math visualization
function RotatingGear({
  position,
  value,
  maxValue,
  color,
  size = 1.5,
  label,
}: {
  position: [number, number, number]
  value: number
  maxValue: number
  color: string
  size?: number
  label: string
}) {
  const gearRef = useRef<THREE.Group>(null)
  const rotationSpeed = 0.2

  // Rotate the gear based on value
  useFrame(() => {
    if (gearRef.current) {
      // Smooth rotation animation
      const targetRotation = (value / maxValue) * Math.PI * 2
      gearRef.current.rotation.z = THREE.MathUtils.lerp(gearRef.current.rotation.z, targetRotation, 0.05)
    }
  })

  return (
    <group position={position}>
      {/* Gear base */}
      <group ref={gearRef}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[size, size, 0.3, 32]} />
          <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Gear teeth */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2
          const x = Math.cos(angle) * size
          const z = Math.sin(angle) * size

          return (
            <mesh key={i} position={[x, 0, z]} castShadow>
              <boxGeometry args={[0.4, 0.4, 0.4]} />
              <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
          )
        })}

        {/* Value indicator */}
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[size * 0.8, size * 0.8, 0.1, 32]} />
          <meshStandardMaterial color="#ffffff" metalness={0.5} roughness={0.5} />
        </mesh>

        <Text position={[0, 0.3, 0]} fontSize={0.5} color="black" anchorX="center" anchorY="middle">
          {value}
        </Text>
      </group>

      {/* Label */}
      <Text position={[0, -1, 0]} fontSize={0.4} color="white" anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  )
}

// Animated arrow for key exchange visualization
function AnimatedArrow({
  start,
  end,
  color,
  label,
  animate = false,
}: {
  start: [number, number, number]
  end: [number, number, number]
  color: string
  label: string
  animate?: boolean
}) {
  const arrowRef = useRef<THREE.Group>(null)
  const progress = useRef(0)

  // Calculate direction and length
  const direction = new THREE.Vector3().subVectors(new THREE.Vector3(...end), new THREE.Vector3(...start))
  const length = direction.length()

  // Calculate midpoint for label
  const midpoint: [number, number, number] = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2 + 0.5,
    (start[2] + end[2]) / 2,
  ]

  // Calculate rotation to point arrow in the right direction
  const arrow = new THREE.ArrowHelper(direction.clone().normalize(), new THREE.Vector3(...start))
  const rotation = arrow.rotation.clone()

  // Animate the arrow
  useFrame(() => {
    if (arrowRef.current && animate) {
      progress.current = (progress.current + 0.01) % 1

      // Pulse effect
      const scale = 1 + 0.1 * Math.sin(progress.current * Math.PI * 10)
      arrowRef.current.scale.set(scale, 1, scale)

      // Glow effect
      const material = (arrowRef.current.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial
      if (material) {
        material.emissiveIntensity = 0.5 + 0.3 * Math.sin(progress.current * Math.PI * 10)
      }
    }
  })

  return (
    <group ref={arrowRef}>
      {/* Arrow shaft */}
      <mesh position={midpoint} rotation={rotation} castShadow>
        <cylinderGeometry args={[0.1, 0.1, length * 0.8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Arrow head */}
      <mesh
        position={[
          end[0] - direction.normalize().x * length * 0.1,
          end[1] - direction.normalize().y * length * 0.1,
          end[2] - direction.normalize().z * length * 0.1,
        ]}
        rotation={rotation}
        castShadow
      >
        <coneGeometry args={[0.2, length * 0.2, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Label */}
      <Html position={midpoint} center>
        <div className="bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md text-sm font-medium">{label}</div>
      </Html>
    </group>
  )
}

// 3D Visualization of the key exchange
function KeyExchangeVisualization({
  p,
  g,
  privateA,
  privateB,
  publicA,
  publicB,
  sharedKeyA,
  sharedKeyB,
}: {
  p: number
  g: number
  privateA: number
  privateB: number
  publicA: number
  publicB: number
  sharedKeyA: number
  sharedKeyB: number
}) {
  return (
    <Canvas shadows camera={{ position: [0, 5, 20], fov: 50 }}>
      <color attach="background" args={["#030712"]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.6} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.5} castShadow />
      <Environment preset="city" />

      {/* Public parameters display */}
      <group position={[0, 7, 0]}>
        <Text position={[0, 0, 0]} fontSize={0.7} color="white">
          Public Parameters
        </Text>
        <Text position={[0, -1, 0]} fontSize={0.6} color="white">
          p = {p}, g = {g}
        </Text>

        {/* Generator visualization */}
        <RotatingGear position={[0, -3, 0]} value={g} maxValue={p} color="#64748b" size={1} label="Generator (g)" />
      </group>

      {/* Alice */}
      <group position={[-6, 0, 0]}>
        {/* Alice's avatar */}
        <mesh position={[0, 3, 0]} castShadow>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#7c3aed" metalness={0.7} roughness={0.3} />
        </mesh>

        <Text position={[0, 4.5, 0]} fontSize={0.8} color="white">
          Alice
        </Text>

        {/* Private key visualization */}
        <RotatingGear position={[0, 1, 0]} value={privateA} maxValue={p} color="#7c3aed" label="Private Key (a)" />

        {/* Public key visualization */}
        <RotatingGear position={[-3, -2, 0]} value={publicA} maxValue={p} color="#7c3aed" label="Public Key (A)" />
      </group>

      {/* Bob */}
      <group position={[6, 0, 0]}>
        {/* Bob's avatar */}
        <mesh position={[0, 3, 0]} castShadow>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#2563eb" metalness={0.7} roughness={0.3} />
        </mesh>

        <Text position={[0, 4.5, 0]} fontSize={0.8} color="white">
          Bob
        </Text>

        {/* Private key visualization */}
        <RotatingGear position={[0, 1, 0]} value={privateB} maxValue={p} color="#2563eb" label="Private Key (b)" />

        {/* Public key visualization */}
        <RotatingGear position={[3, -2, 0]} value={publicB} maxValue={p} color="#2563eb" label="Public Key (B)" />
      </group>

      {/* Public key exchange arrows */}
      <AnimatedArrow start={[-3, -2, 0]} end={[3, -2, 0]} color="#7c3aed" label={`A = ${publicA}`} animate={true} />

      <AnimatedArrow start={[3, -2, 0]} end={[-3, -2, 0]} color="#2563eb" label={`B = ${publicB}`} animate={true} />

      {/* Shared secret */}
      <group position={[0, -5, 0]}>
        <mesh castShadow>
          <torusGeometry args={[2, 0.5, 16, 32]} />
          <meshStandardMaterial
            color="#10b981"
            metalness={0.7}
            roughness={0.3}
            emissive="#10b981"
            emissiveIntensity={0.3}
          />
        </mesh>

        <Text position={[0, 0, 0]} fontSize={0.6} color="white">
          Shared Secret: {sharedKeyA}
        </Text>

        {/* Particles to indicate secure connection */}
        {Array.from({ length: 20 }).map((_, i) => {
          const angle = (i / 20) * Math.PI * 2
          const radius = 2.5
          const x = Math.cos(angle) * radius
          const z = Math.sin(angle) * radius

          return (
            <mesh key={i} position={[x, 0, z]}>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5 + 0.5 * Math.sin(i)} />
            </mesh>
          )
        })}
      </group>

      <OrbitControls enableDamping dampingFactor={0.05} rotateSpeed={0.5} minDistance={5} maxDistance={30} />
    </Canvas>
  )
}

// Modular exponentiation function
function modPow(base: number, exponent: number, modulus: number): number {
  if (modulus === 1) return 0

  let result = 1
  base = base % modulus

  while (exponent > 0) {
    if (exponent % 2 === 1) {
      result = (result * base) % modulus
    }
    exponent = Math.floor(exponent / 2)
    base = (base * base) % modulus
  }

  return result
}

export default function CryptoPage() {
  // Parameters
  const [p, setP] = useState(23)
  const [g, setG] = useState(5)
  const [privateA, setPrivateA] = useState(6)
  const [privateB, setPrivateB] = useState(15)

  // Computed values
  const [publicA, setPublicA] = useState(0)
  const [publicB, setPublicB] = useState(0)
  const [sharedKeyA, setSharedKeyA] = useState(0)
  const [sharedKeyB, setSharedKeyB] = useState(0)
  const [activeTab, setActiveTab] = useState("3d")

  // Recalculate values when parameters change
  useEffect(() => {
    // Calculate public keys
    const pubA = modPow(g, privateA, p)
    const pubB = modPow(g, privateB, p)

    setPublicA(pubA)
    setPublicB(pubB)

    // Calculate shared secrets
    const secretA = modPow(pubB, privateA, p)
    const secretB = modPow(pubA, privateB, p)

    setSharedKeyA(secretA)
    setSharedKeyB(secretB)
  }, [p, g, privateA, privateB])

  // Generate random parameters
  const generateRandom = () => {
    // Generate a small prime for demonstration
    const primes = [5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]
    const randomP = primes[Math.floor(Math.random() * primes.length)]

    // Generate a primitive root (simplified)
    const randomG = Math.floor(Math.random() * (randomP - 2)) + 2

    // Generate private keys
    const randomA = Math.floor(Math.random() * (randomP - 2)) + 2
    const randomB = Math.floor(Math.random() * (randomP - 2)) + 2

    setP(randomP)
    setG(randomG)
    setPrivateA(randomA)
    setPrivateB(randomB)
  }

  return (
    <PageLayout
      title="Cryptographic Key Exchange Simulator"
      description="Visualize how two parties can securely agree on a shared key over a public channel using group theory and modular arithmetic."
      concepts={["Cyclic Groups", "Modular Arithmetic", "Abelian Group Properties", "Diffie-Hellman Algorithm"]}
    >
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Parameters</h2>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="prime">Prime Modulus (p)</Label>
                  <span className="text-sm font-mono">{p}</span>
                </div>
                <Slider id="prime" min={5} max={47} step={2} value={[p]} onValueChange={(value) => setP(value[0])} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="generator">Generator (g)</Label>
                  <span className="text-sm font-mono">{g}</span>
                </div>
                <Slider id="generator" min={2} max={p - 1} value={[g]} onValueChange={(value) => setG(value[0])} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="alice-private">Alice's Private Key</Label>
                  <Input
                    id="alice-private"
                    type="number"
                    min={1}
                    max={p - 1}
                    value={privateA}
                    onChange={(e) => setPrivateA(Number.parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bob-private">Bob's Private Key</Label>
                  <Input
                    id="bob-private"
                    type="number"
                    min={1}
                    max={p - 1}
                    value={privateB}
                    onChange={(e) => setPrivateB(Number.parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <Button onClick={generateRandom} className="w-full flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Generate Random Values
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Key Exchange Process</h2>

            <div className="space-y-6">
              <div className="p-4 bg-muted rounded-md">
                <h3 className="font-medium mb-2">Public Parameters</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Prime (p):</span>
                    <div className="font-mono text-lg">{p}</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Generator (g):</span>
                    <div className="font-mono text-lg">{g}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-primary/10 rounded-md">
                  <h3 className="font-medium mb-2">Alice</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Private Key (a):</span>
                      <div className="font-mono">{privateA}</div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Public Key (A = g^a mod p):</span>
                      <div className="font-mono">{publicA}</div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Shared Secret (B^a mod p):</span>
                      <div className="font-mono">{sharedKeyA}</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-600/10 rounded-md">
                  <h3 className="font-medium mb-2">Bob</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Private Key (b):</span>
                      <div className="font-mono">{privateB}</div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Public Key (B = g^b mod p):</span>
                      <div className="font-mono">{publicB}</div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Shared Secret (A^b mod p):</span>
                      <div className="font-mono">{sharedKeyB}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-600/10 rounded-md">
                <h3 className="font-medium mb-2">Verification</h3>
                <div>
                  <span className="text-sm text-muted-foreground">Shared secrets match:</span>
                  <div className="font-mono">
                    {sharedKeyA === sharedKeyB ? (
                      <span className="text-green-600">✓ Yes ({sharedKeyA})</span>
                    ) : (
                      <span className="text-red-600">
                        ✗ No (A: {sharedKeyA}, B: {sharedKeyB})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Visualization</h2>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="2d">2D Diagram</TabsTrigger>
              <TabsTrigger value="3d">3D Visualization</TabsTrigger>
            </TabsList>
            <TabsContent value="2d" className="h-[400px] flex items-center justify-center">
              <div className="max-w-2xl w-full">
                <div className="flex justify-between items-center">
                  <div className="text-center p-4 bg-primary/10 rounded-md">
                    <div className="font-medium">Alice</div>
                    <div className="text-sm text-muted-foreground">Private: {privateA}</div>
                    <div className="mt-2 font-mono">A = {publicA}</div>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="text-center mb-2">
                      <div className="text-sm text-muted-foreground">Public Parameters</div>
                      <div className="font-mono">
                        p = {p}, g = {g}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center">
                        <div className="w-16 h-0.5 bg-gray-400"></div>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="flex items-center">
                        <ArrowRight className="h-4 w-4 text-gray-400 rotate-180" />
                        <div className="w-16 h-0.5 bg-gray-400"></div>
                      </div>
                    </div>
                    <div className="mt-8 p-2 bg-green-600/10 rounded-md">
                      <div className="text-sm text-muted-foreground">Shared Secret</div>
                      <div className="font-mono">{sharedKeyA}</div>
                    </div>
                  </div>

                  <div className="text-center p-4 bg-blue-600/10 rounded-md">
                    <div className="font-medium">Bob</div>
                    <div className="text-sm text-muted-foreground">Private: {privateB}</div>
                    <div className="mt-2 font-mono">B = {publicB}</div>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="3d" className="h-[400px]">
              <KeyExchangeVisualization
                p={p}
                g={g}
                privateA={privateA}
                privateB={privateB}
                publicA={publicA}
                publicB={publicB}
                sharedKeyA={sharedKeyA}
                sharedKeyB={sharedKeyB}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">How It Works</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Cyclic Groups</h3>
              <p className="text-muted-foreground">
                The Diffie-Hellman key exchange operates within a cyclic group, specifically the multiplicative group of
                integers modulo p. A cyclic group is generated by repeatedly applying the group operation to a single
                element (the generator g).
              </p>
            </div>

            <div>
              <h3 className="font-medium">Modular Arithmetic</h3>
              <p className="text-muted-foreground">
                All calculations are performed modulo a prime number p. This creates a finite field where the discrete
                logarithm problem (finding x given g^x mod p) is computationally difficult, forming the basis of the
                security.
              </p>
            </div>

            <div>
              <h3 className="font-medium">Abelian Group Properties</h3>
              <p className="text-muted-foreground">
                The key exchange relies on the commutative property of exponentiation in modular arithmetic: (g^a)^b mod
                p = (g^b)^a mod p. This allows both parties to arrive at the same shared secret.
              </p>
            </div>

            <div>
              <h3 className="font-medium">Mathematical Steps</h3>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Choose a prime p and generator g</li>
                <li>Alice chooses private key a and computes A = g^a mod p</li>
                <li>Bob chooses private key b and computes B = g^b mod p</li>
                <li>Alice and Bob exchange public keys A and B</li>
                <li>Alice computes shared secret = B^a mod p</li>
                <li>Bob computes shared secret = A^b mod p</li>
                <li>Both arrive at the same value: g^(ab) mod p</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  )
}
