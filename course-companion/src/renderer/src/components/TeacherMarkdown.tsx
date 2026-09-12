import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function TeacherMarkdown({ content }: { content: string }) {
  return (
    <div className="teacher-markdown">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            // Match the desktop shell's existing external-link policy.
            let external = false
            try { external = new URL(href ?? '').protocol === 'https:' } catch { /* Render unsupported links as text. */ }
            return external
              ? <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
              : <span>{children}</span>
          },
          // Replies must not fetch remote images automatically.
          img: ({ alt }) => <span>{alt}</span>,
          pre: ({ children }) => <pre tabIndex={0}>{children}</pre>,
          table: ({ children }) => (
            <div className="teacher-markdown-table" role="region" aria-label="Bảng trong phản hồi của Triết" tabIndex={0}>
              <table>{children}</table>
            </div>
          )
        }}
      >
        {content}
      </Markdown>
    </div>
  )
}
