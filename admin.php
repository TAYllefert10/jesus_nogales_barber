<?php
const ADMIN_KEY = 'CAMBIA_ESTA_CLAVE';
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Admin – Barbería Jesús Nogales</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
  <style>
    body{font-family:'Open Sans', Arial, sans-serif;background:#0b0b0b;color:#fff;margin:0;padding:24px}
    .wrap{max-width:900px;margin:0 auto}
    h1{margin:0 0 18px}
    .card{background:#131313;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:16px;margin-bottom:20px}
    label{display:block;margin:10px 0 6px}
    input,select,button{padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:#1a1a1a;color:#fff}
    input:focus,select:focus{outline:none;border-color:#facc15}
    button{cursor:pointer;font-weight:600}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    table{width:100%;border-collapse:collapse;margin-top:12px}
    th,td{border-bottom:1px solid rgba(255,255,255,.12);padding:10px;text-align:left}
    .row-actions button{margin-right:8px}
    .muted{color:#cfcfcf}
    .ok{color:#9ae6b4}
    .err{color:#feb2b2}
  </style>
</head>
<body>
<div class="wrap">
  <h1>Gestión de horarios</h1>
  <div class="card">
    <div class="grid">
      <div>
        <label>Clave de administrador *</label>
        <input type="password" id="adminKey" placeholder="Introduce tu clave" value="<?=htmlspecialchars(ADMIN_KEY)?>">
      </div>
      <div>
        <label>Fecha (YYYY-MM-DD) *</label>
        <input type="date" id="date">
      </div>
      <div>
        <label>Hora (HH:MM) *</label>
        <input type="time" id="time">
      </div>
      <div style="display:flex;align-items:flex-end;gap:8px">
        <button id="addBtn">Añadir hora</button>
        <button id="reloadBtn">Recargar</button>
      </div>
    </div>
    <p id="msg" class="muted"></p>
  </div>

  <div class="card">
    <h3>Disponibilidad actual</h3>
    <div id="tableWrap"></div>
  </div>
</div>

<script>
async function listSlots(){
  const res=await fetch('api/slots.php?action=list',{cache:'no-store'});
  if(!res.ok) throw new Error('No se pudo cargar');
  return res.json();
}
async function addSlot(key,date,time){
  const form=new FormData();
  form.append('date',date); form.append('time',time);
  const res=await fetch('api/slots.php?action=add',{method:'POST',headers:{'X-ADMIN-KEY':key},body:form});
  if(!res.ok) throw new Error('No se pudo añadir');
  return res.json();
}
async function removeSlot(key,date,time){
  const form=new FormData();
  form.append('date',date); form.append('time',time);
  const res=await fetch('api/slots.php?action=remove',{method:'POST',headers:{'X-ADMIN-KEY':key},body:form});
  if(!res.ok) throw new Error('No se pudo eliminar');
  return res.json();
}

const msg=document.getElementById('msg');
const tableWrap=document.getElementById('tableWrap');
const addBtn=document.getElementById('addBtn');
const reloadBtn=document.getElementById('reloadBtn');

function renderTable(slots){
  const dates=Object.keys(slots).sort();
  if(dates.length===0){ tableWrap.innerHTML='<p class="muted">Sin horas disponibles.</p>'; return; }
  let html='<table><thead><tr><th>Fecha</th><th>Horas</th><th>Acciones</th></tr></thead><tbody>';
  for(const d of dates){
    html+=`<tr><td>${d}</td><td>${(slots[d]||[]).join(', ')}</td>
      <td class="row-actions">
        ${(slots[d]||[]).map(t=>`<button data-date="${d}" data-time="${t}" class="delBtn">Eliminar ${t}</button>`).join(' ')}
      </td></tr>`;
  }
  html+='</tbody></table>';
  tableWrap.innerHTML=html;

  document.querySelectorAll('.delBtn').forEach(b=>{
    b.addEventListener('click', async ()=>{
      try{
        const key=document.getElementById('adminKey').value.trim();
        const date=b.getAttribute('data-date');
        const time=b.getAttribute('data-time');
        msg.textContent='Eliminando…';
        await removeSlot(key,date,time);
        msg.textContent='✓ Eliminado'; await loadAndRender();
      }catch(e){ msg.textContent='✗ Error eliminando'; }
    });
  });
}

async function loadAndRender(){
  try{
    const data=await listSlots();
    renderTable(data.slots||{});
  }catch(e){
    tableWrap.innerHTML='<p class="err">No se pudo cargar la disponibilidad.</p>';
  }
}

addBtn.addEventListener('click', async ()=>{
  const key=document.getElementById('adminKey').value.trim();
  const date=document.getElementById('date').value;
  const time=document.getElementById('time').value;
  if(!key||!date||!time){ msg.textContent='Completa clave, fecha y hora.'; return; }
  try{
    msg.textContent='Añadiendo…';
    await addSlot(key,date,time);
    msg.textContent='✓ Guardado';
    document.getElementById('time').value='';
    await loadAndRender();
  }catch(e){ msg.textContent='✗ Error guardando'; }
});

reloadBtn.addEventListener('click', loadAndRender);
loadAndRender();
</script>
</body>
</html>
