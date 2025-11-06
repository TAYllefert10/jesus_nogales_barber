/***** jesus_nogales_barber / assets/main.js – FIX JSONP + render *****/

// 1) PON AQUÍ tu URL /exec (sin parámetros ?action=...):
const GAS_BASE = 'https://script.google.com/macros/s/AKfycbzFI9ecznj5tHZI0zwrqo3vPd_duIMbgu9KlCQfQK_qBDHPvYIR9ITcMCGBESyqMGwqBQ/exec?';

// ---------- Animaciones y utilidades visuales ----------
const heroBg = document.querySelector('[data-parallax]');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (heroBg) { heroBg.style.transform = `translateY(${y * 0.25}px) scale(1.02)`; }
});

const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
  }
}, { threshold: 0.2 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

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

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---------- JSONP (evita CORS en GitHub Pages) ----------
function jsonp(url){
  return new Promise((resolve,reject)=>{
    const cb = 'cb_' + Math.random().toString(36).slice(2);
    window[cb] = (data)=>{ resolve(data); cleanup(); };
    const s = document.createElement('script');
    s.src = url + (url.includes('?')?'&':'?') + 'format=jsonp&callback=' + cb;
    s.onerror = ()=>{ reject(new Error('JSONP error')); cleanup(); };
    document.head.appendChild(s);
    function cleanup(){ try{ delete window[cb]; }catch{}; if (s && s.parentNode) s.parentNode.removeChild(s); }
  });
}

// ---------- Slots desde Apps Script ----------
async function fetchSlots() {
  if (!(GAS_BASE && GAS_BASE.startsWith('http'))) throw new Error('GAS_BASE no configurado');
  // IMPORTANTE: no añadas aquí &format=json: el helper jsonp lo pone solo
  const data = await jsonp(`${GAS_BASE}?action=list`);
  // La API devuelve { slots: {...} } o el objeto directo
  const slots = data && (data.slots || data);
  if (!slots || typeof slots !== 'object') throw new Error('Respuesta sin slots válidos');
  return slots;
}

// ---------- Rellenar selects ----------
const fechaSelect = document.getElementById('fechaSelect');
const horaSelect  = document.getElementById('horaSelect');
const fmtLabel = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

function renderFechasFrom(slotsByDate) {
  if (!fechaSelect) return;
  fechaSelect.innerHTML = '<option value="">Selecciona fecha…</option>';

  // Nos aseguramos de que las claves sean "YYYY-MM-DD"
  const dates = Object.keys(slotsByDate).filter(Boolean).sort();
  dates.forEach(date => {
    const times = Array.isArray(slotsByDate[date]) ? slotsByDate[date] : [];
    if (!times.length) return;
    // Mostramos etiqueta amigable, pero el value debe ser YYYY-MM-DD
    const d = new Date(date + 'T00:00:00');
    const opt = document.createElement('option');
    opt.value = date;
    opt.textContent = isNaN(d.getTime()) ? date : fmtLabel.format(d);
    fechaSelect.appendChild(opt);
  });

  if (fechaSelect.options.length === 1) {
    horaSelect.innerHTML = '<option value="">Sin horas disponibles</option>';
    horaSelect.disabled = true;
  } else {
    horaSelect.innerHTML = '<option value="">Selecciona fecha primero…</option>';
    horaSelect.disabled = true;
  }
}

function renderHorasFor(slotsByDate, dateValue) {
  if (!horaSelect) return;
  horaSelect.innerHTML = '<option value="">Selecciona hora…</option>';

  const times = Array.isArray(slotsByDate[dateValue]) ? slotsByDate[dateValue] : [];
  times.forEach(t => {
    // Las horas ya vienen como HH:MM
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
    SLOTS_CACHE = await fetchSlots();
    renderFechasFrom(SLOTS_CACHE);
  } catch (err) {
    console.error('Error slots:', err);
    if (fechaSelect) fechaSelect.innerHTML = '<option value="">No disponible</option>';
    if (horaSelect) { horaSelect.innerHTML = '<option value="">No disponible</option>'; horaSelect.disabled = true; }
  }
}
fechaSelect?.addEventListener('change', (e) => renderHorasFor(SLOTS_CACHE, e.target.value));
initSlots();

// ---------- Reserva por GET (preview sin CORS) ----------
const bookForm = document.getElementById('bookForm');
const waConfirm = document.getElementById('waConfirm');
const formMsg = document.getElementById('formMsg');

async function reserveViaGET({nombre, telefono, servicio, fecha, hora}){
  if (!(GAS_BASE && GAS_BASE.startsWith('http'))) throw new Error('Configura GAS_BASE');
  const params = new URLSearchParams({ action:'reserve', nombre, telefono, servicio, fecha, hora });
  const res = await fetch(`${GAS_BASE}?${params.toString()}`, { cache:'no-store' });
  // Apps Script sí permite JSON en GET aquí
  const json = await res.json();
  if(!json.ok) throw new Error(json.error || 'Error reserva');
  return json;
}

bookForm?.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  formMsg.textContent = 'Enviando reserva…';
  const f = new FormData(bookForm);
  const data = Object.fromEntries(f.entries());
  try{
    const resp = await reserveViaGET(data);
    formMsg.textContent = '¡Reserva confirmada!';
    const text = encodeURIComponent(`Hola, soy ${data.nombre}. Confirmo mi cita para "${data.servicio}" el ${data.fecha} a las ${data.hora}.`);
    if (waConfirm) waConfirm.href = `https://wa.me/34603702841?text=${text}`;
    bookForm.reset();
    horaSelect.innerHTML = '<option value="">Selecciona fecha primero…</option>';
    horaSelect.disabled = true;
  }catch(e){
    console.error(e);
    formMsg.textContent = 'No se pudo completar la reserva.';
  }
});
