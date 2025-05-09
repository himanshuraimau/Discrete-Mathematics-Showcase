"use client"

import { useState, useEffect, useRef } from "react"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, Trail, Html } from "@react-three/drei"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Play, RefreshCw } from "lucide-react"
import * as THREE from "three"

// Define router type
type Router = {
  id: string
  name: string
  position: [number, number, number]
}

// Define connection type
type Connection = {
  source: string
  target: string
  weight: number
}

// Router 3D model component
function RouterModel({
  position,
  color,
  scale = 1,
}: { position: [number, number, number]; color: string; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Base cylinder */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.3, 16]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.2} />
      </mesh>

      {/* Top dome */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <sphereGeometry args={[0.7, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Antenna */}
      <mesh position={[0.4, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.6, 8]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Antenna top */}
      <mesh position={[0.4, 0.8, 0]} castShadow>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
      </mesh>

      {/* LED lights */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i * Math.PI) / 2
        return (
          <mesh key={i} position={[0.6 * Math.cos(angle), 0.05, 0.6 * Math.sin(angle)]} castShadow>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? "#00ff00" : "#ffaa00"}
              emissive={i % 2 === 0 ? "#00ff00" : "#ffaa00"}
              emissiveIntensity={0.5}
            />
          </mesh>
        )
      })}
    </group>
  )
}

// Connection component with glow effect
function Connection({
  start,
  end,
  weight,
  isActive = false,
}: {
  start: [number, number, number]
  end: [number, number, number]
  weight: number
  isActive?: boolean
}) {
  // Calculate direction and length
  const direction = new THREE.Vector3().subVectors(new THREE.Vector3(...end), new THREE.Vector3(...start))
  const length = direction.length()

  // Calculate midpoint for weight label
  const midpoint: [number, number, number] = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2 + 0.5,
    (start[2] + end[2]) / 2,
  ]

  // Calculate rotation to point cylinder in the right direction
  const arrow = new THREE.ArrowHelper(direction.clone().normalize(), new THREE.Vector3(...start))
  const rotation = arrow.rotation.clone()

  return (
    <group>
      {/* Main connection tube */}
      <mesh position={midpoint} rotation={rotation} castShadow>
        <cylinderGeometry args={[0.08, 0.08, length, 8]} />
        <meshStandardMaterial
          color={isActive ? "#10b981" : "#64748b"}
          transparent
          opacity={isActive ? 0.9 : 0.6}
          emissive={isActive ? "#10b981" : "#64748b"}
          emissiveIntensity={isActive ? 0.5 : 0.1}
        />
      </mesh>

      {/* Outer glow for active connections */}
      {isActive && (
        <mesh position={midpoint} rotation={rotation}>
          <cylinderGeometry args={[0.12, 0.12, length, 8]} />
          <meshStandardMaterial color="#10b981" transparent opacity={0.3} emissive="#10b981" emissiveIntensity={0.3} />
        </mesh>
      )}

      {/* Weight label */}
      <Html position={midpoint} center>
        <div className="bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md text-sm font-medium">{weight}</div>
      </Html>
    </group>
  )
}

// Animated packet with trail
function AnimatedPacket({
  routers,
  path,
  progress,
}: {
  routers: Router[]
  path: string[]
  progress: number
}) {
  const packetRef = useRef<THREE.Mesh>(null)

  // Calculate which segment of the path we're on
  const numSegments = path.length - 1
  const segmentProgress = progress * numSegments
  const currentSegment = Math.min(Math.floor(segmentProgress), numSegments - 1)
  const segmentFraction = segmentProgress - currentSegment

  // Get current and next router positions
  const currentRouter = routers.find((r) => r.id === path[currentSegment])
  const nextRouter = routers.find((r) => r.id === path[currentSegment + 1])

  if (!currentRouter || !nextRouter) return null

  // Interpolate position
  const x = currentRouter.position[0] + (nextRouter.position[0] - currentRouter.position[0]) * segmentFraction
  const y = currentRouter.position[1] + (nextRouter.position[1] - currentRouter.position[1]) * segmentFraction
  const z = currentRouter.position[2] + (nextRouter.position[2] - currentRouter.position[2]) * segmentFraction

  return (
    <group position={[x, y, z]}>
      {/* Data packet */}
      <Trail width={0.5} length={4} color="#ef4444" attenuation={(t) => t * t}>
        <mesh ref={packetRef} castShadow>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={0.5}
            metalness={0.7}
            roughness={0.2}
          />
        </mesh>
      </Trail>

      {/* Pulse effect */}
      <mesh>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial
          color="#ef4444"
          transparent
          opacity={0.2 * (1 + Math.sin(Date.now() * 0.01))}
          emissive="#ef4444"
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  )
}

// Matrix visualization component
function MatrixVisualization({ routers, connections }: { routers: Router[]; connections: Connection[] }) {
  // Create adjacency matrix
  const matrix: number[][] = Array(routers.length)
    .fill(0)
    .map(() => Array(routers.length).fill(0))

  // Fill matrix with connection weights
  connections.forEach((conn) => {
    const sourceIndex = routers.findIndex((r) => r.id === conn.source)
    const targetIndex = routers.findIndex((r) => r.id === conn.target)
    if (sourceIndex >= 0 && targetIndex >= 0) {
      matrix[sourceIndex][targetIndex] = conn.weight
    }
  })

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2"></th>
            {routers.map((router) => (
              <th key={router.id} className="border p-2 text-center">
                {router.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {routers.map((router, i) => (
            <tr key={router.id}>
              <th className="border p-2 text-left">{router.name}</th>
              {matrix[i].map((value, j) => (
                <td key={j} className="border p-2 text-center">
                  {value || "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// 3D Network visualization
function NetworkVisualization({
  routers,
  connections,
  path = [],
  animationProgress = 0,
}: {
  routers: Router[]
  connections: Connection[]
  path?: string[]
  animationProgress?: number
}) {
  return (
    <Canvas shadows camera={{ position: [0, 10, 20], fov: 50 }}>
      <color attach="background" args={["#030712"]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.6} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.5} castShadow />
      <Environment preset="city" />

      {/* Grid helper */}
      <gridHelper args={[30, 30, "#1f2937", "#1f2937"]} position={[0, -2, 0]} />

      {/* Draw connections */}
      {connections.map((conn) => {
        const source = routers.find((r) => r.id === conn.source)
        const target = routers.find((r) => r.id === conn.target)

        if (!source || !target) return null

        const isInPath =
          path.length > 0 &&
          path.findIndex((id) => id === conn.source) >= 0 &&
          path.findIndex((id) => id === conn.target) >= 0 &&
          Math.abs(path.indexOf(conn.source) - path.indexOf(conn.target)) === 1

        return (
          <Connection
            key={`${conn.source}-${conn.target}`}
            start={source.position}
            end={target.position}
            weight={conn.weight}
            isActive={isInPath}
          />
        )
      })}

      {/* Draw routers */}
      {routers.map((router) => {
        const isInPath = path.includes(router.id)
        const isSource = path.length > 0 && path[0] === router.id
        const isTarget = path.length > 0 && path[path.length - 1] === router.id

        let color = "#64748b"
        if (isSource) color = "#7c3aed"
        else if (isTarget) color = "#2563eb"
        else if (isInPath) color = "#10b981"

        return (
          <group key={router.id}>
            <RouterModel position={router.position} color={color} />

            {/* Router label */}
            <Html position={[router.position[0], router.position[1] - 1.5, router.position[2]]} center>
              <div className="bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md text-sm font-medium">
                {router.name}
              </div>
            </Html>

            {/* Highlight effect for source/target */}
            {(isSource || isTarget) && (
              <mesh position={router.position}>
                <sphereGeometry args={[1.2, 32, 32]} />
                <meshStandardMaterial
                  color={isSource ? "#7c3aed" : "#2563eb"}
                  transparent
                  opacity={0.15}
                  emissive={isSource ? "#7c3aed" : "#2563eb"}
                  emissiveIntensity={0.3}
                />
              </mesh>
            )}
          </group>
        )
      })}

      {/* Animated packet */}
      {path.length >= 2 && animationProgress > 0 && animationProgress < 1 && (
        <AnimatedPacket routers={routers} path={path} progress={animationProgress} />
      )}

      <OrbitControls enableDamping dampingFactor={0.05} rotateSpeed={0.5} minDistance={5} maxDistance={50} />
    </Canvas>
  )
}

// Dijkstra's algorithm for shortest path
function findShortestPath(routers: Router[], connections: Connection[], sourceId: string, targetId: string): string[] {
  // Create adjacency list
  const graph: Record<string, { id: string; weight: number }[]> = {}
  routers.forEach((router) => {
    graph[router.id] = []
  })

  connections.forEach((conn) => {
    graph[conn.source].push({ id: conn.target, weight: conn.weight })
    // For undirected graph, add the reverse connection too
    graph[conn.target].push({ id: conn.source, weight: conn.weight })
  })

  // Initialize distances and previous nodes
  const distances: Record<string, number> = {}
  const previous: Record<string, string | null> = {}
  const unvisited = new Set<string>()

  routers.forEach((router) => {
    distances[router.id] = router.id === sourceId ? 0 : Number.POSITIVE_INFINITY
    previous[router.id] = null
    unvisited.add(router.id)
  })

  // Dijkstra's algorithm
  while (unvisited.size > 0) {
    // Find the unvisited node with the smallest distance
    let current: string | null = null
    let smallestDistance = Number.POSITIVE_INFINITY

    unvisited.forEach((id) => {
      if (distances[id] < smallestDistance) {
        smallestDistance = distances[id]
        current = id
      }
    })

    if (current === null) break // No path exists
    if (current === targetId) break // Found the target

    unvisited.delete(current)

    // Update distances to neighbors
    graph[current].forEach((neighbor) => {
      if (unvisited.has(neighbor.id)) {
        const alt = distances[current] + neighbor.weight
        if (alt < distances[neighbor.id]) {
          distances[neighbor.id] = alt
          previous[neighbor.id] = current
        }
      }
    })
  }

  // Reconstruct the path
  const path: string[] = []
  let current = targetId

  if (previous[current] === null && current !== sourceId) {
    return [] // No path exists
  }

  while (current) {
    path.unshift(current)
    current = previous[current] || ""
    if (!current) break
  }

  return path
}

export default function NetworkPage() {
  // Initial routers with positions
  const [routers, setRouters] = useState<Router[]>([
    { id: "1", name: "Router A", position: [-5, 3, 0] },
    { id: "2", name: "Router B", position: [0, 5, 0] },
    { id: "3", name: "Router C", position: [5, 3, 0] },
    { id: "4", name: "Router D", position: [3, -2, 0] },
    { id: "5", name: "Router E", position: [-3, -2, 0] },
    { id: "6", name: "Router F", position: [0, 0, 3] },
  ])

  // Initial connections
  const [connections, setConnections] = useState<Connection[]>([
    { source: "1", target: "2", weight: 2 },
    { source: "2", target: "3", weight: 1 },
    { source: "3", target: "4", weight: 3 },
    { source: "4", target: "5", weight: 2 },
    { source: "5", target: "1", weight: 4 },
    { source: "1", target: "6", weight: 5 },
    { source: "3", target: "6", weight: 3 },
  ])

  // Form states
  const [newRouterName, setNewRouterName] = useState("")
  const [sourceRouter, setSourceRouter] = useState("")
  const [targetRouter, setTargetRouter] = useState("")
  const [connectionSource, setConnectionSource] = useState("")
  const [connectionTarget, setConnectionTarget] = useState("")
  const [connectionWeight, setConnectionWeight] = useState(1)
  const [shortestPath, setShortestPath] = useState<string[]>([])
  const [animationProgress, setAnimationProgress] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [activeTab, setActiveTab] = useState("network")
  const animationRef = useRef<number>()

  // Add a new router
  const addRouter = () => {
    if (newRouterName.trim() === "") return

    // Generate a random position in 3D space
    const x = (Math.random() - 0.5) * 10
    const y = (Math.random() - 0.5) * 10
    const z = (Math.random() - 0.5) * 5

    const newRouter: Router = {
      id: (routers.length + 1).toString(),
      name: newRouterName,
      position: [x, y, z],
    }

    setRouters([...routers, newRouter])
    setNewRouterName("")
  }

  // Remove a router
  const removeRouter = (id: string) => {
    setRouters(routers.filter((router) => router.id !== id))
    // Also remove connections involving this router
    setConnections(connections.filter((conn) => conn.source !== id && conn.target !== id))
  }

  // Add a connection
  const addConnection = () => {
    if (!connectionSource || !connectionTarget || connectionSource === connectionTarget) return

    // Check if connection already exists
    const exists = connections.some(
      (conn) =>
        (conn.source === connectionSource && conn.target === connectionTarget) ||
        (conn.source === connectionTarget && conn.target === connectionSource),
    )

    if (exists) return

    const newConnection: Connection = {
      source: connectionSource,
      target: connectionTarget,
      weight: connectionWeight,
    }

    setConnections([...connections, newConnection])
    setConnectionSource("")
    setConnectionTarget("")
    setConnectionWeight(1)
  }

  // Find shortest path
  const findPath = () => {
    if (!sourceRouter || !targetRouter || sourceRouter === targetRouter) return

    const path = findShortestPath(routers, connections, sourceRouter, targetRouter)
    setShortestPath(path)
    setAnimationProgress(0)
  }

  // Animate packet
  const startAnimation = () => {
    if (shortestPath.length < 2) return

    setIsAnimating(true)
    setAnimationProgress(0)
    const startTime = Date.now()
    const duration = 3000 // 3 seconds

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      setAnimationProgress(progress)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
  }

  // Reset the network
  const resetNetwork = () => {
    setRouters([
      { id: "1", name: "Router A", position: [-5, 3, 0] },
      { id: "2", name: "Router B", position: [0, 5, 0] },
      { id: "3", name: "Router C", position: [5, 3, 0] },
      { id: "4", name: "Router D", position: [3, -2, 0] },
      { id: "5", name: "Router E", position: [-3, -2, 0] },
      { id: "6", name: "Router F", position: [0, 0, 3] },
    ])
    setConnections([
      { source: "1", target: "2", weight: 2 },
      { source: "2", target: "3", weight: 1 },
      { source: "3", target: "4", weight: 3 },
      { source: "4", target: "5", weight: 2 },
      { source: "5", target: "1", weight: 4 },
      { source: "1", target: "6", weight: 5 },
      { source: "3", target: "6", weight: 3 },
    ])
    setShortestPath([])
    setAnimationProgress(0)
    setIsAnimating(false)
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <PageLayout
      title="Network Packet Routing Simulator"
      description="Simulate how data packets route through a computer network using relation matrices and digraphs."
      concepts={["Relations", "Zero-One Matrices", "Directed Graphs (Digraphs)"]}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="network">Network Visualization</TabsTrigger>
          <TabsTrigger value="matrix">Adjacency Matrix</TabsTrigger>
          <TabsTrigger value="theory">Mathematical Theory</TabsTrigger>
        </TabsList>

        <TabsContent value="network">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Card className="h-[500px]">
                <CardContent className="p-6 h-full">
                  <NetworkVisualization
                    routers={routers}
                    connections={connections}
                    path={shortestPath}
                    animationProgress={animationProgress}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Packet Routing</h2>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="source">Source Router</Label>
                      <select
                        id="source"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={sourceRouter}
                        onChange={(e) => setSourceRouter(e.target.value)}
                      >
                        <option value="">Select source router</option>
                        {routers.map((router) => (
                          <option key={router.id} value={router.id}>
                            {router.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="target">Target Router</Label>
                      <select
                        id="target"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={targetRouter}
                        onChange={(e) => setTargetRouter(e.target.value)}
                      >
                        <option value="">Select target router</option>
                        {routers.map((router) => (
                          <option key={router.id} value={router.id}>
                            {router.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={findPath} className="flex-1">
                        Find Path
                      </Button>
                      <Button
                        onClick={startAnimation}
                        disabled={shortestPath.length < 2 || isAnimating}
                        className="flex items-center gap-2"
                      >
                        <Play className="h-4 w-4" />
                        Animate
                      </Button>
                    </div>
                  </div>

                  {shortestPath.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">Shortest Path:</h3>
                      <div className="p-2 bg-muted rounded-md">
                        {shortestPath.map((id, index) => {
                          const router = routers.find((r) => r.id === id)
                          return (
                            <span key={id}>
                              {router?.name}
                              {index < shortestPath.length - 1 ? " → " : ""}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Network Management</h2>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="routerName">Add Router</Label>
                      <div className="flex gap-2">
                        <Input
                          id="routerName"
                          placeholder="Router name"
                          value={newRouterName}
                          onChange={(e) => setNewRouterName(e.target.value)}
                        />
                        <Button onClick={addRouter} size="icon">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label>Add Connection</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          value={connectionSource}
                          onChange={(e) => setConnectionSource(e.target.value)}
                        >
                          <option value="">From</option>
                          {routers.map((router) => (
                            <option key={router.id} value={router.id}>
                              {router.name}
                            </option>
                          ))}
                        </select>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          value={connectionTarget}
                          onChange={(e) => setConnectionTarget(e.target.value)}
                        >
                          <option value="">To</option>
                          {routers.map((router) => (
                            <option key={router.id} value={router.id}>
                              {router.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="1"
                          placeholder="Weight"
                          value={connectionWeight}
                          onChange={(e) => setConnectionWeight(Number.parseInt(e.target.value) || 1)}
                        />
                        <Button onClick={addConnection} size="icon">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <Button variant="outline" onClick={resetNetwork} className="w-full flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Reset Network
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="matrix">
          <div className="grid gap-8">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Adjacency Matrix Representation</h2>
                <p className="text-muted-foreground mb-6">
                  The network is represented as a zero-one matrix where each cell [i,j] contains the weight of the
                  connection from router i to router j, or "-" if no direct connection exists.
                </p>
                <MatrixVisualization routers={routers} connections={connections} />
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Router List</h2>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {routers.map((router) => (
                      <div key={router.id} className="flex items-center justify-between p-2 border rounded-md">
                        <span>{router.name}</span>
                        <Button variant="ghost" size="icon" onClick={() => removeRouter(router.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Connection List</h2>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {connections.map((conn, index) => {
                      const source = routers.find((r) => r.id === conn.source)
                      const target = routers.find((r) => r.id === conn.target)
                      return (
                        <div key={index} className="p-2 border rounded-md">
                          <span>
                            {source?.name} → {target?.name} (Weight: {conn.weight})
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="theory">
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Zero-One Matrices</h2>
                <p className="text-muted-foreground mb-4">
                  In discrete mathematics, a zero-one matrix (or binary matrix) is a matrix whose elements are either 0
                  or 1. In our network simulation:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>
                    The adjacency matrix represents the network topology, where each cell [i,j] indicates whether there
                    is a connection from router i to router j
                  </li>
                  <li>
                    For weighted graphs, we extend this concept to store the weight of each connection instead of just 0
                    or 1
                  </li>
                  <li>
                    Matrix operations can be used to find paths of specific lengths (e.g., A² shows paths of length 2)
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Directed Graphs (Digraphs)</h2>
                <p className="text-muted-foreground mb-4">
                  A directed graph or digraph is a set of vertices (routers) connected by directed edges (links):
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Each edge has a direction, indicating the flow of data</li>
                  <li>In our simulation, we use an undirected graph for simplicity, but the concepts apply to both</li>
                  <li>
                    Weighted edges represent the "cost" of transmitting data through that connection (e.g., latency,
                    bandwidth constraints)
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Relations and Path Finding</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Relations</h3>
                  <p className="text-muted-foreground">
                    The network topology can be viewed as a relation R on the set of routers, where (a,b) ∈ R if there
                    is a direct connection from router a to router b. This relation can be represented by the adjacency
                    matrix.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium">Dijkstra's Algorithm</h3>
                  <p className="text-muted-foreground">
                    Our simulation uses Dijkstra's algorithm to find the shortest path between two routers:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground mt-2">
                    <li>Initialize distances from source to all other vertices as infinite</li>
                    <li>Set the distance to the source vertex as 0</li>
                    <li>Create a set of unvisited vertices</li>
                    <li>For each iteration, select the vertex with the minimum distance from the unvisited set</li>
                    <li>Update the distances to all adjacent vertices</li>
                    <li>Repeat until the target vertex is reached or all vertices are visited</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-medium">Transitive Closure</h3>
                  <p className="text-muted-foreground">
                    The transitive closure of a graph represents the reachability between all pairs of vertices. In
                    networking, this helps determine which routers can communicate with each other through the network.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  )
}
