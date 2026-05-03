import { useState } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { MessageSquare, Send } from 'lucide-react'

export function ForumCommentItem({ 
  post, 
  allPosts, 
  currentUserId, 
  isTeacher, 
  onDelete, 
  onEdit, 
  onReply, 
  depth = 0 
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isPosting, setIsPosting] = useState(false)

  // Find children
  const children = allPosts.filter(p => p.parent_id === post.id)

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return
    await onEdit(post.id, editContent)
    setIsEditing(false)
  }

  const handleSendReply = async () => {
    if (!replyContent.trim()) return
    setIsPosting(true)
    await onReply(post.id, replyContent)
    setReplyContent('')
    setIsReplying(false)
    setIsPosting(false)
  }

  return (
    <div 
      id={`comment-${post.id}`}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-colors duration-500 ${depth > 0 ? 'ml-6 mt-2 border-l-4 border-l-blue-200' : ''}`}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={post.author?.avatar_url} alt={post.author?.full_name} />
          <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white font-semibold text-sm">
            {post.author?.full_name?.charAt(0).toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-gray-800 font-['Poppins']">
                {post.author?.full_name || 'Anonymous'}
              </h4>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">
                {new Date(post.created_at).toLocaleDateString('id-ID', { 
                  day: 'numeric', 
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              {post.updated_at && post.updated_at !== post.created_at && (
                <span className="text-xs text-gray-400 italic">(diedit)</span>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="text-gray-400 hover:text-blue-500 text-xs font-medium flex items-center gap-1 font-['Poppins']"
              >
                Balas
              </button>
              {(currentUserId === post.user_id || isTeacher) && !isEditing && (
                <>
                  {currentUserId === post.user_id && (
                    <button
                      onClick={() => {
                        setIsEditing(true)
                        setEditContent(post.content)
                      }}
                      className="text-gray-400 hover:text-blue-500 text-xs font-medium font-['Poppins']"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(post.id)}
                    className="text-gray-400 hover:text-red-500 text-xs font-medium font-['Poppins']"
                  >
                    Hapus
                  </button>
                </>
              )}
            </div>
          </div>
          
          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white text-gray-900 text-sm font-['Poppins']"
                rows={3}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditContent(post.content)
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md font-['Poppins']"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!editContent.trim()}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 font-['Poppins']"
                >
                  Simpan
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-['Poppins']">
              {post.content}
            </p>
          )}

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Tulis balasan..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white text-gray-900 text-sm font-['Poppins']"
                rows={2}
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setIsReplying(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md font-['Poppins']"
                >
                  Batal
                </button>
                <button
                  onClick={handleSendReply}
                  disabled={isPosting || !replyContent.trim()}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 flex items-center gap-1 font-['Poppins']"
                >
                  {isPosting ? 'Mengirim...' : (
                    <>
                      <Send className="h-3 w-3" /> Kirim
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Render children recursively */}
      {children.length > 0 && (
        <div className="mt-3 space-y-2">
          {children.map(childPost => (
            <ForumCommentItem
              key={childPost.id}
              post={childPost}
              allPosts={allPosts}
              currentUserId={currentUserId}
              isTeacher={isTeacher}
              onDelete={onDelete}
              onEdit={onEdit}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
