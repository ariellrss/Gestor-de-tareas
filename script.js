let calendar;
let tasks = [];
let tempBgUrl = "";

// Formatea fecha
function formatearLocalYMDHM(date) {
  let y = date.getFullYear();
  let m = String(date.getMonth() + 1).padStart(2, '0');
  let d = String(date.getDate()).padStart(2, '0');
  let h = String(date.getHours()).padStart(2, '0');
  let min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}`;
}

document.addEventListener('DOMContentLoaded', () => {
  const calendarEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'es',
    height: 'auto',
    events: [],
    eventDidMount(info) {
      info.el.style.backgroundColor = prioridadColor(info.event.extendedProps.priority, info.event.extendedProps.status);
      info.el.style.borderColor = prioridadColor(info.event.extendedProps.priority, info.event.extendedProps.status);
      info.el.style.color = getComputedStyle(document.documentElement).getPropertyValue('--color-texto').trim();

      let titleText = info.event.title.replace(/^✅ |^⏳ /, '');
      if (info.event.extendedProps.status === 'completada') {
        info.el.innerHTML = '✅ ' + titleText;
      } else if (info.event.extendedProps.status === 'en proceso') {
        info.el.innerHTML = '⏳ ' + titleText;
      } else {
        info.el.innerHTML = titleText;
      }
    },
    eventClick(info) {
      mostrarModal(info.event);
    }
  });
  calendar.render();
});

// Agregar tarea
document.getElementById('taskForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const name = document.getElementById('taskName').value;
  const date = document.getElementById('dueDate').value;
  const time = document.getElementById('dueTime').value;
  const priority = document.getElementById('priority').value;
  const status = document.getElementById('status').value;
  const description = document.getElementById('description').value;
  const repeat = document.getElementById('repeat').value;

  const dueDate = `${date}T${time}`;
  const task = { name, dueDate, priority, status, description };
  tasks.push(task);

  addEventToCalendar(name, dueDate, priority, status, description);

  if (repeat !== 'none') {
    let baseDate = new Date(dueDate);
    let hour = baseDate.getHours();
    let minute = baseDate.getMinutes();

    for (let i = 1; i <= 11; i++) {
      let newDate = new Date(baseDate);
      if (repeat === 'weekly') newDate.setDate(baseDate.getDate() + (7 * i));
      else if (repeat === 'monthly') newDate.setMonth(baseDate.getMonth() + i);

      newDate.setHours(hour);
      newDate.setMinutes(minute);
      const newDueDate = formatearLocalYMDHM(newDate);
      tasks.push({ name, dueDate: newDueDate, priority, status, description });
      addEventToCalendar(name, newDueDate, priority, status, description);
    }
  }

  this.reset();
});

function addEventToCalendar(name, date, priority, status, description) {
  let displayName = name;
  if (status === 'completada') displayName = '✅ ' + name;
  else if (status === 'en proceso') displayName = '⏳ ' + name;

  calendar.addEvent({
    title: displayName,
    start: date,
    description,
    priority,
    status,
    backgroundColor: prioridadColor(priority, status),
    borderColor: prioridadColor(priority, status),
    allDay: false
  });
}

// Modal para ver/editar tarea
function mostrarModal(event) {
  let modal = document.getElementById('modalTarea');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modalTarea';
    modal.style = `
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.7);
      display: flex; align-items: center; justify-content: center;
      z-index: 9999;
    `;
    modal.innerHTML = `
      <div style="background:#fff; color:#222; padding:2rem; border-radius:10px; min-width:300px; text-align:center;">
        <h2 id="modalTitulo"></h2>
        <p id="modalDescripcion"></p>
        <p id="modalEstado"></p>
        <button id="btnToggleCompletar">Cambiar estado</button>
        <button id="btnBorrar">Borrar tarea</button>
        <button id="btnCerrar">Cerrar</button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  modal.style.display = 'flex';
  const titulo = event.title.replace(/^✅ |^⏳ /, '');
  document.getElementById('modalTitulo').textContent = titulo;
  document.getElementById('modalDescripcion').textContent = event.extendedProps.description;
  document.getElementById('modalEstado').textContent = 'Estado: ' + event.extendedProps.status;

  // Cambiar estado
  document.getElementById('btnToggleCompletar').onclick = function () {
    let nuevoEstado;
    if (event.extendedProps.status === 'pendiente') nuevoEstado = 'en proceso';
    else if (event.extendedProps.status === 'en proceso') nuevoEstado = 'completada';
    else nuevoEstado = 'pendiente';

    const nombre = titulo;
    const fecha = formatearFechaLocal(event.start);
    const idx = tasks.findIndex(t => t.name === nombre && t.dueDate === fecha);
    if (idx !== -1) {
      tasks[idx].status = nuevoEstado;
      event.remove();
      addEventToCalendar(tasks[idx].name, tasks[idx].dueDate, tasks[idx].priority, nuevoEstado, tasks[idx].description);
    }
    modal.style.display = 'none';
  };

 // Borrar tarea
document.getElementById('btnBorrar').onclick = function () {
  const nombre = titulo;
  const fecha = formatearFechaLocal(event.start);

  if (confirm("¿Querés borrar SOLO esta copia?\nPresioná Cancelar para borrar todas las repeticiones.")) {
    // Solo esta copia
    tasks = tasks.filter(t => !(t.name === nombre && t.dueDate === fecha));
    event.remove();
  } else {
    // Todas las copias
    tasks = tasks.filter(t => t.name !== nombre);
    // Borrar todas las ocurrencias en el calendario
    calendar.getEvents().forEach(ev => {
      if (ev.title.replace(/^✅ |^⏳ /, '') === nombre) {
        ev.remove();
      }
    });
  }
  modal.style.display = 'none';
};

}

function prioridadColor(priority, status) {
  const rootStyles = getComputedStyle(document.documentElement);
  if (status === 'completada') return rootStyles.getPropertyValue('--color-completada').trim();
  switch (priority) {
    case 'alta': return rootStyles.getPropertyValue('--color-alta').trim();
    case 'media': return rootStyles.getPropertyValue('--color-media').trim();
    case 'baja': return rootStyles.getPropertyValue('--color-baja').trim();
    default: return rootStyles.getPropertyValue('--color-completada').trim();
  }
}

function formatearFechaLocal(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

// Paletas
document.getElementById('colorPalette').addEventListener('change', function () {
  const palette = this.value;
  const root = document.documentElement;
  const palettes = {
    default: ['#121212', '#f0f0f0', '#ffcc00', '#e6b800', '#ff5252', '#ffd600', '#00e676', '#90caf9'],
    light: ['#ffffff', '#222222', '#007bff', '#0056b3', '#dc3545', '#ffc107', '#28a745', '#17a2b8'],
    pastel: ['#fffaf0', '#333333', '#ffb6c1', '#ff9aa2', '#ff6961', '#fdfd96', '#77dd77', '#aec6cf'],
    neon: ['#000000', '#39ff14', '#ff073a', '#ff5f1f', '#ff073a', '#ffea00', '#00f5ff', '#ff00ff'],
    marina: ['#001f3f', '#cce7ff', '#0074d9', '#005fa3', '#ff4136', '#ffdc00', '#2ecc40', '#7fdbff'],
    otono: ['#3b2f2f', '#ffecd1', '#ff7f50', '#cc5500', '#8b0000', '#ff8c00', '#b5651d', '#deb887'],
    retro: ['#0d0221', '#fffcf2', '#ff124f', '#ff00a0', '#ff124f', '#ffe100', '#00ff9f', '#00e5ff']
  };
  if (palettes[palette]) {
    const [fondo, texto, acento, botonHover, alta, media, baja, completada] = palettes[palette];
    root.style.setProperty('--color-fondo', fondo);
    root.style.setProperty('--color-texto', texto);
    root.style.setProperty('--color-acento', acento);
    root.style.setProperty('--color-boton-hover', botonHover);
    root.style.setProperty('--color-alta', alta);
    root.style.setProperty('--color-media', media);
    root.style.setProperty('--color-baja', baja);
    root.style.setProperty('--color-completada', completada);
  }
  calendar.refetchEvents();
});

// Controles de fondo
document.getElementById('bgFile').addEventListener('change', function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = e => tempBgUrl = e.target.result;
    reader.readAsDataURL(file);
  }
});

document.getElementById('applyBgBtn').addEventListener('click', function () {
  if (tempBgUrl) document.body.style.backgroundImage = `url(${tempBgUrl})`;
});

document.getElementById('removeBgBtn').addEventListener('click', function () {
  document.body.style.backgroundImage = "";
});

// Panel desplegable
document.getElementById('toggleBgPanel').addEventListener('click', function () {
  const panel = document.getElementById('bgPanel');
  if (panel.style.display === "none") {
    panel.style.display = "block";
    this.textContent = "Ocultar opciones de fondo";
  } else {
    panel.style.display = "none";
    this.textContent = "Mostrar opciones de fondo";
  }
});
