import { type ReactNode } from 'react';

const INLINE_RE =
  /(\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\))/g;

const renderInline = (text: string, keyPrefix: string): ReactNode[] => {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let part = 0;

  INLINE_RE.lastIndex = 0;
  while ((match = INLINE_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[2] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-b-${part++}`}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      nodes.push(<em key={`${keyPrefix}-i-${part++}`}>{match[3]}</em>);
    } else if (match[4] !== undefined && match[5] !== undefined) {
      nodes.push(
        <a
          key={`${keyPrefix}-a-${part++}`}
          href={match[5]}
          target="_blank"
          rel="noopener noreferrer"
        >
          {match[4]}
        </a>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
};

export const renderMarkdown = (markdown?: string): ReactNode => {
  if (!markdown?.trim()) return null;

  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  let blockKey = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (line.trimStart().startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith('- ')) {
        items.push(lines[i].trimStart().slice(2));
        i += 1;
      }

      const listKey = `ul-${blockKey++}`;
      blocks.push(
        <ul key={listKey}>
          {items.map((item, index) => (
            <li key={`${listKey}-${index}`}>{renderInline(item, `${listKey}-${index}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trimStart().startsWith('- ')
    ) {
      paragraphLines.push(lines[i]);
      i += 1;
    }

    const pKey = `p-${blockKey++}`;
    blocks.push(
      <p key={pKey}>{renderInline(paragraphLines.join(' '), pKey)}</p>,
    );
  }

  return <>{blocks}</>;
};
