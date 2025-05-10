"use client"

import { useState, useRef, useEffect } from "react"
// Remove the PageLayout import if it doesn't exist
// import { PageLayout } from "@/components/page-layout"
// Instead, let's use standard layout components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Text, useGLTF, Environment, Float, Sparkles, Billboard, useTexture } from "@react-three/drei"
import { Plus, RefreshCw, Trash2 } from "lucide-react"
import * as THREE from "three"

// Define instruction type
type Instruction = {
  id: string
  name: string
  dependencies: string[]
}

// Node component for 3D visualization
function Node({ position, name, color, level }: { position: [number, number, number], name: string, color: string, level: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)

  // Pulse animation for the glow effect
  useFrame((state) => {
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1)
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.3
      ringRef.current.rotation.x = state.clock.elapsedTime * 0.2
    }
  })

  // Hover state for interactive highlighting
  const [hovered, setHovered] = useState(false)
  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto'
    return () => { document.body.style.cursor = 'auto' }
  }, [hovered])

  return (
    <Float 
      speed={2} 
      rotationIntensity={0.2} 
      floatIntensity={0.3} 
      position={position}
    >
      <group 
        ref={groupRef}
        onPointerOver={() => setHovered(true)} 
        onPointerOut={() => setHovered(false)}
      >
        {/* Outer glow */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[0.75, 32, 32]} />
          <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={0.15} 
            toneMapped={false}
          />
        </mesh>

        {/* Decorative ring */}
        <mesh ref={ringRef} scale={1.1}>
          <torusGeometry args={[0.6, 0.03, 16, 32]} />
          <meshStandardMaterial 
            color={color} 
            emissive={color} 
            emissiveIntensity={0.5}
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>
        
        {/* Main sphere with glass-like material */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.55, 64, 64]} />
          <meshPhysicalMaterial 
            color={color} 
            emissive={color} 
            emissiveIntensity={0.2}
            metalness={0.2}
            roughness={0.1}
            clearcoat={1}
            clearcoatRoughness={0.1}
            envMapIntensity={1.5}
            transmission={0.2}
            opacity={0.95}
          />
        </mesh>
        
        {/* Small particles around the node for a dynamic effect */}
        <Sparkles
          count={15}
          scale={[2, 2, 2]}
          size={0.4}
          speed={0.3}
          color={color}
          opacity={0.7}
        />
        
        {/* Text label with better positioning and styling */}
        <Billboard
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
        >
          <Text 
            position={[0, -1.2, 0]} 
            fontSize={0.4}
            font="/fonts/Inter-SemiBold.woff"
            color="white"
            anchorX="center" 
            anchorY="middle"
            outlineWidth={0.05}
            outlineColor="#000000"
            outlineOpacity={0.3}
            overflowWrap="break-word"
            maxWidth={5}
          >
            {name}
          </Text>
        </Billboard>
      </group>
    </Float>
  )
}

// Edge component for connecting nodes
function Edge({ start, end, color = "#8bbbff" }: { start: [number, number, number], end: [number, number, number], color?: string }) {
  const ref = useRef<THREE.Mesh>(null)
  
  // Calculate direction and position
  const direction = new THREE.Vector3().subVectors(
    new THREE.Vector3(...end),
    new THREE.Vector3(...start)
  )
  const center = new THREE.Vector3().addVectors(
    new THREE.Vector3(...start),
    direction.clone().multiplyScalar(0.5)
  )
  const length = direction.length()
  
  // Calculate rotation to align with the direction
  const quaternion = new THREE.Quaternion()
  quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize()
  )
  
  useFrame((state) => {
    if (ref.current) {
      // Animate the material
      const material = ref.current.material as THREE.MeshStandardMaterial
      material.opacity = 0.6 + Math.sin(state.clock.elapsedTime * 2) * 0.2
      
      // Pulse effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.05
      ref.current.scale.set(scale, 1, scale)
    }
  })
  
  return (
    <mesh 
      ref={ref}
      position={center.toArray()}
      quaternion={quaternion}
      castShadow
    >
      <cylinderGeometry args={[0.035, 0.035, length, 8]} />
      <meshStandardMaterial 
        color={color} 
        transparent
        opacity={0.8}
        emissive={color}
        emissiveIntensity={0.5}
        metalness={0.9}
        roughness={0.2}
      />
    </mesh>
  )
}

// 3D Hasse Diagram Visualization
function HasseDiagramVisualization({ instructions }: { instructions: Instruction[] }) {
  // Create a map of instruction levels
  const levels = new Map<string, number>()

  // Compute the level of each instruction
  const computeLevels = () => {
    // Reset levels
    instructions.forEach((inst) => levels.set(inst.id, 0))

    let changed = true
    while (changed) {
      changed = false

      instructions.forEach((inst) => {
        const currentLevel = levels.get(inst.id) || 0

        inst.dependencies.forEach((depId) => {
          const depLevel = levels.get(depId) || 0
          if (currentLevel <= depLevel) {
            levels.set(inst.id, depLevel + 1)
            changed = true
          }
        })
      })
    }
  }

  computeLevels()

  // Get the maximum level
  const maxLevel = Math.max(...Array.from(levels.values()), 1)

  // Create positions for instructions in a 3D space
  const positions: { [key: string]: [number, number, number] } = {}

  // Group instructions by level
  const instructionsByLevel = new Map<number, Instruction[]>()

  instructions.forEach((inst) => {
    const level = levels.get(inst.id) || 0
    if (!instructionsByLevel.has(level)) {
      instructionsByLevel.set(level, [])
    }
    instructionsByLevel.get(level)?.push(inst)
  })

  // Assign positions based on levels - more spread out and with a curved layout
  Array.from(instructionsByLevel.entries()).forEach(([level, insts]) => {
    const levelHeight = (maxLevel - level) * 4 // Vertical spacing
    const width = insts.length
    const radius = Math.max(width * 1.2, 3) // Radius increases with width

    insts.forEach((inst, index) => {
      // Calculate position in a curved layout
      const angle = (index / width) * Math.PI + Math.PI / 2
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius * 0.5
      const y = levelHeight
      
      positions[inst.id] = [x, y, z]
    })
  })

  // Create an advanced color palette with better contrast
  const getNodeColor = (level: number) => {
    const colors = [
      "#ff6b6b", // Red
      "#ff9e64", // Orange
      "#ffd93d", // Yellow
      "#6bcb77", // Green
      "#4d96ff", // Blue
      "#9b72aa", // Purple
      "#ff6e96", // Pink
    ]
    return colors[level % colors.length]
  }

  return (
    <Canvas 
      camera={{ position: [0, maxLevel * 2, maxLevel * 6], fov: 45 }}
      dpr={[1, 2]} // Improve rendering quality
      gl={{ 
        antialias: true,
        alpha: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2
      }}
      shadows
    >
      {/* Enhanced environment and lighting */}
      <color attach="background" args={["#050816"]} />
      <fog attach="fog" args={['#070b2e', 10, 50]} />
      
      {/* Add an environment map for realistic reflections */}
      <Environment preset="city" />
      
      {/* Create dynamic lighting */}
      <ambientLight intensity={0.3} />
      <spotLight 
        position={[10, 15, 10]} 
        angle={0.3} 
        penumbra={1} 
        intensity={2} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />
      
      {/* Add global particles for atmosphere */}
      <Sparkles 
        count={200} 
        scale={[30, 20, 30]} 
        size={1} 
        speed={0.3} 
        opacity={0.2}
      />
      
      {/* Background elements */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial 
          color="#0a0a20" 
          metalness={0.9}
          roughness={0.5}
        />
      </mesh>
      
      {/* Draw edges (dependencies) with enhanced styling */}
      {instructions.map((inst) =>
        inst.dependencies.map((depId) => {
          if (positions[inst.id] && positions[depId]) {
            const startPos = positions[depId] // From dependency
            const endPos = positions[inst.id] // To instruction
            const level = levels.get(inst.id) || 0
            const color = getNodeColor(level)
            
            return (
              <Edge 
                key={`${inst.id}-${depId}`} 
                start={startPos} 
                end={endPos} 
                color={color}
              />
            )
          }
          return null
        }),
      )}

      {/* Draw nodes (instructions) with enhanced styling */}
      {instructions.map((inst) => {
        const pos = positions[inst.id]
        if (!pos) return null
        const level = levels.get(inst.id) || 0
        const color = getNodeColor(level)

        return (
          <Node 
            key={inst.id} 
            position={pos} 
            name={inst.name} 
            color={color} 
            level={level}
          />
        )
      })}

      {/* Enhanced orbit controls */}
      <OrbitControls 
        minDistance={3}
        maxDistance={maxLevel * 10}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        autoRotate
        autoRotateSpeed={0.5}
      />
      
      {/* Add subtle grid for better depth perception */}
      <gridHelper 
        args={[100, 100, "#1e3a8a", "#0f172a"]} 
        position={[0, -1.9, 0]} 
        rotation={[Math.PI / 2, 0, 0]} 
      />
    </Canvas>
  )
}

// Function to find all topological sorts
function findAllTopologicalSorts(instructions: Instruction[]): string[][] {
  const result: string[][] = []
  const visited = new Set<string>()
  const temp = new Set<string>()
  const inDegree = new Map<string, number>()

  // Initialize in-degree for all instructions
  instructions.forEach((inst) => {
    inDegree.set(inst.id, 0)
  })

  // Calculate in-degree for each instruction
  instructions.forEach((inst) => {
    inst.dependencies.forEach((depId) => {
      inDegree.set(depId, (inDegree.get(depId) || 0) + 1)
    })
  })

  // Find all possible topological sorts
  const allTopologicalSortsUtil = (path: string[]) => {
    let allVisited = true

    // Check if all instructions are visited
    instructions.forEach((inst) => {
      if (!visited.has(inst.id) && !temp.has(inst.id)) {
        allVisited = false

        // Check if this instruction has no dependencies or all dependencies are visited
        const canVisit = inst.dependencies.every((depId) => visited.has(depId))

        if (canVisit) {
          // Visit this instruction
          visited.add(inst.id)
          temp.add(inst.id)
          path.push(inst.id)

          // Recursively find all topological sorts
          allTopologicalSortsUtil([...path])

          // Backtrack
          visited.delete(inst.id)
          path.pop()
          temp.delete(inst.id)
        }
      }
    })

    // If all instructions are visited, add the current path to the result
    if (allVisited && path.length === instructions.length) {
      result.push([...path])
    }
  }

  // Start with an empty path
  allTopologicalSortsUtil([])

  return result
}

export default function CompilerPage() {
  // Initial instructions
  const [instructions, setInstructions] = useState<Instruction[]>([
    { id: "1", name: "Load A", dependencies: [] },
    { id: "2", name: "Load B", dependencies: [] },
    { id: "3", name: "Add A,B", dependencies: ["1", "2"] },
    { id: "4", name: "Store C", dependencies: ["3"] },
    { id: "5", name: "Print C", dependencies: ["4"] },
  ])

  // Form states
  const [newInstructionName, setNewInstructionName] = useState("")
  const [newInstructionDeps, setNewInstructionDeps] = useState<string[]>([])
  const [topologicalSorts, setTopologicalSorts] = useState<string[][]>([])
  const [activeTab, setActiveTab] = useState("diagram")

  // Add a new instruction
  const addInstruction = () => {
    if (newInstructionName.trim() === "") return
    const newInstruction: Instruction = {
      id: (instructions.length + 1).toString(),
      name: newInstructionName,
      dependencies: newInstructionDeps,
    }
    setInstructions([...instructions, newInstruction])
    setNewInstructionName("")
    setNewInstructionDeps([])
  }

  // Remove an instruction
  const removeInstruction = (id: string) => {
    // Remove the instruction
    const updatedInstructions = instructions.filter((inst) => inst.id !== id)
    // Remove dependencies on this instruction
    const finalInstructions = updatedInstructions.map((inst) => ({
      ...inst,
      dependencies: inst.dependencies.filter((depId) => depId !== id),
    }))
    setInstructions(finalInstructions)
  }

  // Toggle a dependency
  const toggleDependency = (depId: string) => {
    if (newInstructionDeps.includes(depId)) {
      setNewInstructionDeps(newInstructionDeps.filter((id) => id !== depId))
    } else {
      setNewInstructionDeps([...newInstructionDeps, depId])
    }
  }

  // Find all valid execution sequences
  const findExecutionSequences = () => {
    const sorts = findAllTopologicalSorts(instructions)
    setTopologicalSorts(sorts)
  }

  // Reset to initial state
  const resetInstructions = () => {
    setInstructions([
      { id: "1", name: "Load A", dependencies: [] },
      { id: "2", name: "Load B", dependencies: [] },
      { id: "3", name: "Add A,B", dependencies: ["1", "2"] },
      { id: "4", name: "Store C", dependencies: ["3"] },
      { id: "5", name: "Print C", dependencies: ["4"] },
    ])
    setNewInstructionName("")
    setNewInstructionDeps([])
    setTopologicalSorts([])
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Instruction Dependency Visualizer</h1>
        <p className="text-muted-foreground">
          Visualize task dependencies as partially ordered sets with Hasse diagrams.
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {["Partial Order Relations", "Posets", "Hasse Diagrams", "Topological Sorting"].map((concept) => (
            <span key={concept} className="px-2.5 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
              {concept}
            </span>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="diagram">Hasse Diagram</TabsTrigger>
          <TabsTrigger value="execution">Execution Sequences</TabsTrigger>
          <TabsTrigger value="theory">Mathematical Theory</TabsTrigger>
        </TabsList>

        <TabsContent value="diagram">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Card className="h-[600px]">
                <CardContent className="p-0 h-full">
                  <HasseDiagramVisualization instructions={instructions} />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Instruction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Instruction Name</Label>
                      <Input
                        id="name"
                        placeholder="Enter instruction name"
                        value={newInstructionName}
                        onChange={(e) => setNewInstructionName(e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label>Dependencies</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                        {instructions.map((inst) => (
                          <div key={inst.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`dep-${inst.id}`}
                              checked={newInstructionDeps.includes(inst.id)}
                              onChange={() => toggleDependency(inst.id)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor={`dep-${inst.id}`} className="text-sm">
                              {inst.name}
                            </label>
                          </div>
                        ))}
                        {instructions.length === 0 && (
                          <p className="text-sm text-muted-foreground">No instructions available</p>
                        )}
                      </div>
                    </div>

                    <Button onClick={addInstruction} className="w-full flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add Instruction
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Instruction List</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {instructions.map((inst) => (
                      <div key={inst.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div>
                          <div className="font-medium">{inst.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Dependencies:{" "}
                            {inst.dependencies.length > 0
                              ? inst.dependencies
                                  .map((depId) => instructions.find((i) => i.id === depId)?.name)
                                  .join(", ")
                              : "None"}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeInstruction(inst.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {instructions.length === 0 && (
                      <p className="text-sm text-muted-foreground">No instructions added</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Button variant="outline" onClick={resetInstructions} className="w-full flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Reset Instructions
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="execution">
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Instruction Dependencies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {instructions.map((inst) => (
                    <div key={inst.id} className="p-4 border rounded-md">
                      <div className="font-medium mb-2">{inst.name}</div>
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Dependencies:</span>{" "}
                        {inst.dependencies.length > 0
                          ? inst.dependencies.map((depId) => instructions.find((i) => i.id === depId)?.name).join(", ")
                          : "None"}
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={findExecutionSequences} className="w-full mt-4">
                  Find Valid Execution Sequences
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Valid Execution Sequences</CardTitle>
              </CardHeader>
              <CardContent>
                {topologicalSorts.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {topologicalSorts.map((sort, index) => (
                      <div key={index} className="p-4 border rounded-md">
                        <div className="font-medium mb-2">Sequence {index + 1}</div>
                        <ol className="list-decimal list-inside">
                          {sort.map((id) => (
                            <li key={id} className="text-sm">
                              {instructions.find((inst) => inst.id === id)?.name}
                            </li>
                          ))}
                        </ol>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 text-muted-foreground">
                    Click "Find Valid Execution Sequences" to generate all possible orderings
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8">
            <CardContent className="p-0">
              <h2 className="text-xl font-semibold px-6 pt-6 mb-2">3D Visualization</h2>
              <div className="h-[550px]">
                <HasseDiagramVisualization instructions={instructions} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theory">
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Partial Order Relations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">A partial order relation is a binary relation that is:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>
                    <span className="font-medium">Reflexive:</span> Each element is related to itself
                  </li>
                  <li>
                    <span className="font-medium">Antisymmetric:</span> If a is related to b and b is related to a, then
                    a = b
                  </li>
                  <li>
                    <span className="font-medium">Transitive:</span> If a is related to b and b is related to c, then a
                    is related to c
                  </li>
                </ul>
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Instruction Dependencies as a Poset</h3>
                  <p className="text-muted-foreground">
                    In our instruction dependency system, we define a partial order relation "must execute before"
                    where:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-2">
                    <li>Instruction A must execute before instruction B if B depends on A</li>
                    <li>
                      This relation is transitive: if A must execute before B and B before C, then A must execute before
                      C
                    </li>
                    <li>The relation is not defined for all pairs of instructions (hence "partial")</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hasse Diagrams</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  A Hasse diagram is a graphical representation of a partially ordered set that:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Represents elements as vertices</li>
                  <li>
                    Draws an edge from element a to element b if a &lt; b and there is no c such that a &lt; c &lt; b
                  </li>
                  <li>Omits reflexive edges (no self-loops)</li>
                  <li>Omits transitive edges (if a → b → c, we don't draw a → c)</li>
                  <li>Places elements vertically according to their order (smaller elements below larger ones)</li>
                </ul>
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Interpretation in Our Application</h3>
                  <p className="text-muted-foreground">In our instruction dependency visualizer:</p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-2">
                    <li>Vertices represent instructions</li>
                    <li>Edges represent direct dependencies</li>
                    <li>Instructions are placed in levels based on their dependency depth</li>
                    <li>Independent instructions (no dependencies between them) can be executed in any order</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Topological Sorting</h2>
              <p className="text-muted-foreground mb-4">
                A topological sort of a directed acyclic graph (DAG) is a linear ordering of its vertices such that:
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Definition</h3>
                  <p className="text-muted-foreground">
                    For every directed edge (u, v) in the graph, vertex u comes before vertex v in the ordering. In our
                    context, if instruction A depends on instruction B, then B must come before A in any valid execution
                    sequence.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium">Properties</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>A DAG can have multiple valid topological sorts</li>
                    <li>The number of possible topological sorts depends on how constrained the partial order is</li>
                    <li>If all vertices are comparable (total order), there is exactly one topological sort</li>
                    <li>
                      If there are no edges (no dependencies), there are n! possible topological sorts for n vertices
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium">Application in Compilers</h3>
                  <p className="text-muted-foreground">Compilers use topological sorting for:</p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-2">
                    <li>Instruction scheduling</li>
                    <li>Data dependency analysis</li>
                    <li>Determining evaluation order of expressions</li>
                    <li>Optimizing code generation while preserving program semantics</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
