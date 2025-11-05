const GAS_BASE = 'https://script.google.com/macros/s/AKfycbyKCXkY4lVn514eG2taT0-WG_w6YdexmZyeI462BTdWjCNV8pHe_-t-vhTmBmGZOw1zhg/exec?action=list&format=json';

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

function jsonp(url){
  return new Promise((resolve,reject)=>{
    const cb = 'cb_' + Math.random().toString(36).slice(2);
    window[cb] = (data)=>{ resolve(data); cleanup(); };
    const s = document.createElement('script');
    s.src = url + (url.includes('?')?'&':'?') + 'format=jsonp&callback=' + cb;
    s.onerror = ()=>{ reject(new Error('JSONP error')); cleanup(); };
    document.head.appendChild(s);
    function cleanup(){ try{ delete window[cb]; }catch{}; s.remove(); }
  });
}

async function fetchSlots() {
  if (GAS_BASE && GAS_BASE.startsWith('http')) {
    const data = await jsonp(`${GAS_BASE}?action=list`);
    return data.slots || data;
  } else {
    const res = await fetch('assets/slots.json', { cache:'no-store' });
    return res.json();
  }
}

const fechaSelect = document.getElementById('fechaSelect');
const horaSelect  = document.getElementById('horaSelect');
const fmtLabel = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

function renderFechasFrom(slotsByDate) {
  if (!fechaSelect) return;
  fechaSelect.innerHTML = '<option value="">Selecciona fecha…</option>';
  const dates = Object.keys(slotsByDate).sort();
  dates.forEach(date => {
    const times = slotsByDate[date] || [];
    if (!times.length) return;
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
    SLOTS_CACHE = await fetchSlots();
    renderFechasFrom(SLOTS_CACHE);
  } catch (err) {
    if (fechaSelect) fechaSelect.innerHTML = '<option value="">No disponible</option>';
  }
}
fechaSelect?.addEventListener('change', (e) => renderHorasFor(SLOTS_CACHE, e.target.value));
initSlots();

const bookForm = document.getElementById('bookForm');
const waConfirm = document.getElementById('waConfirm');
const formMsg = document.getElementById('formMsg');

async function reserveViaGET({nombre, telefono, servicio, fecha, hora}){
  if (!(GAS_BASE && GAS_BASE.startsWith('http'))) throw new Error('Configura GAS_BASE');
  const params = new URLSearchParams({ action:'reserve', nombre, telefono, servicio, fecha, hora });
  const res = await fetch(`${GAS_BASE}?${params.toString()}`, { cache:'no-store' });
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
    formMsg.textContent = 'No se pudo completar la reserva.';
  }
});
