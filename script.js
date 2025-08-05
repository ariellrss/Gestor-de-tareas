let calendar;
let tasks = [];

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
      info.el.style.color = '#222';

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

document.getElementById('taskForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const name = document.getElementById('taskName').value;
  const date = document.getElementById('dueDate').value;
  const time = document.getElementById('dueTime').value;
  const priority = document.getElementById('priority').value;
  const status = document.getElementById('status').value;
  const description = document.getElementById('description').value;

  const dueDate = `${date}T${time}`;

  const task = { name, dueDate, priority, status, description };
  tasks.push(task);

  let displayName = name;
  if (status === 'completada') displayName = '✅ ' + name;
  else if (status === 'en proceso') displayName = '⏳ ' + name;

  calendar.addEvent({
    title: displayName,
    start: dueDate,
    description,
    priority,
    status,
    backgroundColor: prioridadColor(priority, status),
    borderColor: prioridadColor(priority, status),
    allDay: false
  });

  this.reset();
});

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

  const btnToggle = document.getElementById('btnToggleCompletar');
  btnToggle.onclick = function () {
    let nuevoEstado;
    if (event.extendedProps.status === 'pendiente') {
      nuevoEstado = 'en proceso';
    } else if (event.extendedProps.status === 'en proceso') {
      nuevoEstado = 'completada';
    } else {
      nuevoEstado = 'pendiente';
    }

    const nombre = titulo;
    const fecha = formatearFechaLocal(event.start);

    const idx = tasks.findIndex(t => t.name === nombre && t.dueDate === fecha);
    if (idx !== -1) {
      tasks[idx].status = nuevoEstado;

      event.remove();

      let nuevoTitulo = tasks[idx].name;
      if (nuevoEstado === 'completada') nuevoTitulo = '✅ ' + nuevoTitulo;
      else if (nuevoEstado === 'en proceso') nuevoTitulo = '⏳ ' + nuevoTitulo;

      calendar.addEvent({
        title: nuevoTitulo,
        start: tasks[idx].dueDate,
        description: tasks[idx].description,
        priority: tasks[idx].priority,
        status: nuevoEstado,
        backgroundColor: prioridadColor(tasks[idx].priority, nuevoEstado),
        borderColor: prioridadColor(tasks[idx].priority, nuevoEstado),
        allDay: false
      });
    }

    modal.style.display = 'none';
  };

  document.getElementById('btnCerrar').onclick = () => modal.style.display = 'none';
}

function prioridadColor(priority, status) {
  if (status === 'completada') return '#90caf9'; // azul para completada

  // Si está "en proceso", NO cambiamos el color: usamos el color de prioridad
  switch (priority) {
    case 'alta': return '#ff5252';    // rojo
    case 'media': return '#ffd600';   // amarillo
    case 'baja': return '#00e676';    // verde
    default: return '#90caf9';
  }
}


function formatearFechaLocal(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

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
document.getElementById('bgFile').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (evt) {
      document.body.style.backgroundImage = `url(${evt.target.result})`;
    };
    reader.readAsDataURL(file);
  }
});

document.getElementById('bgSize').addEventListener('change', function () {
  document.body.style.backgroundSize = this.value;
});

document.getElementById('bgPosition').addEventListener('change', function () {
  document.body.style.backgroundPosition = this.value;
});

document.getElementById('bgX').addEventListener('input', function () {
  const x = this.value;
  const y = document.getElementById('bgY').value;
  document.body.style.backgroundPosition = `${x}% ${y}%`;
});

document.getElementById('bgY').addEventListener('input', function () {
  const x = document.getElementById('bgX').value;
  const y = this.value;
  document.body.style.backgroundPosition = `${x}% ${y}%`;
});

document.getElementById('bgZoom').addEventListener('input', function () {
  const zoom = this.value;
  document.body.style.backgroundSize = `${zoom}%`;
});
