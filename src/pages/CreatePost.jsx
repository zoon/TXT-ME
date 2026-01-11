import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsAPI } from '../services/api';
import { useAuth } from '../utils/AuthContext';
import MarkdownEditor from '../components/MarkdownEditor'; // 👈 ДОБАВИЛИ

export default function CreatePost() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) return <div className="loading">Загрузка...</div>;
  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await postsAPI.create({
        title,
        content,
        tags: tags.split(',').map(t => t.trim()).filter(t => t)
      });

      const postId = response.data.post?.postId || response.data.postId;
      navigate(`/posts/${postId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post">
    <h1>Создать пост</h1>
    {error && <div className="error-message">{error}</div>}
    {loading && <div>Создание...</div>}

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
    placeholder="четадь, плякадь, песадь, снова плякадь"
    />
    </div>

    <div className="form-actions">
    <button type="submit" className="btn btn-primary" disabled={loading}>
    Опубликовать
    </button>
    <button type="button" onClick={() => navigate(-1)} className="btn">
    Отмена
    </button>
    </div>
    </form>
    </div>
  );
}
