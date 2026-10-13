/*
  AUREA — interacción y animación.
  GSAP + ScrollTrigger + SplitText mueven la página; Lenis suaviza el scroll.
  Con "prefers-reduced-motion" (o si no cargan las librerías) la web funciona
  igual, sin animación: menú, carta y reserva no dependen de GSAP.
*/
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const libs = window.gsap && window.ScrollTrigger && window.SplitText && window.Lenis;
  const motion = !reduced && Boolean(libs);
  if (!motion) root.classList.remove('motion');

  const header = $('.site-header');
  const main = $('main');
  const footer = $('.footer');
  let lenis = null;

  /* ---------- Scroll suave sincronizado con ScrollTrigger ---------- */

  if (motion) {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    ScrollTrigger.config({ ignoreMobileResize: true });
    history.scrollRestoration = 'manual';

    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    // Un único reloj: el ticker de GSAP hace avanzar a Lenis.
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  const lockScroll = (lock) => {
    if (lenis) lock ? lenis.stop() : lenis.start();
    else root.style.overflow = lock ? 'hidden' : '';
  };

  /* ---------- Enlaces internos ---------- */

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const target = $(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    if (menuOpen) toggleMenu(false);
    if (lenis) lenis.scrollTo(target, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else target.scrollIntoView();
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

  /* ---------- Menú móvil ---------- */

  const menu = $('#menu');
  const burger = $('.burger');
  const burgerLabel = $('.burger__label');
  let menuOpen = false;

  function toggleMenu(open) {
    menuOpen = open;
    burger.setAttribute('aria-expanded', String(open));
    burgerLabel.textContent = open ? 'Cerrar' : 'Menú';
    main.inert = open;
    footer.inert = open;
    lockScroll(open);

    if (!motion) {
      menu.hidden = !open;
      return;
    }
    const links = $$('.menu__nav a span', menu);
    gsap.killTweensOf([menu, links]);
    if (open) {
      menu.hidden = false;
      gsap.to(header, { yPercent: 0, duration: 0.4, overwrite: true });
      gsap.fromTo(menu, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'power4.inOut' });
      gsap.fromTo(links, { yPercent: 110 }, { yPercent: 0, duration: 1, ease: 'power4.out', stagger: 0.07, delay: 0.3 });
    } else {
      gsap.to(menu, {
        clipPath: 'inset(0% 0% 100% 0%)',
        duration: 0.7,
        ease: 'power4.inOut',
        onComplete: () => { menu.hidden = true; },
      });
    }
  }

  burger.addEventListener('click', () => toggleMenu(!menuOpen));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOpen) {
      toggleMenu(false);
      burger.focus();
    }
  });
  matchMedia('(min-width: 900px)').addEventListener('change', (e) => {
    if (e.matches && menuOpen) toggleMenu(false);
  });

  /* ---------- Carta: filtros por categoría ---------- */

  const tabList = $('.tabs');
  const tabs = $$('.tab');
  const tabLine = $('.tabs__line');
  let switching = null;

  const moveTabLine = () => {
    const active = tabs.find((t) => t.getAttribute('aria-selected') === 'true');
    tabLine.style.width = `${active.offsetWidth}px`;
    tabLine.style.transform = `translateX(${active.offsetLeft}px)`;
  };

  // En pantallas estrechas las categorías se desplazan: se marca hacia qué lado quedan más.
  const markTabsOverflow = () => {
    const max = tabList.scrollWidth - tabList.clientWidth;
    tabList.classList.toggle('has-more-start', tabList.scrollLeft > 4);
    tabList.classList.toggle('has-more-end', tabList.scrollLeft < max - 4);
  };

  const showDishes = (panel, quick) => {
    if (!motion) return;
    // Cada plato tiene su propia secuencia: foto, nombre, línea, precio y descripción.
    // Al cambiar de categoría la entrada es más breve que la primera vez.
    $$('.dish', panel).forEach((dish, i) => {
      const photo = $('.dish__photo', dish);
      gsap.set($$('.dish__photo, .dish__head, .dish__desc', dish), { clearProps: 'opacity,transform' });
      gsap.timeline({ delay: i * (quick ? 0.09 : 0.15) }).timeScale(quick ? 1.35 : 1)
        .fromTo(photo, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.35, ease: 'power3.inOut', clearProps: 'clipPath' }, 0)
        .fromTo($('img', photo), { scale: 1.3 }, { scale: 1, duration: 1.8, ease: 'power3.out' }, 0)
        .fromTo($('.dish__name', dish), { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', clearProps: 'transform,opacity' }, 0.55)
        .fromTo($('.dish__head i', dish), { scaleX: 0 }, { scaleX: 1, transformOrigin: 'left', duration: 1.1, ease: 'power3.inOut', clearProps: 'transform' }, 0.65)
        .fromTo($('.dish__price', dish), { x: -14, opacity: 0 }, { x: 0, opacity: 1, duration: 0.9, ease: 'power3.out', clearProps: 'transform,opacity' }, 1)
        .fromTo($('.dish__desc', dish), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', clearProps: 'transform,opacity' }, 0.8);
    });
  };

  // Estado previo al revelado, para que nada parpadee antes de entrar en pantalla.
  const hideDishes = (panel) => {
    gsap.set($$('.dish__photo', panel), { clipPath: 'inset(100% 0% 0% 0%)' });
    gsap.set($$('.dish__name, .dish__price, .dish__desc', panel), { opacity: 0 });
    gsap.set($$('.dish__head i', panel), { scaleX: 0, transformOrigin: 'left' });
  };

  function selectTab(tab, focus) {
    const current = tabs.find((t) => t.getAttribute('aria-selected') === 'true');
    if (tab === current) return;
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    if (focus) tab.focus();
    tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    moveTabLine();

    const next = $(`#${tab.getAttribute('aria-controls')}`);
    const swap = () => {
      $$('.panel').forEach((p) => { p.hidden = p !== next; });
      showDishes(next, true);
    };

    if (!motion) return swap();
    if (switching) switching.kill();
    const visible = $$('.panel').find((p) => !p.hidden);
    // Sale el contenido de cada plato, no el plato: su parallax de columna sigue intacto.
    const leaving = $$('.dish__photo, .dish__head, .dish__desc', visible);
    gsap.killTweensOf($$('.dish__photo, .dish__head, .dish__head *, .dish__desc', visible));
    switching = gsap.to(leaving, {
      opacity: 0,
      y: -16,
      duration: 0.4,
      ease: 'power2.in',
      stagger: 0.03,
      onComplete: swap,
    });
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (e) => {
      const move = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      let target = null;
      if (move) target = tabs[(i + move + tabs.length) % tabs.length];
      if (e.key === 'Home') target = tabs[0];
      if (e.key === 'End') target = tabs[tabs.length - 1];
      if (!target) return;
      e.preventDefault();
      selectTab(target, true);
    });
  });
  const measureTabs = () => { moveTabLine(); markTabsOverflow(); };
  tabList.addEventListener('scroll', markTabsOverflow, { passive: true });
  addEventListener('resize', measureTabs);
  document.fonts.ready.then(measureTabs);
  measureTabs();

  /* ---------- Navegación: sección en pantalla ---------- */

  const navLinks = $$('.site-nav a, .menu__nav a');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => {
        if (a.getAttribute('href') === `#${entry.target.id}`) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-50% 0px -50% 0px' });
  $$('main > section[id]').forEach((section) => spy.observe(section));

  /* ---------- Reserva ----------
     Sin data-endpoint en el formulario, solo muestra una vista previa.
     Con data-endpoint, envía los datos por POST (JSON) a ese servicio. */

  const dialog = $('#reserva');
  const form = $('#reserva-form');
  const result = $('#reserva-result');
  const statusBox = $('#reserva-status');
  const submitBtn = $('.reserva__submit', form);
  const submitLabel = $('span', submitBtn);
  const againBtn = $('#reserva-again');
  const endpoint = (form.dataset.endpoint || '').trim();
  const idleLabel = endpoint ? 'Enviar solicitud' : submitLabel.textContent;
  const dateInput = form.elements.fecha;
  const notes = form.elements.notas;
  const notesCount = $('#r-notas-count');
  const SEND_TIMEOUT = 12000;
  let sending = false;

  submitLabel.textContent = idleLabel;
  $('.reserva__flag').hidden = Boolean(endpoint);

  const isoToday = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  };

  // Cada regla devuelve el mensaje de error, o '' si el valor es válido.
  const rules = {
    nombre: (v) => (v.trim().length >= 2 ? '' : 'Escribe tu nombre.'),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Escribe un correo válido, por ejemplo nombre@dominio.com.'),
    fecha: (v) => {
      if (!v) return 'Elige una fecha.';
      return v < isoToday() ? 'Elige una fecha a partir de hoy.' : '';
    },
  };

  const validate = (name) => {
    const input = form.elements[name];
    const message = rules[name](input.value);
    const error = $(`#${input.id}-error`);
    input.setAttribute('aria-invalid', String(Boolean(message)));
    error.textContent = message;
    error.hidden = !message;
    return !message;
  };

  Object.keys(rules).forEach((name) => {
    const input = form.elements[name];
    input.addEventListener('blur', () => { if (input.value) validate(name); });
    // Mientras se corrige un campo marcado, el aviso se actualiza al escribir.
    input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') validate(name); });
  });

  const countNotes = () => {
    const max = notes.maxLength;
    notesCount.textContent = `${notes.value.length} / ${max}`;
    notesCount.classList.toggle('is-near', notes.value.length >= max * 0.9);
  };
  notes.addEventListener('input', countNotes);
  // "reset" se emite antes de vaciar los campos.
  form.addEventListener('reset', () => setTimeout(countNotes));
  countNotes();

  const setBusy = (busy) => {
    sending = busy;
    submitBtn.disabled = busy;
    submitLabel.textContent = busy ? 'Enviando…' : idleLabel;
    form.setAttribute('aria-busy', String(busy));
  };

  // Mensaje según el motivo del fallo; los datos escritos se conservan siempre.
  const sendError = (error) => {
    if (!navigator.onLine) return 'Parece que no hay conexión. Comprueba la red y vuelve a intentarlo.';
    if (error.name === 'AbortError') return 'El servicio tarda demasiado en responder. Tus datos siguen aquí: vuelve a intentarlo en un momento.';
    if (error.status === 429) return 'Demasiados intentos seguidos. Espera un momento antes de volver a enviar.';
    if (error.status >= 400 && error.status < 500) return 'El servicio no ha aceptado los datos. Revisa los campos y vuelve a enviar.';
    return 'No se pudo enviar la solicitud. Tus datos siguen aquí: vuelve a intentarlo.';
  };

  const showForm = () => {
    form.hidden = false;
    result.hidden = true;
    statusBox.hidden = true;
  };

  const showResult = (data, sent) => {
    const day = new Date(`${data.fecha}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const people = data.comensales === '1' ? '1 comensal' : `${data.comensales} comensales`;
    const detail = `mesa para ${people}, el ${day} a las ${data.hora}, a nombre de ${data.nombre.trim()}`;
    $('#reserva-summary').textContent = sent ? `Solicitud enviada: ${detail}.` : `Así quedaría tu solicitud: ${detail}.`;
    $('#reserva-warn').textContent = sent
      ? `La reserva no está confirmada todavía: el restaurante responderá a ${data.email.trim()}.`
      : 'No se ha enviado ni guardado ninguna reserva. Esta web es un proyecto conceptual y no está conectada a un servicio de reservas.';
    againBtn.hidden = sent;
    form.hidden = true;
    result.hidden = false;
    if (motion) {
      gsap.from(result.children, { y: 22, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1, clearProps: 'transform,opacity' });
    }
    result.focus();
  };

  $$('[data-open-reserva]').forEach((b) => b.addEventListener('click', () => {
    dateInput.min = isoToday();
    showForm();
    dialog.showModal();
    lockScroll(true);
    if (motion) {
      gsap.from($$('.field, .reserva__submit', form), { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.06, delay: 0.15, clearProps: 'transform,opacity' });
    }
  }));
  $$('[data-close-reserva]').forEach((b) => b.addEventListener('click', () => dialog.close()));
  // Solo cierra un clic en el fondo, no en el margen interior del diálogo.
  dialog.addEventListener('click', (e) => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) dialog.close();
  });
  dialog.addEventListener('close', () => lockScroll(false));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending) return;   // ya hay una solicitud en curso
    statusBox.hidden = true;

    const invalid = Object.keys(rules).filter((name) => !validate(name));
    if (invalid.length) {
      form.elements[invalid[0]].focus();
      return;
    }

    const { web, ...data } = Object.fromEntries(new FormData(form));
    if (web) return;   // campo trampa relleno: es un bot
    if (!endpoint) {
      showResult(data, false);
      return;
    }

    setBusy(true);
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), SEND_TIMEOUT);
    let failure = null;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
        signal: abort.signal,
      });
      if (!response.ok) throw Object.assign(new Error(`Respuesta ${response.status}`), { status: response.status });
    } catch (error) {
      failure = error;
    } finally {
      clearTimeout(timer);
      setBusy(false);
    }

    // Solo se confirma el envío con una respuesta satisfactoria del servicio.
    if (failure) {
      statusBox.textContent = sendError(failure);
      statusBox.hidden = false;
      submitBtn.focus();
      return;
    }
    showResult(data, true);
    form.reset();
  });
  againBtn.addEventListener('click', () => {
    showForm();
    form.elements.nombre.focus();
  });

  if (!motion) return;

  /* =====================================================================
     A partir de aquí, todo es animación.
     ===================================================================== */

  const mm = gsap.matchMedia();
  const DESKTOP = '(min-width: 800px)';
  const MOBILE = '(max-width: 799px)';

  /* ---------- Cabecera: se oculta al bajar y vuelve al subir ---------- */

  let headerHidden = false;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
      if (menuOpen || header.contains(document.activeElement)) return;
      const hide = self.direction === 1 && self.scroll() > 240;
      if (hide === headerHidden) return;
      headerHidden = hide;
      gsap.to(header, { yPercent: hide ? -130 : 0, duration: 0.7, ease: 'power3.out', overwrite: true });
    },
  });

  // Al llegar con el teclado a una cabecera oculta, vuelve a mostrarse.
  header.addEventListener('focusin', () => {
    if (!headerHidden) return;
    headerHidden = false;
    gsap.to(header, { yPercent: 0, duration: 0.5, ease: 'power3.out', overwrite: true });
  });

  /* ---------- Botones magnéticos (solo con ratón) ---------- */

  mm.add('(hover: hover) and (pointer: fine)', () => {
    const clean = $$('[data-magnetic]').map((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'power3.out' });
      const move = (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.28);
        yTo((e.clientY - r.top - r.height / 2) * 0.28);
      };
      const leave = () => { xTo(0); yTo(0); };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerleave', leave);
      return () => {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerleave', leave);
      };
    });
    return () => clean.forEach((fn) => fn());
  });

  /* ---------- Hero: parallax de salida ---------- */

  gsap.to('.hero__media', {
    yPercent: 10,
    scale: 1.08,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.hero__content', {
    y: -90,
    opacity: 0,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '70% top', scrub: true },
  });

  /* ---------- Revelado de imágenes y parallax interior ---------- */

  $$('[data-reveal]').forEach((frame) => {
    const img = $('img', frame);
    gsap.timeline({ scrollTrigger: { trigger: frame, start: 'top 88%', once: true } })
      .fromTo(frame, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'power3.inOut', clearProps: 'clipPath' })
      .fromTo(img, { scale: 1.3 }, { scale: 1, duration: 1.9, ease: 'power3.out', clearProps: 'transform' }, 0);
  });

  $$('[data-parallax]').forEach((layer) => {
    const amount = Number(layer.dataset.parallax);
    gsap.fromTo(layer, { yPercent: -amount }, {
      yPercent: amount,
      ease: 'none',
      scrollTrigger: { trigger: layer.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  // Capas que se desplazan a su propio ritmo; en móvil se quedan quietas.
  mm.add(DESKTOP, () => {
    $$('[data-speed]').forEach((el) => {
      const px = Number(el.dataset.speed);
      gsap.fromTo(el, { y: px }, {
        y: -px,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  });

  $$('[data-fade]').forEach((el) => {
    gsap.from(el, {
      y: 28,
      opacity: 0,
      duration: 1.2,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });

  $$('.tag').forEach((tag) => {
    gsap.from($('i', tag), {
      scaleX: 0,
      transformOrigin: 'left',
      duration: 1.4,
      ease: 'power3.inOut',
      scrollTrigger: { trigger: tag, start: 'top 92%', once: true },
    });
  });

  /* ---------- Expansión de imagen ligada al scroll ---------- */

  $$('[data-expand]').forEach((wrap) => {
    const pin = $('.expand__pin', wrap);
    const frame = $('.expand__frame', wrap);
    const img = $('img', frame);
    const shade = $('.expand__shade', frame);
    const lines = $$('.mask > span', frame);
    const aside = $('.expand__aside', wrap);
    const side = wrap.dataset.expand === 'right';

    mm.add({ desktop: DESKTOP, mobile: MOBILE }, (ctx) => {
      const d = ctx.conditions.desktop;
      // Recorte inicial en vh/vw: centrado al 65 % del ancho, o anclado a la derecha.
      const from = side
        ? (d ? { t: 17, r: 6, b: 17, l: 46 } : { t: 40, r: 6, b: 12, l: 6 })
        : (d ? { t: 14, r: 17.5, b: 14, l: 17.5 } : { t: 22, r: 6, b: 22, l: 6 });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: wrap, start: 'top top', end: '+=150%', pin, scrub: true, anticipatePin: 1 },
      });
      tl.fromTo(frame,
        { '--it': from.t, '--ir': from.r, '--ib': from.b, '--il': from.l, '--rad': d ? 22 : 14 },
        { '--it': 0, '--ir': 0, '--ib': 0, '--il': 0, '--rad': 0, duration: 1, ease: 'power1.inOut' }, 0)
        .fromTo(img, { scale: 1.32, yPercent: -2 }, { scale: 1.07, yPercent: 2, duration: 1.5 }, 0)
        .fromTo(shade, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.65)
        .fromTo(lines, { yPercent: 140 }, { yPercent: 0, duration: 0.45, stagger: 0.14, ease: 'power3.out' }, 0.82);
      if (aside) tl.to(aside, { opacity: 0, x: -50, duration: 0.3 }, 0.08);

      // Antes de fijarse, la foto ya se mueve dentro de su marco.
      gsap.fromTo($('.expand__media', frame), { yPercent: -7 }, {
        yPercent: 0,
        ease: 'none',
        scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'top top', scrub: true },
      });
    });
  });

  /* ---------- Experiencia: secuencia fijada en cuatro actos ---------- */

  const actsWrap = $('[data-acts]');
  const actsPin = $('.acts__pin', actsWrap);
  const acts = $$('.act', actsWrap);
  const actTexts = $$('.act-text', actsWrap);
  const actLabels = $$('.acts__progress li', actsWrap);

  const setAct = (index) => actLabels.forEach((li, i) => li.classList.toggle('is-on', i === index));
  setAct(0);

  mm.add({ desktop: DESKTOP, mobile: MOBILE }, (ctx) => {
    // Cada acto entra con un corte distinto: telón, barrido lateral e iris.
    const wipes = [
      null,
      ['inset(100% 0% 0% 0%)', 'inset(0% 0% 0% 0%)'],
      ['inset(0% 0% 0% 100%)', 'inset(0% 0% 0% 0%)'],
      ['circle(0% at 50% 55%)', 'circle(75% at 50% 55%)'],
    ];

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      // Se lee el tiempo de la propia línea: con scrub suavizado va por detrás del scroll.
      onUpdate: () => setAct(Math.min(acts.length - 1, Math.floor(tl.time() + 0.3))),
      scrollTrigger: {
        trigger: actsWrap,
        start: 'top top',
        end: ctx.conditions.desktop ? '+=420%' : '+=320%',
        pin: actsPin,
        scrub: 0.6,
        anticipatePin: 1,
      },
    });

    tl.fromTo('.acts__bar', { scaleY: 0 }, { scaleY: 1, duration: 0.3, ease: 'power2.out' }, 0)
      .fromTo('.acts__fill', { scaleX: 0 }, { scaleX: 1, duration: acts.length }, 0)
      .fromTo($('img', acts[0]), { scale: 1.22 }, { scale: 1.05, duration: 0.6 }, 0);

    actTexts.forEach((text, i) => {
      const title = $('.mask > span', text);
      const rest = $$('.act-text__n, .act-text__p', text);
      const at = i === 0 ? 0.05 : i + 0.02;
      tl.fromTo(title, { yPercent: 150 }, { yPercent: 0, duration: 0.28, ease: 'power3.out' }, at)
        .fromTo(rest, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.24, stagger: 0.05, ease: 'power2.out' }, at + 0.06);
      if (i < actTexts.length - 1) {
        tl.to(title, { yPercent: -150, duration: 0.2, ease: 'power2.in' }, i + 0.5)
          .to(rest, { y: -20, opacity: 0, duration: 0.16, ease: 'power2.in' }, i + 0.5);
      }
    });

    acts.forEach((act, i) => {
      if (i === 0) return;
      const start = i - 0.5;
      tl.fromTo(act, { clipPath: wipes[i][0] }, { clipPath: wipes[i][1], duration: 0.5, ease: 'power2.inOut' }, start)
        .fromTo($('img', act), { scale: 1.38 }, { scale: 1.05, duration: 0.95, ease: 'power1.out' }, start)
        // El plano anterior retrocede mientras entra el siguiente: profundidad.
        .to($('img', acts[i - 1]), { scale: 1.16, yPercent: -5, duration: 0.5, ease: 'power1.in' }, start);
    });

    tl.to('.acts__bar', { scaleY: 0, duration: 0.25, ease: 'power2.in' }, acts.length - 0.25);
  });

  /* ---------- Carta: entrada, parallax por columnas y foto que sigue al cursor ---------- */

  hideDishes($$('.panel').find((p) => !p.hidden));
  ScrollTrigger.create({
    trigger: '.carta__panels',
    start: 'top 78%',
    once: true,
    onEnter: () => showDishes($$('.panel').find((p) => !p.hidden)),
  });

  gsap.from('.tab', {
    y: 24,
    opacity: 0,
    duration: 1,
    ease: 'power3.out',
    stagger: 0.08,
    clearProps: 'transform,opacity',
    scrollTrigger: { trigger: '.tabs', start: 'top 90%', once: true },
  });
  gsap.from('.tabs__line', {
    opacity: 0,
    duration: 0.8,
    delay: 0.5,
    scrollTrigger: { trigger: '.tabs', start: 'top 90%', once: true },
  });

  // Con tres columnas, cada una se desplaza a su ritmo.
  mm.add('(min-width: 900px)', () => {
    [0, 34, 68].forEach((px, column) => {
      if (!px) return;
      gsap.fromTo($$(`.dish:nth-child(${column + 1})`), { y: px }, {
        y: -px,
        ease: 'none',
        scrollTrigger: { trigger: '.carta__panels', start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  });

  mm.add('(hover: hover) and (pointer: fine)', () => {
    const clean = $$('.dish__photo').map((photo) => {
      const img = $('img', photo);
      const xTo = gsap.quickTo(img, 'xPercent', { duration: 0.9, ease: 'power3.out' });
      const yTo = gsap.quickTo(img, 'yPercent', { duration: 0.9, ease: 'power3.out' });
      const move = (e) => {
        const r = photo.getBoundingClientRect();
        xTo(((e.clientX - r.left) / r.width - 0.5) * -3);
        yTo(((e.clientY - r.top) / r.height - 0.5) * -3);
      };
      const leave = () => { xTo(0); yTo(0); };
      photo.addEventListener('pointermove', move);
      photo.addEventListener('pointerleave', leave);
      return () => {
        photo.removeEventListener('pointermove', move);
        photo.removeEventListener('pointerleave', leave);
      };
    });
    return () => clean.forEach((fn) => fn());
  });

  /* ---------- Reservas: el aro crece mientras la sección cruza la pantalla ---------- */

  gsap.fromTo('.reservas__ring', { scale: 0.82, rotate: -8 }, {
    scale: 1.06,
    rotate: 0,
    ease: 'none',
    scrollTrigger: { trigger: '.reservas', start: 'top bottom', end: 'bottom top', scrub: true },
  });

  /* ---------- Pie: aparece desde debajo de la sección anterior ---------- */

  gsap.fromTo('.footer__word', { yPercent: -22 }, {
    yPercent: 0,
    ease: 'none',
    scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true },
  });
  gsap.from('.footer__nav a, .to-top, .footer__base p', {
    opacity: 0,
    duration: 1.1,
    ease: 'power2.out',
    stagger: 0.07,
    scrollTrigger: { trigger: '.footer__row', start: 'top 96%', once: true },
  });
  gsap.from('.footer__nav a', {
    y: 18,
    duration: 1.1,
    ease: 'power3.out',
    stagger: 0.07,
    clearProps: 'transform',
    scrollTrigger: { trigger: '.footer__row', start: 'top 96%', once: true },
  });

  /* ---------- Pie: logotipo letra a letra ---------- */

  gsap.from('.footer__word span', {
    yPercent: 118,
    duration: 1.5,
    ease: 'power4.out',
    stagger: 0.08,
    scrollTrigger: { trigger: '.footer__word', start: 'top 92%', once: true },
  });

  /* ---------- Textos (cuando las fuentes ya miden lo que deben) ---------- */

  const heroImg = $('.hero__media img');
  const imgReady = heroImg.complete ? Promise.resolve() : new Promise((res) => {
    heroImg.addEventListener('load', res, { once: true });
    heroImg.addEventListener('error', res, { once: true });
  });
  const timeout = new Promise((res) => setTimeout(res, 2500));

  Promise.race([Promise.all([document.fonts.ready, imgReady]), timeout]).then(() => {
    // Títulos: línea a línea tras una máscara, palabra a palabra desde abajo.
    $$('[data-split]').forEach((el) => {
      SplitText.create(el, {
        type: 'lines,words',
        mask: 'lines',
        linesClass: 'ln',
        autoSplit: true,
        onSplit: (self) => gsap.from(self.words, {
          yPercent: 135,
          opacity: 0,
          duration: 1.25,
          ease: 'power4.out',
          stagger: 0.04,
          scrollTrigger: { trigger: el, start: 'top 86%', once: true },
        }),
      });
    });

    // Manifiesto: las palabras ganan tinta a medida que se lee.
    $$('[data-scrubtext]').forEach((el) => {
      SplitText.create(el, {
        type: 'words',
        autoSplit: true,
        onSplit: (self) => gsap.fromTo(self.words, { opacity: 0.16 }, {
          opacity: 1,
          ease: 'none',
          stagger: 0.1,
          scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 48%', scrub: true },
        }),
      });
    });

    // Los pines se crean por tipo, no por posición: se ordenan antes de medir.
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    intro();
  });

  /* ---------- Secuencia de entrada ---------- */

  function intro() {
    const title = $('.hero__title');
    // autoSplit rehace las líneas si el ancho cambia a mitad de la entrada
    // (girar el móvil, o una pestaña que se abre sin tamaño todavía).
    let titleTween = null;
    let titleStarted = false;
    const split = SplitText.create(title, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'ln',
      autoSplit: true,
      onSplit: (self) => {
        titleTween = gsap.from(self.lines, { yPercent: 130, duration: 1.4, stagger: 0.14, ease: 'power4.out', paused: !titleStarted });
        return titleTween;
      },
    });
    gsap.set(['.hero__content', '.hero__scroll', header], { visibility: 'visible' });

    gsap.timeline({ defaults: { ease: 'power4.out' } })
      .from('.curtain__word span', { yPercent: 110, duration: 0.9, stagger: 0.06 })
      .to('.curtain__word span', { yPercent: -110, duration: 0.7, stagger: 0.04, ease: 'power3.in' }, '+=0.35')
      .to('.curtain', { yPercent: -100, duration: 1.2, ease: 'power4.inOut' }, '-=0.25')
      .fromTo(heroImg, { scale: 1.35 }, { scale: 1, duration: 2.6, ease: 'power3.out' }, '<')
      .call(() => lenis.start())
      .call(() => { titleStarted = true; titleTween.play(); }, null, '<0.75')
      .from('.hero__sub', { y: 26, opacity: 0, duration: 1.1 }, '<0.55')
      .from('.hero__cta', { y: 26, opacity: 0, duration: 1.1 }, '<0.25')
      .from(header, { y: -24, opacity: 0, duration: 1.1, clearProps: 'opacity' }, '<')
      .from('.hero__scroll', { opacity: 0, duration: 1.2 }, '<0.2')
      .set('.curtain', { display: 'none' })
      // El título vuelve a ser texto corrido para que se reajuste al cambiar el ancho.
      .call(() => split.revert());
  }
})();
