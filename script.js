let calendar;
let tasks = [];

document.addEventListener('DOMContentLoaded', () => {
  const calendarEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'es',
    height: 'auto',
    events: tasks.map(task => ({
      title: task.name,
      start: task.dueDate,
      description: task.description,
      priority: task.priority,
      status: task.status,
      backgroundColor: prioridadColor(task.priority, task.status),
      borderColor: prioridadColor(task.priority, task.status)
    })),
    eventDidMount(info) {
      info.el.style.backgroundColor = prioridadColor(info.event.extendedProps.priority, info.event.extendedProps.status);
      info.el.style.borderColor = prioridadColor(info.event.extendedProps.priority, info.event.extendedProps.status);
      info.el.style.color = '#222';
      if (info.event.extendedProps.status === 'completada') {
        info.el.innerHTML = '✅ ' + info.el.innerHTML;
      } else if (info.event.extendedProps.status === 'en proceso') {
        info.el.innerHTML = '⏳ ' + info.el.innerHTML;
      }
    },
    eventClick(info) {
      mostrarModal(info.event);
    }
  });
  calendar.render();
});

document.getElementById('taskForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const task = {
    name: document.getElementById('taskName').value,
    dueDate: document.getElementById('dueDate').value,
    priority: document.getElementById('priority').value,
    status: document.getElementById('status').value,
    description: document.getElementById('description').value,
    done: false
  };
  tasks.push(task);
  calendar.addEvent({
    title: task.name,
    start: task.dueDate,
    description: task.description,
    backgroundColor: prioridadColor(task.priority),
    borderColor: prioridadColor(task.priority),
    priority: task.priority
  });
  this.reset();
});

function cargarMusica() {
  const link = document.getElementById('ytLink').value;
  const videoId = extraerIDYoutube(link);
  if (videoId) {
    const iframe = document.createElement('iframe');
    iframe.width = 300;
    iframe.height = 170;
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}`;
    iframe.frameBorder = 0;
    iframe.allow = 'autoplay; encrypted-media';
    iframe.allowFullscreen = true;
    const container = document.getElementById('playerContainer');
    container.innerHTML = '';
    container.appendChild(iframe);
  } else {
    alert('Link de YouTube no válido.');
  }
}

function extraerIDYoutube(url) {
  const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[1].length === 11 ? match[1] : null;
}

function prioridadColor(priority, status) {
  if (status === 'completada') return '#90caf9';
  if (status === 'en proceso') return '#ffd600';
  switch (priority) {
    case 'alta': return '#ff5252';
    case 'media': return '#ffd600';
    case 'baja': return '#00e676';
    default: return '#90caf9';
  }
}

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
    `;
    modal.innerHTML = `
      <div style="background:#fff; color:#222; padding:2rem; border-radius:10px; min-width:300px; text-align:center;">
        <h2 id="modalTitulo"></h2>
        <p id="modalDescripcion"></p>
        <p id="modalEstado"></p>
        <button id="btnCompletar">Marcar como completada</button>
        <button id="btnCerrar">Cerrar</button>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.style.display = 'flex';
  document.getElementById('modalTitulo').textContent = event.title;
  document.getElementById('modalDescripcion').textContent = event.extendedProps.description;
  document.getElementById('modalEstado').textContent = 'Estado: ' + event.extendedProps.status;

  const btnCompletar = document.getElementById('btnCompletar');
  btnCompletar.style.display = event.extendedProps.status === 'completada' ? 'none' : 'inline-block';
  btnCompletar.onclick = function () {
    const idx = tasks.findIndex(t => t.name === event.title && t.dueDate === event.startStr);
    if (idx !== -1) {
      tasks[idx].status = 'completada';
      calendar.refetchEvents();
    }
    modal.style.display = 'none';
  };

  document.getElementById('btnCerrar').onclick = function () {
    modal.style.display = 'none';
  };
}

// Botón para mostrar opciones de fondo
const fondoBtn = document.createElement('button');
fondoBtn.textContent = 'Configuración de Fondo';
fondoBtn.style = `
  display: block;
  margin: 0 auto 1rem;
  background: #333;
  color: #ffcc00;
  border-radius: 8px;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
`;
document.body.insertBefore(fondoBtn, document.getElementById('bgInput'));

const fondoConfig = [
  document.getElementById('bgInput'),
  document.getElementById('bgControls'),
  document.getElementById('bgAdjustControls'),
  document.getElementById('zoomControl')
];
fondoConfig.forEach(el => el.style.display = 'none');

fondoBtn.addEventListener('click', () => {
  const visible = fondoConfig[0].style.display === 'block';
  fondoConfig.forEach(el => el.style.display = visible ? 'none' : 'block');
});
