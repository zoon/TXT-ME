import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { postsAPI, commentsAPI } from '../services/api';
import { useAuth } from '../utils/AuthContext';
import MarkdownRenderer from '../components/MarkdownRenderer'; // 👈 ДОБАВИЛИ

// CommentItem - компонент для отдельного комментария
const CommentItem = ({ comment, level = 0, user, replyTo, setReplyTo, replyText, setReplyText, handleAddReply, handleDeleteComment }) => (
  <div
  key={comment.commentId}
  style={{
    marginLeft: `${level * 2}rem`,
    borderLeft: level > 0 ? '2px solid var(--border)' : 'none',
                                                                                                                                          paddingLeft: level > 0 ? '1rem' : '0',
                                                                                                                                          marginBottom: '1rem'
  }}
  >
  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem' }}>
  <div style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '0.5rem' }}>
  <strong>{comment.username}</strong>
  <span> • </span>
  <span>{new Date(comment.createdAt).toLocaleString('ru-RU')}</span>
  </div>

  {/* 👇 ИЗМЕНИЛИ: теперь рендерим Markdown */}
  <div style={{ marginBottom: '0.75rem' }}>
  <MarkdownRenderer content={comment.content} />
  </div>

  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
  {user && (
    <button
    onClick={() => setReplyTo(replyTo === comment.commentId ? null : comment.commentId)}
    className="btn btn-primary"
    >
    {replyTo === comment.commentId ? '❌ Отмена' : '↩️ Ответить'}
    </button>
  )}
  {user && (user.username === comment.username || user.role === 'admin') && (
    <button
    onClick={() => handleDeleteComment(comment.commentId)}
    className="btn"
    style={{ color: '#dc2626' }}
    >
    🗑️ Удалить
    </button>
  )}
  </div>

  {/* Форма ответа на комментарий */}
  {replyTo === comment.commentId && (
    <div style={{ marginTop: '0.75rem', marginLeft: '1rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem' }}>
    <form onSubmit={(e) => handleAddReply(e, comment.commentId)}>
    <textarea
    value={replyText}
    onChange={(e) => setReplyText(e.target.value)}
    placeholder="Напишите ответ..."
    className="comment-textarea"
    style={{ width: '100%', minHeight: '80px', marginBottom: '0.5rem' }}
    />
    <div style={{ display: 'flex', gap: '0.5rem' }}>
    <button type="submit" className="btn btn-primary">
    Отправить
    </button>
    <button
    type="button"
    onClick={() => { setReplyTo(null); setReplyText(''); }}
    className="btn"
    >
    Отмена
    </button>
    </div>
    </form>
    </div>
  )}
  </div>

  {/* Рекурсивный рендеринг вложенных комментариев */}
  {comment.replies && comment.replies.length > 0 && (
    <div style={{ marginTop: '0.75rem' }}>
    {comment.replies.map(reply => (
      <CommentItem
      key={reply.commentId}
      comment={reply}
      level={level + 1}
      user={user}
      replyTo={replyTo}
      setReplyTo={setReplyTo}
      replyText={replyText}
      setReplyText={setReplyText}
      handleAddReply={handleAddReply}
      handleDeleteComment={handleDeleteComment}
      />
    ))}
    </div>
  )}
  </div>
);

export default function PostView() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadPost();
    loadComments();
  }, [postId]);

  // Скролл к якорю после загрузки
  useEffect(() => {
    if (!loading && window.location.hash) {
      setTimeout(() => {
        const hash = window.location.hash.substring(1);
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });

          // Если якорь на форму комментария - фокус на textarea
          if (hash === 'comment-form') {
            const textarea = element.querySelector('textarea');
            if (textarea) {
              setTimeout(() => textarea.focus(), 300);
            }
          }
        }
      }, 200);
    }
  }, [loading, comments]);

  const loadPost = async () => {
    try {
      const response = await postsAPI.getById(postId);
      setPost(response.data.post);
    } catch (error) {
      console.error('Failed to load post:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const response = await commentsAPI.getByPost(postId);
      setComments(response.data.comments);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await commentsAPI.create(postId, { content: newComment });
      setNewComment('');
      loadComments();
    } catch (error) {
      console.error('Add comment error:', error);
      alert('Failed to add comment');
    }
  };

  const handleAddReply = async (e, parentCommentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      await commentsAPI.create(postId, {
        content: replyText,
        parentCommentId: parentCommentId
      });
      setReplyText('');
      setReplyTo(null);
      loadComments();
    } catch (error) {
      console.error('Add reply error:', error);
      alert('Failed to add reply');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Удалить комментарий?')) return;

    try {
      await commentsAPI.delete(postId, commentId);
      loadComments();
    } catch (error) {
      console.error('Delete comment error:', error);
      const message = error.response?.data?.error || 'Failed to delete comment';
      alert(message);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Удалить пост?')) return;

    try {
      await postsAPI.delete(postId);
      navigate('/');
    } catch (error) {
      console.error('Delete post error:', error);
      alert('Failed to delete post');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url)
    .then(() => alert('Ссылка скопирована!'))
    .catch(() => alert('Не удалось скопировать ссылку'));
  };

  const scrollToComments = () => {
    const commentsSection = document.querySelector('.comments-section');
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToCommentForm = () => {
    const form = document.getElementById('comment-form');
    if (form) {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const textarea = form.querySelector('textarea');
      if (textarea) {
        setTimeout(() => textarea.focus(), 300);
      }
    }
  };

  // Построение дерева комментариев
  const buildCommentTree = (comments) => {
    const map = {};
    const roots = [];

    comments.forEach(comment => {
      map[comment.commentId] = { ...comment, replies: [] };
    });

    comments.forEach(comment => {
      if (comment.parentCommentId) {
        if (map[comment.parentCommentId]) {
          map[comment.parentCommentId].replies.push(map[comment.commentId]);
        }
      } else {
        roots.push(map[comment.commentId]);
      }
    });

    return roots;
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (!post) return <div className="loading">Пост не найден</div>;

  const commentTree = buildCommentTree(comments);

  return (
    <div className="post-view">
    <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
    ← Назад к ленте
    </Link>

    <div className="post-card">
    <div className="post-header">
    <h1 className="post-title">{post.title}</h1>
    <div className="post-meta">
    <span>{post.username}</span>
    <span>•</span>
    <span>{new Date(post.createdAt).toLocaleDateString('ru-RU')}</span>
    </div>
    </div>

    {/* 👇 ИЗМЕНИЛИ: теперь рендерим Markdown */}
    <div className="post-content-wrapper">
    <div className="post-content">
    <MarkdownRenderer content={post.content} />
    </div>
    </div>

    <div className="post-footer">
    {post.tags && post.tags.map((tag, idx) => (
      <Link
      key={idx}
      to={`/?tag=${encodeURIComponent(tag)}`}
      className="post-tag"
      >
      {tag}
      </Link>
    ))}
    </div>

    <div className="post-actions">
    <button onClick={scrollToComments} className="btn">
    💬 Комментарии ({comments.length})
    </button>
    <button onClick={scrollToCommentForm} className="btn btn-primary">
    ✍️ Оставить комментарий
    </button>
    <button onClick={handleShare} className="btn">
    🔗 Share
    </button>
    {user && user.username === post.username && (
      <>
      <Link to={`/posts/${postId}/edit`} className="btn btn-primary">
      Редактировать
      </Link>
      <button onClick={handleDeletePost} className="btn" style={{ color: '#dc2626' }}>
      Удалить
      </button>
      </>
    )}
    </div>
    </div>

    {/* ФОРМА ДОБАВЛЕНИЯ КОММЕНТАРИЯ */}
    {user ? (
      <div className="comment-form" id="comment-form">
      <h3>Добавить комментарий</h3>
      <form onSubmit={handleAddComment}>
      <textarea
      value={newComment}
      onChange={(e) => setNewComment(e.target.value)}
      placeholder="Напишите комментарий..."
      className="comment-textarea"
      />
      <button type="submit" className="btn btn-primary">
      Отправить
      </button>
      </form>
      </div>
    ) : (
      <div className="comment-form">
      <p style={{ textAlign: 'center', color: 'var(--muted-foreground)' }}>
      <Link to="/login" style={{ color: 'var(--primary)' }}>Войдите</Link>, чтобы оставить комментарий
      </p>
      </div>
    )}

    {/* СЕКЦИЯ КОММЕНТАРИЕВ */}
    <div className="comments-section">
    <h3>Комментарии ({comments.length})</h3>
    {commentTree.length === 0 ? (
      <div className="no-comments">Пока нет комментариев</div>
    ) : (
      commentTree.map(comment => (
        <CommentItem
        key={comment.commentId}
        comment={comment}
        level={0}
        user={user}
        replyTo={replyTo}
        setReplyTo={setReplyTo}
        replyText={replyText}
        setReplyText={setReplyText}
        handleAddReply={handleAddReply}
        handleDeleteComment={handleDeleteComment}
        />
      ))
    )}
    </div>
    </div>
  );
}
