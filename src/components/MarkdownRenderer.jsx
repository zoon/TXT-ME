import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import rehypeRaw from 'rehype-raw';
import { Link } from 'react-router-dom';

function MarkdownRenderer({ content }) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          // Обработка mentions (@username)
          p: ({ node, children }) => {
            const text = String(children);
            const parts = text.split(/(@\w+)/g);

            const elements = parts.map((part, i) => {
              if (part.startsWith('@')) {
                const username = part.substring(1);
                return (
                  <Link key={i} to={`/users/${username}`} className="mention">
                    {part}
                  </Link>
                );
              }
              return part;
            });

            return <p>{elements}</p>;
          },
          // Открываем ссылки в новой вкладке
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
