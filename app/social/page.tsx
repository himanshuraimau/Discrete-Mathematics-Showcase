"use client"

import { useState, useEffect, useRef } from "react"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Html } from "@react-three/drei"
import { Plus, RefreshCw, UserPlus } from "lucide-react"
import * as THREE from "three"

// Define user type
type User = {
  id: string
  name: string
  friends: string[]
}

// User node component
function UserNode({
  position,
  name,
  isHighlighted = false,
  isRecommended = false,
}: {
  position: [number, number, number]
  name: string
  isHighlighted?: boolean
  isRecommended?: boolean
}) {
  const nodeRef = useRef<THREE.Group>(null)
  const initialPosition = useRef(position)

  // Floating animation
  useFrame(({ clock }) => {
    if (nodeRef.current) {
      // Add subtle floating motion
      nodeRef.current.position.y =
        initialPosition.current[1] + Math.sin(clock.getElapsedTime() + Number.parseInt(name, 36)) * 0.2

      // Add pulse effect if highlighted or recommended
      if (isHighlighted || isRecommended) {
        const scale = 1 + 0.1 * Math.sin(clock.getElapsedTime() * 3)
        nodeRef.current.scale.set(scale, scale, scale)
      }
    }
  })

  // Determine color based on state
  let color = "#64748b"
  if (isHighlighted) color = "#7c3aed"
  else if (isRecommended) color = "#10b981"

  return (
    <group ref={nodeRef} position={position}>
      {/* User sphere */}
      <mesh castShadow>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} emissive={color} emissiveIntensity={0.3} />
      </mesh>

      {/* Glow effect */}
      {(isHighlighted || isRecommended) && (
        <mesh>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color={color} transparent opacity={0.2} emissive={color} emissiveIntensity={0.3} />
        </mesh>
      )}

      {/* User name label */}
      <Html position={[0, -1.2, 0]} center>
        <div className="bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md text-sm font-medium">{name}</div>
      </Html>
    </group>
  )
}

// Connection line component
function ConnectionLine({
  start,
  end,
  isHighlighted = false,
  isRecommendation = false,
}: {
  start: [number, number, number]
  end: [number, number, number]
  isHighlighted?: boolean
  isRecommendation?: boolean
}) {
  const lineRef = useRef<THREE.Group>(null)

  // Animate highlighted connections
  useFrame(({ clock }) => {
    if (lineRef.current && (isHighlighted || isRecommendation)) {
      // Pulse effect for highlighted connections
      const material = lineRef.current.children[0].material as THREE.MeshStandardMaterial
      if (material) {
        material.opacity = 0.5 + 0.3 * Math.sin(clock.getElapsedTime() * 3)
        material.emissiveIntensity = 0.3 + 0.2 * Math.sin(clock.getElapsedTime() * 3)
      }
    }
  })

  // Determine color based on state
  let color = "#64748b"
  if (isHighlighted) color = "#7c3aed"
  else if (isRecommendation) color = "#10b981"

  // Calculate direction and length
  const direction = new THREE.Vector3().subVectors(new THREE.Vector3(...end), new THREE.Vector3(...start))
  const length = direction.length()

  // Calculate midpoint
  const midpoint: [number, number, number] = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2, (start[2] + end[2]) / 2]

  // Calculate rotation to point cylinder in the right direction
  const arrow = new THREE.ArrowHelper(direction.clone().normalize(), new THREE.Vector3(...start))
  const rotation = arrow.rotation.clone()

  return (
    <group ref={lineRef}>
      {/* Connection line */}
      <mesh position={midpoint} rotation={rotation} castShadow>
        <cylinderGeometry args={[0.08, 0.08, length, 8]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={isHighlighted || isRecommendation ? 0.8 : 0.3}
          emissive={color}
          emissiveIntensity={isHighlighted || isRecommendation ? 0.5 : 0.1}
        />
      </mesh>

      {/* Glow effect for highlighted connections */}
      {(isHighlighted || isRecommendation) && (
        <mesh position={midpoint} rotation={rotation}>
          <cylinderGeometry args={[0.12, 0.12, length, 8]} />
          <meshStandardMaterial color={color} transparent opacity={0.2} emissive={color} emissiveIntensity={0.3} />
        </mesh>
      )}
    </group>
  )
}

// 3D Visualization component
function SocialGraphVisualization({
  users,
  highlightUser = null,
  recommendations = [],
}: {
  users: User[]
  highlightUser?: string | null
  recommendations?: string[]
}) {
  // Create positions for users in a 3D space
  const positions: Record<string, [number, number, number]> = {}

  // Assign positions in a spherical layout
  users.forEach((user, index) => {
    const phi = Math.acos(-1 + (2 * index) / users.length)
    const theta = Math.sqrt(users.length * Math.PI) * phi

    const x = 5 * Math.cos(theta) * Math.sin(phi)
    const y = 5 * Math.sin(theta) * Math.sin(phi)
    const z = 5 * Math.cos(phi)

    positions[user.id] = [x, y, z]
  })

  return (
    <Canvas shadows camera={{ position: [0, 5, 15], fov: 50 }}>
      <color attach="background" args={["#030712"]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.6} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.5} castShadow />

      {/* Draw edges (friendships) */}
      {users.map((user) =>
        user.friends.map((friendId) => {
          if (positions[user.id] && positions[friendId]) {
            const isHighlighted = highlightUser === user.id || highlightUser === friendId

            const isRecommendation =
              (highlightUser === user.id && recommendations.includes(friendId)) ||
              (highlightUser === friendId && recommendations.includes(user.id))

            return (
              <ConnectionLine
                key={`${user.id}-${friendId}`}
                start={positions[user.id]}
                end={positions[friendId]}
                isHighlighted={isHighlighted}
                isRecommendation={isRecommendation}
              />
            )
          }
          return null
        }),
      )}

      {/* Draw potential recommendation connections */}
      {highlightUser &&
        recommendations.map((recId) => {
          if (positions[highlightUser] && positions[recId]) {
            return (
              <ConnectionLine
                key={`rec-${highlightUser}-${recId}`}
                start={positions[highlightUser]}
                end={positions[recId]}
                isRecommendation={true}
              />
            )
          }
          return null
        })}

      {/* Draw nodes (users) */}
      {users.map((user) => {
        const pos = positions[user.id]
        if (!pos) return null

        const isHighlighted = highlightUser === user.id
        const isRecommended = highlightUser && recommendations.includes(user.id)

        return (
          <UserNode
            key={user.id}
            position={pos}
            name={user.name}
            isHighlighted={isHighlighted}
            isRecommended={isRecommended}
          />
        )
      })}

      <OrbitControls enableDamping dampingFactor={0.05} rotateSpeed={0.5} minDistance={5} maxDistance={30} />
    </Canvas>
  )
}

// Function to compute transitive closure
function computeTransitiveClosure(users: User[]): Map<string, Set<string>> {
  // Initialize the reachability map
  const reachable = new Map<string, Set<string>>()

  // Initialize with direct friendships
  users.forEach((user) => {
    const set = new Set<string>()
    user.friends.forEach((friendId) => set.add(friendId))
    reachable.set(user.id, set)
  })

  // Floyd-Warshall algorithm for transitive closure
  users.forEach((k) => {
    users.forEach((i) => {
      users.forEach((j) => {
        const iSet = reachable.get(i.id)
        if (iSet && iSet.has(k.id)) {
          const kSet = reachable.get(k.id)
          if (kSet && kSet.has(j.id)) {
            iSet.add(j.id)
          }
        }
      })
    })
  })

  return reachable
}

// Function to get friend recommendations
function getFriendRecommendations(userId: string, users: User[]): string[] {
  const user = users.find((u) => u.id === userId)
  if (!user) return []

  // Get friends of friends
  const friendsOfFriends = new Set<string>()
  user.friends.forEach((friendId) => {
    const friend = users.find((u) => u.id === friendId)
    if (friend) {
      friend.friends.forEach((fofId) => {
        // Don't recommend the user themselves or their direct friends
        if (fofId !== userId && !user.friends.includes(fofId)) {
          friendsOfFriends.add(fofId)
        }
      })
    }
  })

  return Array.from(friendsOfFriends)
}

export default function SocialPage() {
  // Initial users with friendships
  const [users, setUsers] = useState<User[]>([
    { id: "1", name: "Alice", friends: ["2", "3"] },
    { id: "2", name: "Bob", friends: ["1", "4"] },
    { id: "3", name: "Charlie", friends: ["1", "5"] },
    { id: "4", name: "Diana", friends: ["2", "6"] },
    { id: "5", name: "Evan", friends: ["3"] },
    { id: "6", name: "Fiona", friends: ["4"] },
    { id: "7", name: "George", friends: ["8"] },
    { id: "8", name: "Hannah", friends: ["7"] },
  ])

  // Form states
  const [newUserName, setNewUserName] = useState("")
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [newFriendId, setNewFriendId] = useState("")
  const [activeTab, setActiveTab] = useState("graph")

  // Add a new user
  const addUser = () => {
    if (newUserName.trim() === "") return

    const newUser: User = {
      id: (users.length + 1).toString(),
      name: newUserName,
      friends: [],
    }

    setUsers([...users, newUser])
    setNewUserName("")
  }

  // Add a friendship
  const addFriendship = () => {
    if (!selectedUser || !newFriendId || selectedUser === newFriendId) return

    setUsers(
      users.map((user) => {
        if (user.id === selectedUser && !user.friends.includes(newFriendId)) {
          return {
            ...user,
            friends: [...user.friends, newFriendId],
          }
        }
        if (user.id === newFriendId && !user.friends.includes(selectedUser)) {
          return {
            ...user,
            friends: [...user.friends, selectedUser],
          }
        }
        return user
      }),
    )

    setNewFriendId("")
  }

  // Get friend recommendations
  const getRecommendations = () => {
    if (!selectedUser) return

    const recs = getFriendRecommendations(selectedUser, users)
    setRecommendations(recs)
  }

  // Reset the graph to initial state
  const resetGraph = () => {
    setUsers([
      { id: "1", name: "Alice", friends: ["2", "3"] },
      { id: "2", name: "Bob", friends: ["1", "4"] },
      { id: "3", name: "Charlie", friends: ["1", "5"] },
      { id: "4", name: "Diana", friends: ["2", "6"] },
      { id: "5", name: "Evan", friends: ["3"] },
      { id: "6", name: "Fiona", friends: ["4"] },
      { id: "7", name: "George", friends: ["8"] },
      { id: "8", name: "Hannah", friends: ["7"] },
    ])
    setSelectedUser(null)
    setRecommendations([])
  }

  // Update recommendations when selected user changes
  useEffect(() => {
    if (selectedUser) {
      getRecommendations()
    } else {
      setRecommendations([])
    }
  }, [selectedUser, users])

  return (
    <PageLayout
      title="Friend Recommendation Engine"
      description="Suggest friends based on mutual connections using graph reachability and transitive closure."
      concepts={["Directed Graphs", "Transitive Closure", "Equivalence Relations"]}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="graph">Social Graph</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="theory">Mathematical Theory</TabsTrigger>
        </TabsList>

        <TabsContent value="graph">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Card className="h-[500px]">
                <CardContent className="p-6 h-full">
                  <SocialGraphVisualization
                    users={users}
                    highlightUser={selectedUser}
                    recommendations={recommendations}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add New User</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        placeholder="Enter user name"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                      />
                    </div>
                    <Button onClick={addUser} className="w-full flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add User
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Add Friendship</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="user1">Select User</Label>
                      <select
                        id="user1"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={selectedUser || ""}
                        onChange={(e) => setSelectedUser(e.target.value)}
                      >
                        <option value="">Select a user</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="user2">Add Friend</Label>
                      <select
                        id="user2"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={newFriendId}
                        onChange={(e) => setNewFriendId(e.target.value)}
                        disabled={!selectedUser}
                      >
                        <option value="">Select a friend</option>
                        {users
                          .filter(
                            (user) =>
                              user.id !== selectedUser &&
                              !users.find((u) => u.id === selectedUser)?.friends.includes(user.id),
                          )
                          .map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <Button
                      onClick={addFriendship}
                      className="w-full flex items-center gap-2"
                      disabled={!selectedUser || !newFriendId}
                    >
                      <UserPlus className="h-4 w-4" />
                      Add Friendship
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Button variant="outline" onClick={resetGraph} className="w-full flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Reset Graph
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recommendations">
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Friend Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="userSelect">Select User</Label>
                    <select
                      id="userSelect"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={selectedUser || ""}
                      onChange={(e) => setSelectedUser(e.target.value)}
                    >
                      <option value="">Select a user</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button onClick={getRecommendations} className="w-full" disabled={!selectedUser}>
                    Get Recommendations
                  </Button>
                </div>

                <div className="mt-6">
                  <h3 className="font-medium mb-2">Current Friends</h3>
                  {selectedUser ? (
                    <div className="space-y-2">
                      {users
                        .find((u) => u.id === selectedUser)
                        ?.friends.map((friendId) => {
                          const friend = users.find((u) => u.id === friendId)
                          return (
                            <div key={friendId} className="p-2 border rounded-md">
                              {friend?.name}
                            </div>
                          )
                        })}
                      {users.find((u) => u.id === selectedUser)?.friends.length === 0 && (
                        <p className="text-muted-foreground">No friends yet</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Select a user to see their friends</p>
                  )}
                </div>

                <div className="mt-6">
                  <h3 className="font-medium mb-2">Recommended Friends</h3>
                  {selectedUser ? (
                    <div className="space-y-2">
                      {recommendations.map((recId) => {
                        const rec = users.find((u) => u.id === recId)
                        return (
                          <div key={recId} className="p-2 border rounded-md flex justify-between items-center">
                            <span>{rec?.name}</span>
                            <Button
                              size="sm"
                              onClick={() => {
                                setNewFriendId(recId)
                                addFriendship()
                              }}
                            >
                              Add Friend
                            </Button>
                          </div>
                        )
                      })}
                      {recommendations.length === 0 && (
                        <p className="text-muted-foreground">No recommendations available</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Select a user to see recommendations</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Visualization</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <SocialGraphVisualization
                  users={users}
                  highlightUser={selectedUser}
                  recommendations={recommendations}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="theory">
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Directed Graphs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">A social network can be modeled as a directed graph where:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Vertices (nodes) represent users</li>
                  <li>Edges represent friendships between users</li>
                  <li>
                    In this application, we use an undirected graph since friendships are mutual, but the underlying
                    algorithms work with directed graphs as well
                  </li>
                </ul>

                <div className="mt-6">
                  <h3 className="font-medium mb-2">Adjacency Representation</h3>
                  <p className="text-muted-foreground mb-2">
                    The graph is represented using adjacency lists, where each user has a list of friends:
                  </p>
                  <pre className="p-4 bg-muted rounded-md overflow-x-auto">
                    {users.map(
                      (user) =>
                        `${user.name}: [${user.friends.map((id) => users.find((u) => u.id === id)?.name).join(", ")}]\n`,
                    )}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transitive Closure</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Transitive closure of a graph adds an edge from vertex u to v if there is a path from u to v. In the
                  context of social networks:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>It represents all possible connections in the network</li>
                  <li>It helps identify potential friend recommendations</li>
                  <li>It can be computed using algorithms like Floyd-Warshall</li>
                </ul>

                <div className="mt-6">
                  <h3 className="font-medium mb-2">Friend Recommendation Algorithm</h3>
                  <p className="text-muted-foreground mb-2">The recommendation algorithm works as follows:</p>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Find all friends of the selected user (direct connections)</li>
                    <li>For each friend, find their friends (2nd-degree connections)</li>
                    <li>Filter out the original user and their direct friends</li>
                    <li>The remaining users are potential friend recommendations</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Equivalence Relations in Social Networks</h2>
              <p className="text-muted-foreground mb-4">
                In social network analysis, we can define various equivalence relations:
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Connectivity Equivalence</h3>
                  <p className="text-muted-foreground">
                    Two users are equivalent if they can reach the same set of other users through the network. This
                    forms an equivalence relation that partitions users into equivalence classes based on their
                    reachability patterns.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium">Friend Circle Equivalence</h3>
                  <p className="text-muted-foreground">
                    Two users are equivalent if they have exactly the same set of friends. This strict equivalence
                    relation identifies users with identical social connections.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium">Distance-k Equivalence</h3>
                  <p className="text-muted-foreground">
                    Two users are equivalent if they are at the same distance (number of edges) from a reference user.
                    This creates "layers" of users at different degrees of separation.
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
