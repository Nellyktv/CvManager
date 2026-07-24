import { type ReactNode } from 'react';
import { Link, Text, View, StyleSheet } from '@react-pdf/renderer';

/**
 * Restricted Markdown → React-PDF nodes (no HTML, no images, no code blocks).
 * Supports paragraphs, **bold**, *italic*, unordered lists, and http(s) links.
 */
const INLINE_RE =
  /(\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\))/g;

const styles = StyleSheet.create({
  paragraph: {
    marginBottom: 4,
    fontSize: 9,
    lineHeight: 1.4,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  italic: {
    fontFamily: 'Helvetica-Oblique',
  },
  link: {
    color: '#1d4ed8',
    textDecoration: 'underline',
  },
  list: {
    marginBottom: 4,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  bullet: {
    width: 10,
    fontSize: 9,
  },
  listItemText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.4,
  },
});

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
      nodes.push(
        <Text key={`${keyPrefix}-b-${part++}`} style={styles.bold}>
          {match[2]}
        </Text>,
      );
    } else if (match[3] !== undefined) {
      nodes.push(
        <Text key={`${keyPrefix}-i-${part++}`} style={styles.italic}>
          {match[3]}
        </Text>,
      );
    } else if (match[4] !== undefined && match[5] !== undefined) {
      nodes.push(
        <Link key={`${keyPrefix}-a-${part++}`} src={match[5]} style={styles.link}>
          {match[4]}
        </Link>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
};

export const markdownToPdf = (markdown?: string): ReactNode => {
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
        <View key={listKey} style={styles.list}>
          {items.map((item, index) => (
            <View key={`${listKey}-${index}`} style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listItemText}>
                {renderInline(item, `${listKey}-${index}`)}
              </Text>
            </View>
          ))}
        </View>,
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
      <Text key={pKey} style={styles.paragraph}>
        {renderInline(paragraphLines.join(' '), pKey)}
      </Text>,
    );
  }

  return <>{blocks}</>;
};
