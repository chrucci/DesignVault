import { getToken, getApiBaseUrl } from './auth';
import type { ClipProductFormValues } from '@design-vault/shared';

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getToken();
  const baseUrl = await getApiBaseUrl();

  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

export async function clipProduct(data: ClipProductFormValues): Promise<{ id: string }> {
  const response = await authFetch('/api/extension/clip', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export interface Project {
  id: string;
  name: string;
  client_name: string | null;
}

export interface Room {
  id: string;
  name: string;
  project_id: string;
}

export async function getProjects(): Promise<Project[]> {
  const response = await authFetch('/api/projects');

  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }

  return response.json();
}

export async function getRooms(projectId: string): Promise<Room[]> {
  const response = await authFetch(`/api/projects/${projectId}/rooms`);

  if (!response.ok) {
    throw new Error('Failed to fetch rooms');
  }

  return response.json();
}
