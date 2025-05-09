import type React from "react"
import { Navbar } from "@/components/navbar"
import { Badge } from "@/components/ui/badge"

interface PageLayoutProps {
  title: string
  description: string
  concepts: string[]
  children: React.ReactNode
}

export function PageLayout({ title, description, concepts, children }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>
              <p className="text-lg text-muted-foreground mb-4">{description}</p>
              <div className="flex flex-wrap gap-2">
                {concepts.map((concept) => (
                  <Badge key={concept} variant="outline">
                    {concept}
                  </Badge>
                ))}
              </div>
            </div>
            {children}
          </div>
        </div>
      </main>
      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          Discrete Mathematics Applications Showcase &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  )
}
