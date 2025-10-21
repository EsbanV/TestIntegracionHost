import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/posts', () => {
    return HttpResponse.json([
      { id: 1, title: 'Post 1', content: 'Content 1' },
      { id: 2, title: 'Post 2', content: 'Content 2' },
    ])
  }),
  http.get('/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'User 1', email: 'user1@example.com' },
      { id: 2, name: 'User 2', email: 'user2@example.com' },
    ])
  }),
  http.get('/api/posts', ({ request }) => {
    const url = new URL(request.url)
    const page = url.searchParams.get('page') || '1'
    const limit = url.searchParams.get('limit') || '9'
    // Mock data for posts
    const posts = Array.from({ length: parseInt(limit) }, (_, i) => ({
      id: (parseInt(page) - 1) * parseInt(limit) + i + 1,
      title: `Post ${(parseInt(page) - 1) * parseInt(limit) + i + 1}`,
      description: `Content ${(parseInt(page) - 1) * parseInt(limit) + i + 1}`,
      price: Math.floor(Math.random() * 100) + 10,
      category: 'electronics',
      categoryName: 'Electrónicos',
      userId: 1,
      author: 'User ' + (i + 1),
      avatar: 'https://via.placeholder.com/40',
      timeAgo: 'hace 2 horas',
      image: 'https://via.placeholder.com/300x200',
      sellerRating: 4.5,
      sellerSales: Math.floor(Math.random() * 50) + 1,
    }))
    return HttpResponse.json({
      posts,
      nextPage: parseInt(page) < 5 ? parseInt(page) + 1 : undefined, // Mock pagination
      hasMore: parseInt(page) < 5,
    })
  }),
  http.get('/api/me', () => {
    return HttpResponse.json({
      id: 1,
      name: 'User 1',
      email: 'user1@example.com',
      role: 'user',
      campus: 'Main Campus',
      rating: 4.5,
      avatar: 'https://via.placeholder.com/96',
    })
  }),
  http.get('/perfil', () => {
    return HttpResponse.json({
      id: 1,
      name: 'User 1',
      email: 'user1@example.com',
      role: 'user',
      campus: 'Main Campus',
      deliveryPlaces: ['Place 1', 'Place 2'],
      rating: 4.5,
      avatar: 'https://via.placeholder.com/96',
    })
  }),
  http.get('/home', () => {
    return HttpResponse.json({ message: 'Home page' })
  }),
]
