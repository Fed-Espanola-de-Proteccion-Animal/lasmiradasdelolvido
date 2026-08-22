/**
 * REFUGIO AMIGO ANIMAL — admin.js
 * Lógica del panel de administración sin backend (GitHub API client-side)
 * Permite subir fotos y actualizar data/animales.json de manera 100% automática.
 */

// ════════════════════════════════════════════════════════════
// ESTADO GLOBAL DEL ADMIN
// ════════════════════════════════════════════════════════════
let GH_TOKEN = '';
let GH_REPO = '';
let FILE_SHA = '';
let CONFIG_SHA = '';
let ANIMALS_DATA = [];
let CONFIG_DATA = {};
let CURRENT_IMAGE_BASE64 = '';
let CURRENT_IMAGE_NAME = '';
let IS_DEMO_MODE = true;

/** Formatea el encabezado de autorización según el tipo de token (Classic u Org Fine-Grained) */
function getAuthHeader(token) {
  if (!token) return '';
  const cleanToken = token.trim();
  if (cleanToken.startsWith('Bearer ') || cleanToken.startsWith('token ')) return cleanToken;
  if (cleanToken.startsWith('github_pat_')) return `Bearer ${cleanToken}`;
  return `token ${cleanToken}`;
}

// ════════════════════════════════════════════════════════════
// INICIALIZACIÓN Y VISTAS
// ════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  GH_TOKEN = localStorage.getItem('gh_token') || '';
  GH_REPO = localStorage.getItem('gh_repo') || '';

  if (GH_TOKEN && GH_REPO) {
    IS_DEMO_MODE = false;
    showDashboard();
  } else {
    IS_DEMO_MODE = true;
    showDemoDashboard();
  }

  // Bind login form
  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  
  // Bind logout button
  document.getElementById('btnLogout')?.addEventListener('click', handleLogout);

  // Bind drawer controls
  document.getElementById('btnAddAnimal')?.addEventListener('click', () => openDrawer());
  document.getElementById('btnCancelDrawer')?.addEventListener('click', closeDrawer);
  document.getElementById('drawerOverlay')?.addEventListener('click', closeDrawer);

  // Bind de login modal (drawer)
  document.getElementById('btnOpenLogin')?.addEventListener('click', openLoginDrawer);
  document.getElementById('btnCancelLogin')?.addEventListener('click', closeLoginDrawer);
  document.getElementById('loginOverlay')?.addEventListener('click', closeLoginDrawer);

  // Bind image file preview and base64 parsing
  document.getElementById('animalImageFile')?.addEventListener('change', handleImageUpload);

  // Bind animal form submit
  document.getElementById('animalForm')?.addEventListener('submit', handleAnimalSubmit);

  // Configuración de Tabs del Dashboard
  const btnTabAnimals = document.getElementById('btnTabAnimals');
  const btnTabSettings = document.getElementById('btnTabSettings');
  const panelAnimals = document.getElementById('panelAnimals');
  const panelSettings = document.getElementById('panelSettings');

  if (btnTabAnimals && btnTabSettings && panelAnimals && panelSettings) {
    btnTabAnimals.addEventListener('click', () => {
      btnTabAnimals.classList.add('active');
      btnTabAnimals.style.color = 'var(--primary)';
      btnTabAnimals.style.borderBottom = '3px solid var(--primary)';
      
      btnTabSettings.classList.remove('active');
      btnTabSettings.style.color = 'var(--text-secondary)';
      btnTabSettings.style.borderBottom = 'none';

      panelAnimals.style.display = 'block';
      panelSettings.style.display = 'none';
    });

    btnTabSettings.addEventListener('click', () => {
      btnTabSettings.classList.add('active');
      btnTabSettings.style.color = 'var(--primary)';
      btnTabSettings.style.borderBottom = '3px solid var(--primary)';

      btnTabAnimals.classList.remove('active');
      btnTabAnimals.style.color = 'var(--text-secondary)';
      btnTabAnimals.style.borderBottom = 'none';

      panelAnimals.style.display = 'none';
      panelSettings.style.display = 'block';
    });
  }

  // Guardar configuración del refugio
  document.getElementById('configForm')?.addEventListener('submit', handleConfigSubmit);

  // Eventos de colores interactivos en vivo
  const updateColorPreview = (pickerId, textId, varName) => {
    const picker = document.getElementById(pickerId);
    const text = document.getElementById(textId);
    if (picker && text) {
      picker.addEventListener('input', () => {
        text.value = picker.value.toUpperCase();
        document.documentElement.style.setProperty(varName, picker.value);
      });
      text.addEventListener('input', () => {
        if (/^#[0-9A-F]{6}$/i.test(text.value)) {
          picker.value = text.value;
          document.documentElement.style.setProperty(varName, text.value);
        }
      });
    }
  };

  updateColorPreview('colorPrimary', 'colorPrimaryText', '--primary');
  updateColorPreview('colorSecondary', 'colorSecondaryText', '--secondary');
  updateColorPreview('colorAccent', 'colorAccentText', '--accent');
  updateColorPreview('colorDarkBg', 'colorDarkBgText', '--bg-dark');
  updateColorPreview('colorLightBg', 'colorLightBgText', '--bg-light');
  updateColorPreview('colorCardBg', 'colorCardBgText', '--bg-card');
});

function showDashboard() {
  document.getElementById('demoBanner').style.display = 'none';
  document.getElementById('btnLogout').style.display = 'block';
  document.getElementById('repoNameLabel').textContent = `Repositorio: https://github.com/${GH_REPO}`;
  loadRepositoryData();
}

function showDemoDashboard() {
  document.getElementById('demoBanner').style.display = 'flex';
  document.getElementById('btnLogout').style.display = 'none';
  document.getElementById('repoNameLabel').textContent = 'Modo Demostración';
  loadLocalDemoData();
}

function openLoginDrawer() {
  const drawer = document.getElementById('loginDrawer');
  const overlay = document.getElementById('loginOverlay');
  if (drawer && overlay) {
    overlay.style.display = 'block';
    drawer.style.display = 'block';
    setTimeout(() => drawer.style.right = '0', 10);
  }
}

function closeLoginDrawer() {
  const drawer = document.getElementById('loginDrawer');
  const overlay = document.getElementById('loginOverlay');
  if (drawer && overlay) {
    drawer.style.right = '-550px';
    setTimeout(() => {
      drawer.style.display = 'none';
      overlay.style.display = 'none';
    }, 300);
  }
}

async function loadLocalDemoData() {
  showLoading('Cargando datos locales para demostración...');
  try {
    // Carga animales locales
    const resAnimals = await fetch('data/animales.json');
    if (resAnimals.ok) {
      ANIMALS_DATA = await resAnimals.json();
      renderTable();
    }
    // Carga configuración local
    const resConfig = await fetch('data/config.json');
    if (resConfig.ok) {
      CONFIG_DATA = await resConfig.json();
      populateSettingsForm();
    }
  } catch (err) {
    console.error('Error al cargar datos locales:', err);
  } finally {
    hideLoading();
  }
}

function showLoading(text) {
  const overlay = document.getElementById('loadingOverlay');
  const label = document.getElementById('loadingText');
  if (overlay && label) {
    label.textContent = text;
    overlay.style.display = 'flex';
  }
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.style.display = 'none';
}

// ════════════════════════════════════════════════════════════
// LOGIN / LOGOUT CON GITHUB API
// ════════════════════════════════════════════════════════════
async function handleLogin(e) {
  e.preventDefault();
  let repoInput = document.getElementById('ghRepo').value.trim();
  let tokenInput = document.getElementById('ghToken').value.trim();

  // Limpiar la URL del repositorio si el usuario pegó el enlace completo
  let repo = repoInput
    .replace(/^https?:\/\/github\.com\//i, '')
    .replace(/\.git$/i, '')
    .replace(/^\/+|\/+$/g, '')
    .trim();

  // Asegurar formato usuario/repositorio
  if (!repo.includes('/') || repo.split('/').length !== 2) {
    alert('Formato de repositorio incorrecto. Debe tener la forma: usuario/repositorio (ejemplo: lasmiradasdelolvido/asociacion)');
    return;
  }

  const token = tokenInput;

  showLoading('Verificando repositorio en GitHub...');

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        'Authorization': getAuthHeader(token),
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Token inválido o sin permisos. Asegúrate de que el token sea correcto.');
      } else if (res.status === 404) {
        throw new Error(`No se encontró el repositorio "${repo}". Verifica que el nombre del usuario y repositorio sean exactos.`);
      } else {
        throw new Error(`Error de GitHub (${res.status}). Verifica tus credenciales.`);
      }
    }

    // Guardar credenciales limpias
    localStorage.setItem('gh_token', token);
    localStorage.setItem('gh_repo', repo);
    GH_TOKEN = token;
    GH_REPO = repo;
    IS_DEMO_MODE = false;

    closeLoginDrawer();
    showDashboard();
  } catch (err) {
    console.error('Login error:', err);
    if (err.name === 'TypeError' || err.message.includes('Failed to fetch')) {
      alert(`Error de conexión (Failed to fetch):\n- Comprueba si pegaste la URL completa en vez de "usuario/repositorio".\n- Si usas un bloqueador de anuncios o Brave Shield, desactívalo para esta página.\n- Comprueba tu conexión a internet.`);
    } else {
      alert(`Error de acceso: ${err.message}`);
    }
  } finally {
    hideLoading();
  }
}

function handleLogout() {
  localStorage.removeItem('gh_token');
  localStorage.removeItem('gh_repo');
  GH_TOKEN = '';
  GH_REPO = '';
  IS_DEMO_MODE = true;
  showDemoDashboard();
}

// ════════════════════════════════════════════════════════════
// LECTURA DE CATÁLOGO Y CONFIGURACIÓN DESDE GITHUB
// ════════════════════════════════════════════════════════════
async function loadRepositoryData() {
  showLoading('Cargando datos desde GitHub...');
  try {
    // 1. Cargar animales.json
    const resAnimals = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/data/animales.json`, {
      headers: {
        'Authorization': getAuthHeader(GH_TOKEN),
        'Accept': 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache'
      }
    });

    if (!resAnimals.ok) throw new Error('No se pudo encontrar data/animales.json en el repositorio.');

    const animalsFileData = await resAnimals.json();
    FILE_SHA = animalsFileData.sha;
    const animalsRaw = atob(animalsFileData.content.replace(/\s/g, ''));
    ANIMALS_DATA = JSON.parse(decodeURIComponent(escape(animalsRaw)));
    renderTable();

    // 2. Cargar config.json
    const resConfig = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/data/config.json`, {
      headers: {
        'Authorization': getAuthHeader(GH_TOKEN),
        'Accept': 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache'
      }
    });

    if (resConfig.ok) {
      const configFileData = await resConfig.json();
      CONFIG_SHA = configFileData.sha;
      const configRaw = atob(configFileData.content.replace(/\s/g, ''));
      CONFIG_DATA = JSON.parse(decodeURIComponent(escape(configRaw)));
      populateSettingsForm();
    }
  } catch (err) {
    alert(`Error al cargar datos: ${err.message}`);
    handleLogout(); // Fuerza login si el token expiró
  } finally {
    hideLoading();
  }
}

function populateSettingsForm() {
  if (!CONFIG_DATA) return;
  
  // Rellenar campos de texto
  const guideTitle = document.getElementById('guideTitle');
  const guideTagline = document.getElementById('guideTagline');
  const guideEmail = document.getElementById('guideEmail');
  const guidePhone = document.getElementById('guidePhone');
  const guideAddress = document.getElementById('guideAddress');
  const guideInstagram = document.getElementById('guideInstagram');
  const guideFacebook = document.getElementById('guideFacebook');
  const guideWhatsApp = document.getElementById('guideWhatsApp');

  if (guideTitle) guideTitle.value = CONFIG_DATA.siteTitle || '';
  if (guideTagline) guideTagline.value = CONFIG_DATA.siteTagline || '';
  if (guideEmail) guideEmail.value = CONFIG_DATA.contactInfo?.email || '';
  if (guidePhone) guidePhone.value = CONFIG_DATA.contactInfo?.phone || '';
  if (guideAddress) guideAddress.value = CONFIG_DATA.contactInfo?.address || '';

  if (CONFIG_DATA.socialLinks) {
    const ig = CONFIG_DATA.socialLinks.find(l => l.icon === 'instagram');
    const fb = CONFIG_DATA.socialLinks.find(l => l.icon === 'facebook');
    const wa = CONFIG_DATA.socialLinks.find(l => l.icon === 'whatsapp');
    if (guideInstagram && ig) guideInstagram.value = ig.url || '';
    if (guideFacebook && fb) guideFacebook.value = fb.url || '';
    if (guideWhatsApp && wa) guideWhatsApp.value = wa.url || '';
  }

  // Rellenar color pickers
  const pickerPrimary = document.getElementById('colorPrimary');
  const pickerSecondary = document.getElementById('colorSecondary');
  const pickerAccent = document.getElementById('colorAccent');
  const pickerDarkBg = document.getElementById('colorDarkBg');
  const pickerLightBg = document.getElementById('colorLightBg');
  const pickerCardBg = document.getElementById('colorCardBg');

  const textPrimary = document.getElementById('colorPrimaryText');
  const textSecondary = document.getElementById('colorSecondaryText');
  const textAccent = document.getElementById('colorAccentText');
  const textDarkBg = document.getElementById('colorDarkBgText');
  const textLightBg = document.getElementById('colorLightBgText');
  const textCardBg = document.getElementById('colorCardBgText');

  const t = CONFIG_DATA.theme || {};
  
  const setupColor = (picker, text, val, defaultVal) => {
    if (picker) picker.value = val || defaultVal;
    if (text) text.value = (val || defaultVal).toUpperCase();
  };

  setupColor(pickerPrimary, textPrimary, t.primaryColor, '#E8622A');
  setupColor(pickerSecondary, textSecondary, t.secondaryColor, '#2D6A4F');
  setupColor(pickerAccent, textAccent, t.accentColor, '#FFB703');
  setupColor(pickerDarkBg, textDarkBg, t.darkBg, '#1A1A2E');
  setupColor(pickerLightBg, textLightBg, t.lightBg, '#FFFBF7');
  setupColor(pickerCardBg, textCardBg, t.cardBg, '#FFFFFF');

  // Rellenar sección Cómo Ayudar
  const help = CONFIG_DATA.helpPage || {};
  const helpDonationTitle = document.getElementById('helpDonationTitle');
  const helpDonationDesc = document.getElementById('helpDonationDesc');
  const helpShowMaterials = document.getElementById('helpShowMaterials');
  const helpMaterialsTitle = document.getElementById('helpMaterialsTitle');
  const helpMaterialsDesc = document.getElementById('helpMaterialsDesc');
  const helpMaterialsItems = document.getElementById('helpMaterialsItems');
  const helpShowVolunteer = document.getElementById('helpShowVolunteer');
  const helpVolunteerTitle = document.getElementById('helpVolunteerTitle');
  const helpVolunteerDesc = document.getElementById('helpVolunteerDesc');
  const helpVolunteerTasks = document.getElementById('helpVolunteerTasks');

  if (helpDonationTitle) helpDonationTitle.value = help.donation?.title || '';
  if (helpDonationDesc) helpDonationDesc.value = help.donation?.description || '';

  if (helpShowMaterials) helpShowMaterials.checked = help.materials?.show !== false;
  if (helpMaterialsTitle) helpMaterialsTitle.value = help.materials?.title || '';
  if (helpMaterialsDesc) helpMaterialsDesc.value = help.materials?.description || '';
  if (helpMaterialsItems) helpMaterialsItems.value = help.materials?.items?.join(', ') || '';

  if (helpShowVolunteer) helpShowVolunteer.checked = help.volunteer?.show !== false;
  if (helpVolunteerTitle) helpVolunteerTitle.value = help.volunteer?.title || '';
  if (helpVolunteerDesc) helpVolunteerDesc.value = help.volunteer?.description || '';
  if (helpVolunteerTasks) helpVolunteerTasks.value = help.volunteer?.tasks?.join(', ') || '';

  // Rellenar sección Textos de Portada
  const txt = CONFIG_DATA.homepageText || {};
  const homeHeroTag = document.getElementById('homeHeroTag');
  const homeHeroTitle = document.getElementById('homeHeroTitle');
  const homeHeroDesc = document.getElementById('homeHeroDesc');
  const homeFeaturedTitle = document.getElementById('homeFeaturedTitle');
  const homeFeaturedDesc = document.getElementById('homeFeaturedDesc');
  const homeSocialTitle = document.getElementById('homeSocialTitle');
  const homeSocialDesc = document.getElementById('homeSocialDesc');
  const homeContactTitle = document.getElementById('homeContactTitle');
  const homeContactDesc = document.getElementById('homeContactDesc');

  if (homeHeroTag) homeHeroTag.value = txt.heroTag || '';
  if (homeHeroTitle) homeHeroTitle.value = txt.heroTitle || '';
  if (homeHeroDesc) homeHeroDesc.value = txt.heroDescription || '';
  if (homeFeaturedTitle) homeFeaturedTitle.value = txt.featuredTitle || '';
  if (homeFeaturedDesc) homeFeaturedDesc.value = txt.featuredDescription || '';
  if (homeSocialTitle) homeSocialTitle.value = txt.socialTitle || '';
  if (homeSocialDesc) homeSocialDesc.value = txt.socialDescription || '';
  if (homeContactTitle) homeContactTitle.value = txt.contactTitle || '';
  if (homeContactDesc) homeContactDesc.value = txt.contactDescription || '';
}

async function handleConfigSubmit(e) {
  e.preventDefault();

  if (IS_DEMO_MODE) {
    alert('Acción no permitida: Estás probando la web en Modo Demostración. Conecta tu repositorio de GitHub en el botón superior para realizar cambios reales.');
    return;
  }
  
  if (!CONFIG_DATA) CONFIG_DATA = {};

  const guideTitle = document.getElementById('guideTitle')?.value || '';
  const guideTagline = document.getElementById('guideTagline')?.value || '';
  const guideEmail = document.getElementById('guideEmail')?.value || '';
  const guidePhone = document.getElementById('guidePhone')?.value || '';
  const guideAddress = document.getElementById('guideAddress')?.value || '';

  const guideInstagram = document.getElementById('guideInstagram')?.value || '';
  const guideFacebook = document.getElementById('guideFacebook')?.value || '';
  const guideWhatsApp = document.getElementById('guideWhatsApp')?.value || '';

  const primary = document.getElementById('colorPrimary')?.value || '#E8622A';
  const secondary = document.getElementById('colorSecondary')?.value || '#2D6A4F';
  const accent = document.getElementById('colorAccent')?.value || '#FFB703';
  const darkBg = document.getElementById('colorDarkBg')?.value || '#1A1A2E';
  const lightBg = document.getElementById('colorLightBg')?.value || '#FFFBF7';
  const cardBg = document.getElementById('colorCardBg')?.value || '#FFFFFF';

  // Construir nueva configuración
  CONFIG_DATA.isTemplate = false;
  CONFIG_DATA.siteTitle = guideTitle;
  CONFIG_DATA.siteTagline = guideTagline;
  if (!CONFIG_DATA.contactInfo) CONFIG_DATA.contactInfo = {};
  CONFIG_DATA.contactInfo.email = guideEmail;
  CONFIG_DATA.contactInfo.phone = guidePhone;
  CONFIG_DATA.contactInfo.address = guideAddress;

  CONFIG_DATA.socialLinks = [
    { name: "Instagram", url: guideInstagram, icon: "instagram" },
    { name: "Facebook", url: guideFacebook, icon: "facebook" },
    { name: "WhatsApp", url: guideWhatsApp, icon: "whatsapp" }
  ];

  CONFIG_DATA.theme = {
    primaryColor: primary,
    secondaryColor: secondary,
    accentColor: accent,
    darkBg: darkBg,
    lightBg: lightBg,
    cardBg: cardBg
  };

  // Guardar textos de portada
  if (!CONFIG_DATA.homepageText) CONFIG_DATA.homepageText = {};
  CONFIG_DATA.homepageText.heroTag = document.getElementById('homeHeroTag')?.value || '';
  CONFIG_DATA.homepageText.heroTitle = document.getElementById('homeHeroTitle')?.value || '';
  CONFIG_DATA.homepageText.heroDescription = document.getElementById('homeHeroDesc')?.value || '';
  CONFIG_DATA.homepageText.featuredTitle = document.getElementById('homeFeaturedTitle')?.value || '';
  CONFIG_DATA.homepageText.featuredDescription = document.getElementById('homeFeaturedDesc')?.value || '';
  CONFIG_DATA.homepageText.socialTitle = document.getElementById('homeSocialTitle')?.value || '';
  CONFIG_DATA.homepageText.socialDescription = document.getElementById('homeSocialDesc')?.value || '';
  CONFIG_DATA.homepageText.contactTitle = document.getElementById('homeContactTitle')?.value || '';
  CONFIG_DATA.homepageText.contactDescription = document.getElementById('homeContactDesc')?.value || '';

  // Guardar configuración del Cómo Ayudar
  if (!CONFIG_DATA.helpPage) CONFIG_DATA.helpPage = {};
  if (!CONFIG_DATA.helpPage.donation) CONFIG_DATA.helpPage.donation = {};
  if (!CONFIG_DATA.helpPage.materials) CONFIG_DATA.helpPage.materials = {};
  if (!CONFIG_DATA.helpPage.volunteer) CONFIG_DATA.helpPage.volunteer = {};

  CONFIG_DATA.helpPage.donation.title = document.getElementById('helpDonationTitle')?.value || '';
  CONFIG_DATA.helpPage.donation.description = document.getElementById('helpDonationDesc')?.value || '';

  CONFIG_DATA.helpPage.materials.show = document.getElementById('helpShowMaterials')?.checked === true;
  CONFIG_DATA.helpPage.materials.title = document.getElementById('helpMaterialsTitle')?.value || '';
  CONFIG_DATA.helpPage.materials.description = document.getElementById('helpMaterialsDesc')?.value || '';
  const matItemsVal = document.getElementById('helpMaterialsItems')?.value || '';
  CONFIG_DATA.helpPage.materials.items = matItemsVal.split(',').map(x => x.trim()).filter(x => x.length > 0);

  CONFIG_DATA.helpPage.volunteer.show = document.getElementById('helpShowVolunteer')?.checked === true;
  CONFIG_DATA.helpPage.volunteer.title = document.getElementById('helpVolunteerTitle')?.value || '';
  CONFIG_DATA.helpPage.volunteer.description = document.getElementById('helpVolunteerDesc')?.value || '';
  const volTasksVal = document.getElementById('helpVolunteerTasks')?.value || '';
  CONFIG_DATA.helpPage.volunteer.tasks = volTasksVal.split(',').map(x => x.trim()).filter(x => x.length > 0);

  showLoading('Guardando configuración en GitHub...');

  try {
    // Codifica JSON a UTF-8 Base64 seguro
    const utf8Content = unescape(encodeURIComponent(JSON.stringify(CONFIG_DATA, null, 2)));
    const base64Content = btoa(utf8Content);

    const body = {
      message: 'Actualizar configuración del refugio (via CMS Panel)',
      content: base64Content,
      sha: CONFIG_SHA
    };

    const res = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/data/config.json`, {
      method: 'PUT',
      headers: {
        'Authorization': getAuthHeader(GH_TOKEN),
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      throw new Error(`Código ${res.status} al guardar configuración.`);
    }

    const data = await res.json();
    CONFIG_SHA = data.content.sha; // actualiza SHA local
    alert('¡Configuración guardada correctamente! La web se actualizará en unos instantes.');
  } catch (err) {
    alert(`Error al guardar configuración: ${err.message}`);
  } finally {
    hideLoading();
  }
}

// ════════════════════════════════════════════════════════════
// RENDERIZADO DE TABLA DE INVENTARIO
// ════════════════════════════════════════════════════════════
function renderTable() {
  const tbody = document.getElementById('adminTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (ANIMALS_DATA.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2rem;">No hay animales registrados.</td></tr>`;
    return;
  }

  ANIMALS_DATA.forEach((animal, index) => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>
        <img src="${animal.image}" alt="${animal.name}" onerror="this.src='https://placehold.co/100x100?text=Foto'">
      </td>
      <td style="font-weight: 600;">${animal.name}</td>
      <td>${animal.species}</td>
      <td>${animal.gender || '-'}</td>
      <td>${formatAge(animal.age)}</td>
      <td>${animal.featured ? 'Sí' : 'No'}</td>
      <td style="text-align: right;">
        <button class="btn btn--secondary btn--sm" onclick="editAnimal(${index})">Editar</button>
        <button class="btn btn--primary btn--sm" style="background:#e63946; border-color:#e63946;" onclick="deleteAnimal(${index})">Borrar</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// ════════════════════════════════════════════════════════════
// MANEJO DE IMÁGENES (Lector local a Base64)
// ════════════════════════════════════════════════════════════
function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  CURRENT_IMAGE_NAME = `${Date.now()}-${file.name.toLowerCase().replace(/\s+/g, '-')}`;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const preview = document.getElementById('uploadImgPreview');
    if (preview) {
      preview.src = evt.target.result;
      preview.style.display = 'block';
    }
    // Obtiene solo el string base64 puro (sin el prefijo data:image/...)
    CURRENT_IMAGE_BASE64 = evt.target.result.split(',')[1];
  };
  reader.readAsDataURL(file);
}

// ════════════════════════════════════════════════════════════
// DRAWER DE EDICIÓN / ADICIÓN
// ════════════════════════════════════════════════════════════
function openDrawer(title = 'Añadir Nuevo Animal') {
  document.getElementById('drawerTitle').textContent = title;
  document.getElementById('animalForm').reset();
  document.getElementById('animalId').value = '';
  
  const preview = document.getElementById('uploadImgPreview');
  if (preview) {
    preview.src = '';
    preview.style.display = 'none';
  }
  
  CURRENT_IMAGE_BASE64 = '';
  CURRENT_IMAGE_NAME = '';

  document.getElementById('adminDrawer').classList.add('open');
  document.getElementById('drawerOverlay').classList.add('open');
}

function closeDrawer() {
  document.getElementById('adminDrawer').classList.remove('open');
  document.getElementById('drawerOverlay').classList.remove('open');
}

function editAnimal(index) {
  const animal = ANIMALS_DATA[index];
  openDrawer(`Editar Ficha: ${animal.name}`);
  
  // Rellena campos
  document.getElementById('animalId').value = index;
  document.getElementById('animalName').value = animal.name;
  document.getElementById('animalSpecies').value = animal.species;
  document.getElementById('animalBreed').value = animal.breed || '';
  document.getElementById('animalGender').value = animal.gender || 'Macho';
  document.getElementById('animalSize').value = animal.size || 'Mediano';
  document.getElementById('animalAge').value = animal.age;
  document.getElementById('animalType').value = animal.type || 'adoption';
  document.getElementById('animalDesc').value = animal.description;
  document.getElementById('animalPersonality').value = (animal.personality || []).join(', ');
  
  document.getElementById('animalVaccinated').checked = !!animal.vaccinated;
  document.getElementById('animalNeutered').checked = !!animal.neutered;
  document.getElementById('animalMicrochip').checked = !!animal.microchip;
  document.getElementById('animalFeatured').checked = !!animal.featured;

  // Vista previa de foto actual
  const preview = document.getElementById('uploadImgPreview');
  if (preview && animal.image) {
    preview.src = animal.image;
    preview.style.display = 'block';
  }
}

// ════════════════════════════════════════════════════════════
// ACCIONES: GUARDAR / CREAR ANIMAL
// ════════════════════════════════════════════════════════════
async function handleAnimalSubmit(e) {
  e.preventDefault();

  if (IS_DEMO_MODE) {
    alert('Acción no permitida: Estás probando la web en Modo Demostración. Conecta tu repositorio de GitHub en el botón superior para realizar cambios reales.');
    closeDrawer();
    return;
  }

  const indexStr = document.getElementById('animalId').value;
  const name = document.getElementById('animalName').value.trim();
  const species = document.getElementById('animalSpecies').value;
  const breed = document.getElementById('animalBreed').value.trim();
  const gender = document.getElementById('animalGender').value;
  const size = document.getElementById('animalSize').value;
  const age = parseFloat(document.getElementById('animalAge').value) || 0;
  const type = document.getElementById('animalType').value;
  const description = document.getElementById('animalDesc').value.trim();
  const personalityStr = document.getElementById('animalPersonality').value;
  
  const vaccinated = document.getElementById('animalVaccinated').checked;
  const neutered = document.getElementById('animalNeutered').checked;
  const microchip = document.getElementById('animalMicrochip').checked;
  const featured = document.getElementById('animalFeatured').checked;

  const personality = personalityStr 
    ? personalityStr.split(',').map(p => p.trim()).filter(p => p.length > 0)
    : [];

  let imagePath = '';

  // 1/2. Subir imagen a GitHub si hay archivo nuevo
  if (CURRENT_IMAGE_BASE64) {
    showLoading('1/2. Subiendo foto al repositorio...');
    try {
      const uploadRes = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/img/animales/${CURRENT_IMAGE_NAME}`, {
        method: 'PUT',
        headers: {
          'Authorization': getAuthHeader(GH_TOKEN),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Subida de foto para ${name}`,
          content: CURRENT_IMAGE_BASE64
        })
      });

      if (!uploadRes.ok) throw new Error('Error al subir la imagen a GitHub.');
      imagePath = `img/animales/${CURRENT_IMAGE_NAME}`;
    } catch (err) {
      alert(`Error al guardar imagen: ${err.message}`);
      hideLoading();
      return;
    }
  }

  // 2/2. Modificar el array en memoria y guardar JSON en GitHub
  showLoading('2/2. Actualizando catálogo de animales...');
  
  const animalObj = {
    id: indexStr !== '' ? ANIMALS_DATA[indexStr].id : `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    name,
    species,
    breed,
    age,
    gender,
    size,
    description,
    personality,
    vaccinated,
    neutered,
    microchip,
    image: imagePath || (indexStr !== '' ? ANIMALS_DATA[indexStr].image : 'https://placehold.co/600x400?text=Foto'),
    type,
    featured,
    isAdopted: indexStr !== '' ? ANIMALS_DATA[indexStr].isAdopted : false
  };

  if (indexStr !== '') {
    ANIMALS_DATA[indexStr] = animalObj;
  } else {
    ANIMALS_DATA.push(animalObj);
  }

  await commitJsonChanges('Actualizado catálogo de animales');
}

// ════════════════════════════════════════════════════════════
// ACCIONES: ELIMINAR ANIMAL
// ════════════════════════════════════════════════════════════
async function deleteAnimal(index) {
  const animal = ANIMALS_DATA[index];

  if (IS_DEMO_MODE) {
    alert('Acción no permitida: Estás probando la web en Modo Demostración. Conecta tu repositorio de GitHub en el botón superior para realizar cambios reales.');
    return;
  }

  if (!confirm(`¿Estás seguro de que deseas eliminar a ${animal.name} del catálogo?`)) return;

  showLoading(`Eliminando a ${animal.name}...`);
  ANIMALS_DATA.splice(index, 1);

  await commitJsonChanges(`Eliminado ${animal.name} de la lista`);
}

// ════════════════════════════════════════════════════════════
// COMIT DE DATOS JSON A GITHUB
// ════════════════════════════════════════════════════════════
async function commitJsonChanges(commitMessage) {
  try {
    const jsonString = JSON.stringify(ANIMALS_DATA, null, 2);
    // Codifica a base64 manejando caracteres UTF-8 correctamente
    const base64Content = btoa(unescape(encodeURIComponent(jsonString)));

    const res = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/data/animales.json`, {
      method: 'PUT',
      headers: {
        'Authorization': getAuthHeader(GH_TOKEN),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: commitMessage,
        content: base64Content,
        sha: FILE_SHA
      })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Error al guardar los cambios en GitHub.');
    }

    closeDrawer();
    alert('¡Cambios guardados con éxito! La web tardará unos 30-60 segundos en actualizarse en producción.');
    
    // Recarga los datos actualizados para obtener el nuevo SHA
    await loadRepositoryData();
  } catch (err) {
    alert(`Error al guardar cambios: ${err.message}`);
    hideLoading();
  }
}
