'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface RoomFormProps {
  onSave: (data: { name: string }) => void | Promise<void>;
  saving?: boolean;
}

export function RoomForm({ onSave, saving }: RoomFormProps) {
  const [name, setName] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ name });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="room-name">Room Name</Label>
        <Input id="room-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
}
