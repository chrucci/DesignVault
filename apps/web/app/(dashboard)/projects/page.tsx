'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProjectForm } from '@/components/project-form';
import { createClient } from '@/lib/supabase/client';
import { FolderOpen, Plus, Calendar } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  client_name: string | null;
  status: string;
  created_at: string;
  rooms: { id: string }[];
  room_products: number;
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'completed':
      return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'archived':
      return 'bg-stone-100 text-stone-600 border-stone-200';
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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
      .select('id, name, client_name, status, created_at, rooms(id)')
      .order('created_at', { ascending: false });
    if (data) setProjects(data as unknown as Project[]);
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage your client projects and rooms</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-5 mb-4">
            <FolderOpen className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-lg mb-1">No projects yet</h3>
          <p className="text-muted-foreground max-w-sm">
            Create your first project to start organizing products into rooms for your clients.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <Badge className={statusBadgeClass(project.status)}>
                    {statusLabel(project.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {project.client_name && (
                  <p className="text-sm font-medium text-foreground">{project.client_name}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span>
                    {project.rooms?.length ?? 0}{' '}
                    {(project.rooms?.length ?? 0) === 1 ? 'room' : 'rooms'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(project.created_at)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
