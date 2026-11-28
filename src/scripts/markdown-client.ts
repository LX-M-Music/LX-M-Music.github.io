/**
 * 客户端 Markdown 渲染（下载页更新说明用）。
 * 与构建端 markdown.ts 同配置；Release 说明来自官方发布页，
 * 渲染前做基础净化（去 script/iframe/内联事件），与旧版 sanitizeReleaseBody 一致。
 */
import { marked } from 'marked';

let configured = false;

function ensureConfigured(): void {
  if (configured) return;
  configured = true;
  marked.use({
    gfm: true,
    breaks: false,
    renderer: {
      link({ href, title, tokens }: { href: string; title?: string | null; tokens: unknown[] }) {
        // @ts-expect-error marked 注入的 parser 上下文
        const text: string = this.parser.parseInline(tokens);
        const external = /^https?:\/\//i.test(href);
        const rel = external ? ' target="_blank" rel="noopener noreferrer"' : '';
        const titleAttr = title ? ` title="${title}"` : '';
        return `<a href="${href}"${titleAttr}${rel}>${text}</a>`;
      },
    },
  });
}

export function sanitizeReleaseBody(body: string | null): string {
  if (!body || body.trim().length === 0) return '<p>本次发布没有填写更新说明。</p>';
  return body
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\r\n/g, '\n');
}

export function renderMarkdown(md: string): string {
  ensureConfigured();
  return marked.parse(sanitizeReleaseBody(md), { async: false }) as string;
}
