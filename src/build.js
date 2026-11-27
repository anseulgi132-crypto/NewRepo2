
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';
import markedFootnote from 'marked-footnote';
import { render, components } from '../layouts/index.js';

const esc = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

// Markdown → HTML 변환 및 목차 생성
function convert(md) {
  let major = 0;
  let minor = 0;

  const toc = [];
  let subOpen = false;
  let majorOpen = false;

  const marked = new Marked({
    renderer: {
      heading({ tokens, depth }) {
        const content = this.parser.parseInline(tokens);
        const h2 = depth === 2;

        // h2, h3만 자동 번호를 붙인다.
        // 단, h2보다 먼저 등장한 h3는 일반 제목으로 처리한다.
        if (
          (!h2 && depth !== 3) ||
          (depth === 3 && major === 0)
        ) {
          return `<h${depth}>${content}</h${depth}>\n`;
        }

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

        // 목차에서는 링크나 강조 등의 마크다운 서식을 제거
        const tocText = esc(
          this.parser.parseInline(
            tokens,
            this.parser.textRenderer
          )
        );

        toc.push(
          `<li><a href="#${id}">${number}. ${tocText}</a>`
        );

        if (!h2) {
          toc.push('</li>');
        }

        const className = h2
          ? 'big-title'
          : 'small-title';

        return `<h${depth} id="${id}" class="${className}">${content}</h${depth}>\n`;
      },

      // 기존 위키 전용 컴포넌트
      html({ raw }) {
        const name = raw.trim();

        if (
          name.startsWith('<!--') &&
          Object.hasOwn(components, name)
        ) {
          return components[name];
        }

        return false;
      },

      // 기존 리스트 CSS 유지
      listitem({ tokens, loose }) {
        const content = this.parser.parse(tokens, loose);
        return `<li class="trivia">${content}</li>\n`;
      },

      // 기존 인용문 CSS 유지
      blockquote({ tokens }) {
        const content = this.parser.parse(tokens);
        return `<blockquote class="quote">${content}</blockquote>\n`;
      },
    },
  });

  marked.use(markedFootnote());

  const content = marked.parse(md);

  // 열린 목차 태그 닫기
  if (subOpen) {
    toc.push('</ul>');
  }

  if (majorOpen) {
    toc.push('</li>');
  }

  return {
    content,
    toc: toc.length > 0
      ? `<ul>${toc.join('\n')}</ul>`
      : '',
  };
}

// Front Matter 추출
function parseFrontMatter(text, name) {
  if (text[0] === '\uFEFF') {
    text = text.slice(1);
  }

  text = text
    .replaceAll('\r\n', '\n')
    .replaceAll('\r', '\n');

  // Front Matter가 없으면 빈 meta 반환
  if (!text.startsWith('---\n')) {
    return {
      meta: {},
      markdown: text,
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

  return {
    meta,
    markdown: text.slice(index + 5),
  };
}

// 프로젝트 경로
const rootDir = dirname(
  dirname(fileURLToPath(import.meta.url))
);

const outputDir = join(rootDir, 'dist');
const docOutputDir = join(outputDir, 'html');
const dataDir = join(rootDir, 'data');
const metaDir = join(dataDir, 'meta');

// 파일 목록 및 출력 폴더 준비
const [files] = await Promise.all([
  readdir(dataDir),
  mkdir(docOutputDir, { recursive: true }),
]);

// Markdown 파일마다 HTML 생성
const dataExt = '.md';
const dataExtOffset = -dataExt.length;

await Promise.all(
  files
    .filter(name => name.endsWith(dataExt))
    .map(async (name) => {
      const baseName = name.slice(0, dataExtOffset);

      // 1. Markdown 읽기
      const text = await readFile(
        join(dataDir, name),
        'utf-8'
      );

      // 2. Front Matter 추출
      const { meta, markdown } = parseFrontMatter(
        text,
        name
      );

      // 3. 별도 패널 JSON 읽기 (선택 사항)
      const panelPath = join(
        metaDir,
        baseName + '.json'
      );

      try {
        const panel = JSON.parse(
          await readFile(panelPath, 'utf-8')
        );

        if (
          !panel.fields ||
          typeof panel.fields !== 'object' ||
          Array.isArray(panel.fields)
        ) {
          throw new Error(
            `${baseName}.json: panel fields missing`
          );
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
      const dest = join(
        baseName === 'index'
          ? outputDir
          : docOutputDir,
        baseName + '.html'
      );

      await writeFile(
        dest,
        render(content, meta, toc),
        'utf-8'
      );

      console.log(`Built: ${dest}`);
    })
);
