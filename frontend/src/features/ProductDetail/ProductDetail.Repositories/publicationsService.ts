import type { Publication } from '../types/publication';
import { mockPublications } from '../mocks/fixtures/publications';

// Flag para alternar mocks ↔ API real
const USE_MOCKS = (import.meta as any)?.env?.VITE_USE_MOCKS !== 'false';

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function getPublicationById(id: string): Promise<Publication> {
  if (!id) throw new Error('publication id is required');

  if (USE_MOCKS) {
    // Simula red de 300ms y devuelve fixture
    await delay(300);
    const pub = mockPublications[id];
    if (!pub) throw new Error(`Mock publication ${id} not found`);
    return pub;
  }

  const res = await fetch(`/api/publications/${id}`);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch publication ${id}: ${res.status} ${text}`);
  }
  return res.json();
}