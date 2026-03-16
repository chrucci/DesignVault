'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProjectForm } from '@/components/project-form';
import { RoomForm } from '@/components/room-form';
import { RoomProductList } from '@/components/room-product-list';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, ChevronDown, ChevronRight, Plus, FileText } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  client_name: string | null;
  status: string;
  notes: string | null;
}

interface Room {
  id: string;
  name: string;
  sort_order: number;
  room_products: { id: string }[];
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

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = React.useState<Project | null>(null);
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [editing, setEditing] = React.useState(false);
  const [addRoomOpen, setAddRoomOpen] = React.useState(false);
  const [expandedRoom, setExpandedRoom] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const fetchProject = React.useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('projects')
      .select('id, name, client_name, status, notes')
      .eq('id', projectId)
      .single();
    if (data) setProject(data);
  }, [projectId]);

  const fetchRooms = React.useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('rooms')
      .select('id, name, sort_order, room_products(id)')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });
    if (data) setRooms(data as unknown as Room[]);
  }, [projectId]);

  React.useEffect(() => {
    fetchProject();
    fetchRooms();
  }, [fetchProject, fetchRooms]);

  const handleEditSave = async (formData: {
    name: string;
    client_name: string;
    status: string;
    notes: string;
  }) => {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from('projects')
      .update({
        name: formData.name,
        client_name: formData.client_name,
        status: formData.status,
        notes: formData.notes,
      })
      .eq('id', projectId);
    setSaving(false);
    setEditing(false);
    await fetchProject();
  };

  const handleAddRoom = async (data: { name: string }) => {
    setSaving(true);
    const supabase = createClient();
    await supabase.from('rooms').insert({
      project_id: projectId,
      name: data.name,
    });
    setSaving(false);
    setAddRoomOpen(false);
    await fetchRooms();
  };

  if (!project) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  if (editing) {
    return (
      <div className="space-y-6">
        <Link
          href={`/projects/${projectId}`}
          onClick={(e) => {
            e.preventDefault();
            setEditing(false);
          }}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Project
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Edit Project</h1>
        <ProjectForm
          initialData={{
            id: project.id,
            name: project.name,
            client_name: project.client_name ?? '',
            status: project.status,
            notes: project.notes ?? '',
          }}
          onSave={handleEditSave}
          saving={saving}
        />
        <Button variant="outline" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge className={statusBadgeClass(project.status)}>
              {statusLabel(project.status)}
            </Badge>
          </div>
          {project.client_name && (
            <p className="text-muted-foreground mt-1">{project.client_name}</p>
          )}
          {project.notes && <p className="text-sm mt-2">{project.notes}</p>}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setEditing(true)} variant="outline">
            Edit
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/projects/${projectId}/documents`} className="gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </Link>
          </Button>
        </div>
      </div>

      {/* Rooms */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Rooms</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddRoomOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Room
          </Button>
        </div>

        {rooms.length === 0 && (
          <Card className="p-8">
            <div className="flex flex-col items-center text-center">
              <p className="text-muted-foreground">
                No rooms yet. Add a room to start organizing products.
              </p>
            </div>
          </Card>
        )}

        <div className="space-y-3">
          {rooms.map((room) => {
            const isExpanded = expandedRoom === room.id;
            const productCount = room.room_products?.length ?? 0;

            return (
              <Card key={room.id}>
                <CardHeader className="p-0">
                  <button
                    className="w-full text-left px-5 py-4 font-medium hover:bg-accent/50 transition-colors rounded-t-lg flex items-center justify-between"
                    onClick={() => setExpandedRoom(isExpanded ? null : room.id)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span>{room.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {productCount} {productCount === 1 ? 'product' : 'products'}
                    </span>
                  </button>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="px-5 pb-5 pt-0">
                    <RoomProductList roomId={room.id} projectId={projectId} />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={addRoomOpen} onOpenChange={setAddRoomOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Room</DialogTitle>
          </DialogHeader>
          <RoomForm onSave={handleAddRoom} saving={saving} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
