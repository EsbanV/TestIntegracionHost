import React from "react";
import { formatCLP } from "../../utils/format";

interface Post {
  id: number;
  title: string;
  content?: string;
  author?: {
    name?: string;
    avatar?: string;
  };
  createdAt?: string;
  likes?: number;
  comments?: number;
  price?: string | number;
}

interface PostCardProps {
  post: Post;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleDateString();
};

export default function PostCard({ post, onView, onEdit, onDelete, className = "" }: PostCardProps) {
  return (
    <article className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {post.price || post.content ? (
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              {post.author?.avatar ? (
                <img src={post.author.avatar} alt={post.author.name ?? "avatar"} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-600 flex-shrink-0">
                  {post.author?.name ? post.author.name.charAt(0).toUpperCase() : "?"}
                </div>
              )}

              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate">{post.title}</h3>
                {post.content ? <p className="text-xs text-gray-500 truncate mt-1">{post.content}</p> : null}
              </div>
            </div>

            {post.price !== undefined && (
              <div className="flex-shrink-0 text-right ml-3">
                <div className="text-sm font-semibold text-gray-900 leading-6">
                  {typeof post.price === "number" ? formatCLP(post.price) : formatCLP(parseFloat(String(post.price)) || 0)}
                </div>
                <div className="text-xs text-gray-400">{formatDate(post.createdAt)}</div>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span>{post.likes ?? 0} ❤️</span>
              <span>{post.comments ?? 0} 💬</span>
            </div>

            <div className="flex items-center gap-2">
              {onView && <button onClick={onView} className="inline-flex items-center h-8 px-2 rounded-md text-sm bg-gray-50 hover:bg-gray-100">Ver</button>}
              {onEdit && <button onClick={onEdit} className="inline-flex items-center h-8 px-2 rounded-md text-sm text-blue-600 hover:underline">Editar</button>}
              {onDelete && <button onClick={onDelete} className="inline-flex items-center h-8 px-2 rounded-md text-sm text-rose-600 hover:underline">Eliminar</button>}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 text-sm text-gray-500">Sin contenido</div>
      )}
    </article>
  );
}