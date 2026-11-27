const partyMember = (page, image, color, name) => `\
<a href="${page}">
  <span class="image-container">
    <span class="image-crop">
      <img src="/image/${image}">
    </span>
  </span>
  <span style="background-color: ${color};"><strong>${name}</strong></span>
</a>`;

export default `\
<div class="party-template">
  <p class="party-name"><ruby> 심상 <rt>SHINSHO</rt></ruby><ruby> 탐색부 <rt>SEEKERS</rt></ruby></p>
  <div class="party-member">
    ${partyMember('ryo',     'ryo1.png',     '#C35F69', '주인공(심상 시커 4)')}
    ${partyMember('harnire', 'harnire1.png', '#296A31', '하르니레')}
    ${partyMember('kohei',   'kohei1.png',   '#005cac', '시노하라 코헤이')}
    ${partyMember('kana',    'kana1.png',    '#FFAB51', '오가와 카나')}
    ${partyMember('shuichi', 'shuichi1.png', '#418781', '키리시마 슈이치')}
    ${partyMember('towa',    'towa1.png',    '#DCA1E9', '히가시야마 토와')}
  </div>
</div>`;
