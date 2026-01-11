import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postsAPI } from '../services/api';
import { useAuth } from '../utils/AuthContext';
import MarkdownEditor from '../components/MarkdownEditor'; // 👈 ДОБАВИЛИ

export default function EditPost() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      loadPost();
    } else if (!authLoading && !user) {
      navigate('/login');
    }
  }, [postId, user, authLoading]);

  const loadPost = async () => {
    try {
      const response = await postsAPI.getById(postId);
      const loadedPost = response.data.post;

      if (user.userId !== loadedPost.userId) {
        navigate('/');
        return;
      }

      setPost(loadedPost);
      setTitle(loadedPost.title);
      setContent(loadedPost.content);
      setTags(loadedPost.tags?.join(', ') || '');
    } catch (error) {
      console.error('Failed to load post:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await postsAPI.update(postId, {
        title,
        content,
        tags: tags.split(',').map(t => t.trim()).filter(t => t)
      });
      navigate(`/posts/${postId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update post');
    }
  };

  if (authLoading || loading) return <div className="loading">Загрузка...</div>;
  if (!post) return null;

  return (
    <div className="edit-post">
    <h1>Редактировать пост</h1>
    {error && <div className="error">{error}</div>}

    <form onSubmit={handleSubmit}>
    <div className="form-group">
    <label>Заголовок</label>
    <input
    type="text"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    placeholder="Введите заголовок"
    required
    />
    </div>

    <div className="form-group">
    <label>Содержание</label>
    {/* 👇 ЗАМЕНИЛИ textarea на MarkdownEditor */}
    <MarkdownEditor
    value={content}
    onChange={setContent}
    placeholder="Напишите текст поста..."
    />
    </div>

    <div className="form-group">
    <label>Теги (через запятую)</label>
    <input
    type="text"
    value={tags}
    onChange={(e) => setTags(e.target.value)}
    placeholder="песадь, четадь"
    />
    </div>

    <div className="form-actions">
    <button type="submit" className="btn btn-primary">
    Сохранить
    </button>
    <button type="button" onClick={() => navigate(-1)} className="btn">
    Отмена
    </button>
    </div>
    </form>
    </div>
  );
}
