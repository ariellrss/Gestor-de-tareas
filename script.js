let calendar;
let tasks = [];
let tempBgUrl = "";

// UID simple
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

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
      // Construir clases según prioridad/estado y aplicarlas en el DOM
      const p = info.event.extendedProps.priority || 'baja';
      const s = info.event.extendedProps.status || 'pendiente';
      const priorityClass = 'priority-' + p;
      const classesToRemove = ['priority-alta','priority-media','priority-baja','status-completada'];

      classesToRemove.forEach(c => info.el.classList.remove(c));
      info.el.classList.add(priorityClass);
      if (s === 'completada') info.el.classList.add('status-completada');

      // Fallback: también aplicamos inline styles por si hiciera falta
      const color = prioridadColor(p, s);
      info.el.style.backgroundColor = color;
      info.el.style.borderColor = color;
      info.el.style.color = getComputedStyle(document.documentElement).getPropertyValue('--color-texto').trim();

      // Mostrar título con emoji según estado
      let titleText = info.event.title.replace(/^✅ |^⏳ /, '');
      if (s === 'completada') info.el.innerHTML = '✅ ' + titleText;
      else if (s === 'en proceso') info.el.innerHTML = '⏳ ' + titleText;
      else info.el.innerHTML = titleText;
    },
    eventClick(info) {
      mostrarModal(info.event);
    }
  });
  calendar.render();

  // Vista previa de color en selector de prioridad del formulario
  const prioritySelect = document.getElementById('priority');
  if (prioritySelect) {
    prioritySelect.addEventListener('change', function () {
      const color = prioridadColor(this.value, 'pendiente');
      this.style.backgroundColor = color;
      this.style.color = '#000';
    });
    prioritySelect.dispatchEvent(new Event('change'));
  }
});

document.getElementById('taskForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const name = document.getElementById('taskName').value.trim();
  const date = document.getElementById('dueDate').value;
  const time = document.getElementById('dueTime').value;
  const priority = document.getElementById('priority').value;
  const status = document.getElementById('status').value;
  const description = document.getElementById('description').value;
  const repeat = document.getElementById('repeat').value;

  const baseDate = new Date(`${date}T${time}`);
  const seriesId = (repeat === 'none') ? null : uid();

  const t = { id: uid(), seriesId, name, dueDate: new Date(baseDate), priority, status, description };
  tasks.push(t);
  addEventToCalendar(t);

  if (repeat !== 'none') {
    for (let i = 1; i <= 11; i++) {
      const newDate = new Date(baseDate);
      if (repeat === 'weekly') newDate.setDate(newDate.getDate() + (7 * i));
      else if (repeat === 'monthly') newDate.setMonth(newDate.getMonth() + i);

      const rt = { id: uid(), seriesId, name, dueDate: new Date(newDate), priority, status, description };
      tasks.push(rt);
      addEventToCalendar(rt);
    }
  }

  this.reset();
  document.getElementById('priority').dispatchEvent(new Event('change'));
});

function addEventToCalendar(task) {
  let displayName = task.name;
  if (task.status === 'completada') displayName = '✅ ' + task.name;
  else if (task.status === 'en proceso') displayName = '⏳ ' + task.name;

  // Clase(s) a aplicar
  const priorityClass = 'priority-' + task.priority;
  const classes = [priorityClass];
  if (task.status === 'completada') classes.push('status-completada');

  calendar.addEvent({
    id: task.id,
    title: displayName,
    start: task.dueDate,
    extendedProps: {
      priority: task.priority,
      status: task.status,
      description: task.description,
      taskId: task.id,
      seriesId: task.seriesId
    },
    classNames: classes,
    allDay: false
  });
}

function mostrarModal(event) {
  let modal = document.getElementById('modalTarea');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modalTarea';
    modal.style = `
      position: fixed; top:0; left:0; width:100vw; height:100vh;
      background: rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center;
      z-index:9999;
    `;
    modal.innerHTML = `
      <div style="background:#fff; color:#222; padding:2rem; border-radius:10px; min-width:320px; text-align:center;">
        <h2 id="modalTitulo"></h2>
        <p id="modalDescripcion"></p>
        <p id="modalEstado"></p>
        <p id="modalHora" style="font-size:0.9rem; color:#555;"></p>
        <label>Nueva prioridad:
          <select id="modalPriority">
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </label>
        <div style="display:flex; flex-wrap: wrap; gap:8px; justify-content:center; margin-top:1rem;">
          <button id="btnToggleCompletar">Cambiar estado</button>
          <button id="btnGuardarPrioridad">Guardar prioridad</button>
          <button id="btnBorrar">Borrar tarea</button>
          <button id="btnCerrar">Cerrar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  modal.style.display = 'flex';
  const titulo = event.title.replace(/^✅ |^⏳ /, '');
  document.getElementById('modalTitulo').textContent = titulo;
  document.getElementById('modalDescripcion').textContent = event.extendedProps.description || '';
  document.getElementById('modalEstado').textContent = 'Estado: ' + (event.extendedProps.status || '');
  const startDate = event.start;
  document.getElementById('modalHora').textContent = 'Horario: ' + formatearLocalYMDHM(startDate);

  // Set current priority in modal select
  const modalPriority = document.getElementById('modalPriority');
  modalPriority.value = event.extendedProps.priority;
  modalPriority.style.backgroundColor = prioridadColor(modalPriority.value, 'pendiente');

  modalPriority.addEventListener('change', function () {
    this.style.backgroundColor = prioridadColor(this.value, 'pendiente');
  });

  document.getElementById('btnToggleCompletar').onclick = function () {
    const taskId = event.extendedProps.taskId;
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      const nuevoEstado = siguienteEstado(tasks[idx].status);
      tasks[idx].status = nuevoEstado;

      // Actualizar título
      const newTitle = (nuevoEstado === 'completada') ? ('✅ ' + tasks[idx].name) :
                       (nuevoEstado === 'en proceso') ? ('⏳ ' + tasks[idx].name) :
                       tasks[idx].name;
      event.setProp('title', newTitle);
      event.setExtendedProp('status', nuevoEstado);

      // Actualizar clases: prioridad + posible clase de completada
      const priorityClass = 'priority-' + tasks[idx].priority;
      const classes = [priorityClass];
      if (nuevoEstado === 'completada') classes.push('status-completada');
      event.setProp('classNames', classes);

      // Fallback visual inmediato
      const color = prioridadColor(tasks[idx].priority, nuevoEstado);
      if (event.el) {
        event.el.style.backgroundColor = color;
        event.el.style.borderColor = color;
      }
    }
    modal.style.display = 'none';
  };

  document.getElementById('btnGuardarPrioridad').onclick = function () {
    const nuevaPrioridad = modalPriority.value;
    const taskId = event.extendedProps.taskId;
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      tasks[idx].priority = nuevaPrioridad;
      event.setExtendedProp('priority', nuevaPrioridad);

      // Actualizar clases: prioridad + posible clase de completada
      const classes = ['priority-' + nuevaPrioridad];
      if (tasks[idx].status === 'completada') classes.push('status-completada');
      event.setProp('classNames', classes);

      // Fallback visual inmediato
      const color = prioridadColor(nuevaPrioridad, tasks[idx].status);
      if (event.el) {
        event.el.style.backgroundColor = color;
        event.el.style.borderColor = color;
      }
    }
    modal.style.display = 'none';
  };

  document.getElementById('btnBorrar').onclick = function () {
    const taskId = event.extendedProps.taskId;
    const seriesId = event.extendedProps.seriesId || null;
    const confirmSolo = confirm("Presioná Aceptar para BORRAR SOLO ESTA COPIA.\nPresioná Cancelar para BORRAR TODAS LAS COPIAS de esta serie.");
    if (confirmSolo) {
      tasks = tasks.filter(t => t.id !== taskId);
      event.remove();
    } else {
      if (seriesId) {
        tasks = tasks.filter(t => t.seriesId !== seriesId);
        calendar.getEvents().forEach(ev => {
          if (ev.extendedProps.seriesId === seriesId) ev.remove();
        });
      } else {
        const nombre = event.title.replace(/^✅ |^⏳ /, '');
        tasks = tasks.filter(t => t.name !== nombre);
        calendar.getEvents().forEach(ev => {
          if (ev.title.replace(/^✅ |^⏳ /, '') === nombre) ev.remove();
        });
      }
    }
    modal.style.display = 'none';
  };

  document.getElementById('btnCerrar').onclick = () => modal.style.display = 'none';
}

function siguienteEstado(actual) {
  if (actual === 'pendiente') return 'en proceso';
  if (actual === 'en proceso') return 'completada';
  return 'pendiente';
}

function prioridadColor(priority, status) {
  // Colores fijos de prioridad (usados para preview en selects)
  const coloresFijos = {
    alta: '#ff5252',
    media: '#ffd600',
    baja: '#00e676',
    completada: '#90caf9'
  };
  if (status === 'completada') return coloresFijos.completada;
  return coloresFijos[priority] || coloresFijos.completada;
}
