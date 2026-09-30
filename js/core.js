/* Havena — shared runtime: page transitions, menu, marquees, text/image reveals, smooth scroll */
(function () {
  'use strict';

  var root = document.documentElement;
  var H = (window.H = { marquees: [], ready: false });

  // Without GSAP (CDN blocked / offline) the site still shows as a static page.
  if (!window.gsap) {
    root.classList.remove('is-loading', 'is-covered');
    var pre = document.querySelector('.preloader');
    if (pre) pre.remove();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  var RM = (H.RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  H.ready = true;
  H.data = window.HV_DATA;
  H.img = function (id, small) { return 'assets/img/' + (small ? 'sm/' : '') + id + '.jpg'; };
  H.dur = function (d) { return RM ? 0.01 : d; };

  H.fonts = (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve())
    .then(function () {}, function () {});
  H.fontsTimed = Promise.race([H.fonts, new Promise(function (r) { setTimeout(r, 2500); })]);

  H.loadImages = function (imgs, timeout) {
    var all = Promise.all([].map.call(imgs, function (img) {
      if (img.complete && img.naturalWidth) return Promise.resolve();
      return new Promise(function (res) {
        img.addEventListener('load', res, { once: true });
        img.addEventListener('error', res, { once: true });
      });
    }));
    return Promise.race([all, new Promise(function (r) { setTimeout(r, timeout || 6000); })]);
  };

  /* ------------------------------------------------------------------
     Page cover transitions
     ------------------------------------------------------------------ */
  var cover = document.querySelector('.cover');

  H.isCovered = function () { return root.classList.contains('is-covered'); };

  H.revealCover = function () {
    if (!cover || !H.isCovered()) return Promise.resolve(false);
    return new Promise(function (res) {
      gsap.set(cover, { yPercent: 0 });
      root.classList.remove('is-covered');
      gsap.to(cover, {
        yPercent: -100,
        duration: H.dur(1.1),
        delay: 0.05,
        ease: 'expo.inOut',
        onComplete: function () { gsap.set(cover, { yPercent: 100 }); res(true); }
      });
      // let intro animations overlap the cover lift
      setTimeout(function () { res(true); }, RM ? 0 : 420);
    });
  };

  H.go = function (url, color) {
    if (H.leaving) return;
    H.leaving = true;
    color = color || getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#1e2a5a';
    try { sessionStorage.setItem('hv-cover', color); } catch (e) {}
    if (H.lenis) H.lenis.stop();
    cover.style.background = color;
    gsap.fromTo(cover, { yPercent: 100 }, {
      yPercent: 0,
      duration: H.dur(0.95),
      ease: 'expo.inOut',
      onComplete: function () { location.href = url; }
    });
  };

  // Restored from back/forward cache: drop the cover that was left over the page
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    H.leaving = false;
    root.classList.remove('is-covered');
    if (cover) gsap.set(cover, { yPercent: 100 });
    document.querySelectorAll('.expander').forEach(function (el) { el.remove(); });
    if (H.lenis) H.lenis.start();
    if (H.onRestore) H.onRestore();
  });

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download') || a.hasAttribute('data-no-transition')) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^(mailto|tel|sms|javascript):/i.test(href)) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) {
      if (url.hash) return; // same-page hash; the page handles it
      e.preventDefault();
      H.closeMenu();
      if (H.lenis) H.lenis.scrollTo(0); else window.scrollTo(0, 0);
      return;
    }
    e.preventDefault();
    H.closeMenu(true);
    H.go(url.href, a.getAttribute('data-color'));
  });

  /* ------------------------------------------------------------------
     Menu
     ------------------------------------------------------------------ */
  var menu = document.querySelector('.menu');
  var btnMenu = document.querySelector('.btn-menu');
  var menuTl = null;
  H.menuOpen = false;

  function buildMenu() {
    var panel = menu.querySelector('.menu__panel');
    var items = menu.querySelectorAll('.menu__links a, .menu__foot a');
    menuTl = gsap.timeline({
      paused: true,
      onReverseComplete: function () { gsap.set(menu, { visibility: 'hidden' }); }
    })
      .set(menu, { visibility: 'visible' })
      .to(menu.querySelector('.menu__scrim'), { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0)
      .fromTo(panel, { clipPath: 'inset(100% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.inOut' }, 0)
      .fromTo(items, { yPercent: 115 }, { yPercent: 0, duration: 0.8, stagger: 0.05, ease: 'expo.out' }, 0.38);
  }

  H.openMenu = function () {
    if (!menu || H.menuOpen) return;
    if (!menuTl) buildMenu();
    H.menuOpen = true;
    root.classList.add('is-menu-open');
    btnMenu.setAttribute('aria-expanded', 'true');
    btnMenu.setAttribute('aria-label', 'Close menu');
    menu.setAttribute('aria-hidden', 'false');
    if (H.lenis) H.lenis.stop();
    menuTl.timeScale(1).play();
    var first = menu.querySelector('.menu__links a');
    setTimeout(function () { if (first) first.focus({ preventScroll: true }); }, 400);
  };

  H.closeMenu = function (instant) {
    if (!menu || !H.menuOpen) return;
    H.menuOpen = false;
    root.classList.remove('is-menu-open');
    btnMenu.setAttribute('aria-expanded', 'false');
    btnMenu.setAttribute('aria-label', 'Open menu');
    menu.setAttribute('aria-hidden', 'true');
    if (H.lenis && !H.leaving) H.lenis.start();
    if (instant) return; // page is leaving; keep it visible under the cover
    menuTl.timeScale(1.7).reverse();
  };

  if (menu && btnMenu) {
    btnMenu.addEventListener('click', function () { H.menuOpen ? H.closeMenu() : H.openMenu(); });
    menu.querySelector('.menu__scrim').addEventListener('click', function () { H.closeMenu(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && H.menuOpen) { H.closeMenu(); btnMenu.focus(); }
    });
  }

  /* ------------------------------------------------------------------
     Marquee — endless line of text, speeds up with scroll velocity
     ------------------------------------------------------------------ */
  function Marquee(el, opts) {
    opts = opts || {};
    this.el = el;
    this.text = el.getAttribute('data-text');
    this.track = el.querySelector('.marquee__track');
    this.speed = RM ? 0 : (opts.speed != null ? opts.speed : 80);
    this.dir = opts.dir || -1;
    this.x = 0;
    this.visible = true;
    this.build();
    this.x = -this.w * (opts.offset != null ? opts.offset : 0.3);
    this.render();
    var self = this;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { self.visible = en[0].isIntersecting; }).observe(el);
    }
    H.marquees.push(this);
  }
  Marquee.prototype.build = function () {
    this.track.textContent = '';
    var item = document.createElement('span');
    item.className = 'marquee__item';
    item.textContent = this.text;
    this.track.appendChild(item);
    this.w = item.getBoundingClientRect().width || 1;
    var copies = Math.ceil((window.innerWidth * 1.25) / this.w) + 1;
    for (var i = 0; i < copies; i++) this.track.appendChild(item.cloneNode(true));
  };
  Marquee.prototype.render = function () {
    this.track.style.transform = 'translate3d(' + this.x.toFixed(2) + 'px,0,0)';
  };
  Marquee.prototype.tick = function (dt, boost) {
    if (!this.visible || !this.speed) return;
    this.x += this.dir * this.speed * (1 + boost) * dt;
    this.x = ((this.x % this.w) - this.w) % this.w; // keep in (-w, 0]
    this.render();
  };
  H.Marquee = Marquee;

  gsap.ticker.add(function (time, delta) {
    if (!H.marquees.length) return;
    var dt = Math.min(delta, 64) / 1000;
    var v = H.lenis ? Math.abs(H.lenis.velocity || 0) : 0;
    var boost = Math.min(v * 0.22, 7);
    for (var i = 0; i < H.marquees.length; i++) H.marquees[i].tick(dt, boost);
  });

  var rsT;
  window.addEventListener('resize', function () {
    clearTimeout(rsT);
    rsT = setTimeout(function () {
      H.marquees.forEach(function (m) { var p = m.x / m.w; m.build(); m.x = p * m.w; m.render(); });
    }, 150);
  });

  /* ------------------------------------------------------------------
     Text + image reveals
     ------------------------------------------------------------------ */
  H.splitWords = function (el) {
    if (el._words) return el._words;
    var words = [];
    var frag = document.createDocumentFragment();
    function wrap(node) {
      var w = document.createElement('span'); w.className = 'w';
      var i = document.createElement('span'); i.className = 'wi';
      i.appendChild(node); w.appendChild(i); frag.appendChild(w); words.push(i);
    }
    [].slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(' '));
          else wrap(document.createTextNode(part));
        });
      } else if (n.nodeName === 'BR') {
        frag.appendChild(document.createElement('br'));
      } else {
        wrap(n.cloneNode(true));
      }
    });
    el.textContent = '';
    el.appendChild(frag);
    el._words = words;
    return words;
  };

  H.revealText = function (el, opts) {
    var words = H.splitWords(el);
    if (RM) return;
    gsap.from(words, Object.assign({
      yPercent: 118,
      duration: 1.2,
      ease: 'expo.out',
      stagger: 0.04,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    }, opts || {}));
  };

  H.revealImg = function (wrap) {
    if (RM) return;
    var img = wrap.querySelector('img, canvas');
    gsap.timeline({ scrollTrigger: { trigger: wrap, start: 'top 90%', once: true } })
      .fromTo(wrap, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' })
      .fromTo(img, { scale: 1.4 }, { scale: 1, duration: 1.8, ease: 'expo.out' }, 0.15);
  };

  H.revealFade = function (el, delay) {
    if (RM) return;
    gsap.from(el, { autoAlpha: 0, y: 24, duration: 1.1, delay: delay || 0, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
  };

  H.revealLine = function (el) {
    if (RM) return;
    gsap.from(el, { scaleY: 0, duration: 1.2, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  };

  H.parallax = function (wrap, amount) {
    if (RM) return;
    var img = wrap.querySelector('img, canvas');
    amount = amount || 10;
    gsap.fromTo(img, { yPercent: -amount }, {
      yPercent: amount, ease: 'none',
      scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  };

  /* ------------------------------------------------------------------
     Smooth scroll + dock colour inversion over accent sections
     ------------------------------------------------------------------ */
  H.initLenis = function () {
    if (RM || typeof window.Lenis === 'undefined') return null;
    var lenis = new window.Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    H.lenis = lenis;
    return lenis;
  };

  H.watchInvert = function () {
    var secs = [].slice.call(document.querySelectorAll('[data-invert]'));
    function update() {
      document.body.classList.toggle('ui-invert', secs.some(function (s) { return s._on; }));
    }
    secs.forEach(function (sec) {
      ScrollTrigger.create({
        trigger: sec,
        start: 'top bottom-=70',
        end: 'bottom bottom-=70',
        onToggle: function (st) { sec._on = st.isActive; update(); }
      });
    });
  };

  H.unlock = function () { root.classList.remove('is-loading'); };
})();
