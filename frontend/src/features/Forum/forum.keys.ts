// src/features/Forum/forum.keys.ts
export const forumKeys = {
  all: ['forum'] as const,
  lists: () => [...forumKeys.all, 'list'] as const,
  myPublications: () => [...forumKeys.all, 'mine'] as const,
  publications: () => [...forumKeys.all, 'publications'] as const,
  // Nueva clave para comentarios
  comments: (postId: number) => [...forumKeys.all, 'comments', postId] as const,
};