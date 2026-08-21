/**
 * REFUGIO AMIGO ANIMAL — script.js
 * Sistema modular de carga de contenido dinámico y maquetación interactiva.
 * Inyecta cabecera y pie de página de forma automática y unificada.
 */

// ════════════════════════════════════════════════════════════
// ESTADO GLOBAL
// ════════════════════════════════════════════════════════════
let CONFIG = null;
let ALL_ANIMALS = [];

// ════════════════════════════════════════════════════════════
// UTILIDADES
// ════════════════════════════════════════════════════════════

/** Formatea la edad de forma legible */
function formatAge(age) {
  if (!age && age !== 0) return 'Desconocida';
  if (age < 1) {
    const months = Math.round(age * 12);
    return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  }
  const years = Math.round(age);
  return `${years} ${years === 1 ? 'año' : 'años'}`;
}

/** Formatea fecha para eventos */
function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return date.toLocaleDateString('es-ES', options);
}

/** Icono SVG inline para redes sociales */
function socialIcon(name) {
  const icons = {
    instagram: 'IG',
    facebook: 'FB',
    twitter: 'TW',
    whatsapp: 'WA',
    tiktok: 'TT',
    youtube: 'YT',
    bluesky: 'BS',
  };
  return icons[name?.toLowerCase()] || '🔗';
}

/** Observador de intersección para animaciones al hacer scroll */
function setupScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(
    '.animate-on-scroll, .animal-card, .help-quick-card, .event-card, .stat-item, .value-card, .team-card, .help-card, .foster-step'
  ).forEach(el => observer.observe(el));
}

/** Contador animado para estadísticas */
function animateCounter(el, target, duration = 1500) {
  const start = performance.now();
  const update = (time) => {
    const elapsed = time - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = Math.round(eased * target);
    el.textContent = current.toLocaleString('es-ES');
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

/** Inicia contadores cuando entran en vista */
function setupCounters() {
  const counterEls = document.querySelectorAll('[data-counter]');
  if (!counterEls.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.dataset.counter, 10);
        animateCounter(entry.target, target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counterEls.forEach(el => observer.observe(el));
}

// ════════════════════════════════════════════════════════════
// HEADER — sticky + menú hamburguesa
// ════════════════════════════════════════════════════════════
function setupHeader() {
  const header = document.querySelector('.site-header');
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');

  // Sticky shadow
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  // Hamburger toggle
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('active', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
    });

    // Cierra al hacer clic en un enlace
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('active');
      });
    });
  }

  // Marca el enlace activo basado en la página actual y hashes
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const currentHash = window.location.hash;

  document.querySelectorAll('.main-nav a, .mobile-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    
    // Remueve marcas previas
    link.classList.remove('active');

    // Validación precisa de enlace activo
    if (href === currentPage || (currentPage === 'index.html' && href.startsWith('#'))) {
      if (currentHash && href.includes(currentHash)) {
        link.classList.add('active');
      } else if (!currentHash && (href === 'index.html' || href === '#hero')) {
        link.classList.add('active');
      }
    } else if (href === 'adopcion.html' && currentPage === 'adopcion.html') {
      link.classList.add('active');
    } else if (href === 'guia.html' && currentPage === 'guia.html') {
      link.classList.add('active');
    }
  });
}

// ════════════════════════════════════════════════════════════
// DYNAMIC LAYOUT INJECTION (Header, Mobile Menu & Footer)
// ════════════════════════════════════════════════════════════
function renderLayout() {
  if (!CONFIG) return;

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const isHomePage = currentPage === 'index.html' || currentPage === '';

  // Genera la ruta apropiada para las anclas
  const getPath = (anchor) => {
    return isHomePage ? anchor : `index.html${anchor}`;
  };

  // 1. Inyectar site-header
  const headerHtml = `
    <div class="container">
      <div class="header-inner">
        <a href="${isHomePage ? '#hero' : 'index.html'}" class="site-logo" aria-label="Inicio">
          <span class="site-logo__name">
            <span data-site-name>${CONFIG.siteTitle}</span>
            <span data-site-tagline>${CONFIG.siteTagline || ''}</span>
          </span>
        </a>

        <nav class="main-nav" aria-label="Navegación principal">
          <a href="${isHomePage ? '#hero' : 'index.html'}">Inicio</a>
          <a href="adopcion.html">Adopción</a>
          <a href="${getPath('#como-ayudar')}">Cómo Ayudar</a>
          <a href="${getPath('#contacto')}">Contacto</a>
        </nav>

        <div class="header-cta">
          <button class="hamburger" id="hamburger" aria-label="Abrir menú" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </div>
  `;

  let header = document.querySelector('.site-header');
  if (!header) {
    header = document.createElement('header');
    header.className = 'site-header';
    header.setAttribute('role', 'banner');
    document.body.insertBefore(header, document.body.firstChild);
  }
  header.innerHTML = headerHtml;

  // 2. Inyectar mobile-nav
  const mobileNavHtml = `
    <a href="${isHomePage ? '#hero' : 'index.html'}">Inicio</a>
    <a href="adopcion.html">Adopción</a>
    <a href="${getPath('#como-ayudar')}">Cómo Ayudar</a>
    <a href="${getPath('#contacto')}">Contacto</a>
  `;
  let mobileNav = document.getElementById('mobileNav');
  if (!mobileNav) {
    mobileNav = document.createElement('nav');
    mobileNav.className = 'mobile-nav';
    mobileNav.id = 'mobileNav';
    mobileNav.setAttribute('aria-label', 'Menú móvil');
    header.after(mobileNav);
  }
  mobileNav.innerHTML = mobileNavHtml;

  // 3. Inyectar site-footer
  const footerHtml = `
    <div class="container">
      <div class="footer-top">
        <div class="footer-brand">
          <a href="${isHomePage ? '#hero' : 'index.html'}" class="site-logo" aria-label="Inicio">
            <span class="site-logo__name">
              <span>${CONFIG.siteTitle}</span>
            </span>
          </a>
          <p>${CONFIG.footerText || `Rescatando y rehabilitando animales en situación de abandono.`}</p>
          <div class="social-links" data-social-links></div>
        </div>

        <div class="footer-col">
          <h4>Navegación</h4>
          <ul>
            <li><a href="${isHomePage ? '#hero' : 'index.html'}">Inicio</a></li>
            <li><a href="adopcion.html">Adopción</a></li>
            <li><a href="${getPath('#como-ayudar')}">Cómo Ayudar</a></li>
            <li><a href="${getPath('#contacto')}">Contacto</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Colaborar</h4>
          <ul>
            <li><a href="${getPath('#como-ayudar')}">Donaciones</a></li>
            <li><a href="${getPath('#como-ayudar')}">Voluntariado</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Contacto</h4>
          <ul>
            <li><a href="mailto:${CONFIG.contactInfo?.email || ''}">${CONFIG.contactInfo?.email || ''}</a></li>
            <li><a href="tel:${(CONFIG.contactInfo?.phone || '').replace(/\s/g, '')}">${CONFIG.contactInfo?.phone || ''}</a></li>
            <li><a href="como-usar.html" style="font-weight:bold;color:var(--accent);">Usa esta Plantilla</a></li>
            <li><a href="admin.html" style="font-weight:bold;color:var(--primary);">Panel de Admin</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <p>© ${new Date().getFullYear()} ${CONFIG.siteTitle}. Todos los derechos reservados.</p>
        <p><a href="como-usar.html">Cómo usar esta Plantilla</a> | <a href="admin.html">Administración</a></p>
      </div>
    </div>
  `;
  let footer = document.querySelector('.site-footer');
  if (!footer) {
    footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.setAttribute('role', 'contentinfo');
    document.body.appendChild(footer);
  }
  footer.innerHTML = footerHtml;

  // 4. Inyectar modal-overlay si no existe
  let modalOverlay = document.getElementById('animalModal');
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.id = 'animalModal';
    modalOverlay.setAttribute('role', 'dialog');
    modalOverlay.setAttribute('aria-modal', 'true');
    document.body.appendChild(modalOverlay);
  }

  // Vuelve a vincular eventos de redes sociales, email, etc.
  document.querySelectorAll('[data-donation-url]').forEach(el => {
    el.href = CONFIG.donationUrl || '#';
  });

  const socialLinksContainers = document.querySelectorAll('[data-social-links]');
  if (socialLinksContainers.length && CONFIG.socialLinks) {
    socialLinksContainers.forEach(container => {
      container.innerHTML = CONFIG.socialLinks.map(link => `
        <a href="${link.url}" target="_blank" rel="noopener" class="social-link" title="${link.name}">
          ${socialIcon(link.icon)}
        </a>
      `).join('');
    });
  }

  setupHeader();
}

// ════════════════════════════════════════════════════════════
// CARGA DE CONFIGURACIÓN
// ════════════════════════════════════════════════════════════
async function loadConfig() {
  try {
    const res = await fetch('data/config.json');
    if (!res.ok) throw new Error(`Error ${res.status}`);
    CONFIG = await res.json();

    // Aplica el tema de color
    if (CONFIG.theme) {
      const root = document.documentElement;
      if (CONFIG.theme.primaryColor)   root.style.setProperty('--primary', CONFIG.theme.primaryColor);
      if (CONFIG.theme.secondaryColor) root.style.setProperty('--secondary', CONFIG.theme.secondaryColor);
      if (CONFIG.theme.accentColor)    root.style.setProperty('--accent', CONFIG.theme.accentColor);
      if (CONFIG.theme.darkBg)         root.style.setProperty('--bg-dark', CONFIG.theme.darkBg);
      if (CONFIG.theme.lightBg)        root.style.setProperty('--bg-light', CONFIG.theme.lightBg);
      if (CONFIG.theme.cardBg)         root.style.setProperty('--bg-card', CONFIG.theme.cardBg);
    }

    // Título de la pestaña
    const page = window.location.pathname.split('/').pop() || 'index.html';
    const pageTitles = {
      'index.html': 'Inicio',
      'adopcion.html': 'Adopción',
      'guia.html': 'Configuración y Guía',
    };
    document.title = pageTitles[page]
      ? `${CONFIG.siteTitle} — ${pageTitles[page]}`
      : CONFIG.siteTitle;

    // Rellena la cabecera, menús y pie
    renderLayout();

    return CONFIG;
  } catch (err) {
    console.error('Error cargando config.json:', err);
    return null;
  }
}

// ════════════════════════════════════════════════════════════
// CARGA DE ANIMALES
// ════════════════════════════════════════════════════════════
async function loadAnimals() {
  try {
    // Intenta Google Apps Script primero
    const url = CONFIG?.appsScriptAnimalsUrl;
    if (url && url !== 'TU_URL_DE_APPS_SCRIPT_ANIMALES') {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          ALL_ANIMALS = data;
          return data;
        }
      }
    }
  } catch (_) { /* fallback al JSON local */ }

  try {
    const res = await fetch('data/animales.json');
    if (!res.ok) throw new Error(`Error ${res.status}`);
    ALL_ANIMALS = await res.json();
    return ALL_ANIMALS;
  } catch (err) {
    console.error('Error cargando animales:', err);
    return [];
  }
}

// ════════════════════════════════════════════════════════════
// TARJETA DE ANIMAL
// ════════════════════════════════════════════════════════════
function createAnimalCard(animal, clickable = true) {
  const isFoster = animal.type === 'foster';
  const card = document.createElement('div');
  card.className = 'animal-card';

  card.innerHTML = `
    <div class="animal-card__img-wrap">
      <img
        src="${animal.image}"
        alt="${animal.name}"
        loading="lazy"
        onerror="this.src='https://placehold.co/600x400/F5F0EB/9B9BAD?text=${encodeURIComponent(animal.name)}'"
      >
      <div class="animal-card__badges">
        <span class="badge badge--species">${animal.species}</span>
        <span class="badge badge--available">Disponible</span>
      </div>
    </div>
    <div class="animal-card__body">
      <div class="animal-card__name">${animal.name}</div>
      <div class="animal-card__meta">
        <span>Edad: ${formatAge(animal.age)}</span>
        ${animal.gender ? `<span>${animal.gender}</span>` : ''}
        ${animal.size ? `<span>Tamaño: ${animal.size}</span>` : ''}
        ${animal.breed ? `<span>Raza: ${animal.breed}</span>` : ''}
      </div>
      <p class="animal-card__desc">${animal.description}</p>
    </div>
    <div class="animal-card__footer">
      <div class="animal-indicators">
        <span class="indicator ${animal.vaccinated ? 'ok' : ''}">Vacunado</span>
        <span class="indicator ${animal.neutered ? 'ok' : ''}">Esterilizado</span>
      </div>
      <span class="btn btn--primary btn--sm">Ver más</span>
    </div>
  `;

  if (clickable) {
    card.addEventListener('click', () => openAnimalModal(animal));
    card.style.cursor = 'pointer';
  }

  return card;
}

// ════════════════════════════════════════════════════════════
// MODAL DE ANIMAL
// ════════════════════════════════════════════════════════════
function openAnimalModal(animal) {
  const overlay = document.getElementById('animalModal');
  if (!overlay) return;

  const email = CONFIG?.contactInfo?.email || 'info@turefugio.com';
  const subject = encodeURIComponent(`Interés en adoptar a ${animal.name}`);
  const body = encodeURIComponent(
    `Hola, me gustaría obtener más información sobre ${animal.name} (${animal.species}, ${animal.breed || ''}).\n\n` +
    `Mi nombre es: \nMi teléfono: \nMensaje: `
  );

  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-label="Información de ${animal.name}">
      <button class="modal__close" id="modalClose" aria-label="Cerrar">✕</button>
      <img class="modal__img" src="${animal.image}" alt="${animal.name}"
        onerror="this.src='https://placehold.co/860x320/F5F0EB/9B9BAD?text=${encodeURIComponent(animal.name)}'">
      <div class="modal__body">
        <div class="modal__header">
          <div class="modal__name">${animal.name}</div>
          <span class="modal__species-badge">${animal.species} · ${animal.breed || ''}</span>
        </div>

        <p class="modal__desc">${animal.description}</p>

        ${animal.personality?.length ? `
          <div class="modal__traits">
            <h4>Personalidad</h4>
            <div class="trait-pills">
              ${animal.personality.map(t => `<span class="trait-pill">${t}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        <div class="modal__checklist">
          <div class="checklist-item">
            <span class="${animal.vaccinated ? 'icon-ok' : 'icon-no'}">${animal.vaccinated ? '✓' : '✗'}</span>
            Vacunado
          </div>
          <div class="checklist-item">
            <span class="${animal.neutered ? 'icon-ok' : 'icon-no'}">${animal.neutered ? '✓' : '✗'}</span>
            Esterilizado
          </div>
          <div class="checklist-item">
            <span class="${animal.microchip ? 'icon-ok' : 'icon-no'}">${animal.microchip ? '✓' : '✗'}</span>
            Microchip
          </div>
          <div class="checklist-item">
            Edad: ${formatAge(animal.age)}
          </div>
          ${animal.gender ? `<div class="checklist-item">Género: ${animal.gender}</div>` : ''}
          ${animal.size ? `<div class="checklist-item">Tamaño: ${animal.size}</div>` : ''}
        </div>

        <div class="modal__cta">
          <a href="mailto:${email}?subject=${subject}&body=${body}"
            class="btn btn--primary btn--lg">
            Quiero adoptarlo
          </a>
          <a href="mailto:${email}?subject=${encodeURIComponent('Pregunta sobre ' + animal.name)}"
            class="btn btn--secondary">
            Preguntar
          </a>
        </div>
      </div>
    </div>
  `;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  document.getElementById('modalClose').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
}

function closeModal() {
  const overlay = document.getElementById('animalModal');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// Cierra modal con Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ════════════════════════════════════════════════════════════
// CONSOLIDATED INITIALIZERS FOR index.html
// ════════════════════════════════════════════════════════════

/** Rellena la sección Quiénes Somos */
function initAboutSection() {
  if (!CONFIG?.aboutPage) return;
  const about = CONFIG.aboutPage;

  document.querySelectorAll('[data-about-title]').forEach(el => { el.textContent = about.title; });
  document.querySelectorAll('[data-about-image]').forEach(el => {
    el.src = about.heroImage || '';
    el.alt = about.title || '';
  });

  const missionContainer = document.getElementById('missionParagraphs');
  if (missionContainer && about.missionParagraphs) {
    missionContainer.innerHTML = about.missionParagraphs.map(p => `<p>${p}</p>`).join('');
  }

  const valuesGrid = document.getElementById('valuesGrid');
  if (valuesGrid && about.values) {
    valuesGrid.innerHTML = about.values.map((v, i) => `
      <div class="value-card delay-${(i % 4) + 1}">
        <div class="value-card__emoji">${v.emoji}</div>
        <div>
          <h3>${v.title}</h3>
          <p>${v.text}</p>
        </div>
      </div>
    `).join('');
  }

  const teamGrid = document.getElementById('teamGrid');
  if (teamGrid && about.teamMembers) {
    teamGrid.innerHTML = about.teamMembers.map((m, i) => `
      <div class="team-card delay-${(i % 3) + 1}">
        <img class="team-card__img" src="${m.image}" alt="${m.name}"
          onerror="this.src='https://placehold.co/300x220/F5F0EB/9B9BAD?text=${encodeURIComponent(m.name)}'">
        <div class="team-card__body">
          <h3>${m.name}</h3>
          <div class="team-card__role">${m.role}</div>
          <p>${m.description}</p>
        </div>
      </div>
    `).join('');
  }

  const galleryGrid = document.getElementById('galleryGrid');
  if (galleryGrid && CONFIG.gallery?.length) {
    galleryGrid.innerHTML = CONFIG.gallery.map((url, i) => `
      <div class="gallery-item">
        <img src="${url}" alt="Foto del refugio ${i + 1}" loading="lazy">
      </div>
    `).join('');
  }
}

/** Rellena la sección Cómo Ayudar */
function initHelpSection() {
  if (!CONFIG?.helpPage) return;
  const help = CONFIG.helpPage;

  const donationMethods = document.getElementById('donationMethods');
  if (donationMethods && help.donation?.methods) {
    // Excluye PayPal del listado
    const filteredMethods = help.donation.methods.filter(m => m.name.toLowerCase() !== 'paypal');
    donationMethods.innerHTML = filteredMethods.map(m => `
      <div class="help-card__method">
        <div>
          <div class="help-card__method-name">${m.name}</div>
          <div class="help-card__method-info">${m.info}</div>
        </div>
      </div>
    `).join('');
  }

  const materialsList = document.getElementById('materialsList');
  if (materialsList && help.materials?.items) {
    materialsList.innerHTML = `<ul class="help-card__list">${
      help.materials.items.map(item => `<li>${item}</li>`).join('')
    }</ul>`;
  }

  const volunteerTasks = document.getElementById('volunteerTasks');
  if (volunteerTasks && help.volunteer?.tasks) {
    volunteerTasks.innerHTML = `<ul class="help-card__list">${
      help.volunteer.tasks.map(t => `<li>${t}</li>`).join('')
    }</ul>`;
  }

  const email = CONFIG.contactInfo?.email || '';
  document.querySelectorAll('[data-volunteer-contact]').forEach(el => {
    el.innerHTML = `${help.volunteer?.contactPrompt || '¿Te interesa? Escríbenos a:'} <a href="mailto:${email}" class="btn btn--sm btn--secondary">${email}</a>`;
  });
}

/** Rellena la sección de Contacto */
function initContactSection() {
  // Datos específicos del panel de contacto
  document.querySelectorAll('[data-contact-address]').forEach(el => {
    el.textContent = CONFIG.contactInfo?.address || '';
    if (el.tagName === 'A') el.href = `https://maps.google.com/?q=${encodeURIComponent(CONFIG.contactInfo?.address || '')}`;
  });
  document.querySelectorAll('[data-contact-phone]').forEach(el => {
    el.textContent = CONFIG.contactInfo?.phone || '';
    if (el.tagName === 'A') el.href = `tel:${(CONFIG.contactInfo?.phone || '').replace(/\s/g, '')}`;
  });
  document.querySelectorAll('[data-contact-hours]').forEach(el => {
    el.textContent = CONFIG.contactInfo?.hours || '';
  });

  // Formulario de contacto (mailto)
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name    = document.getElementById('formName')?.value || '';
      const email   = document.getElementById('formEmail')?.value || '';
      const subject = document.getElementById('formSubject')?.value || 'Consulta desde la web';
      const message = document.getElementById('formMessage')?.value || '';
      const toEmail = CONFIG?.contactInfo?.email || '';

      const body = encodeURIComponent(`Nombre: ${name}\nEmail: ${email}\n\n${message}`);
      const mailtoUrl = `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${body}`;
      window.location.href = mailtoUrl;
    });
  }
}

function initSocialSection() {
  const socialGrid = document.getElementById('socialGrid');
  if (socialGrid && CONFIG?.socialLinks) {
    socialGrid.innerHTML = CONFIG.socialLinks.map(link => `
      <a href="${link.url}" target="_blank" rel="noopener" class="social-btn social-btn--${link.icon.toLowerCase()}">
        ${link.name}
      </a>
    `).join('');
  }
}

/** Inicialización de la página principal */
async function initHome() {
  // Banner promocional de la plantilla (solo en el modo demo/original)
  const promo = document.getElementById('templatePromoSection');
  if (promo && CONFIG?.isTemplate) {
    promo.innerHTML = `
      <section class="section" style="background: var(--primary-light); border-top: 1.5px dashed var(--primary); border-bottom: 1.5px dashed var(--primary); text-align: center; padding: 4rem 0;">
        <div class="container" style="max-width: 700px;">
          <span class="badge badge--species" style="background: var(--primary); color: #fff; margin-bottom: 1rem; padding: 4px 12px; font-weight: bold; border-radius: 20px;">Plantilla Web</span>
          <h2 style="font-family: var(--font-display); font-size: 2rem; color: var(--primary-dark); margin-bottom: 1rem; font-weight: 700;">¿Te gusta esta web para tu refugio?</h2>
          <p style="color: var(--text-primary); margin-bottom: 2rem; font-size: 1.05rem; line-height: 1.6;">
            Esta página es una plantilla de código abierto diseñada para protectoras de animales. 
            Es 100% gratuita, se publica en 5 minutos y se administra de forma visual sin programar nada.
          </p>
          <div style="display: flex; justify-content: center; gap: var(--space-4); flex-wrap: wrap;">
            <a href="como-usar.html" class="btn btn--primary btn--lg">Crear mi propia web</a>
            <a href="admin.html" class="btn btn--secondary btn--lg">Probar panel de control</a>
          </div>
        </div>
      </section>
    `;
  }
  // Estadísticas
  const statsGrid = document.getElementById('statsGrid');
  if (statsGrid && CONFIG?.stats) {
    statsGrid.innerHTML = CONFIG.stats.map((stat, i) => `
      <div class="stat-item delay-${i + 1}">
        <div class="stat-icon">${stat.icon}</div>
        <div class="stat-number" data-counter="${stat.value}">0</div>
        <div class="stat-label">${stat.label}</div>
      </div>
    `).join('');
  }

  // Animales destacados
  const featuredGrid = document.getElementById('featuredAnimals');
  if (featuredGrid) {
    const animals = await loadAnimals();
    const featured = animals.filter(a => !a.isAdopted && a.featured).slice(0, 4);
    if (featured.length === 0) {
      featuredGrid.innerHTML = '<p class="no-results">No hay animales destacados en este momento.</p>';
    } else {
      featured.forEach(animal => {
        featuredGrid.appendChild(createAnimalCard(animal));
      });
    }
  }

  // Eventos
  const eventsGrid = document.getElementById('eventsGrid');
  if (eventsGrid && CONFIG?.events?.length) {
    eventsGrid.innerHTML = CONFIG.events.map((ev, i) => `
      <div class="event-card delay-${(i % 3) + 1}">
        <span class="event-card__emoji">${ev.emoji || '📅'}</span>
        <div class="event-card__date">${formatDate(ev.date)} · ${ev.time}</div>
        <h3>${ev.title}</h3>
        <p>${ev.description}</p>
        <div class="event-card__location">📍 ${ev.location}</div>
      </div>
    `).join('');
  } else if (eventsGrid) {
    eventsGrid.closest('section')?.remove();
  }

  // Inicializa secciones consolidadas
  initAboutSection();
  initHelpSection();
  initSocialSection();
  initContactSection();
}

// ════════════════════════════════════════════════════════════
// PÁGINA DE ADOPCIÓN — adopcion.html
// ════════════════════════════════════════════════════════════
async function initAdoption() {
  const grid = document.getElementById('allAnimals');
  const resultsInfo = document.getElementById('resultsInfo');
  if (!grid) return;

  const animals = await loadAnimals();
  let available = animals.filter(a => !a.isAdopted);

  // Poblar filtro de especie
  const speciesFilter = document.getElementById('filterSpecies');
  if (speciesFilter) {
    const species = [...new Set(available.map(a => a.species))].sort();
    species.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      speciesFilter.appendChild(opt);
    });
  }

  function renderAnimals(list) {
    grid.innerHTML = '';
    if (resultsInfo) {
      resultsInfo.textContent = `${list.length} ${list.length === 1 ? 'animal encontrado' : 'animales encontrados'}`;
    }
    if (list.length === 0) {
      grid.innerHTML = `
        <div class="no-results">
          <span class="no-results__icon">🔍</span>
          <h3>No encontramos animales con esos filtros</h3>
          <p>Prueba ajustando los filtros de búsqueda.</p>
        </div>
      `;
      return;
    }
    list.forEach(animal => {
      const card = createAnimalCard(animal);
      grid.appendChild(card);
    });
    setupScrollAnimations();
  }

  function applyFilters() {
    const search  = document.getElementById('filterSearch')?.value.toLowerCase() || '';
    const species = document.getElementById('filterSpecies')?.value || '';
    const size    = document.getElementById('filterSize')?.value || '';
    const gender  = document.getElementById('filterGender')?.value || '';

    const filtered = available.filter(a => {
      if (search && !a.name.toLowerCase().includes(search) && !a.breed?.toLowerCase().includes(search) && !a.description?.toLowerCase().includes(search)) return false;
      if (species && a.species !== species) return false;
      if (size && a.size !== size) return false;
      if (gender && a.gender !== gender) return false;
      return true;
    });

    renderAnimals(filtered);
  }

  // Event listeners de filtros
  ['filterSearch', 'filterSpecies', 'filterSize', 'filterGender'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', applyFilters);
    document.getElementById(id)?.addEventListener('change', applyFilters);
  });

  // Filter pills (tipo rápido)
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const group = pill.dataset.group;
      const value = pill.dataset.value;
      document.querySelectorAll(`.filter-pill[data-group="${group}"]`).forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const select = document.getElementById(`filter${group.charAt(0).toUpperCase() + group.slice(1)}`);
      if (select) { select.value = value; applyFilters(); }
    });
  });

  // Reset
  document.getElementById('resetFilters')?.addEventListener('click', () => {
    ['filterSearch', 'filterSpecies', 'filterSize', 'filterGender', 'filterType'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    applyFilters();
  });

  renderAnimals(available);
}

// ════════════════════════════════════════════════════════════
// PÁGINA GUÍA DE CONFIGURACIÓN — guia.html
// ════════════════════════════════════════════════════════════
function initGuide() {
  const codeBox = document.getElementById('configCode');
  const copyBtn = document.getElementById('btnCopyConfig');

  // Elementos de formulario
  const inputTitle = document.getElementById('guideTitle');
  const inputTagline = document.getElementById('guideTagline');
  const inputEmail = document.getElementById('guideEmail');
  const inputPhone = document.getElementById('guidePhone');
  const inputAddress = document.getElementById('guideAddress');
  const inputInstagram = document.getElementById('guideInstagram');
  const inputFacebook = document.getElementById('guideFacebook');
  const inputWhatsApp = document.getElementById('guideWhatsApp');

  // Paleta de colores
  const pickerPrimary = document.getElementById('colorPrimary');
  const pickerSecondary = document.getElementById('colorSecondary');
  const pickerAccent = document.getElementById('colorAccent');
  const pickerDarkBg = document.getElementById('colorDarkBg');
  const pickerLightBg = document.getElementById('colorLightBg');
  const pickerCardBg = document.getElementById('colorCardBg');

  if (CONFIG) {
    // Inicializa campos de texto
    if (inputTitle) inputTitle.value = CONFIG.siteTitle || '';
    if (inputTagline) inputTagline.value = CONFIG.siteTagline || '';
    if (inputEmail) inputEmail.value = CONFIG.contactInfo?.email || '';
    if (inputPhone) inputPhone.value = CONFIG.contactInfo?.phone || '';
    if (inputAddress) inputAddress.value = CONFIG.contactInfo?.address || '';

    if (CONFIG.socialLinks) {
      const ig = CONFIG.socialLinks.find(l => l.icon === 'instagram');
      const fb = CONFIG.socialLinks.find(l => l.icon === 'facebook');
      const wa = CONFIG.socialLinks.find(l => l.icon === 'whatsapp');
      if (inputInstagram && ig) inputInstagram.value = ig.url || '';
      if (inputFacebook && fb) inputFacebook.value = fb.url || '';
      if (inputWhatsApp && wa) inputWhatsApp.value = wa.url || '';
    }

    // Inicializa color pickers
    const style = getComputedStyle(document.documentElement);
    if (pickerPrimary) pickerPrimary.value = style.getPropertyValue('--primary').trim() || '#E8622A';
    if (pickerSecondary) pickerSecondary.value = style.getPropertyValue('--secondary').trim() || '#2D6A4F';
    if (pickerAccent) pickerAccent.value = style.getPropertyValue('--accent').trim() || '#FFB703';
    if (pickerDarkBg) pickerDarkBg.value = style.getPropertyValue('--bg-dark').trim() || '#1A1A2E';
    if (pickerLightBg) pickerLightBg.value = style.getPropertyValue('--bg-light').trim() || '#FFFBF7';
    if (pickerCardBg) pickerCardBg.value = style.getPropertyValue('--bg-card').trim() || '#FFFFFF';

    // Eventos para cambiar variables en vivo
    document.querySelectorAll('.color-picker-wrap').forEach(wrap => {
      const picker = wrap.querySelector('input[type="color"]');
      const text = wrap.querySelector('input[type="text"]');
      if (picker && text) {
        text.value = picker.value.toUpperCase();
        
        picker.addEventListener('input', () => {
          text.value = picker.value.toUpperCase();
          updateLiveColors();
        });
        
        text.addEventListener('input', () => {
          if (/^#[0-9A-F]{6}$/i.test(text.value)) {
            picker.value = text.value;
            updateLiveColors();
          }
        });
      }
    });
  }

  function updateLiveColors() {
    const primary = pickerPrimary?.value || '#E8622A';
    const secondary = pickerSecondary?.value || '#2D6A4F';
    const accent = pickerAccent?.value || '#FFB703';
    const darkBg = pickerDarkBg?.value || '#1A1A2E';
    const lightBg = pickerLightBg?.value || '#FFFBF7';
    const cardBg = pickerCardBg?.value || '#FFFFFF';

    const root = document.documentElement;
    root.style.setProperty('--primary', primary);
    root.style.setProperty('--secondary', secondary);
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--bg-dark', darkBg);
    root.style.setProperty('--bg-light', lightBg);
    root.style.setProperty('--bg-card', cardBg);

    generateConfigJson();
  }

  function generateConfigJson() {
    if (!CONFIG) return;

    // Duplica CONFIG y sobrescribe campos
    const newConfig = JSON.parse(JSON.stringify(CONFIG));
    newConfig.siteTitle = inputTitle?.value || CONFIG.siteTitle;
    newConfig.siteTagline = inputTagline?.value || CONFIG.siteTagline;
    
    if (!newConfig.contactInfo) newConfig.contactInfo = {};
    newConfig.contactInfo.email = inputEmail?.value || CONFIG.contactInfo?.email;
    newConfig.contactInfo.phone = inputPhone?.value || CONFIG.contactInfo?.phone;
    newConfig.contactInfo.address = inputAddress?.value || CONFIG.contactInfo?.address;

    newConfig.socialLinks = [
      { name: "Instagram", url: inputInstagram?.value || '', icon: "instagram" },
      { name: "Facebook", url: inputFacebook?.value || '', icon: "facebook" },
      { name: "WhatsApp", url: inputWhatsApp?.value || '', icon: "whatsapp" }
    ];

    newConfig.theme = {
      primaryColor: pickerPrimary?.value || '#E8622A',
      secondaryColor: pickerSecondary?.value || '#2D6A4F',
      accentColor: pickerAccent?.value || '#FFB703',
      darkBg: pickerDarkBg?.value || '#1A1A2E',
      lightBg: pickerLightBg?.value || '#FFFBF7',
      cardBg: pickerCardBg?.value || '#FFFFFF'
    };

    if (codeBox) {
      codeBox.textContent = JSON.stringify(newConfig, null, 2);
    }
  }

  // Añade event listeners a los inputs de texto
  [inputTitle, inputTagline, inputEmail, inputPhone, inputAddress, inputInstagram, inputFacebook, inputWhatsApp].forEach(input => {
    input?.addEventListener('input', generateConfigJson);
  });

  // Copiar al portapapeles
  if (copyBtn && codeBox) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(codeBox.textContent).then(() => {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '¡Copiado!';
        copyBtn.style.background = '#2ec4b6';
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
          copyBtn.style.background = '';
        }, 2000);
      }).catch(err => {
        console.error('Error al copiar:', err);
      });
    });
  }

  generateConfigJson();
}

// ════════════════════════════════════════════════════════════
// INICIALIZACIÓN PRINCIPAL
// ════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Carga configuración general del sitio (y renderiza header/footer/temas)
  await loadConfig();

  // 2. Determina la página actual
  const page = window.location.pathname.split('/').pop() || 'index.html';

  if (page === 'index.html' || page === '') {
    await initHome();
  } else if (page === 'adopcion.html') {
    await initAdoption();
  } else if (page === 'guia.html') {
    initGuide();
  }

  // 3. Animaciones de scroll + contadores
  setupScrollAnimations();
  setupCounters();

  // 4. Soporte para enlaces con hashes que saltan de otras páginas
  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }
});

// Listener de hashchange para refrescar el menú activo si el usuario navega por anclas
window.addEventListener('hashchange', () => {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const currentHash = window.location.hash;

  document.querySelectorAll('.main-nav a, .mobile-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    link.classList.remove('active');

    if (href.includes(currentHash) && (href.startsWith('#') || href.startsWith(currentPage))) {
      link.classList.add('active');
    }
  });
});