
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from "marked";
import markedFootnote from "marked-footnote";
import layout from '../layouts/index.js';

// HTML 특수문자 처리
function escapeHTML(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

// Markdown → HTML 변환 및 목차 생성
function convert(md) {
  let major = 0;
  let minor = 0;

  const toc = [];
  let subOpen = false;
  let majorOpen = false;

  const marked = new Marked({
    renderer: {
      heading({ text, tokens, depth }) {
        // h2, h3만 자동 번호를 붙인다.
        if (depth !== 2 && depth !== 3) {
          return `<h${depth}>${this.parser.parseInline(tokens)}</h${depth}>`;
        }

        const h2 = depth === 2;

        if (h2) {
          major++;
          minor = 0;

          if (subOpen) {
            toc.push('</ul>');
            subOpen = false;
          }

          if (majorOpen) {
            toc.push('</li>');
          }

          majorOpen = true;
        } else {
          minor++;

          if (!subOpen) {
            toc.push('<ul>');
            subOpen = true;
          }
        }

        const id = h2
          ? `${major}`
          : `${major}-${minor}`;

        const number = h2
          ? `${major}`
          : `${major}.${minor}`;

        const title = this.parser.parseInline(tokens);

        toc.push(
          `<li><a href="#${id}">${number}. ${title}</a>`
        );

        if (!h2) {
          toc.push('</li>');
        }

        const className = h2 ? 'big-title' : 'small-title';

        return `<h${depth} id="${id}" class="${className}">${title}</h${depth}>${h2 ? '\n<hr>' : ''}`;
      },

      // 기존 위키 전용 컴포넌트
      html({ raw }) {
        if (raw.trim() === '<!-- component: party4 -->') {
          return '<div id="party4"></div>';
        }

        return raw;
      },

      listitem({ tokens }) {
        const content = this.parser.parse(tokens, {
          textRenderer: false
        });

        return `<li class="trivia">${content}</li>`;
      },

      // 기존 인용문 CSS 유지
      blockquote({ tokens }) {
        const content = this.parser.parse(tokens);
        return `<blockquote class="quote">${content}</blockquote>`;
      },
    },
  });

  marked.use(markedFootnote());

  const content = marked.parse(md);

  if (subOpen) {
    toc.push('</ul>');
  }

  if (majorOpen) {
    toc.push('</li>');
  }

  return {
    content,
    toc: `<ul>${toc.join('\n')}</ul>`,
  };
}
function parseFrontMatter(text, name) {
  text = text.replace(/\r\n?/g, '\n').replace(/^\uFEFF/, '');

  // Front Matter가 없으면 빈 meta 반환
  if (!text.startsWith('---\n')) {
    return {
      meta: {},
      markdown: text
    };
  }

  const index = text.indexOf('\n---\n', 3);

  if (index === -1) {
    throw new SyntaxError(`${name}: invalid front matter`);
  }

  const rawMeta = text.slice(4, index);

  let meta;

  try {
    meta = JSON.parse(rawMeta);
  } catch (error) {
    console.error(`\n[Front Matter 오류] ${name}`);
    console.error(rawMeta);
    throw new SyntaxError(`${name}: ${error.message}`);
  }

  const markdown = text.slice(index + 5);

  return { meta, markdown };
}

// 프로젝트 경로
const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDir = join(rootDir, 'dist', 'html');
const dataDir = join(rootDir, 'data');
const metaDir = join(dataDir, 'meta');

// 파일 목록 및 출력 폴더 준비
const [files] = await Promise.all([
  readdir(dataDir),
  mkdir(outputDir, { recursive: true }),
]);

// Markdown 파일마다 HTML 생성
await Promise.all(
  files
    .filter(name => name.endsWith('.md'))
    .map(async (name) => {
      const baseName = name.slice(0, -3);

      // 1. Markdown 읽기
      const text = await readFile(
        join(dataDir, name),
        'utf-8'
      );

      // 2. Front Matter 추출
      const { meta, markdown } = parseFrontMatter(text, name);

      // 3. 별도 패널 JSON 읽기 (선택 사항)
      const panelPath = join(metaDir, baseName + '.json');

      try {
        const panel = JSON.parse(
          await readFile(panelPath, 'utf-8')
        );

        if (!panel.fields || typeof panel.fields !== 'object') {
          throw new Error(`${baseName}.json: panel fields missing`);
        }

        meta.panel = panel;

      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }

        meta.panel = null;
      }

      // 4. Markdown 변환
      const { content, toc } = convert(markdown);

      // 5. 레이아웃 적용 및 HTML 저장
      const dest = join(outputDir, baseName + '.html');

      await writeFile(
        dest,
        layout(content, meta, toc),
        'utf-8'
      );

      console.log(`Built: ${dest}`);
    })
);
