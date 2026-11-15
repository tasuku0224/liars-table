/* ==========================================================
   LIARS TABLE — main.js
   ========================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------
     Data — 円卓の八人（第1章〜第2章の記述にもとづく）
     ------------------------------------------------------ */
  var CHARS = [
    {
      no: '01',
      name: '藤宮 彩音',
      kana: 'ふじみや あやね',
      age: '26',
      role: '動画配信者',
      status: 'FULL SCALE',
      desc: 'モデル並みの容姿と、作り込まれた笑顔。喋ることの全部が演技で、ノイズは途切れない。それでも席に着くとき、指先だけが震えていた。',
      quote: '「藤宮彩音、二十六歳。動画配信をやってます。フォロワー、百八十万人」',
      noise: 0.97,
      foot: '連続ノイズ ／ 全発話が演技'
    },
    {
      no: '02',
      name: '白瀬 澪',
      kana: 'しらせ みお',
      age: '17',
      role: '高校生',
      status: 'SILENT',
      desc: '最後に円卓へ現れた、制服姿の少女。年齢に似合わない落ち着きで、最初からそこが自分の席だったように座った。',
      quote: '「初めまして。白瀬澪、十七歳です。今日はよろしくお願いします」',
      noise: 0,
      foot: '反応なし ／ ノイズを検出できない',
      silent: true
    },
    {
      no: '03',
      name: '三島 悟',
      kana: 'みしま さとる',
      age: '33',
      role: '雀荘経営',
      status: 'INTERMITTENT',
      desc: '痩せた男。指先で空のチップを回す仕草。「運がいい」の一言にだけ、ノイズが跳ねた。この部屋を賭場として測っている。',
      quote: '「三島悟、三十三。雀荘経営……ま、賭け事全般が仕事みたいなもんだ」',
      noise: 0.45,
      foot: '部分ノイズ ／ 運の話に反応'
    },
    {
      no: '04',
      name: '葉山 志乃',
      kana: 'はやま しの',
      age: '38',
      role: '心理カウンセラー',
      status: 'QUIET',
      desc: '呼吸も姿勢も、完璧に管理されている。円堂の「空っぽ」とは違う、訓練で整えられた静けさ。円卓で最も長く、こちらを見ていた。',
      quote: '「葉山志乃、三十八歳。心理カウンセラーです」',
      noise: 0.04,
      foot: '制御された静寂 ／ 材料を出さない'
    },
    {
      no: '05',
      name: '黒崎 鷹久',
      kana: 'くろさき たかひさ',
      age: '52',
      role: '元・詐欺師',
      status: 'PARTIAL',
      desc: '恰幅のいい初老の男。場を温める話術で、初対面の空気をほどいてみせる。嘘の「量」ではなく「配分」で勝負するタイプ。',
      quote: '「黒崎鷹久、五十二。元・詐欺師、なんて言えばいいかな」',
      noise: 0.62,
      foot: '断続的なノイズ ／ 冗談と本音が混在'
    },
    {
      no: '06',
      name: '久世 玲央',
      kana: 'くぜ れお',
      age: '17',
      role: '高校生',
      status: 'READING',
      desc: '三年前、父の会社を潰したのは自分の「読み」だったと信じている。嘘がノイズとして聞こえる力を封じて、普通の高校生として三年間を過ごしてきた。',
      quote: '「俺は、人の嘘が分かる。ほぼ百パーセント、分かってしまう」',
      meter: 'all',
      foot: '円卓の全八名を、同時に聴取中'
    },
    {
      no: '07',
      name: '若槻 圭',
      kana: 'わかつき けい',
      age: '21',
      role: '大学生',
      status: 'UNSTABLE',
      desc: '爽やかな笑顔の大学生。「ただの大学生」という言葉に、小さなノイズ。ポケットのスマホを、ずっと握りしめている。',
      quote: '「若槻圭、二十一。ただの大学生です」',
      noise: 0.38,
      foot: '不安定なノイズ ／ 安心と不安の綱渡り'
    },
    {
      no: '08',
      name: '五十嵐 徹',
      kana: 'いがらし とおる',
      age: '45',
      role: '元・刑事',
      status: 'CONTROLLED',
      desc: '短い言葉だけで名乗った元刑事。嘘をつく代わりに「言わない」ことを選ぶ。読むための材料そのものを、出してこない。',
      quote: '「五十嵐徹。四十五。元・刑事だ」',
      noise: 0.12,
      foot: '低ノイズ ／ 発話そのものが最小限'
    }
  ];

  var state = {
    index: 5,
    t0: performance.now(),
    switchAt: 0
  };

  /* ------------------------------------------------------
     Intro
     ------------------------------------------------------ */
  var intro = document.getElementById('intro');
  var skipBtn = document.getElementById('skipIntro');
  var introCanvas = document.getElementById('introNoise');
  var introDone = false;
  var rafIntro = null;

  function endIntro() {
    if (introDone) return;
    introDone = true;
    if (rafIntro) cancelAnimationFrame(rafIntro);
    if (!intro) return;
    intro.classList.add('is-hidden');
    window.setTimeout(function () {
      if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
    }, 1000);
  }

  if (intro) {
    if (reduceMotion) {
      endIntro();
    } else {
      drawIntroNoise();
      window.setTimeout(endIntro, 2400);
      if (skipBtn) {
        skipBtn.addEventListener('click', endIntro);
      }
      window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') endIntro();
      });
    }
  }

  function fitCanvas(canvas) {
    if (!canvas) return null;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth || canvas.parentNode.clientWidth || 320;
    var h = canvas.clientHeight || 160;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    var ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }

  function drawIntroNoise() {
    var box = fitCanvas(introCanvas);
    if (!box) return;
    var ctx = box.ctx, w = box.w, h = box.h;
    var start = performance.now();

    function frame(now) {
      var t = (now - start) / 1000;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      // horizontal glitch bars
      var bars = 7;
      for (var b = 0; b < bars; b++) {
        var y = ((b + 1) / (bars + 1)) * h + Math.sin(t * (2.1 + b * 0.7) + b) * h * 0.05;
        var amp = (0.4 + 0.6 * Math.abs(Math.sin(t * (3.1 + b) + b * 2))) * h * 0.055;
        ctx.beginPath();
        for (var x = 0; x <= w; x += 3) {
          var n = Math.sin(x * 0.06 + t * 9 + b * 2) * Math.sin(x * 0.017 - t * 3.4 + b);
          n += Math.sin(x * 0.21 + t * 17) * 0.35;
          var yy = y + n * amp;
          if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
        }
        ctx.strokeStyle = b === 3 ? 'rgba(217,56,58,0.5)' : 'rgba(212,175,106,0.34)';
        ctx.lineWidth = b === 3 ? 1.4 : 0.9;
        ctx.stroke();
      }

      // random static blocks
      for (var i = 0; i < 14; i++) {
        if (Math.random() > 0.55) continue;
        var bw = 6 + Math.random() * 90;
        var bh = 1 + Math.random() * 3;
        ctx.fillStyle = 'rgba(234,230,220,' + (0.03 + Math.random() * 0.12) + ')';
        ctx.fillRect(Math.random() * w, Math.random() * h, bw, bh);
      }
      ctx.globalCompositeOperation = 'source-over';
      rafIntro = requestAnimationFrame(frame);
    }
    rafIntro = requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------
     Hero grain
     ------------------------------------------------------ */
  var heroCanvas = document.getElementById('heroGrain');
  function drawHeroGrain() {
    if (!heroCanvas || reduceMotion) return;
    var box = fitCanvas(heroCanvas);
    if (!box) return;
    var ctx = box.ctx, w = box.w, h = box.h;
    var dots = [];
    for (var i = 0; i < 46; i++) {
      dots.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vy: 0.08 + Math.random() * 0.3,
        r: Math.random() * 1.2 + 0.3,
        a: 0.06 + Math.random() * 0.22
      });
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        d.y -= d.vy;
        if (d.y < -4) { d.y = h + 4; d.x = Math.random() * w; }
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(212,175,106,' + d.a + ')';
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    window.addEventListener('resize', function () { fitCanvas(heroCanvas); });
  }
  drawHeroGrain();

  /* ------------------------------------------------------
     Build seats
     ------------------------------------------------------ */
  var seatsLayer = document.getElementById('seatsLayer');
  var seatList = document.getElementById('seatList');
  var seatEls = [];
  var listEls = [];

  function seatPos(i) {
    var angle = (-90 + i * 45) * Math.PI / 180;
    return { x: 50 + 41.2 * Math.cos(angle), y: 50 + 41.2 * Math.sin(angle) };
  }

  CHARS.forEach(function (c, i) {
    var p = seatPos(i);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'seat' + (c.silent ? ' silent' : '');
    btn.style.left = p.x + '%';
    btn.style.top = p.y + '%';
    btn.textContent = c.no;
    btn.setAttribute('aria-label', c.no + ' ' + c.name + ' の紹介を表示');
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', function () { selectChar(i); });
    seatsLayer.appendChild(btn);
    seatEls.push(btn);

    var lb = document.createElement('button');
    lb.type = 'button';
    lb.className = 'seat-btn' + (c.silent ? ' silent' : '');
    lb.setAttribute('aria-pressed', 'false');
    var b = document.createElement('b');
    b.textContent = c.no;
    var s = document.createElement('span');
    s.textContent = c.name;
    lb.appendChild(b);
    lb.appendChild(s);
    lb.addEventListener('click', function () { selectChar(i); });
    seatList.appendChild(lb);
    listEls.push(lb);
  });

  /* ------------------------------------------------------
     Character panel
     ------------------------------------------------------ */
  var el = {
    no: document.getElementById('charNo'),
    status: document.getElementById('charStatus'),
    name: document.getElementById('charName'),
    kana: document.getElementById('charKana'),
    age: document.getElementById('charAge'),
    role: document.getElementById('charRole'),
    desc: document.getElementById('charDesc'),
    quote: document.getElementById('charQuote'),
    value: document.getElementById('meterValue'),
    foot: document.getElementById('meterFoot'),
    canvas: document.getElementById('meterCanvas')
  };

  function selectChar(i) {
    state.index = i;
    state.switchAt = performance.now();
    var c = CHARS[i];

    if (el.no) el.no.textContent = c.no;
    if (el.name) el.name.textContent = c.name;
    if (el.kana) el.kana.textContent = c.kana;
    if (el.age) el.age.textContent = c.age;
    if (el.role) el.role.textContent = c.role;
    if (el.desc) el.desc.textContent = c.desc;
    if (el.quote) el.quote.textContent = c.quote;
    if (el.foot) el.foot.textContent = c.foot;

    if (el.status) {
      el.status.textContent = c.status;
      el.status.classList.toggle('silent', !!c.silent);
    }
    if (el.value) {
      el.value.classList.toggle('is-silent', !!c.silent);
      el.value.textContent = (c.silent ? 0 : c.meter === 'all' ? avgNoise() * 100 : c.noise * 100).toFixed(2) + '%';
    }

    seatEls.forEach(function (b, k) {
      b.classList.toggle('is-active', k === i);
      b.setAttribute('aria-pressed', k === i ? 'true' : 'false');
    });
    listEls.forEach(function (b, k) {
      b.classList.toggle('is-active', k === i);
      b.setAttribute('aria-pressed', k === i ? 'true' : 'false');
    });

    // restart meter
    meterState.amp = c.meter === 'all' ? avgNoise() : (c.noise || 0);
    meterState.silent = !!c.silent;
    meterState.mode = c.meter === 'all' ? 'all' : 'one';
  }

  function avgNoise() {
    var sum = 0, n = 0;
    CHARS.forEach(function (c) {
      if (typeof c.noise === 'number' && c.meter !== 'all') { sum += c.noise; n++; }
    });
    return n ? sum / n : 0.4;
  }

  /* ------------------------------------------------------
     Noise meter
     ------------------------------------------------------ */
  var meterState = { amp: 0.35, silent: false, mode: 'one' };

  function drawMeter() {
    if (!el.canvas) return;
    var canvas = el.canvas;
    var box = fitCanvas(canvas);
    if (!box) return;
    var ctx = box.ctx, w = box.w, h = box.h;
    var mid = h / 2;
    var t = (performance.now() - state.t0) / 1000;
    var sinceSwitch = (performance.now() - state.switchAt) / 1000;

    ctx.clearRect(0, 0, w, h);

    // grid
    ctx.strokeStyle = 'rgba(234,230,220,0.055)';
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75].forEach(function (p) {
      ctx.beginPath();
      ctx.moveTo(0, h * p);
      ctx.lineTo(w, h * p);
      ctx.stroke();
    });
    for (var gx = 0; gx < w; gx += 34) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.stroke();
    }

    var amp = meterState.amp;

    // switch spike: brief flare then settle
    var spike = Math.exp(-sinceSwitch * 2.2) * (meterState.silent ? 0 : 0.35);

    if (meterState.silent) {
      // perfectly flat line
      ctx.beginPath();
      ctx.moveTo(0, mid);
      ctx.lineTo(w, mid);
      ctx.strokeStyle = 'rgba(255,138,139,0.85)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // slow cursor
      var cx = ((t * 0.18) % 1) * w;
      ctx.beginPath();
      ctx.arc(cx, mid, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,138,139,0.9)';
      ctx.fill();

      ctx.fillStyle = 'rgba(255,138,139,0.16)';
      ctx.fillRect(0, mid - 0.5, w, 1);
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255,138,139,0.55)';
      ctx.textAlign = 'right';
      ctx.fillText('SILENT', w - 6, mid - 10);
      ctx.textAlign = 'left';
      return;
    }

    var bars = Math.max(28, Math.floor(w / 4));
    var step = w / bars;

    ctx.beginPath();
    for (var i = 0; i <= bars; i++) {
      var x = i * step;
      var p = i / bars;
      var envelope = 0.55 + 0.45 * Math.sin(p * Math.PI);
      var v = 0;
      if (meterState.mode === 'all') {
        v = Math.sin(x * 0.10 + t * 5.1) * 0.5
          + Math.sin(x * 0.041 - t * 2.3) * 0.32
          + Math.sin(x * 0.28 + t * 11.4) * 0.18;
        v = (v * 0.5 + 0.5) * (amp + spike);
      } else {
        v = Math.sin(x * 0.075 + t * 7.2) * 0.52
          + Math.sin(x * 0.21 - t * 3.1) * 0.28
          + Math.sin(x * 0.47 + t * 15.7) * 0.14;
        v = Math.abs(v) * envelope * (amp + spike) + 0.02;
      }
      var y = mid - v * (mid - 8);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    var grad = ctx.createLinearGradient(0, 0, w, 0);
    if (amp > 0.75) {
      grad.addColorStop(0, 'rgba(212,175,106,0.55)');
      grad.addColorStop(0.45, 'rgba(232,99,100,0.95)');
      grad.addColorStop(1, 'rgba(217,56,58,0.75)');
    } else {
      grad.addColorStop(0, 'rgba(212,175,106,0.45)');
      grad.addColorStop(0.5, 'rgba(230,201,141,0.95)');
      grad.addColorStop(1, 'rgba(212,175,106,0.5)');
    }
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // mirrored ghost
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    for (var j = 0; j <= bars; j++) {
      var x2 = j * step;
      var p2 = j / bars;
      var env2 = 0.55 + 0.45 * Math.sin(p2 * Math.PI);
      var v2 = Math.sin(x2 * 0.075 - t * 6.4) * 0.5 + Math.sin(x2 * 0.19 + t * 2.7) * 0.3;
      v2 = Math.abs(v2) * env2 * (amp + spike) + 0.02;
      var y2 = mid + v2 * (mid - 8);
      if (j === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // baseline
    ctx.beginPath();
    ctx.moveTo(0, mid);
    ctx.lineTo(w, mid);
    ctx.strokeStyle = 'rgba(234,230,220,0.09)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  var meterRaf;
  function meterLoop() {
    drawMeter();
    meterRaf = requestAnimationFrame(meterLoop);
  }

  selectChar(state.index);
  if (reduceMotion) {
    drawMeter();
  } else {
    meterLoop();
  }

  window.addEventListener('resize', function () {
    if (reduceMotion) drawMeter();
  });

  // Pause meter when off screen (battery friendly)
  if ('IntersectionObserver' in window && el.canvas && !reduceMotion) {
    var visible = true;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !visible) {
          visible = true;
          meterLoop();
        } else if (!entry.isIntersecting && visible) {
          visible = false;
          if (meterRaf) cancelAnimationFrame(meterRaf);
        }
      });
    }, { threshold: 0.05 });
    io.observe(el.canvas);
  }

  /* ------------------------------------------------------
     Redaction reveal (tap / click)
     ------------------------------------------------------ */
  var redacts = document.querySelectorAll('.redact');
  Array.prototype.forEach.call(redacts, function (r) {
    r.setAttribute('tabindex', '0');
    r.setAttribute('role', 'button');
    r.setAttribute('aria-label', '黒塗りを解除して断片を読む');
    r.addEventListener('click', function () {
      r.classList.toggle('open');
    });
    r.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        r.classList.toggle('open');
      }
    });
  });

  /* ------------------------------------------------------
     Topbar state
     ------------------------------------------------------ */
  var topbar = document.getElementById('topbar');
  function onScroll() {
    if (!topbar) return;
    if (window.scrollY > 40) topbar.classList.add('is-scrolled');
    else topbar.classList.remove('is-scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
