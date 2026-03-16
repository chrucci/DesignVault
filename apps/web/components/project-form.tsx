'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface ProjectFormProps {
  initialData?: {
    id?: string;
    name: string;
    client_name: string;
    status: string;
    notes: string;
  };
  onSave: (data: {
    name: string;
    client_name: string;
    status: string;
    notes: string;
  }) => void | Promise<void>;
  saving?: boolean;
}

export function ProjectForm({ initialData, onSave, saving }: ProjectFormProps) {
  const [name, setName] = React.useState(initialData?.name ?? '');
  const [clientName, setClientName] = React.useState(initialData?.client_name ?? '');
  const [status, setStatus] = React.useState(initialData?.status ?? 'active');
  const [notes, setNotes] = React.useState(initialData?.notes ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ name, client_name: clientName, status, notes });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="project-name">Name</Label>
        <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="project-client">Client</Label>
        <Input
          id="project-client"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="project-status">Status</Label>
        <select
          id="project-status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
        >
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="project-notes">Notes</Label>
        <textarea
          id="project-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
        />
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
}
