'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProjectForm } from '@/components/project-form';
import { createClient } from '@/lib/supabase/client';

interface Project {
  id: string;
  name: string;
  client_name: string | null;
  status: string;
  created_at: string;
}

function statusBadgeVariant(status: string) {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    case 'archived':
      return 'bg-gray-100 text-gray-800';
    default:
      return '';
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'active':
      return 'Active';
    case 'completed':
      return 'Completed';
    case 'archived':
      return 'Archived';
    default:
      return status;
  }
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const fetchProjects = React.useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('projects')
      .select('id, name, client_name, status, created_at')
      .order('created_at', { ascending: false });
    if (data) setProjects(data);
  }, []);

  React.useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async (formData: {
    name: string;
    client_name: string;
    status: string;
    notes: string;
  }) => {
    setSaving(true);
    const supabase = createClient();
    await supabase.from('projects').insert({
      name: formData.name,
      client_name: formData.client_name,
      status: formData.status,
      notes: formData.notes,
    });
    setSaving(false);
    setCreateOpen(false);
    await fetchProjects();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Button onClick={() => setCreateOpen(true)}>New Project</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card
            key={project.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(`/projects/${project.id}`)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <Badge className={statusBadgeVariant(project.status)}>
                  {statusLabel(project.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {project.client_name && (
                <p className="text-sm text-muted-foreground">{project.client_name}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {projects.length === 0 && (
        <p className="text-muted-foreground">No projects yet. Create one to get started.</p>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
          </DialogHeader>
          <ProjectForm onSave={handleCreate} saving={saving} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
