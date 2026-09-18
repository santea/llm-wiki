import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Link2, Terminal } from 'lucide-react';
import { MermaidRenderer } from './MermaidRenderer';
import { NoteItem, TabType } from '../../types';

interface MarkdownRendererProps {
  content: string;
  notes?: NoteItem[];
  onSelectNote?: (noteId: string | null) => void;
  onNavigateToTab?: (tab: TabType) => void;
  className?: string;
  isUserMessage?: boolean;
}

// Subcomponent: Styled Code Block with copy button and language pill
function CodeBlockBox({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const displayLang = (language || 'text').toUpperCase();

  return (
    <div className="w-full my-2.5 rounded-xl overflow-hidden border border-[#2e3547] bg-[#0c0e14] shadow-md font-mono text-xs">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#191b22] border-b border-[#2e3547]/80 text-[#958da1]">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-[#4cd7f6]" />
          <span className="text-[11px] font-semibold text-[#ccc3d8]">{displayLang}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#282a30] hover:bg-[#383a45] text-[#ccc3d8] hover:text-white transition-colors cursor-pointer text-[11px]"
          title="코드 복사"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-[#4edea3]" />
              <span className="text-[#4edea3]">복사됨</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>복사</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto text-[#e2e2eb] leading-relaxed">
        <pre className="m-0 p-0 font-mono">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

// Preprocessor for Obsidian [[WikiLink]] syntax:
// [[Title|Alias]] -> [Alias](wiki://Title)
// [[Title]] -> [Title](wiki://Title)
function preprocessObsidianWikiLinks(text: string): string {
  if (!text) return '';
  // Split by code blocks or inline code to preserve code formatting
  const codeBlockRegex = /(```[\s\S]*?```|`[^`\n]+`)/g;
  return text
    .split(codeBlockRegex)
    .map((part, index) => {
      // Odd indices are code chunks, do not replace inside code
      if (index % 2 === 1) return part;
      // Replace [[Target|Display]] or [[Target]]
      return part.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, display) => {
        const title = target.trim();
        const label = (display || target).trim();
        return `[${label}](wiki://${encodeURIComponent(title)})`;
      });
    })
    .join('');
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  notes = [],
  onSelectNote,
  onNavigateToTab,
  className = '',
  isUserMessage = false
}) => {
  const processedContent = preprocessObsidianWikiLinks(content);

  const handleWikiLinkClick = (targetTitle: string) => {
    const cleanTarget = targetTitle.toLowerCase();
    const found = notes.find(
      (n) =>
        n.id.toLowerCase() === cleanTarget ||
        n.title.toLowerCase() === cleanTarget ||
        n.title.toLowerCase().includes(cleanTarget)
    );

    if (found && onSelectNote) {
      onSelectNote(found.id);
      if (onNavigateToTab) {
        onNavigateToTab('notes');
      }
    }
  };

  return (
    <div className={`markdown-content text-sm leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1({ children }) {
            return (
              <h1 className="text-lg font-bold text-[#e2e2eb] mt-3.5 mb-2 pb-1 border-b border-[#2e3547]/80 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[#7c3aed] rounded-full"></span>
                <span>{children}</span>
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-base font-bold text-[#d2bbff] mt-3 mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-3.5 bg-[#4cd7f6] rounded-full"></span>
                <span>{children}</span>
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-sm font-semibold text-[#4cd7f6] mt-2.5 mb-1 flex items-center gap-1.5">
                <span className="w-1 h-3 bg-[#4edea3] rounded-full"></span>
                <span>{children}</span>
              </h3>
            );
          },
          h4({ children }) {
            return <h4 className="text-xs font-semibold text-[#e2e2eb] mt-2 mb-1">{children}</h4>;
          },
          p({ children }) {
            return (
              <p
                className={`my-1.5 text-sm leading-relaxed ${
                  isUserMessage ? 'text-white' : 'text-[#e2e2eb]'
                }`}
              >
                {children}
              </p>
            );
          },
          ul({ children }) {
            return (
              <ul className="list-disc list-outside pl-4 my-2 space-y-1 text-sm text-[#e2e2eb]">
                {children}
              </ul>
            );
          },
          ol({ children }) {
            return (
              <ol className="list-decimal list-outside pl-4 my-2 space-y-1 text-sm text-[#e2e2eb]">
                {children}
              </ol>
            );
          },
          li({ children }) {
            return <li className="leading-relaxed pl-0.5">{children}</li>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-3 border-[#7c3aed] bg-[#191b22]/80 pl-3 py-1.5 my-2 rounded-r-lg text-xs text-[#ccc3d8] italic font-mono">
                {children}
              </blockquote>
            );
          },
          a({ href, children }) {
            if (href?.startsWith('wiki://')) {
              const rawTitle = decodeURIComponent(href.replace('wiki://', ''));
              return (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleWikiLinkClick(rawTitle);
                  }}
                  className="inline-flex items-center gap-1 mx-0.5 px-1.5 py-0.5 rounded bg-[#282a30] hover:bg-[#7c3aed]/30 border border-[#7c3aed]/50 text-[#d2bbff] hover:text-white text-xs font-mono transition-colors cursor-pointer align-baseline"
                  title={`지식 노트 이동: [[${rawTitle}]]`}
                >
                  <Link2 className="w-3 h-3 text-[#b982ff] shrink-0 inline" />
                  <span className="underline decoration-dotted underline-offset-2">{children}</span>
                </button>
              );
            }

            return (
              <a
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                className="text-[#4cd7f6] hover:text-[#7ce5ff] underline underline-offset-2 decoration-[#4cd7f6]/50 hover:decoration-[#4cd7f6] transition-colors inline-flex items-center gap-0.5"
              >
                <span>{children}</span>
              </a>
            );
          },
          hr() {
            return <hr className="my-3 border-[#2e3547]" />;
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-2.5 rounded-xl border border-[#2e3547] bg-[#0c0e14]">
                <table className="w-full text-left text-xs text-[#e2e2eb] border-collapse">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-[#191b22] border-b border-[#2e3547]">{children}</thead>;
          },
          th({ children }) {
            return (
              <th className="px-3 py-2 font-mono font-semibold text-[#4cd7f6] text-[11px]">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-3 py-2 border-b border-[#2e3547]/50 font-mono text-[11px] text-[#ccc3d8]">
                {children}
              </td>
            );
          },
          pre({ children }) {
            return <>{children}</>;
          },
          code({ className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            const isBlock = Boolean(match) || codeString.includes('\n');

            if (!isBlock) {
              return (
                <code
                  className="px-1.5 py-0.5 mx-0.5 rounded bg-[#282a30] text-[#4cd7f6] font-mono text-[11px] border border-[#3b3d4a]/80"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            const lang = match ? match[1].toLowerCase() : '';

            // Render interactive Mermaid if language is mermaid!
            if (lang === 'mermaid') {
              return (
                <div className="my-2.5">
                  <MermaidRenderer chart={codeString} title="인라인 다이어그램" />
                </div>
              );
            }

            return <CodeBlockBox code={codeString} language={lang} />;
          },
          strong({ children }) {
            return <strong className="font-semibold text-white">{children}</strong>;
          },
          em({ children }) {
            return <em className="text-[#ccc3d8] italic">{children}</em>;
          },
          del({ children }) {
            return <del className="text-[#958da1] line-through">{children}</del>;
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};
