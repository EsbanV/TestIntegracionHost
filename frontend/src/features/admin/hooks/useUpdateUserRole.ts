const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export function useUpdateUserRole() {
  const updateRole = async (id: string, role: string) => {
    const res = await fetch(`${BASE}/admin/users/${encodeURIComponent(id)}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Failed to update role (${res.status})`);
    }
    return res.json();
  };

  return { updateRole };
}