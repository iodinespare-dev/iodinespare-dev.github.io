/* ==========================================================
   朽木毅行者 2026 · 網站互動
   ------------------------------------------------------------
   ★ 只需修改下面這個 CONFIG，不用改其他程式碼 ★
   ========================================================== */
const CONFIG = {
  // 活動開始時間（香港時間）。改這裡就會更新倒數
  raceStart: '2026-11-20T08:00:00+08:00',

  // 籌款目標（港幣）
  target: 40000,

  // 目前已籌金額（港幣）。捐款後更新這個數字即可，進度條會自動計算
  raised: 0,

  // 樂施會官方捐款頁（隊伍專頁）
  donateUrl: 'https://event.oxfamtrailwalker.org.hk/tc/Donation/PageTeam?tId=a0yUPYrpMuU%3D'
};

(function () {
  'use strict';

  /* ---------- 1. 倒數計時 ---------- */
  const raceDate = new Date(CONFIG.raceStart).getTime();
  const el = {
    d: document.getElementById('cd-d'),
    h: document.getElementById('cd-h'),
    m: document.getElementById('cd-m'),
    s: document.getElementById('cd-s'),
    daysLeft: document.getElementById('daysLeft')
  };

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const gap = raceDate - Date.now();
    if (gap <= 0) {
      el.d.textContent = '00'; el.h.textContent = '00';
      el.m.textContent = '00'; el.s.textContent = '00';
      if (el.daysLeft) el.daysLeft.textContent = '0';
      return;
    }
    const total = Math.floor(gap / 1000);
    const d = Math.floor(total / 86400);
    const h = Math.floor((total % 86400) / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;

    el.d.textContent = d;
    el.h.textContent = pad(h);
    el.m.textContent = pad(m);
    el.s.textContent = pad(s);
    if (el.daysLeft) el.daysLeft.textContent = d;
  }
  tick();
  setInterval(tick, 1000);

  /* ---------- 2. 籌款進度條 ---------- */
  const raised = Math.max(0, Number(CONFIG.raised) || 0);
  const target = Math.max(1, Number(CONFIG.target) || 40000);
  const pct = Math.min(100, (raised / target) * 100);

  const raisedEl = document.getElementById('raised');
  const barEl = document.getElementById('bar');
  const trackEl = document.querySelector('.progress__track');
  const hintEl = document.getElementById('progressHint');

  if (raisedEl) raisedEl.textContent = 'HK$' + raised.toLocaleString('en-US');
  if (trackEl) {
    trackEl.setAttribute('aria-valuemax', target);
    trackEl.setAttribute('aria-valuenow', raised);
  }
  if (hintEl) {
    if (raised === 0) {
      hintEl.textContent = '籌款剛起步，目標 HK$' + target.toLocaleString('en-US');
    } else if (pct >= 100) {
      hintEl.textContent = '已達標！感謝每一位同行的人。';
    } else {
      hintEl.textContent = '已完成 ' + pct.toFixed(0) + '%，尚餘 HK$' +
        (target - raised).toLocaleString('en-US') + ' 達標';
    }
  }
  // 進場後才跑動畫
  requestAnimationFrame(function () {
    setTimeout(function () { if (barEl) barEl.style.width = pct + '%'; }, 350);
  });

  /* ---------- 3. 相片牆（訓練實錄 + 支援隊，縮圖 + 雙擊放大） ----------
     相片清單由 update_photos.py 產生：
       訓練實錄 ← 「照片」資料夾      → assets/gallery-photos.js
       支援隊   ← 「support team」資料夾 → assets/support-photos.js
     加相片後重新執行 python3 update_photos.py 即可，唔使改這裡。          */

  function renderGrid(gridId, emptyId, list, altText) {
    const box = document.getElementById(gridId);
    const empty = document.getElementById(emptyId);
    if (!box) return null;
    const items = (window[list] && window[list].length) ? window[list] : [];
    if (items.length) {
      let html = '';
      items.forEach(function (p, i) {
        html += '<figure data-full="' + p.full + '">' +
          '<img src="' + p.thumb + '" alt="' + altText + ' ' + (i + 1) +
          '" loading="lazy" decoding="async"></figure>';
      });
      box.innerHTML = html;
    } else if (empty) {
      empty.hidden = false;
    }
    return box;
  }

  const grid = renderGrid('grid', 'galleryEmpty', 'GALLERY_PHOTOS', '訓練照片');
  const sGrid = renderGrid('supportGrid', 'supportEmpty', 'SUPPORT_PHOTOS', '支援隊相片');

  /* 燈箱 */
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const lbClose = document.getElementById('lbClose');
  const lbZoom = document.getElementById('lbZoom');

  function openLb(src) {
    if (!lb || !lbImg) return;
    lbImg.src = src;
    lb.classList.remove('is-actual');
    if (lbZoom) lbZoom.textContent = '放大至原尺寸（1:1）';
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeLb() {
    if (!lb) return;
    lb.hidden = true;
    lb.classList.remove('is-actual');
    if (lbImg) lbImg.src = '';
    document.body.style.overflow = '';
  }

  // 兩個相片牆都綁定同一個燈箱
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  [grid, sGrid].forEach(function (box) {
    if (!box || !lb) return;
    box.addEventListener('dblclick', function (e) {
      const fig = e.target.closest('figure[data-full]');
      if (fig) openLb(fig.getAttribute('data-full'));
    });
    // 觸控裝置沒有雙擊手感，改為單點開啟
    if (!finePointer) {
      box.addEventListener('click', function (e) {
        const fig = e.target.closest('figure[data-full]');
        if (fig) openLb(fig.getAttribute('data-full'));
      });
    }
  });
  if (lbClose) lbClose.addEventListener('click', closeLb);
  if (lbZoom) {
    lbZoom.addEventListener('click', function () {
      lb.classList.toggle('is-actual');
      lbZoom.textContent = lb.classList.contains('is-actual') ? '縮回視窗大小' : '放大至原尺寸（1:1）';
    });
  }
  if (lb) {
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.id === 'lbStage') closeLb();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lb && !lb.hidden) closeLb();
  });

  /* ---------- 5. 捐款按鈕 ---------- */
  const btn = document.getElementById('donateBtn');
  if (btn && CONFIG.donateUrl && CONFIG.donateUrl.trim() !== '') {
    btn.href = CONFIG.donateUrl.trim();
  }

  /* ---------- 6. 手機底部捐助條 ---------- */
  const bar = document.querySelector('.mobilebar');
  if (bar) {
    const onScroll = function () {
      if (window.scrollY > 420) bar.classList.add('show');
      else bar.classList.remove('show');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
