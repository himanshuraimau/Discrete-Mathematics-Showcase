"use client"

import { useState } from "react"
import { PageLayout } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Text, Html } from "@react-three/drei"
import { Check, Plus, Trash2, X } from "lucide-react"
import type * as THREE from "three"
import { useRef } from "react"

// Define permission types
type Permission = "read" | "write" | "delete" | "admin"

// Define role types with their permissions
type Role = {
  name: string
  permissions: Permission[]
  color: string
}

// Define user type
type User = {
  id: string
  name: string
  role: string
}

// Animated bubble component for users
function UserBubble({
  position,
  userName,
  color,
  size = 0.5,
}: {
  position: [number, number, number]
  userName: string
  color: string
  size?: number
}) {
  const bubbleRef = useRef<THREE.Group>(null)
  const initialY = position[1]

  // Floating animation
  useFrame(({ clock }) => {
    if (bubbleRef.current) {
      bubbleRef.current.position.y = initialY + Math.sin(clock.getElapsedTime() * 1.5) * 0.2
      bubbleRef.current.rotation.y = clock.getElapsedTime() * 0.5
    }
  })

  return (
    <group ref={bubbleRef} position={position}>
      {/* User bubble */}
      <mesh castShadow>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.7} emissive={color} emissiveIntensity={0.2} />
      </mesh>

      {/* Glow effect */}
      <mesh>
        <sphereGeometry args={[size * 1.2, 32, 32]} />
        <meshStandardMaterial color={color} transparent opacity={0.15} emissive={color} emissiveIntensity={0.1} />
      </mesh>

      {/* User name label */}
      <Html position={[0, -size * 1.6, 0]} center>
        <div className="bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md text-sm font-medium">{userName}</div>
      </Html>
    </group>
  )
}

// Permission set visualization component
function PermissionSet({
  position,
  role,
  scale = 1,
}: {
  position: [number, number, number]
  role: Role
  scale?: number
}) {
  const groupRef = useRef<THREE.Group>(null)

  // Slow rotation animation
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.2
    }
  })

  // Calculate size based on number of permissions
  const size = 1 + role.permissions.length * 0.3

  return (
    <group position={position}>
      {/* Role name */}
      <Text position={[0, size * 1.2, 0]} fontSize={0.7 * scale} color="white" anchorX="center" anchorY="middle">
        {role.name}
      </Text>

      {/* Permission set visualization */}
      <group ref={groupRef}>
        {/* Base sphere for the role */}
        <mesh castShadow>
          <sphereGeometry args={[size * scale, 32, 32]} />
          <meshStandardMaterial
            color={role.color}
            transparent
            opacity={0.3}
            emissive={role.color}
            emissiveIntensity={0.2}
          />
        </mesh>

        {/* Permission spheres */}
        {role.permissions.map((perm, index) => {
          // Position permissions in a circle around the role
          const angle = (index / role.permissions.length) * Math.PI * 2
          const radius = size * 0.6 * scale
          const x = Math.sin(angle) * radius
          const z = Math.cos(angle) * radius

          let permColor = "#64748b"
          if (perm === "read") permColor = "#10b981"
          if (perm === "write") permColor = "#3b82f6"
          if (perm === "delete") permColor = "#ef4444"
          if (perm === "admin") permColor = "#f59e0b"

          return (
            <group key={perm} position={[x, 0, z]}>
              <mesh castShadow>
                <sphereGeometry args={[0.4 * scale, 16, 16]} />
                <meshStandardMaterial
                  color={permColor}
                  metalness={0.6}
                  roughness={0.3}
                  emissive={permColor}
                  emissiveIntensity={0.3}
                />
              </mesh>

              <Text
                position={[0, 0.6 * scale, 0]}
                fontSize={0.3 * scale}
                color="white"
                anchorX="center"
                anchorY="middle"
              >
                {perm}
              </Text>
            </group>
          )
        })}
      </group>
    </group>
  )
}

// 3D Visualization component
function RBACVisualization({ roles, users }: { roles: Role[]; users: User[] }) {
  // Group users by role
  const usersByRole = roles.map((role) => ({
    role,
    users: users.filter((user) => user.role === role.name),
  }))

  return (
    <Canvas shadows camera={{ position: [0, 10, 20], fov: 50 }}>
      <color attach="background" args={["#030712"]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.6} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.5} castShadow />

      {/* Grid helper */}
      <gridHelper args={[30, 30, "#1f2937", "#1f2937"]} position={[0, -2, 0]} />

      {/* System center */}
      <group position={[0, 0, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[1.5, 32, 32]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
        </mesh>

        <Text position={[0, 2, 0]} fontSize={0.8} color="white">
          System
        </Text>

        {/* Connection lines to roles */}
        {usersByRole.map((group, index) => {
          const angle = ((2 * Math.PI) / usersByRole.length) * index
          const radius = 8
          const x = Math.sin(angle) * radius
          const z = Math.cos(angle) * radius

          return (
            <mesh key={`line-${group.role.name}`}>
              <cylinderGeometry args={[0.05, 0.05, Math.sqrt(x * x + z * z), 8]} />
              <meshStandardMaterial
                color={group.role.color}
                transparent
                opacity={0.5}
                emissive={group.role.color}
                emissiveIntensity={0.2}
              />
              <group position={[x / 2, 0, z / 2]} rotation={[Math.PI / 2, Math.atan2(x, z), 0]} />
            </mesh>
          )
        })}
      </group>

      {/* Role groups with users */}
      {usersByRole.map((group, groupIndex) => {
        const angle = ((2 * Math.PI) / usersByRole.length) * groupIndex
        const radius = 8
        const groupX = Math.sin(angle) * radius
        const groupZ = Math.cos(angle) * radius

        return (
          <group key={group.role.name} position={[groupX, 0, groupZ]}>
            {/* Role permission set */}
            <PermissionSet position={[0, 0, 0]} role={group.role} />

            {/* Users in this role */}
            {group.users.map((user, userIndex) => {
              const userAngle = ((2 * Math.PI) / Math.max(group.users.length, 1)) * userIndex
              const userRadius = 3
              const userX = Math.sin(userAngle) * userRadius
              const userZ = Math.cos(userAngle) * userRadius

              return (
                <UserBubble key={user.id} position={[userX, 0, userZ]} userName={user.name} color={group.role.color} />
              )
            })}
          </group>
        )
      })}

      <OrbitControls enableDamping dampingFactor={0.05} rotateSpeed={0.5} minDistance={5} maxDistance={30} />
    </Canvas>
  )
}

export default function RBACPage() {
  // Define initial roles
  const [roles, setRoles] = useState<Role[]>([
    { name: "Admin", permissions: ["read", "write", "delete", "admin"], color: "#7c3aed" },
    { name: "Editor", permissions: ["read", "write"], color: "#2563eb" },
    { name: "Viewer", permissions: ["read"], color: "#10b981" },
  ])

  // Define initial users
  const [users, setUsers] = useState<User[]>([
    { id: "1", name: "Alice", role: "Admin" },
    { id: "2", name: "Bob", role: "Editor" },
    { id: "3", name: "Charlie", role: "Viewer" },
    { id: "4", name: "Diana", role: "Editor" },
    { id: "5", name: "Evan", role: "Viewer" },
  ])

  // Form states
  const [newUserName, setNewUserName] = useState("")
  const [newUserRole, setNewUserRole] = useState("Viewer")
  const [resourceToCheck, setResourceToCheck] = useState("documents")
  const [actionToCheck, setActionToCheck] = useState<Permission>("read")
  const [userToCheck, setUserToCheck] = useState(users[0]?.id || "")
  const [checkResult, setCheckResult] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState("users")

  // Add a new user
  const addUser = () => {
    if (newUserName.trim() === "") return

    const newUser: User = {
      id: Date.now().toString(),
      name: newUserName,
      role: newUserRole,
    }

    setUsers([...users, newUser])
    setNewUserName("")
  }

  // Remove a user
  const removeUser = (id: string) => {
    setUsers(users.filter((user) => user.id !== id))
  }

  // Check if a user has permission
  const checkPermission = () => {
    const user = users.find((u) => u.id === userToCheck)
    if (!user) {
      setCheckResult(false)
      return
    }

    const role = roles.find((r) => r.name === user.role)
    if (!role) {
      setCheckResult(false)
      return
    }

    setCheckResult(role.permissions.includes(actionToCheck))
  }

  return (
    <PageLayout
      title="RBAC Permission System"
      description="Explore role-based access control through equivalence relations and set partitioning."
      concepts={["Equivalence Relations", "Partitions", "Sets and Subsets"]}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permission Checker</TabsTrigger>
          <TabsTrigger value="visualization">Visualization</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Roles & Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {roles.map((role) => (
                    <div key={role.name} className="p-4 border rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }}></div>
                        <h3 className="font-medium">{role.name}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {role.permissions.map((perm) => (
                          <Badge key={perm} variant="outline">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

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
                    <div className="grid gap-2">
                      <Label htmlFor="role">Role</Label>
                      <select
                        id="role"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value)}
                      >
                        {roles.map((role) => (
                          <option key={role.name} value={role.name}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={addUser} className="w-full flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add User
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User List</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {users.map((user) => {
                      const role = roles.find((r) => r.name === user.role)
                      return (
                        <div key={user.id} className="flex items-center justify-between p-2 border rounded-md">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: role?.color }}></div>
                            <span>{user.name}</span>
                            <Badge variant="outline">{user.role}</Badge>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeUser(user.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="permissions">
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Permission Checker</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="user">User</Label>
                    <select
                      id="user"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={userToCheck}
                      onChange={(e) => setUserToCheck(e.target.value)}
                    >
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="resource">Resource</Label>
                    <Input
                      id="resource"
                      placeholder="Resource name"
                      value={resourceToCheck}
                      onChange={(e) => setResourceToCheck(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="action">Action</Label>
                    <select
                      id="action"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={actionToCheck}
                      onChange={(e) => setActionToCheck(e.target.value as Permission)}
                    >
                      <option value="read">Read</option>
                      <option value="write">Write</option>
                      <option value="delete">Delete</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={checkPermission} className="w-full">
                  Check Permission
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Result</CardTitle>
              </CardHeader>
              <CardContent>
                {checkResult === null ? (
                  <div className="text-center p-8 text-muted-foreground">
                    Click "Check Permission" to see the result
                  </div>
                ) : (
                  <div className="text-center p-8">
                    {checkResult ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-medium">Access Granted</h3>
                        <p className="text-muted-foreground">
                          User has permission to {actionToCheck} {resourceToCheck}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                          <X className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="text-xl font-medium">Access Denied</h3>
                        <p className="text-muted-foreground">
                          User does not have permission to {actionToCheck} {resourceToCheck}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Permission Matrix</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 text-left">Role</th>
                      <th className="border p-2 text-center">Read</th>
                      <th className="border p-2 text-center">Write</th>
                      <th className="border p-2 text-center">Delete</th>
                      <th className="border p-2 text-center">Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((role) => (
                      <tr key={role.name}>
                        <td className="border p-2 font-medium">{role.name}</td>
                        <td className="border p-2 text-center">
                          {role.permissions.includes("read") ? (
                            <Check className="h-4 w-4 mx-auto text-green-600" />
                          ) : (
                            <X className="h-4 w-4 mx-auto text-red-600" />
                          )}
                        </td>
                        <td className="border p-2 text-center">
                          {role.permissions.includes("write") ? (
                            <Check className="h-4 w-4 mx-auto text-green-600" />
                          ) : (
                            <X className="h-4 w-4 mx-auto text-red-600" />
                          )}
                        </td>
                        <td className="border p-2 text-center">
                          {role.permissions.includes("delete") ? (
                            <Check className="h-4 w-4 mx-auto text-green-600" />
                          ) : (
                            <X className="h-4 w-4 mx-auto text-red-600" />
                          )}
                        </td>
                        <td className="border p-2 text-center">
                          {role.permissions.includes("admin") ? (
                            <Check className="h-4 w-4 mx-auto text-green-600" />
                          ) : (
                            <X className="h-4 w-4 mx-auto text-red-600" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visualization">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">3D Visualization</h2>
              <div className="h-[500px]">
                <RBACVisualization roles={roles} users={users} />
              </div>
            </CardContent>
          </Card>

          <Card className="mt-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">How It Works</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Equivalence Relations</h3>
                  <p className="text-muted-foreground">
                    RBAC uses an equivalence relation to group users. Two users are equivalent if they have the same
                    role, which satisfies the reflexive, symmetric, and transitive properties of equivalence relations.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium">Partitions</h3>
                  <p className="text-muted-foreground">
                    The set of all users is partitioned into disjoint subsets based on roles. Each user belongs to
                    exactly one role, and each role contains a set of users. This forms a mathematical partition of the
                    user set.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium">Sets and Subsets</h3>
                  <p className="text-muted-foreground">
                    Each role has a set of permissions. The permission sets form a hierarchy, where higher roles
                    typically have supersets of the permissions of lower roles. This hierarchical structure can be
                    represented as a partial ordering of sets.
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
