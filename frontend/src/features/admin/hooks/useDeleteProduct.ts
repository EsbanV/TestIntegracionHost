const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export function useDeleteProduct() {
  const deleteProduct = async (id: string) => {
    if (BASE) {
      const res = await fetch(`${BASE}/admin/products/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      return res.json();
    }

    // Fallback: eliminar post en MSW
    const res = await fetch(`/api/posts/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Delete failed (${res.status})`);
    return res.json();
  };

  return { deleteProduct };
}
