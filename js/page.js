/* Havena — inner pages (category / about / contact), rendered from HV_DATA */
(function () {
  'use strict';
  var D = window.HV_DATA;
  var body = document.body;
  var main = document.querySelector('.page');

  var key = body.getAttribute('data-page');
  if (key === 'category') {
    key = new URLSearchParams(location.search).get('c');
    if (!D.pages[key] || D.order.indexOf(key) < 0) key = D.order[0];
  }
  var P = D.pages[key];
  var isCat = D.order.indexOf(key) > -1;
  var img = function (id, small) { return 'assets/img/' + (small ? 'sm/' : '') + id + '.jpg'; };

  body.style.setProperty('--accent', P.color);
  document.title = (key === 'about' ? 'About' : key === 'contact' ? 'Contact' : P.name) + ' — Havena';
  var tc = document.querySelector('meta[name="theme-color"]');
  if (tc) tc.setAttribute('content', P.color);

  var arrow = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M1 7h11M8 3l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';
  var arrowL = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M13 7H2M6 3L2 7l4 4" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';

  function header() {
    return '<header class="site-header">' +
      '<a class="nav-link" href="about.html"' + (key === 'about' ? ' aria-current="page"' : '') + '>About</a>' +
      '<a class="logo" href="index.html" aria-label="Havena, home"><span class="mark" aria-hidden="true"></span>Havena</a>' +
      '<a class="nav-link" href="contact.html"' + (key === 'contact' ? ' aria-current="page"' : '') + '>Contact</a>' +
      '</header>';
  }

  function hero() {
    var mq = P.marquee || P.name;
    return '<section class="c-hero" data-invert>' + header() +
      '<div class="c-hero__fg">' +
        '<div class="marquee" data-text="' + mq + '" aria-hidden="true"><div class="marquee__inner"><div class="marquee__track"><span class="marquee__item">' + mq + '</span></div></div></div>' +
        '<div class="hero__copy"><h1 class="sr-only">' + (P.marquee || P.name) + '</h1><p class="hero__sub">' + P.sub + '</p><span class="tag wide">' + P.tag + '</span></div>' +
      '</div>' +
      '<div class="c-hero__media"><img src="' + img(P.hero) + '" alt="" data-water></div>' +
      '<p class="scroll-hint">(Scroll)</p>' +
      '</section>';
  }

  function story() {
    var gallery = P.gallery.map(function (id) { return '<figure class="g-item"><img data-src="' + img(id) + '" alt="" decoding="async"></figure>'; }).join('');
    var stats = P.stats.map(function (s) {
      return '<div class="stat"><div class="stat__img"><img src="' + img(s.img, true) + '" alt="" loading="lazy"></div>' +
        '<div class="stat__body"><h3>' + s.t + '<small>' + s.s + '</small></h3><p>' + s.p + '</p></div></div>';
    }).join('');
    return '' +
      '<section class="sec intro"><span class="vline"></span><h2 class="serif h-xl js-words">' + P.intro + '</h2><p class="lead js-fade">' + P.introText + '</p></section>' +
      '<section class="sec gallery" aria-label="Gallery"><div class="gallery__viewport"><div class="gallery__track">' + gallery + '</div></div>' +
        '<div class="gallery__nav"><button class="circle-btn" type="button" data-dir="-1" aria-label="Previous images">' + arrowL + '</button><button class="circle-btn" type="button" data-dir="1" aria-label="Next images">' + arrow + '</button></div></section>' +
      '<section class="sec band">' +
        '<div class="band__mq"><div class="marquee" data-text="' + (P.marquee || P.name) + '" aria-hidden="true"><div class="marquee__inner"><div class="marquee__track"></div></div></div>' +
        '<div class="media-sq"><img src="' + img(P.bandImg, true) + '" alt="" loading="lazy"></div></div>' +
        '<blockquote class="serif quote js-words" style="margin-left:auto;margin-right:auto">' + P.quote + '</blockquote>' +
        '<p class="cite js-fade"><b>' + P.cite[0] + '</b>/ ' + P.cite[1] + '</p>' +
      '</section>' +
      '<div class="bleed js-parallax"><img src="' + img(P.bleed) + '" alt="" data-water></div>' +
      '<section class="sec split"><div class="split__text"><h2 class="serif h-xl js-words">' + P.split + '</h2><p class="lead js-fade">' + P.splitText + '</p></div>' +
        '<div class="split__img js-img"><img src="' + img(P.splitImg) + '" alt="" loading="lazy"></div></section>' +
      '<section class="sec stats">' + stats + '</section>' +
      '<p class="note sec">Figures and quotes on this page are illustrative placeholders for a fictional brand.</p>' +
      '<div class="bleed js-parallax"><img src="' + img(P.bleed2) + '" alt="" data-water></div>' +
      '<section class="cta" data-invert><span class="vline"></span><h2 class="serif h-xl js-words">' + P.cta + '</h2>' +
        '<a class="link-arrow js-fade" href="contact.html">Speak with an advisor ' + arrow + '</a>' +
        '<button class="to-top wide" type="button">Top</button></section>';
  }

  function next() {
    var nk = P.next || D.order[(D.order.indexOf(key) + 1) % D.order.length];
    var N = D.pages[nk];
    return '<a class="next" href="category.html?c=' + nk + '" data-color="' + N.color + '" style="--next:' + N.color + '" data-invert>' +
      '<img src="' + img(N.hero) + '" alt="" data-water>' +
      '<div class="next__body"><span class="pill">Next</span><h2>' + N.name + '</h2><p>' + N.card.replace('<br>', ' ') + '</p></div></a>';
  }

  function contact() {
    var opts = D.order.map(function (k) { return '<option>' + D.pages[k].name + '</option>'; }).join('');
    return '<section class="sec contact">' +
      '<div class="contact__aside"><span class="vline" style="margin-left:0"></span><h2 class="serif h-xl js-words">Start a Conversation</h2>' +
        '<p class="lead js-fade">Share a few details and we will come back with a first shortlist and a time to talk.</p>' +
        '<ul class="contact__list js-fade"><li><b>Email</b><a href="mailto:hello@havena.example">hello@havena.example</a></li><li><b>Phone</b><a href="tel:+351000000000">+351 000 000 000</a></li><li><b>Office</b>Rua Exemplo 12, Lisbon</li><li><b>Hours</b>Mon–Fri, 9:00–18:00</li></ul></div>' +
      '<form class="form js-fade" novalidate>' +
        '<div class="field"><label for="f-name">Full name</label><input id="f-name" name="name" autocomplete="name" required></div>' +
        '<div class="field"><label for="f-email">Email</label><input id="f-email" name="email" type="email" autocomplete="email" required></div>' +
        '<div class="field"><label for="f-int">Interested in</label><select id="f-int" name="interest"><option>Not sure yet</option>' + opts + '</select></div>' +
        '<div class="field"><label for="f-budget">Budget</label><select id="f-budget" name="budget"><option>€120k – €250k</option><option>€250k – €500k</option><option>€500k – €1M</option><option>€1M +</option></select></div>' +
        '<div class="field field--full"><label for="f-msg">Message</label><textarea id="f-msg" name="message" rows="4"></textarea></div>' +
        '<div class="form__row"><p class="form__note">Demo form — nothing is sent anywhere.</p><button class="btn-solid" type="submit">Send enquiry ' + arrow + '</button></div>' +
      '</form></section>';
  }

  var foot = '<footer class="site-foot"><span>Havena © ' + D.year + '</span><span>Lisbon · Athens · Split</span><span>Fictional brand · Photos: Unsplash</span></footer>';

  main.innerHTML = hero() + (key === 'contact' ? contact() : story() + next()) + foot;

  // gallery photos are requested only when the strip gets close (see below)
  function loadGallery() {
    [].forEach.call(document.querySelectorAll('.g-item img[data-src]'), function (im) {
      im.src = im.getAttribute('data-src');
      im.removeAttribute('data-src');
    });
  }

  /* ================================================================== */
  if (!window.H || !H.ready) { loadGallery(); return; }
  if (H.water) H.water(main); // swap photos marked data-water for the WebGL water surface
  var RM = H.RM;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };

  var heroEl = $('.c-hero');
  var media = $('.c-hero__media', heroEl);
  var mImg = $('img, canvas', media);
  var fg = $('.c-hero__fg', heroEl);
  var hdr = $('.site-header', heroEl);
  var hint = $('.scroll-hint', heroEl);
  var sub = $('.hero__sub', heroEl);
  var tag = $('.tag', heroEl);
  var dock = $('.dock');

  // clip state: k = intro growth of the square (0→1), p = scroll expansion to full-bleed (0→1)
  var st = { k: 0, p: 0 };
  function sq() { // resolve the CSS clamp() behind --sq to pixels
    var t = document.createElement('div');
    t.style.cssText = 'position:absolute;width:var(--sq);height:0;visibility:hidden';
    heroEl.appendChild(t);
    var v = t.getBoundingClientRect().width;
    t.remove();
    return v;
  }
  function heroY() { return window.innerWidth < 768 ? 0.40 : 0.41; }
  var S = sq();
  function applyClip() {
    var W = heroEl.clientWidth, Hh = heroEl.clientHeight;
    var s = S * st.k;
    var w = s + (W - s) * st.p;
    var h = s + (Hh - s) * st.p;
    var cy = Hh * heroY() + (Hh / 2 - Hh * heroY()) * st.p;
    var t = cy - h / 2, b = Hh - cy - h / 2, l = (W - w) / 2;
    media.style.clipPath = 'inset(' + t.toFixed(1) + 'px ' + l.toFixed(1) + 'px ' + b.toFixed(1) + 'px ' + l.toFixed(1) + 'px)';
  }
  ScrollTrigger.addEventListener('refreshInit', function () { S = sq(); });
  ScrollTrigger.addEventListener('refresh', applyClip);

  var words = H.splitWords(sub);
  gsap.set($('.marquee__inner', fg), { yPercent: 112 });
  gsap.set(hdr.children, { autoAlpha: 0, y: -14 });
  gsap.set(words, { yPercent: 118 });
  gsap.set(tag, { clipPath: 'inset(0% 100% 0% 0%)' });
  gsap.set([hint, dock], { autoAlpha: 0, y: 14 });
  gsap.set(mImg, { scale: 1.35 });
  applyClip();
  H.unlock();

  var lenis = H.initLenis();

  H.fontsTimed.then(function () {
    new H.Marquee($('.marquee', fg), { speed: 72, offset: 0.2 });
    var band = $('.band .marquee');
    if (band) new H.Marquee(band, { speed: 55, dir: 1, offset: 0.5 });
    ScrollTrigger.refresh();
  });

  // --- hero pinned expansion (created first so later triggers account for its pin spacing)
  if (!RM) {
    gsap.timeline({
      scrollTrigger: { trigger: heroEl, start: 'top top', end: function () { return '+=' + window.innerHeight * 1.2; }, pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true }
    })
      .to(st, { p: 1, ease: 'power2.inOut', duration: 1, onUpdate: applyClip }, 0)
      .to(mImg, { scale: 1, ease: 'power2.inOut', duration: 1 }, 0)
      .to(fg, { yPercent: -18, autoAlpha: 0, ease: 'power1.in', duration: 0.6 }, 0)
      .to(hdr, { autoAlpha: 0, ease: 'none', duration: 0.3 }, 0)
      .to(hint, { autoAlpha: 0, ease: 'none', duration: 0.2 }, 0.8);
  }

  // --- reveals
  $$('.js-words').forEach(function (el) { H.revealText(el); });
  $$('.js-fade').forEach(function (el) { H.revealFade(el, 0.15); });
  $$('.vline').forEach(H.revealLine);
  $$('.js-img, .stat__img').forEach(H.revealImg);
  $$('.js-parallax').forEach(function (el) { H.parallax(el, 9); });
  $$('.stat__body').forEach(function (el) { H.revealFade(el, 0.1); });
  var bandSq = $('.band .media-sq');
  if (bandSq && !RM) {
    gsap.fromTo(bandSq, { clipPath: 'inset(50% 50% 50% 50%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut', scrollTrigger: { trigger: bandSq, start: 'top 85%', once: true } });
    gsap.fromTo($('img', bandSq), { rotate: 8, scale: 1.5 }, { rotate: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: bandSq, start: 'top bottom', end: 'bottom top', scrub: true } });
  }
  var nextEl = $('.next');
  if (nextEl && !RM) {
    gsap.fromTo($('h2', nextEl), { yPercent: 40, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: nextEl, start: 'top 70%', once: true } });
  }
  H.watchInvert();

  // --- gallery: endless diagonal strip, driven by page scroll, arrows and drag
  (function () {
    var vp = $('.gallery__viewport');
    if (!vp) return;
    var track = $('.gallery__track', vp);
    var originals = $$('.g-item', track);
    var SLOPE = 0.14;          // vertical rise per px of horizontal distance from centre
    var SCROLL_FACTOR = 0.75;  // px of strip travel per px of page scroll
    var items = [], w = 0, h = 0, step = 0, total = 0, vw = 0;
    var pos = 0, target = 0, lastScroll = window.scrollY, visible = false;

    function build() {
      items.forEach(function (el) { if (originals.indexOf(el) < 0) el.remove(); });
      vw = vp.clientWidth;
      w = originals[0].offsetWidth;
      h = originals[0].offsetHeight;
      step = w + Math.min(26, Math.max(10, window.innerWidth * 0.018)); // gap between photos
      items = originals.slice(); // clones copy src or data-src, so they load together with the originals
      // enough copies that the loop never shows a gap
      while (items.length * step < vw + step * 3) {
        originals.forEach(function (el) {
          var c = el.cloneNode(true);
          c.setAttribute('aria-hidden', 'true');
          track.appendChild(c);
          items.push(c);
        });
      }
      total = items.length * step;
      items.forEach(function (el) { el._img = el.querySelector('img'); });
      render();
    }

    function render() {
      var cx = vw / 2;
      for (var i = 0; i < items.length; i++) {
        var x = i * step + pos;
        x = ((x + step) % total + total) % total - step; // wrap into [-step, total - step)
        var dx = x + w / 2 - cx;
        var y = -dx * SLOPE - h / 2;
        items[i].style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
        items[i]._img.style.transform = 'translate3d(' + (-dx * 0.06).toFixed(1) + 'px,0,0) scale(1.14)';
      }
    }

    ScrollTrigger.create({
      trigger: vp,
      start: 'top bottom+=1400',
      once: true,
      onEnter: loadGallery
    });
    ScrollTrigger.create({
      trigger: vp,
      start: 'top bottom+=200',
      end: 'bottom top-=200',
      onToggle: function (st) { visible = st.isActive; }
    });

    gsap.ticker.add(function (t, delta) {
      var sy = window.scrollY;
      var ds = sy - lastScroll;
      lastScroll = sy;
      if (!visible) return;
      if (!RM) target -= ds * SCROLL_FACTOR;
      var diff = target - pos;
      if (Math.abs(diff) < 0.05) return;
      var ease = RM ? 1 : 1 - Math.pow(0.9, (Math.min(delta, 64) / 1000) * 60);
      pos += diff * ease;
      render();
    });

    $$('.gallery__nav .circle-btn').forEach(function (b) {
      b.addEventListener('click', function () { target -= step * Number(b.getAttribute('data-dir')); });
    });

    // drag / swipe (vertical swipes still scroll the page: touch-action pan-y)
    var dragX = null, dragStart = 0;
    vp.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragX = e.clientX;
      dragStart = target;
      vp.setPointerCapture(e.pointerId);
      vp.classList.add('is-dragging');
    });
    vp.addEventListener('pointermove', function (e) {
      if (dragX == null) return;
      target = dragStart + (e.clientX - dragX) * 1.4;
    });
    function endDrag() { dragX = null; vp.classList.remove('is-dragging'); }
    vp.addEventListener('pointerup', endDrag);
    vp.addEventListener('pointercancel', endDrag);
    $$('img', vp).forEach(function (im) { im.draggable = false; });

    // soft entrance the first time the strip comes into view
    if (!RM) {
      gsap.from(vp, { autoAlpha: 0, y: 60, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: vp, start: 'top 90%', once: true } });
    }

    build();
    target = pos = (vw - w) / 2; // start with the first photo centred
    render();
    ScrollTrigger.addEventListener('refresh', function () {
      var p = step ? pos / step : 0, tg = step ? target / step : 0;
      build();
      pos = p * step; target = tg * step;
      render();
    });
  })();

  // --- back to top
  var top = $('.to-top');
  if (top) top.addEventListener('click', function () {
    if (lenis) lenis.scrollTo(0, { duration: 2.2 }); else window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // --- demo contact form
  var form = $('.form');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = $$('[required]', form).filter(function (f) { return !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value)); });
    $$('[required]', form).forEach(function (f) { f.style.borderColor = bad.indexOf(f) > -1 ? '#c0392b' : ''; });
    if (bad.length) { bad[0].focus(); return; }
    var done = document.createElement('p');
    done.className = 'form__done';
    done.setAttribute('role', 'status');
    done.textContent = 'Thank you — this is a demo, so nothing was sent. In a live site an advisor would reply within one working day.';
    form.innerHTML = '';
    form.appendChild(done);
  });

  // --- intro
  function heroIn() {
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to(st, { k: 1, duration: H.dur(1.4), ease: 'expo.inOut', onUpdate: applyClip }, 0)
      .to(mImg, { scale: 1.12, duration: H.dur(2) }, 0.1)
      .to($('.marquee__inner', fg), { yPercent: 0, duration: H.dur(1.6) }, 0.1)
      .to(hdr.children, { autoAlpha: 1, y: 0, duration: H.dur(1.1), stagger: 0.08 }, 0.25)
      .to(words, { yPercent: 0, duration: H.dur(1.2), stagger: 0.025 }, 0.4)
      .to(tag, { clipPath: 'inset(0% 0% 0% 0%)', duration: H.dur(1.1), ease: 'expo.inOut' }, 0.6)
      .to([hint, dock], { autoAlpha: 1, y: 0, duration: H.dur(1.1), stagger: 0.1 }, 0.75);
    if (RM) tl.progress(1);
  }

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  H.revealCover().then(heroIn);
})();
