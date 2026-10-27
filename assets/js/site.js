/* Lucero Rojas — Portfolio motion layer. Vanilla JS, no dependencies. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) root.classList.add('motion');

  /* Split headline into words for the rise-in */
  document.querySelectorAll('[data-split]').forEach(function (el) {
    var i = 0;
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span'); w.className = 'w';
            var s = document.createElement('span'); s.textContent = part; s.style.setProperty('--i', i++);
            w.appendChild(s); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) {
          if (n.tagName === 'EM') {
            var w = document.createElement('span'); w.className = 'w';
            var clone = n.cloneNode(true); var s = document.createElement('span');
            s.style.setProperty('--i', i++ + 1); s.appendChild(clone); w.appendChild(s);
            n.parentNode.replaceChild(w, n);
          } else walk(n);
        }
      });
    };
    walk(el);
    el.classList.add('split');
  });

  /* Reveal on view */
  if (root.classList.contains('motion')) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll('[data-reveal], .timeline').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-in');
      else io.observe(el);
    });
  } else {
    document.querySelectorAll('.timeline').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* Counters (final value is in the markup; animate only when motion is on) */
  if (root.classList.contains('motion')) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, end = parseInt(el.getAttribute('data-count'), 10), t0 = null, dur = 1400;
        var step = function (t) {
          if (!t0) t0 = t;
          var k = Math.min(1, (t - t0) / dur), eased = 1 - Math.pow(1 - k, 3);
          el.textContent = Math.round(end * eased);
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        cio.unobserve(el);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('[data-count]').forEach(function (el) { cio.observe(el); });
  }

  /* Nav state + reading progress */
  var nav = document.querySelector('.nav');
  var progress = document.querySelector('.progress');

  /* Scroll-linked scenes */
  var scene = document.querySelector('.scene');
  var board = scene && scene.querySelector('.board');
  var meter = scene && scene.querySelector('[data-meter]');
  var stackCards = Array.prototype.slice.call(document.querySelectorAll('.stack__card'));
  var grow = document.querySelector('.contact__title');

  var ticking = false;
  var update = function () {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    if (nav) nav.classList.toggle('is-scrolled', y > (nav.dataset.offset ? parseInt(nav.dataset.offset, 10) : 40));
    if (progress) {
      var max = document.documentElement.scrollHeight - vh;
      progress.style.setProperty('--progress', max > 0 ? Math.min(1, y / max) : 0);
    }
    if (reduce) return;
    if (board) {
      var r = scene.getBoundingClientRect();
      var total = r.height - vh;
      var p = total > 0 ? Math.min(1, Math.max(0, -r.top / (total * 0.8))) : 1;
      var eased = 1 - Math.pow(1 - p, 3);
      board.style.setProperty('--p', eased.toFixed(3));
      scene.classList.toggle('is-order', p > 0.55);
      if (meter) meter.textContent = String(Math.round(p * 100)).padStart(3, '0') + '%';
    }
    stackCards.forEach(function (card, i) {
      var next = stackCards[i + 1];
      if (!next) { card.style.setProperty('--s', 1); card.style.setProperty('--b', 1); return; }
      var nr = next.getBoundingClientRect(), cr = card.getBoundingClientRect();
      var dist = nr.top - cr.top;
      var k = Math.min(1, Math.max(0, 1 - dist / cr.height));
      card.style.setProperty('--s', (1 - k * 0.06).toFixed(4));
      card.style.setProperty('--b', (1 - k * 0.25).toFixed(3));
    });
    if (grow) {
      var gr = grow.getBoundingClientRect();
      var g = Math.min(1, Math.max(0, (vh - gr.top) / (vh * 0.9)));
      grow.style.setProperty('--grow', (0.82 + g * 0.18).toFixed(4));
    }
  };
  var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  /* Experience index: floating peek card */
  var peek = document.querySelector('.peek');
  if (peek && window.matchMedia('(pointer: fine)').matches && !reduce) {
    var label = peek.querySelector('strong');
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    var loop = function () {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      peek.style.left = cx + 'px'; peek.style.top = cy + 'px';
      raf = requestAnimationFrame(loop);
    };
    document.querySelectorAll('.index__row').forEach(function (row) {
      row.addEventListener('mouseenter', function (e) {
        label.textContent = row.getAttribute('data-peek');
        cx = tx = e.clientX + 150; cy = ty = e.clientY;
        peek.classList.add('is-on');
        if (!raf) loop();
      });
      row.addEventListener('mousemove', function (e) { tx = e.clientX + 150; ty = e.clientY; });
      row.addEventListener('mouseleave', function () {
        peek.classList.remove('is-on');
        cancelAnimationFrame(raf); raf = null;
      });
    });
  }

  /* Before / after slider */
  document.querySelectorAll('.ba').forEach(function (ba) {
    var input = ba.querySelector('input');
    var set = function () { ba.style.setProperty('--pos', input.value + '%'); };
    input.addEventListener('input', set); set();
  });


  /* Carousels */
  document.querySelectorAll('.carousel').forEach(function (car) {
    var track = car.querySelector('.carousel__track');
    var slides = track.querySelectorAll('.carousel__slide');
    var dotsWrap = car.querySelector('.carousel__dots');
    var prev = car.querySelector('[data-dir="-1"]'), next = car.querySelector('[data-dir="1"]');
    var dots = [];
    var current = function () { return Math.round(track.scrollLeft / Math.max(1, track.clientWidth)); };
    var go = function (i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: i * track.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
    };
    slides.forEach(function (s, i) {
      var d = document.createElement('button');
      d.type = 'button'; d.className = 'carousel__dot';
      d.setAttribute('aria-label', 'Photo ' + (i + 1) + ' of ' + slides.length);
      d.addEventListener('click', function () { go(i); });
      if (dotsWrap) dotsWrap.appendChild(d); dots.push(d);
    });
    var sync = function () {
      var i = current();
      dots.forEach(function (d, k) { d.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      prev.disabled = i === 0;
      next.disabled = i === slides.length - 1;
    };
    prev.addEventListener('click', function () { go(current() - 1); });
    next.addEventListener('click', function () { go(current() + 1); });
    track.addEventListener('scroll', function () { window.requestAnimationFrame(sync); }, { passive: true });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(current() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(current() - 1); }
    });
    window.addEventListener('resize', function () { go(current()); });
    sync();
  });

  /* Copy email */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var done = function () { var o = btn.textContent; btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = o; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {});
      }
    });
  });
})();
