'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProjectForm } from '@/components/project-form';
import { RoomForm } from '@/components/room-form';
import { RoomProductList } from '@/components/room-product-list';
import { createClient } from '@/lib/supabase/client';

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
      .select('id, name, sort_order')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });
    if (data) setRooms(data);
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
    return <div className="p-6">Loading...</div>;
  }

  if (editing) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Edit Project</h1>
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
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold">{project.name}</h1>
        <Badge className={statusBadgeVariant(project.status)}>{statusLabel(project.status)}</Badge>
      </div>

      {project.client_name && <p className="text-muted-foreground">{project.client_name}</p>}

      {project.notes && <p className="text-sm">{project.notes}</p>}

      <div className="flex gap-2">
        <Button onClick={() => setEditing(true)}>Edit</Button>
        <Button variant="outline" onClick={() => setAddRoomOpen(true)}>
          Add Room
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/projects/${projectId}/documents`}>Documents</Link>
        </Button>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Rooms</h2>
        {rooms.length === 0 && <p className="text-muted-foreground text-sm">No rooms yet.</p>}
        {rooms.map((room) => (
          <div key={room.id} className="border rounded-lg">
            <button
              className="w-full text-left px-4 py-3 font-medium hover:bg-accent transition-colors rounded-t-lg"
              onClick={() => setExpandedRoom(expandedRoom === room.id ? null : room.id)}
            >
              {room.name}
            </button>
            {expandedRoom === room.id && (
              <div className="px-4 pb-4">
                <RoomProductList roomId={room.id} projectId={projectId} />
              </div>
            )}
          </div>
        ))}
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
