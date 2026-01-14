const escapeHtml = (value) => {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
};

const sanitizeHref = (href) => {
  const trimmed = String(href).trim();
  const lower = trimmed.toLowerCase();

  if (lower.startsWith('http://')) return trimmed;
  if (lower.startsWith('https://')) return trimmed;
  if (lower.startsWith('mailto:')) return trimmed;
  if (lower.startsWith('#')) return trimmed;
  if (lower.startsWith('/')) return trimmed;

  return '#';
};

const applyInlineMarkdown = (rawText) => {
  let escaped = escapeHtml(rawText);

  const codeSpans = [];
  escaped = escaped.replace(/`([^`]+)`/g, (_match, code) => {
    const index = codeSpans.length;
    codeSpans.push(`<code>${code}</code>`);
    return `@@CODE${index}@@`;
  });

  escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
    const safeHref = escapeHtml(sanitizeHref(href));
    return `<a href="${safeHref}" target="_blank" rel="noreferrer noopener">${label}</a>`;
  });

  escaped = escaped.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');
  escaped = escaped.replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>');

  escaped = escaped.replace(/@@CODE(\d+)@@/g, (_match, indexText) => {
    const index = Number(indexText);
    return codeSpans[index] ?? '';
  });

  return escaped;
};

export const renderMarkdownToHtml = (markdown) => {
  const lines = String(markdown ?? '').replaceAll('\r\n', '\n').split('\n');

  let inCodeBlock = false;
  let codeLines = [];
  let paragraphLines = [];
  let listType = null;
  let listItems = [];

  const htmlParts = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    const body = applyInlineMarkdown(paragraphLines.join('<br/>'));
    htmlParts.push(`<p>${body}</p>`);
    paragraphLines = [];
  };

  const flushList = () => {
    if (!listType || listItems.length === 0) {
      listType = null;
      listItems = [];
      return;
    }
    const itemsHtml = listItems.map((item) => `<li>${applyInlineMarkdown(item)}</li>`).join('');
    htmlParts.push(`<${listType}>${itemsHtml}</${listType}>`);
    listType = null;
    listItems = [];
  };

  for (const line of lines) {
    if (inCodeBlock) {
      if (line.trim().startsWith('```')) {
        inCodeBlock = false;
        htmlParts.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        codeLines = [];
      } else {
        codeLines.push(line);
      }
      continue;
    }

    if (line.trim().startsWith('```')) {
      flushParagraph();
      flushList();
      inCodeBlock = true;
      continue;
    }

    if (line.trim() === '') {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      htmlParts.push(`<h${level}>${applyInlineMarkdown(text)}</h${level}>`);
      continue;
    }

    const ulMatch = line.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      flushParagraph();
      if (listType && listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(ulMatch[1]);
      continue;
    }

    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      flushParagraph();
      if (listType && listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(olMatch[1]);
      continue;
    }

    if (listType) flushList();
    paragraphLines.push(line);
  }

  if (inCodeBlock) {
    htmlParts.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
  } else {
    flushParagraph();
    flushList();
  }

  return htmlParts.join('\n');
};

