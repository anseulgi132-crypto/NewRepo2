import panel from './panel.js';
import party4 from './party4.js';
import { esc } from './util.js';

export const components = {
  '<!-- component: party4 -->': party4,
};

export const render = (content, meta, toc) => `\
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(meta.title)} - 심상 시커즈 Wiki</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <header>
    <a href="/">
      <img src="/image/logo.png" alt="로고">
      <div class="title-box">
        <h1>심상 시커즈 Wiki</h1>
        <p>SHINSHO SEEKERS</p>
      </div>
    </a>
  </header>
  <main>
    <h1 class="content-title">${esc(meta.title)}</h1>
    <div class="up-box">
      <div>
      ${
        meta.quote
        ? `<p class="quote">${esc(meta.quote)}</p>`
        : ''
      }
      ${
        meta.quote_from
        ? `<p class="quote-from">${esc(meta.quote_from)}</p>`
        : ''
      }
      ${
        meta.intro?.map(x => `<p>${esc(x)}</p>`).join('\n') ?? ''
      }
      ${
        toc
        ? `<div class="toc"><h3>목차</h3>${toc}</div>`
        : ''
      }
      </div>
      ${meta.panel ? panel(meta.panel) : ''}
    </div>
    ${content}
  </main>
</body>
</html>`;
