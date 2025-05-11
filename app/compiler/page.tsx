"use client"

import { useState } from "react"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Text } from "@react-three/drei"
import { Plus, RefreshCw, Trash2 } from "lucide-react"

// Define instruction type
type Instruction = {
  id: string
  name: string
  dependencies: string[]
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

  // Assign positions based on levels - more spread out
  Array.from(instructionsByLevel.entries()).forEach(([level, insts]) => {
    const levelHeight = (maxLevel - level) * 4 // Increased vertical spacing
    const width = insts.length

    insts.forEach((inst, index) => {
      const x = (index - (width - 1) / 2) * 3.5 // Increased horizontal spacing
      const y = levelHeight
      const z = 0

      positions[inst.id] = [x, y, z]
    })
  })

  // Create a color palette for nodes based on their level
  const getNodeColor = (level: number) => {
    const colors = [
      "#8b5cf6", // Violet
      "#6366f1", // Indigo
      "#3b82f6", // Blue
      "#0ea5e9", // Light Blue
      "#06b6d4", // Cyan
      "#14b8a6", // Teal
    ]
    return colors[level % colors.length]
  }

  return (
    <Canvas 
      camera={{ position: [0, maxLevel * 2, maxLevel * 6], fov: 45 }}
      style={{ background: "linear-gradient(to bottom, #111827, #1e293b)" }}
      shadows
    >
      <fog attach="fog" args={['#1e293b', 10, 50]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.5} castShadow />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {/* Draw edges (dependencies) */}
      {instructions.map((inst) =>
        inst.dependencies.map((depId) => {
          if (positions[inst.id] && positions[depId]) {
            const [x1, y1, z1] = positions[inst.id]
            const [x2, y2, z2] = positions[depId]

            // Calculate the midpoint
            const midX = (x1 + x2) / 2
            const midY = (y1 + y2) / 2
            const midZ = (z1 + z2) / 2

            // Calculate the distance
            const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2))

            // Calculate the rotation
            const rotX = Math.atan2(y2 - y1, Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2)))
            const rotZ = Math.atan2(x2 - x1, z2 - z1)

            return (
              <group key={`${inst.id}-${depId}`}>
                <mesh position={[midX, midY, midZ]} rotation={[rotX, 0, rotZ]} castShadow receiveShadow>
                  <cylinderGeometry args={[0.08, 0.08, distance, 12]} />
                  <meshStandardMaterial 
                    color="#94a3b8" 
                    emissive="#475569"
                    emissiveIntensity={0.2}
                    metalness={0.8}
                    roughness={0.2}
                  />
                </mesh>
              </group>
            )
          }
          return null
        }),
      )}

      {/* Draw nodes (instructions) */}
      {instructions.map((inst) => {
        const pos = positions[inst.id]
        if (!pos) return null
        const level = levels.get(inst.id) || 0
        const color = getNodeColor(level)

        return (
          <group key={inst.id} position={pos}>
            {/* Glow effect */}
            <mesh>
              <sphereGeometry args={[0.7, 16, 16]} />
              <meshBasicMaterial color={color} transparent opacity={0.15} />
            </mesh>
            
            {/* Main sphere */}
            <mesh castShadow receiveShadow>
              <sphereGeometry args={[0.6, 32, 32]} />
              <meshStandardMaterial 
                color={color} 
                emissive={color}
                emissiveIntensity={0.3}
                metalness={0.7}
                roughness={0.2}
              />
            </mesh>
            
            {/* Text label */}
            <Text 
              position={[0, -1.0, 0]} 
              fontSize={0.45} 
              color="white"
              anchorX="center" 
              anchorY="middle"
              outlineWidth={0.02}
              outlineColor="#1e293b"
            >
              {inst.name}
            </Text>
          </group>
        )
      })}

      <OrbitControls 
        minDistance={3}
        maxDistance={maxLevel * 8}
        enableDamping
        dampingFactor={0.05}
      />
      
      {/* Add subtle grid for better depth perception */}
      <gridHelper 
        args={[50, 50, "#64748b", "#334155"]} 
        position={[0, -2, 0]} 
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
    <PageLayout
      title="Instruction Dependency Visualizer"
      description="Visualize task dependencies as partially ordered sets with Hasse diagrams."
      concepts={["Partial Order Relations", "Posets", "Hasse Diagrams", "Topological Sorting"]}
    >
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
    </PageLayout>
  )
}