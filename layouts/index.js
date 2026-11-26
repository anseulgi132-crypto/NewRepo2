import panel from './panel.js';

import { readFileSync } from 'node:fs';

const header = readFileSync(
  new URL('../components/header.html', import.meta.url),
  'utf-8'
);

const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

export default function layout(content, meta, toc) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(meta.title)} - 심상 시커 Wiki</title>
<link rel="stylesheet" href="/css/style.css">
<script src="/js/include.js"></script>
</head>
<body>
<div id="header">${header}</div>
<main>
<h1 class="content-title">${esc(meta.title)}</h1>

<div class="up-box">
<div>

${meta.quote
  ? `<p class="quote">${esc(meta.quote)}</p>`
  : ''}

${meta.quote_from
  ? `<p class="quote-from">${esc(meta.quote_from)}</p>`
  : ''}

${(meta.intro ?? []).map(x => `<p>${esc(x)}</p>`).join('\n')}

${toc && toc !== '<ul></ul>'
  ? `<div class="toc"><h3>목차</h3>${toc}</div>`
  : ''}

</div>

${meta.panel ? panel(meta.panel) : ''}

</div>
${content}
</main>
<script>
loadComponent("party4", "/components/party4.html");
</script>
</body></html>`;
}