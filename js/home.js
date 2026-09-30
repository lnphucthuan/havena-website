/* Havena — home: preloader, hero intro, "Our Selection" zoom-out mode */
(function () {
  'use strict';
  if (!window.H || !H.ready) return;

  var D = H.data;
  var RM = H.RM;
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };

  var stage = $('.stage');
  var sel = $('.selection');
  var btnSel = $('.btn-sel');
  var hit = $('.stage__hit');
  var dock = $('.dock');
  var hero = $('.hero');
  var heroSq = $('.hero__media', hero);
  var heroImg = $('img', heroSq);
  var mqEl = $('.marquee', hero);
  var sub = $('.hero__sub', hero);
  var tag = $('.tag', hero);
  var foot = $('.hero__foot', hero);
  var headerItems = $$('.site-header > *', stage);

  var mode = 'intro';
  var busy = true;

  /* ---------- selection cards ---------- */
  sel.innerHTML = D.order.map(function (k) {
    var p = D.pages[k];
    var chars = p.name.split('').map(function (c) { return c === ' ' ? ' ' : '<span class="ch">' + c + '</span>'; }).join('');
    return '<a class="card" href="category.html?c=' + k + '" style="--c:' + p.color + '" data-color="' + p.color + '">' +
      '<div class="card__in">' +
        '<div class="card__img"><img src="' + H.img(p.cardImg, true) + '" alt=""><span class="card__shade"></span></div>' +
        '<div class="card__top"><span class="mark" aria-hidden="true"></span>' +
          '<h2 class="card__title"><span class="sr-only">' + p.name + '</span><span aria-hidden="true">' + chars + '</span></h2>' +
          '<p class="card__desc">' + p.card.replace('<br>', ' <br>') + '</p>' +
        '</div>' +
        '<span class="card__go" aria-hidden="true">Explore collection <i>→</i></span>' +
        '<span class="card__glare"></span>' +
      '</div></a>';
  }).join('');
  var cards = $$('.card', sel);
  cards.forEach(function (c) { c.tabIndex = -1; });

  // hover: 3D tilt toward the pointer, a glare that follows it, and the title letters roll over
  if (!RM && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    cards.forEach(function (card) {
      var inn = $('.card__in', card);
      var chars = $$('.ch', card);
      var roll = null;
      gsap.set(inn, { transformPerspective: 1000 });
      var rx = gsap.quickTo(inn, 'rotationX', { duration: 0.7, ease: 'power3.out' });
      var ry = gsap.quickTo(inn, 'rotationY', { duration: 0.7, ease: 'power3.out' });
      card.addEventListener('pointerenter', function () {
        if (mode !== 'sel') return;
        gsap.to(inn, { y: -12, duration: 0.9, ease: 'expo.out' });
        if (roll) roll.progress(1).kill();
        roll = gsap.timeline()
          .to(chars, { xPercent: -130, duration: 0.32, ease: 'power2.in', stagger: 0.028 })
          .set(chars, { xPercent: 130 })
          .to(chars, { xPercent: 0, duration: 0.7, ease: 'expo.out', stagger: 0.028 });
      });
      card.addEventListener('pointermove', function (e) {
        if (mode !== 'sel') return;
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        ry((px - 0.5) * 12);
        rx((0.5 - py) * 9);
        inn.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        inn.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', function () {
        rx(0); ry(0);
        gsap.to(inn, { y: 0, duration: 0.9, ease: 'expo.out' });
      });
    });
  }

  /* ---------- hero start state ---------- */
  var words = H.splitWords(sub);
  var withPreloader = !root.classList.contains('no-preload') && !RM;
  try { sessionStorage.setItem('hv-seen', '1'); } catch (e) {}

  gsap.set($('.marquee__inner', mqEl), { yPercent: 112 });
  gsap.set(headerItems, { autoAlpha: 0, y: -14 });
  gsap.set(words, { yPercent: 118 });
  gsap.set(tag, { clipPath: 'inset(0% 100% 0% 0%)' });
  gsap.set([foot, dock], { autoAlpha: 0, y: 14 });
  if (!withPreloader) gsap.set(heroSq, { clipPath: 'inset(50% 50% 50% 50%)' });
  H.unlock();

  var marquee;
  H.fontsTimed.then(function () { marquee = new H.Marquee(mqEl, { speed: 72, offset: 0.35 }); });

  function heroIn() {
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to($('.marquee__inner', mqEl), { yPercent: 0, duration: H.dur(1.6) }, 0)
      .to(headerItems, { autoAlpha: 1, y: 0, duration: H.dur(1.1), stagger: 0.08 }, 0.2)
      .to(words, { yPercent: 0, duration: H.dur(1.2), stagger: 0.025 }, 0.35)
      .to(tag, { clipPath: 'inset(0% 0% 0% 0%)', duration: H.dur(1.1), ease: 'expo.inOut' }, 0.55)
      .to([foot, dock], { autoAlpha: 1, y: 0, duration: H.dur(1.1), stagger: 0.1 }, 0.7)
      .add(function () { busy = false; }, RM ? 0 : 0.9);
    if (!withPreloader) {
      tl.to(heroSq, { clipPath: 'inset(0% 0% 0% 0%)', duration: H.dur(1.3), ease: 'expo.inOut' }, 0)
        .fromTo(heroImg, { scale: 1.45 }, { scale: 1, duration: H.dur(1.8) }, 0.1);
    }
    return tl;
  }

  /* ---------- preloader ---------- */
  function runPreloader() {
    var pre = $('.preloader');
    var box = $('.media-sq', pre);
    var bg = $('.preloader__bg', pre);
    var count = $('.preloader__count', pre);
    var cols = $$('.digit', count);
    var ids = D.order.map(function (k) { return D.pages[k].cardImg; }).concat([D.home.image]);
    box.innerHTML = ids.map(function (id) { return '<img src="' + H.img(id, true) + '" alt="">'; }).join('');
    var imgs = $$('img', box);
    var last = { t: -1, o: -1 };
    var prog = { v: 0 };

    function setCount() {
      var n = Math.min(99, Math.floor(prog.v));
      var t = Math.floor(n / 10), o = n % 10;
      if (t !== last.t) { last.t = t; gsap.to(cols[0], { yPercent: -t * 10, duration: 0.5, ease: 'power3.out', overwrite: true }); }
      if (o !== last.o) { last.o = o; gsap.to(cols[1], { yPercent: -o * 10, duration: 0.22, ease: 'power2.out', overwrite: true }); }
    }

    return new Promise(function (resolve) {
      var loaded = H.loadImages(imgs, 6000);
      var tl = gsap.timeline();
      tl.fromTo(box, { scale: 0.55 }, { scale: 1, duration: 3, ease: 'power3.inOut' }, 0);
      imgs.forEach(function (img, i) {
        tl.fromTo(img,
          { clipPath: 'inset(50% 50% 50% 50%)', scale: 1.6 },
          { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1, ease: 'expo.inOut' },
          0.15 + i * 0.48);
      });
      tl.to(prog, { v: 99, duration: 3.1, ease: 'power2.inOut', onUpdate: setCount }, 0);

      var timelineDone = new Promise(function (r) { tl.eventCallback('onComplete', r); });
      Promise.all([timelineDone, loaded, H.fontsTimed]).then(function () {
        gsap.timeline({ onComplete: function () { pre.remove(); } })
          .to(count, { autoAlpha: 0, y: 12, duration: 0.4, ease: 'power2.in' }, 0)
          .to(bg, { yPercent: -100, duration: 1.15, ease: 'expo.inOut' }, 0.1)
          .add(resolve, 0.5);
      });
    });
  }

  /* ---------- selection mode ---------- */
  function stageTarget() {
    var mob = window.innerWidth < 768;
    return { scale: mob ? 0.6 : 0.445, y: window.innerHeight * (mob ? 0.8 : 0.81) };
  }

  function openSelection(instant) {
    if (mode === 'sel' || (busy && !instant) || H.menuOpen) return;
    busy = true;
    mode = 'sel';
    root.classList.add('is-selection');
    document.body.classList.add('is-selection');
    history.replaceState(null, '', '#selection');
    cards.forEach(function (c) { c.tabIndex = 0; });
    stage.setAttribute('aria-hidden', 'true');
    gsap.set(sel, { visibility: 'visible' });
    var t = stageTarget();
    if (instant || RM) {
      gsap.set(stage, t);
      gsap.set(cards, { y: 0 });
      gsap.set(btnSel, { autoAlpha: 0 });
      busy = false;
      return;
    }
    gsap.timeline({ onComplete: function () { busy = false; } })
      .to(btnSel, { autoAlpha: 0, y: 10, duration: 0.4, ease: 'power2.in' }, 0)
      .to(stage, { scale: t.scale, y: t.y, duration: 1.25, ease: 'expo.inOut' }, 0)
      .fromTo(cards, { y: function () { return window.innerHeight; } }, { y: 0, duration: 1.25, ease: 'expo.inOut', stagger: 0.07 }, 0.06);
  }

  function closeSelection() {
    if (mode !== 'sel' || busy) return;
    busy = true;
    mode = 'intro';
    history.replaceState(null, '', location.pathname + location.search);
    cards.forEach(function (c) { c.tabIndex = -1; });
    stage.removeAttribute('aria-hidden');
    root.classList.remove('is-selection');
    document.body.classList.remove('is-selection');
    gsap.timeline({ onComplete: function () { busy = false; gsap.set(sel, { visibility: 'hidden' }); } })
      .to(cards, { y: function () { return window.innerHeight; }, duration: H.dur(1.1), ease: 'expo.inOut', stagger: { each: 0.05, from: 'end' } }, 0)
      .to(stage, { scale: 1, y: 0, duration: H.dur(1.25), ease: 'expo.inOut' }, 0.08)
      .to(btnSel, { autoAlpha: 1, y: 0, duration: H.dur(0.6), ease: 'expo.out' }, 0.9);
  }

  // card → category: the card colour grows to fill the screen, the next page starts on that colour
  cards.forEach(function (card) {
    card.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      if (busy || H.leaving) return;
      H.leaving = true;
      busy = true;
      var color = card.getAttribute('data-color');
      var r = $('.card__in', card).getBoundingClientRect();
      var ex = document.createElement('div');
      ex.className = 'expander';
      ex.style.cssText = 'left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;background:' + color;
      document.body.appendChild(ex);
      try { sessionStorage.setItem('hv-cover', color); } catch (err) {}
      gsap.fromTo(ex, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: H.dur(0.45), ease: 'power2.out' });
      gsap.to(ex, {
        left: 0, top: 0, width: window.innerWidth, height: window.innerHeight,
        duration: H.dur(1.05), delay: RM ? 0 : 0.25, ease: 'expo.inOut',
        onComplete: function () { location.href = card.href; }
      });
    });
  });

  H.onRestore = function () {
    busy = false;
    gsap.set(cards, { clearProps: 'opacity' });
  };

  /* ---------- input ---------- */
  window.addEventListener('wheel', function (e) {
    if (H.menuOpen || Math.abs(e.deltaY) < 6) return;
    if (e.deltaY > 0) openSelection(); else closeSelection();
  }, { passive: true });

  var touchY = null;
  window.addEventListener('touchstart', function (e) { touchY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchend', function (e) {
    if (touchY == null || H.menuOpen) return;
    var dy = e.changedTouches[0].clientY - touchY;
    touchY = null;
    if (dy < -45) openSelection();
    else if (dy > 45) closeSelection();
  }, { passive: true });

  window.addEventListener('keydown', function (e) {
    if (H.menuOpen || e.target.closest('input, textarea, select')) return;
    if (['ArrowDown', 'PageDown', ' '].indexOf(e.key) > -1) { e.preventDefault(); openSelection(); }
    else if (['ArrowUp', 'PageUp', 'Home'].indexOf(e.key) > -1 || (e.key === 'Escape' && mode === 'sel')) { e.preventDefault(); closeSelection(); }
  });

  btnSel.addEventListener('click', function (e) { e.preventDefault(); openSelection(); });
  hit.addEventListener('click', closeSelection);
  window.addEventListener('hashchange', function () { if (location.hash === '#selection') openSelection(); });
  window.addEventListener('resize', function () { if (mode === 'sel') gsap.set(stage, stageTarget()); });

  /* ---------- subtle pointer parallax on the hero photo ---------- */
  if (!RM && window.matchMedia('(pointer: fine)').matches) {
    gsap.set(heroImg, { scale: 1.12 });
    var qx = gsap.quickTo(heroImg, 'x', { duration: 1.2, ease: 'power3.out' });
    var qy = gsap.quickTo(heroImg, 'y', { duration: 1.2, ease: 'power3.out' });
    window.addEventListener('pointermove', function (e) {
      if (mode !== 'intro') return;
      qx((e.clientX / window.innerWidth - 0.5) * -22);
      qy((e.clientY / window.innerHeight - 0.5) * -22);
    });
  }

  /* ---------- start ---------- */
  var startSelection = location.hash === '#selection';

  if (withPreloader) {
    runPreloader().then(heroIn);
  } else if (startSelection) {
    gsap.set($('.marquee__inner', mqEl), { yPercent: 0 });
    gsap.set(headerItems.concat(words, [foot, dock]), { autoAlpha: 1, y: 0, yPercent: 0 });
    gsap.set([tag, heroSq], { clipPath: 'inset(0% 0% 0% 0%)' });
    openSelection(true);
    H.revealCover();
  } else {
    H.revealCover().then(function () { heroIn(); });
  }
})();
