"use client"

import * as React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

interface Project {
  id: string
  name: string
  client_name: string | null
  status: string
}

export default function DashboardPage() {
  const [projects, setProjects] = React.useState<Project[]>([])

  React.useEffect(() => {
    const supabase = createClient()
    supabase
      .from("projects")
      .select("id, name, client_name, status")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setProjects(data)
      })
  }, [])

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Welcome to Design Vault</h1>

      <section>
        <h2 className="text-xl font-semibold mb-4">Active Projects</h2>
        {projects.length === 0 ? (
          <p className="text-muted-foreground">No active projects yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {project.client_name && (
                    <p className="text-sm text-muted-foreground">
                      {project.client_name}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
