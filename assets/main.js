// Carga de horarios desde la API
async function fetchSlots() {
  const res = await fetch('api/slots.php?action=list', { cache: 'no-store' });
  if (!res.ok) throw new Error('No se pudo cargar disponibilidad');
  return res.json();
}

// Parallax en el hero (suave)
const heroBg = document.querySelector('[data-parallax]');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (heroBg) { heroBg.style.transform = `translateY(${y * 0.25}px) scale(1.02)`; }
});

// IntersectionObserver para revelar elementos
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
  }
}, { threshold: 0.2 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Lightbox robusto
const lightbox = document.getElementById('lightbox');
const lightboxImg = lightbox?.querySelector('.lightbox__img');
if (lightbox) lightbox.setAttribute('hidden', '');
document.querySelectorAll('[data-lightbox-src]').forEach(btn => {
  btn.addEventListener('click', () => {
    const src = btn.getAttribute('data-lightbox-src');
    if (src && lightbox && lightboxImg) {
      lightboxImg.src = src;
      lightbox.removeAttribute('hidden');
    }
  });
});
lightbox?.addEventListener('click', (e) => {
  if (e.target.hasAttribute('data-close')) {
    lightbox.setAttribute('hidden', '');
    if (lightboxImg) lightboxImg.removeAttribute('src');
  }
});

// Año del footer
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ==== Poblar selects desde API ====
const fechaSelect = document.getElementById('fechaSelect');
const horaSelect  = document.getElementById('horaSelect');
const fmtLabel = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

function renderFechasFrom(slotsByDate) {
  if (!fechaSelect) return;
  fechaSelect.innerHTML = '<option value="">Selecciona fecha…</option>';
  const dates = Object.keys(slotsByDate).sort();
  dates.forEach(date => {
    const times = slotsByDate[date] || [];
    if (times.length === 0) return;
    const d = new Date(date + 'T00:00:00');
    const opt = document.createElement('option');
    opt.value = date;
    opt.textContent = fmtLabel.format(d);
    fechaSelect.appendChild(opt);
  });
  if (fechaSelect.options.length === 1) {
    horaSelect.innerHTML = '<option value="">Sin horas disponibles</option>';
    horaSelect.disabled = true;
  }
}

function renderHorasFor(slotsByDate, dateValue) {
  if (!horaSelect) return;
  horaSelect.innerHTML = '<option value="">Selecciona hora…</option>';
  const times = slotsByDate[dateValue] || [];
  times.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    horaSelect.appendChild(opt);
  });
  horaSelect.disabled = times.length === 0;
}

let SLOTS_CACHE = {};
async function initSlots() {
  try {
    const data = await fetchSlots();
    SLOTS_CACHE = data.slots || {};
    renderFechasFrom(SLOTS_CACHE);
  } catch (err) {
    if (fechaSelect) fechaSelect.innerHTML = '<option value="">No disponible</option>';
  }
}
fechaSelect?.addEventListener('change', (e) => renderHorasFor(SLOTS_CACHE, e.target.value));
initSlots();

// WhatsApp auto-llenado
const bookForm = document.getElementById('bookForm');
const waConfirm = document.getElementById('waConfirm');
if (bookForm) {
  bookForm.addEventListener('submit', () => {
    const f = new FormData(bookForm);
    const nombre = f.get('nombre');
    const servicio = f.get('servicio');
    const fecha = f.get('fecha');
    const hora = f.get('hora');
    const text = encodeURIComponent(`Hola, soy ${nombre}. Quiero confirmar mi cita para "${servicio}" el ${fecha} a las ${hora}.`);
    if (waConfirm) waConfirm.href = `https://wa.me/34603702841?text=${text}`;
  });
}
