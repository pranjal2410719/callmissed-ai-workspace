'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AIMessageProps {
  content: string;
}

// Pietrastudio tokens
const silver = '#c4c4c4';
const cream = '#f8f6f2';
const inkBlack = '#000000';
const midGray = '#6b6b6b';
const coral = '#ff5c3c';

export const AIMessage: React.FC<AIMessageProps> = ({ content }) => {
  return (
    <div
      style={{
        fontSize: '14px',
        lineHeight: 1.65,
        letterSpacing: '-0.14px',
        color: inkBlack,
        wordBreak: 'break-word',
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: '-0.4px',
                color: inkBlack,
                marginTop: '18px',
                marginBottom: '10px',
              }}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                lineHeight: 1.25,
                letterSpacing: '-0.25px',
                color: inkBlack,
                marginTop: '16px',
                marginBottom: '8px',
              }}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              style={{
                fontSize: '15px',
                fontWeight: 600,
                lineHeight: 1.3,
                letterSpacing: '-0.15px',
                color: inkBlack,
                marginTop: '14px',
                marginBottom: '6px',
              }}
            >
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: inkBlack,
                marginTop: '12px',
                marginBottom: '4px',
              }}
            >
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p
              style={{
                marginBottom: '10px',
                lineHeight: 1.65,
              }}
            >
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul
              style={{
                listStyleType: 'disc',
                paddingLeft: '22px',
                marginBottom: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              style={{
                listStyleType: 'decimal',
                paddingLeft: '22px',
                marginBottom: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li
              style={{
                lineHeight: 1.6,
              }}
            >
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong style={{ fontWeight: 700, color: inkBlack }}>{children}</strong>
          ),
          em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
          del: ({ children }) => (
            <del style={{ textDecoration: 'line-through', color: midGray }}>{children}</del>
          ),
          blockquote: ({ children }) => (
            <blockquote
              style={{
                borderLeft: `3px solid ${coral}`,
                background: cream,
                padding: '10px 14px',
                borderRadius: '0 8px 8px 0',
                margin: '12px 0',
                fontStyle: 'italic',
                color: '#333333',
              }}
            >
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: coral,
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
                fontWeight: 500,
              }}
            >
              {children}
            </a>
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  style={{
                    borderRadius: '4px',
                    border: `1px solid ${silver}`,
                    background: cream,
                    padding: '2px 6px',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: '12px',
                    color: '#141414',
                    wordBreak: 'break-word',
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre
                style={{
                  borderRadius: '10px',
                  background: '#141414',
                  color: '#ffffff',
                  padding: '14px 16px',
                  margin: '12px 0',
                  overflowX: 'auto',
                  border: '1px solid #333333',
                  boxShadow: 'rgba(0, 0, 0, 0.05) 0px 2px 4px',
                }}
              >
                <code
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: '12.5px',
                    lineHeight: 1.5,
                  }}
                  {...props}
                >
                  {children}
                </code>
              </pre>
            );
          },
          table: ({ children }) => (
            <div
              style={{
                overflowX: 'auto',
                margin: '14px 0',
                borderRadius: '8px',
                border: `1px solid ${silver}`,
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '13px',
                  textAlign: 'left',
                }}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead style={{ background: cream, borderBottom: `1px solid ${silver}` }}>
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th
              style={{
                border: `1px solid ${silver}`,
                padding: '8px 12px',
                fontWeight: 700,
                color: inkBlack,
                letterSpacing: '-0.01em',
              }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              style={{
                border: `1px solid ${silver}`,
                padding: '8px 12px',
                verticalAlign: 'top',
                color: '#333333',
              }}
            >
              {children}
            </td>
          ),
          hr: () => (
            <hr
              style={{
                border: 'none',
                borderTop: `1px solid ${silver}`,
                margin: '16px 0',
              }}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
