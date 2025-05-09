import { Navbar } from "@/components/navbar"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowRight, Database, FileCode, Network, Shield, Share2 } from "lucide-react"

export default function Home() {
  const applications = [
    {
      title: "Network Packet Routing Simulator",
      description: "Simulate how data packets route through a computer network using relation matrices and digraphs.",
      concepts: ["Relations", "Zero-One Matrices", "Directed Graphs"],
      icon: <Share2 className="h-8 w-8" />,
      path: "/network",
    },
    {
      title: "Cryptographic Key Exchange",
      description: "Visualize secure key agreement over a public channel using group theory and modular arithmetic.",
      concepts: ["Cyclic Groups", "Modular Arithmetic", "Abelian Groups"],
      icon: <Shield className="h-8 w-8" />,
      path: "/crypto",
    },
    {
      title: "RBAC Permission System",
      description: "Explore role-based access control through equivalence relations and set partitioning.",
      concepts: ["Equivalence Relations", "Partitions", "Sets and Subsets"],
      icon: <Database className="h-8 w-8" />,
      path: "/rbac",
    },
    {
      title: "Friend Recommendation Engine",
      description: "Suggest friends based on mutual connections using graph theory and transitive closure.",
      concepts: ["Directed Graphs", "Transitive Closure", "Equivalence Relations"],
      icon: <Network className="h-8 w-8" />,
      path: "/social",
    },
    {
      title: "Instruction Dependency Visualizer",
      description: "Visualize task dependencies as partially ordered sets with Hasse diagrams.",
      concepts: ["Partial Order Relations", "Posets", "Hasse Diagrams"],
      icon: <FileCode className="h-8 w-8" />,
      path: "/compiler",
    },
  ]

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">Discrete Mathematics Applications</h1>
            <p className="text-xl text-muted-foreground">
              Interactive demonstrations of discrete math concepts in real-world applications
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {applications.map((app) => (
              <Link href={app.path} key={app.path} className="block group">
                <Card className="h-full transition-all hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-md bg-primary/10 text-primary">{app.icon}</div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <CardTitle className="mt-4">{app.title}</CardTitle>
                    <CardDescription>{app.description}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <div className="flex flex-wrap gap-2">
                      {app.concepts.map((concept) => (
                        <Badge key={concept} variant="secondary">
                          {concept}
                        </Badge>
                      ))}
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          Discrete Mathematics Applications Showcase &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </main>
  )
}
