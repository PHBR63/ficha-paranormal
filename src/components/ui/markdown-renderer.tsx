/**
 * MarkdownRenderer - Componente para renderização de markdown simplificado
 * 
 * Suporta: negrito, itálico, tabelas, listas, blockquotes, headings
 */

import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  /** Conteúdo markdown para renderizar */
  content: string;
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Renderiza markdown simplificado em React
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    
    // Tabela - detecta linha com |
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      elements.push(<MarkdownTable key={key++} lines={tableLines} />);
      continue;
    }

    // Blockquote
    if (line.trim().startsWith('>')) {
      const quoteContent = line.trim().slice(1).trim();
      elements.push(
        <blockquote 
          key={key++} 
          className="border-l-2 border-paranormal/50 pl-3 py-1 my-2 text-sm italic text-muted-foreground bg-paranormal/5 rounded-r"
        >
          {renderInlineMarkdown(quoteContent)}
        </blockquote>
      );
      i++;
      continue;
    }

    // Heading ###
    if (line.trim().startsWith('### ')) {
      elements.push(
        <h4 key={key++} className="font-display text-sm tracking-wider text-primary mt-3 mb-2">
          {renderInlineMarkdown(line.trim().slice(4))}
        </h4>
      );
      i++;
      continue;
    }

    // Heading ##
    if (line.trim().startsWith('## ')) {
      elements.push(
        <h3 key={key++} className="font-display text-base tracking-wider text-foreground mt-3 mb-2">
          {renderInlineMarkdown(line.trim().slice(3))}
        </h3>
      );
      i++;
      continue;
    }

    // Lista com -
    if (line.trim().startsWith('- ')) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('- ')) {
        listItems.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <ul key={key++} className="space-y-1.5 my-2">
          {listItems.map((item, idx) => (
            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{renderInlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Lista com •
    if (line.trim().startsWith('• ')) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('• ')) {
        listItems.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <ul key={key++} className="space-y-1.5 my-2">
          {listItems.map((item, idx) => (
            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{renderInlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Linha vazia
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Parágrafo normal
    elements.push(
      <p key={key++} className="text-sm text-muted-foreground leading-relaxed my-1">
        {renderInlineMarkdown(line)}
      </p>
    );
    i++;
  }

  return <div className={cn('space-y-1', className)}>{elements}</div>;
}

/**
 * Renderiza tabela markdown
 */
function MarkdownTable({ lines }: { lines: string[] }) {
  if (lines.length < 2) return null;

  // Parseia células
  const parseRow = (line: string) => {
    return line
      .split('|')
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
      .map(cell => cell.trim());
  };

  const headerCells = parseRow(lines[0]);
  
  // Pula linha separadora (---)
  const bodyLines = lines.slice(2);

  return (
    <div className="my-3 overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-border/50">
            {headerCells.map((cell, idx) => (
              <th 
                key={idx} 
                className="text-left py-2 px-2 font-display text-primary/90 tracking-wider"
              >
                {renderInlineMarkdown(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyLines.map((line, rowIdx) => {
            const cells = parseRow(line);
            return (
              <tr 
                key={rowIdx} 
                className="border-b border-border/30 hover:bg-muted/30 transition-colors"
              >
                {cells.map((cell, cellIdx) => (
                  <td 
                    key={cellIdx} 
                    className="py-1.5 px-2 text-muted-foreground"
                  >
                    {renderInlineMarkdown(cell)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Renderiza markdown inline (negrito, itálico)
 */
function renderInlineMarkdown(text: string): React.ReactNode {
  // Padrões para negrito e itálico
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Negrito **texto**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Itálico *texto* ou _texto_
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)|_([^_]+)_/);

    if (boldMatch && (!italicMatch || boldMatch.index! <= italicMatch.index!)) {
      // Adiciona texto antes do match
      if (boldMatch.index! > 0) {
        parts.push(remaining.slice(0, boldMatch.index));
      }
      // Adiciona negrito
      parts.push(
        <strong key={key++} className="font-semibold text-foreground">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldMatch.index! + boldMatch[0].length);
    } else if (italicMatch) {
      // Adiciona texto antes do match
      if (italicMatch.index! > 0) {
        parts.push(remaining.slice(0, italicMatch.index));
      }
      // Adiciona itálico
      parts.push(
        <em key={key++} className="italic">
          {italicMatch[1] || italicMatch[2]}
        </em>
      );
      remaining = remaining.slice(italicMatch.index! + italicMatch[0].length);
    } else {
      // Sem mais matches, adiciona o resto
      parts.push(remaining);
      break;
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

export default MarkdownRenderer;
