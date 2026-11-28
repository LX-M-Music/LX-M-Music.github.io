/**
 * 构建时 Markdown → HTML（文档与更新说明共用）。
 * marked v15（token 版 renderer），GFM 表格、标题锚点、外链新标签。
 */
import { marked } from 'marked';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80) || 'h';
}

let configured = false;

function ensureConfigured(): void {
  if (configured) return;
  configured = true;

  marked.use({
    gfm: true,
    breaks: false,
    renderer: {
      heading({ tokens, depth }: { tokens: unknown[]; depth: number }) {
        // @ts-expect-error marked 注入的 parser 上下文
        const text: string = this.parser.parseInline(tokens);
        const slug = slugify(text);
        return `<h${depth} id="${slug}"><a class="h-anchor" href="#${slug}" aria-hidden="true">#</a>${text}</h${depth}>\n`;
      },
      link({ href, title, tokens }: { href: string; title?: string | null; tokens: unknown[] }) {
        // @ts-expect-error marked 注入的 parser 上下文
        const text: string = this.parser.parseInline(tokens);
        const titleAttr = title ? ` title="${title}"` : '';
        const external = /^https?:\/\//i.test(href);
        const rel = external ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${href}"${titleAttr}${rel}>${text}</a>`;
      },
    },
  });
}

/** 渲染 Markdown 为 HTML。内容全部来自本仓库/官方 Release，信任级别与旧版一致。 */
export function renderMarkdown(md: string): string {
  ensureConfigured();
  return marked.parse(md ?? '', { async: false }) as string;
}
