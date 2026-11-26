import { marked } from 'marked';

const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

// Markdown → HTML 변환
const md = (v) => marked.parseInline(String(v ?? ''));

export default function panel(p) {
  const fields = Object.entries(p.fields).map(([key, value]) => {
    const values = Array.isArray(value)
      ? value.map(md).join('<br>')
      : md(value);

    return `
      <div class="panel-content">
        <p class="panel-content1">${esc(key)}</p>
        <p class="panel-content2">${values}</p>
      </div>`;
  }).join('\n');

  const fontColor = p['font-color']
    ? `color: ${esc(p['font-color'])};`
    : '';

  return `
    <div class="panel" style="background-color: ${esc(p.color)}; ${fontColor}">
      <h3>${esc(p.name)}</h3>
      <img src="${esc(p.image)}" alt="${esc(p.image_alt)}">
      ${fields}
    </div>`;
}