import usePosts from '../../../../hooks/UsePosts'
import ItemCard from './ItemCard'

export default function ItemList() {
  const { data: posts, isLoading, isError } = usePosts()

  if (isLoading) return <p>Cargando publicaciones...</p>
  if (isError) return <p>Error al cargar publicaciones.</p>

  return (
    <div className="grid grid-cols-3 gap-6">
      {posts?.map((post) => (
        <ItemCard key={post.id} post={post} />
      ))}
    </div>
  )
}
