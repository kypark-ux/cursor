// ======== 매핑 테이블 ========
const COUNTRY_PREFIX = {"KR":"880","JP":"450","GB":"500","US":"000"};
const COLOR_CODE = {"WHITE":"01","BLACK":"02","NAVY":"03","GRAY":"04","RED":"05","BLUE":"06","GREEN":"07","YELLOW":"08","BEIGE":"09","BROWN":"10","IVORY":"11","CHARCOAL":"12","ORANGE":"13","PINK":"14","PURPLE":"15","KHAKI":"16"};
const SIZE_CODE  = {"XS":"01","S":"02","M":"03","L":"04","XL":"05","XXL":"06","XXXL":"07","90":"21","95":"22","100":"23","105":"24","110":"25"};
const PRODUCT_OVERRIDES = {"MD NOTE L":"30045","MDNOTE L":"30045","MD노트L":"30045"};

// ======== 유틸 ========
function normalizeKey(s){
  return (s||"").toString().normalize('NFKD').toUpperCase().replace(/[^\w]+/g,' ').replace(/\s+/g,' ').trim();
}

// 라벨 포맷터: 20자 이상이면 2줄로 개행
function formatLabelForTwoLines(text){
  const t = (text||'').trim();
  if (t.length < 20) return t;
  const mid = Math.floor(t.length/2);
  let split = t.lastIndexOf(' ', mid);
  if (split === -1) split = t.indexOf(' ', mid);
  if (split === -1 || split < 8) split = 20;
  const a = t.slice(0, split).trim();
  const b = t.slice(split).trim();
  return a + '<br>' + b;
}

function productToCode(name){
  if(!name) return "00000";
  const key = normalizeKey(name);
  if (PRODUCT_OVERRIDES[key]) return PRODUCT_OVERRIDES[key];
  let h = 2166136261 >>> 0;
  for (let i=0;i<key.length;i++){ h ^= key.charCodeAt(i); h = Math.imul(h,16777619)>>>0; }
  return String(h % 100000).padStart(5,'0');
}

function colorToCode(color){
  if(!color) return "00";
  const key = normalizeKey(color);
  if (COLOR_CODE[key]) return COLOR_CODE[key];
  let sum = 0; for(let i=0;i<key.length;i++) sum += key.charCodeAt(i);
  return String(sum % 100).padStart(2,'0');
}

function sizeToCode(size){
  if(!size) return "00";
  const key = normalizeKey(size).replace(/\s+/g,'');
  if (SIZE_CODE[key]) return SIZE_CODE[key];
  let sum = 0; for(let i=0;i<key.length;i++) sum += key.charCodeAt(i);
  return String(sum % 100).padStart(2,'0');
}

function ean13CheckDigit(twelve){
  const digits = twelve.split('').map(d=>parseInt(d,10)); let sum = 0;
  for (let i=0;i<12;i++){ sum += digits[i]*((i%2===0)?1:3); }
  const mod = sum % 10; return (mod===0)?0:10-mod;
}

// 포맷별 콘텐츠 생성
function contentForFormat(fmt, parts, pn, sz, cn){
  const base12 = parts.prefix + parts.prod + parts.size + parts.clr; // 12자리
  
  if (fmt === 'EAN13'){
    // EAN-13: 12자리 + 체크디지트 = 13자리
    const cd = ean13CheckDigit(base12);
    return { value: base12 + String(cd), display: true };
  }
  
  if (fmt === 'UPC'){
    // UPC-A: 11자리 + 체크디지트 = 12자리 (JsBarcode가 체크 계산)
    if (base12.length >= 11) {
      return { value: base12.slice(0, 11), display: true };
    } else {
      // 11자리 미만이면 0으로 패딩
      return { value: base12.padEnd(11, '0'), display: true };
    }
  }
  
  if (fmt === 'EAN8'){
    // EAN-8: 7자리 + 체크디지트 = 8자리 (JsBarcode가 체크 계산)
    let key = (pn||'') + '|' + (sz||'') + '|' + (cn||'');
    let h = 2166136261 >>> 0;
    for (let i=0;i<key.length;i++){ h ^= key.charCodeAt(i); h = Math.imul(h,16777619)>>>0; }
    const d7 = String(h % 10000000).padStart(7,'0');
    return { value: d7, display: true };
  }
  
  if (fmt === 'ITF14'){
    // ITF-14: 13자리 + 체크디지트 = 14자리 (JsBarcode가 체크 계산)
    const d13 = ('0' + base12).slice(-13);
    return { value: d13, display: true };
  }
  
  if (fmt === 'CODE128'){
    // CODE128: 가변 길이, 12자리 그대로 사용
    return { value: base12, display: true };
  }
  
  if (fmt === 'CODE39'){
    // CODE39: 가변 길이, 12자리 그대로 사용
    return { value: base12, display: true };
  }
  
  if (fmt === 'ITF'){
    // ITF: 짝수 자리만 지원, 12자리 그대로 사용
    return { value: base12, display: true };
  }
  
  if (fmt === 'MSI'){
    // MSI: 가변 길이, 12자리 그대로 사용
    return { value: base12, display: true };
  }
  
  if (fmt === 'codabar'){
    // Codabar: 가변 길이, 12자리 그대로 사용
    return { value: base12, display: true };
  }
  
  // 기본값: EAN-13
  const cd = ean13CheckDigit(base12);
  return { value: base12 + String(cd), display: true };
}

function buildEAN13(countryCode, productName, sizeName, colorName){
  const prefix = COUNTRY_PREFIX[countryCode] || "000";
  const prod = productToCode(productName);
  const size = sizeToCode(sizeName);
  const clr  = colorToCode(colorName);
  const body12 = prefix + prod + size + clr;
  const cd = ean13CheckDigit(body12);
  return { code13: body12 + String(cd), parts:{prefix, prod, size, clr, cd} };
}

// ======== 메인 애플리케이션 ========
(function(){
  const $ = s=>document.querySelector(s);
  const preview = $('#preview');
  const labelEl = $('#preview-label');

  // Label coloring synced with bar color
  function syncLabelColor(){
    labelEl.style.color = $('#bar-color').value || '#000000';
  }

  // Render Barcode
  function renderBarcode(){
    const fmtSel = document.getElementById('barcode-format');
    const fmt = fmtSel ? fmtSel.value : 'EAN13';
    const cc = $('#country').value;
    const pn = $('#product-name').value;
    const sz = $('#size').value;
    const cn = $('#color-name').value;
    const {code13, parts} = buildEAN13(cc, pn, sz, cn);
    const content = contentForFormat(fmt, parts, pn, sz, cn);

    // Set label (제품명/사이즈/(컬러))
    const labelText = `${pn || ''} ${sz || ''}${cn ? ' ('+cn+')' : ''}`.trim();
    labelEl.innerHTML = formatLabelForTwoLines(labelText);
    syncLabelColor();

    // Code breakdown
    $('#code').textContent = content.value;
    $('#explain').textContent = `구성: [국가 ${parts.prefix}] [제품 ${parts.prod}] [사이즈 ${parts.size}] [컬러 ${parts.clr}] + 체크디지트 ${parts.cd}`;

    // Draw barcode
    preview.innerHTML = '';
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('id','barcodeSvg');
    preview.appendChild(svg);
    try{
      JsBarcode(svg, content.value, {
        format: fmt, // 선택된 포맷 사용
        lineColor: $('#bar-color').value || '#000000',
        background: $('#bg-color').value || '#ffffff',
        width: clampInt($('#line-width').value, 1, 10),
        height: clampInt($('#bar-height').value, 20, 300),
        margin: clampInt($('#margin').value, 0, 40),
        displayValue: content.display, // 포맷별 표시 여부 사용
        fontSize: clampInt($('#font-size').value, 8, 32),
      });
    }catch(e){
      preview.removeChild(svg);
      const p = document.createElement('p');
      p.textContent = '생성 실패: ' + (e && e.message ? e.message : e);
      preview.appendChild(p);
    }
  }

  function clampInt(v,min,max){ v=parseInt(v,10); if(isNaN(v)) v=min; return Math.max(min, Math.min(max,v)); }

  // Export buttons
  $('#btn-save-svg').addEventListener('click', () => {
    const svg = document.querySelector('#preview svg');
    if (!svg){ alert('먼저 바코드를 생성하세요.'); return; }
    
    // 파일명 생성: 제품명_사이즈_컬러.svg
    const pn = $('#product-name').value || 'product';
    const sz = $('#size').value || 'size';
    const cn = $('#color-name').value || 'color';
    const filename = `${pn}_${sz}_${cn}.svg`.replace(/\s+/g, '_');
    
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);
    if(!source.match(/^<svg[^>]+xmlns=/)){ source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"'); }
    const blob = new Blob([source], {type:'image/svg+xml;charset=utf-8'});
    downloadBlob(blob, filename);
  });

  $('#btn-save-png').addEventListener('click', async () => {
    const svg = document.querySelector('#preview svg');
    if (!svg){ alert('먼저 바코드를 생성하세요.'); return; }
    
    // 파일명 생성: 제품명_사이즈_컬러.png
    const pn = $('#product-name').value || 'product';
    const sz = $('#size').value || 'size';
    const cn = $('#color-name').value || 'color';
    const filename = `${pn}_${sz}_${cn}.png`.replace(/\s+/g, '_');
    
    const url = await svgToPngURL(svg);
    const blob = await (await fetch(url)).blob();
    downloadBlob(blob, filename);
  });

  $('#btn-copy').addEventListener('click', async () => {
    try{
      const svg = document.querySelector('#preview svg');
      if (!svg){ alert('먼저 바코드를 생성하세요.'); return; }
      
      const url = await svgToPngURL(svg);
      const blob = await (await fetch(url)).blob();
      await navigator.clipboard.write([new ClipboardItem({'image/png': blob})]);
      alert('PNG 복사 완료!');
    }catch(e){ alert('복사 실패: 브라우저 권한을 확인해주세요.'); }
  });

  async function svgToPngURL(svg){
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);
    if(!source.match(/^<svg[^>]+xmlns=/)){ source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"'); }
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);
    const img = new Image();
    const w = parseFloat(svg.getAttribute('width')) || svg.getBBox().width;
    const h = parseFloat(svg.getAttribute('height')) || svg.getBBox().height;
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w*scale));
    canvas.height = Math.max(1, Math.round(h*scale));
    const ctx = canvas.getContext('2d');
    await new Promise(resolve => { img.onload = resolve; img.src = url; });
    ctx.setTransform(scale,0,0,scale,0,0);
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/png');
  }

  function downloadBlob(blob,name){
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name;
    document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },0);
  }

  // Bind inputs
  ['country','product-name','size','color-name','line-width','bar-height','margin','font-size','bar-color','bg-color','display-value','barcode-format'].forEach(id => {
    const el = document.getElementById(id); if (el) el.addEventListener('input', ()=>{
      renderBarcode();
      if (id==='bar-color') syncLabelColor();
    });
  });

  // Initial values & first render
  document.getElementById('product-name').value = '노트';
  document.getElementById('size').value = 'L';
  document.getElementById('color-name').value = 'White';
  document.getElementById('bar-height').value = '60';
  renderBarcode();
})();
