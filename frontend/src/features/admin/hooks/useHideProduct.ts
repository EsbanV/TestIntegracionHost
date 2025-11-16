const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export function useHideProduct() {
  const hideProduct = async (id: string) => {
    if (BASE) {
      const res = await fetch(`${BASE}/admin/products/${encodeURIComponent(id)}/hide`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Hide failed (${res.status})`);
      return res.json();
    }

    // Fallback: actualizar post en MSW api como archivado
    const res = await fetch(`/api/posts/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'hidden' }),
    });
    if (!res.ok) throw new Error(`Hide failed (${res.status})`);
    return res.json();
  };

  return { hideProduct };
}
