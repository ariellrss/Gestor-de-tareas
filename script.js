let calendar;
let tasks = [];

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

// Verificar autenticación al cargar la página
async function checkAuth() {
  try {
    const response = await fetch('./check-auth.php');
    const result = await response.json();
    
    if (!result.authenticated) {
      window.location.href = './login.html';
      return false;
    }
    return true;
  } catch (error) {
    window.location.href = './login.html';
    return false;
  }
}

// Cargar tareas desde la base de datos
async function loadTasks() {
  try {
    const response = await fetch('./tareas.php');
    const tasksFromDB = await response.json();
    
    // Limpiar calendario
    calendar.getEvents().forEach(event => event.remove());
    
    // Limpiar array local
    tasks = [];
    
    // Agregar tareas al calendario y al array local
    tasksFromDB.forEach(task => {
      const taskObj = {
        id: task.id,
        seriesId: task.series_id,
        name: task.nombre,
        dueDate: new Date(task.fecha_vencimiento),
        priority: task.prioridad,
        status: task.estado,
        description: task.descripcion
      };
      
      tasks.push(taskObj);
      addEventToCalendar(taskObj);
    });
    
  } catch (error) {
    alert('Error al cargar las tareas');
  }
}

// Guardar tarea en la base de datos
async function saveTask(task) {
  try {
    const response = await fetch('./tareas.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    
    return await response.json();
  } catch (error) {
    return { success: false };
  }
}

// Actualizar tarea en la base de datos
async function updateTask(taskId, updates) {
  try {
    const response = await fetch('./tareas.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, ...updates })
    });
    
    return await response.json();
  } catch (error) {
    return { success: false };
  }
}

// Eliminar tarea de la base de datos
async function deleteTask(taskId, seriesId = null) {
  try {
    const response = await fetch('./tareas.php', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, seriesId })
    });
    
    return await response.json();
  } catch (error) {
    return { success: false };
  }
}

// Cargar preferencias del usuario
async function loadPreferences() {
  try {
    const response = await fetch('./preferencias.php');
    const prefs = await response.json();
    
    // Aplicar paleta de colores
    if (prefs.paleta_colores) {
      const paletteSelect = document.getElementById('colorPalette');
      if (paletteSelect) {
        paletteSelect.value = prefs.paleta_colores;
        // Aplicar la paleta inmediatamente
        document.body.className = '';
        if (prefs.paleta_colores !== 'default') {
          document.body.classList.add('palette-' + prefs.paleta_colores);
        }
      }
    }
    
  } catch (error) {
    // Aplicar valores por defecto
    document.body.className = '';
  }
}

// Guardar preferencias del usuario
async function savePreferences() {
  const paletteSelect = document.getElementById('colorPalette');
  
  const prefs = {
    palette: paletteSelect ? paletteSelect.value : 'default',
    backgroundImage: '',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundZoom: 100
  };
  
  try {
    await fetch('./preferencias.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs)
    });
  } catch (error) {
    // Error silencioso
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Verificar autenticación
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    return;
  }
  
  // Agregar botón de cerrar sesión
  const logoutBtn = document.createElement('button');
  logoutBtn.textContent = 'Cerrar Sesión';
  logoutBtn.id = 'logoutBtn';
  logoutBtn.style.position = 'fixed';
  logoutBtn.style.top = '10px';
  logoutBtn.style.right = '10px';
  logoutBtn.style.zIndex = '1000';
  logoutBtn.style.padding = '8px 16px';
  logoutBtn.style.backgroundColor = '#ff5252';
  logoutBtn.style.color = 'white';
  logoutBtn.style.border = 'none';
  logoutBtn.style.borderRadius = '5px';
  logoutBtn.style.cursor = 'pointer';
  logoutBtn.style.fontSize = '14px';
  logoutBtn.style.fontWeight = 'bold';
  
  logoutBtn.addEventListener('click', () => {
    window.location.href = './logout.php';
  });
  document.body.appendChild(logoutBtn);

  // Ajustar margen superior para el contenido principal
  const paletteSelector = document.getElementById('paletteSelector');
  if (paletteSelector) {
    paletteSelector.style.marginTop = '60px';
  }

  // Cargar datos del usuario
  await loadPreferences();
  
  // Inicializar calendario
  const calendarEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'es',
    height: 'auto',
    events: [],
    eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },

    eventContent(info) {
      const status = info.event.extendedProps.status || 'pendiente';
      const baseTitle = info.event.title;
      let finalTitle = baseTitle;

      if (status === 'completada') finalTitle = '✅ ' + baseTitle;
      else if (status === 'en proceso') finalTitle = '⏳ ' + baseTitle;

      return {
        html: `<div class="fc-event-time">${info.timeText || ''}</div>
               <div class="fc-event-title">${finalTitle}</div>`
      };
    },

    eventDidMount(info) {
      const p = info.event.extendedProps.priority || 'baja';
      const s = info.event.extendedProps.status || 'pendiente';

      // Aplicar clases de prioridad
      const priorityClass = 'priority-' + p;
      const classesToRemove = ['priority-alta','priority-media','priority-baja','status-completada'];
      classesToRemove.forEach(c => info.el.classList.remove(c));
      info.el.classList.add(priorityClass);
      if (s === 'completada') info.el.classList.add('status-completada');

      // Fallback colores
      const color = prioridadColor(p, s);
      info.el.style.backgroundColor = color;
      info.el.style.borderColor = color;
      info.el.style.color = getComputedStyle(document.documentElement).getPropertyValue('--color-texto').trim();
    },

    eventClick(info) {
      mostrarModal(info.event);
    }
  });
  
  calendar.render();
  
  // Cargar tareas después de inicializar el calendario
  await loadTasks();

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

  // Cambio de paleta
  const paletteSelect = document.getElementById('colorPalette');
  if (paletteSelect) {
    paletteSelect.addEventListener('change', () => {
      document.body.className = '';
      const value = paletteSelect.value;
      if (value !== 'default') {
        document.body.classList.add('palette-' + value);
      }
      savePreferences();
    });
  }
});

// Manejar envío del formulario de tareas
const taskForm = document.getElementById('taskForm');
if (taskForm) {
  taskForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('taskName').value.trim();
    const date = document.getElementById('dueDate').value;
    const time = document.getElementById('dueTime').value;
    const priority = document.getElementById('priority').value;
    const status = document.getElementById('status').value;
    const description = document.getElementById('description').value;
    const repeat = document.getElementById('repeat').value;

    // Validaciones básicas
    if (!name || !date || !time) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    const baseDate = new Date(`${date}T${time}`);
    if (isNaN(baseDate.getTime())) {
      alert('Fecha u hora inválida');
      return;
    }

    const seriesId = (repeat === 'none') ? null : uid();

    const t = { 
      id: uid(), 
      seriesId, 
      name, 
      dueDate: baseDate.toISOString(), 
      priority, 
      status, 
      description,
      repeat 
    };
    
    // Guardar en la base de datos
    const result = await saveTask(t);
    
    if (result.success) {
      // Agregar al array local
      const taskObj = {
        id: t.id,
        seriesId: t.seriesId,
        name: t.name,
        dueDate: new Date(t.dueDate),
        priority: t.priority,
        status: t.status,
        description: t.description
      };
      
      tasks.push(taskObj);
      addEventToCalendar(taskObj);

      // Manejar repeticiones
      if (repeat !== 'none') {
        for (let i = 1; i <= 11; i++) {
          const newDate = new Date(baseDate.getTime());

          if (repeat === 'weekly') {
            newDate.setDate(baseDate.getDate() + (7 * i));
          } else if (repeat === 'monthly') {
            newDate.setMonth(baseDate.getMonth() + i);
          }

          newDate.setHours(baseDate.getHours());
          newDate.setMinutes(baseDate.getMinutes());

          const rt = { 
            id: uid(), 
            seriesId, 
            name, 
            dueDate: newDate.toISOString(), 
            priority, 
            status, 
            description,
            repeat 
          };
          
          // Guardar tarea repetida en la base de datos
          const repeatResult = await saveTask(rt);
          
          if (repeatResult.success) {
            const repeatTaskObj = {
              id: rt.id,
              seriesId: rt.seriesId,
              name: rt.name,
              dueDate: new Date(rt.dueDate),
              priority: rt.priority,
              status: rt.status,
              description: rt.description
            };
            
            tasks.push(repeatTaskObj);
            addEventToCalendar(repeatTaskObj);
          }
        }
      }

      this.reset();
      document.getElementById('priority').dispatchEvent(new Event('change'));
    } else {
      alert('Error al guardar la tarea');
    }
  });
}

function addEventToCalendar(task) {
  const priorityClass = 'priority-' + task.priority;
  const classes = [priorityClass];
  if (task.status === 'completada') classes.push('status-completada');

  calendar.addEvent({
    id: task.id,
    title: task.name,
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
    modal.style.cssText = `
      position: fixed; 
      top: 0; 
      left: 0; 
      width: 100vw; 
      height: 100vh;
      background: rgba(0,0,0,0.7); 
      display: flex; 
      align-items: center; 
      justify-content: center;
      z-index: 9999;
    `;
    modal.innerHTML = `
      <div style="background: #fff; color: #222; padding: 2rem; border-radius: 10px; min-width: 320px; max-width: 500px; text-align: center; box-shadow: 0 0 20px rgba(0,0,0,0.3);">
        <h2 id="modalTitulo" style="margin-top: 0; color: #333;"></h2>
        <p id="modalDescripcion" style="margin: 1rem 0; color: #666;"></p>
        <p id="modalEstado" style="font-weight: bold; color: #444;"></p>
        <p id="modalHora" style="font-size: 0.9rem; color: #555;"></p>
        <label style="display: block; margin: 1rem 0;">
          Nueva prioridad:
          <select id="modalPriority" style="margin-left: 0.5rem; padding: 0.25rem;">
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </label>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 1rem;">
          <button id="btnToggleCompletar" style="padding: 0.5rem 1rem; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Cambiar estado</button>
          <button id="btnGuardarPrioridad" style="padding: 0.5rem 1rem; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">Guardar prioridad</button>
          <button id="btnBorrar" style="padding: 0.5rem 1rem; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Borrar tarea</button>
          <button id="btnCerrar" style="padding: 0.5rem 1rem; background: #9E9E9E; color: white; border: none; border-radius: 4px; cursor: pointer;">Cerrar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  modal.style.display = 'flex';
  const titulo = event.title;
  document.getElementById('modalTitulo').textContent = titulo;
  document.getElementById('modalDescripcion').textContent = event.extendedProps.description || '(Sin descripción)';
  document.getElementById('modalEstado').textContent = 'Estado: ' + (event.extendedProps.status || 'pendiente');
  const startDate = event.start;
  document.getElementById('modalHora').textContent = 'Horario: ' + formatearLocalYMDHM(startDate);

  const modalPriority = document.getElementById('modalPriority');
  modalPriority.value = event.extendedProps.priority;
  modalPriority.style.backgroundColor = prioridadColor(modalPriority.value, 'pendiente');

  modalPriority.addEventListener('change', function () {
    this.style.backgroundColor = prioridadColor(this.value, 'pendiente');
  });

  document.getElementById('btnToggleCompletar').onclick = async function () {
    const taskId = event.extendedProps.taskId;
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      const nuevoEstado = siguienteEstado(tasks[idx].status);
      
      // Actualizar en la base de datos
      const result = await updateTask(taskId, { status: nuevoEstado });
      
      if (result.success) {
        tasks[idx].status = nuevoEstado;

        event.setExtendedProp('status', nuevoEstado);

        const priorityClass = 'priority-' + tasks[idx].priority;
        const classes = [priorityClass];
        if (nuevoEstado === 'completada') classes.push('status-completada');
        event.setProp('classNames', classes);

        const color = prioridadColor(tasks[idx].priority, nuevoEstado);
        if (event.el) {
          event.el.style.backgroundColor = color;
          event.el.style.borderColor = color;
        }
      } else {
        alert('Error al actualizar el estado');
      }
    }
    modal.style.display = 'none';
  };

  document.getElementById('btnGuardarPrioridad').onclick = async function () {
    const nuevaPrioridad = modalPriority.value;
    const taskId = event.extendedProps.taskId;
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      // Actualizar en la base de datos
      const result = await updateTask(taskId, { priority: nuevaPrioridad });
      
      if (result.success) {
        tasks[idx].priority = nuevaPrioridad;
        event.setExtendedProp('priority', nuevaPrioridad);

        const classes = ['priority-' + nuevaPrioridad];
        if (tasks[idx].status === 'completada') classes.push('status-completada');
        event.setProp('classNames', classes);

        const color = prioridadColor(nuevaPrioridad, tasks[idx].status);
        if (event.el) {
          event.el.style.backgroundColor = color;
          event.el.style.borderColor = color;
        }
      } else {
        alert('Error al actualizar la prioridad');
      }
    }
    modal.style.display = 'none';
  };

  document.getElementById('btnBorrar').onclick = function () {
    let confirmModal = document.getElementById('modalConfirmar');
    if (!confirmModal) {
      confirmModal = document.createElement('div');
      confirmModal.id = 'modalConfirmar';
      confirmModal.style.cssText = `
        position: fixed; 
        top: 0; 
        left: 0; 
        width: 100vw; 
        height: 100vh;
        background: rgba(0,0,0,0.7); 
        display: flex; 
        align-items: center; 
        justify-content: center;
        z-index: 10000;
      `;
      confirmModal.innerHTML = `
        <div style="background: #fff; color: #222; padding: 2rem; border-radius: 10px; min-width: 320px; text-align: center; box-shadow: 0 0 20px rgba(0,0,0,0.3);">
          <h3 style="margin-top: 0; color: #333;">¿Querés borrar esta tarea?</h3>
          <p style="color: #666;">Podés elegir borrar solo esta copia o toda la serie.</p>
          <div style="display: flex; gap: 10px; justify-content: center; margin-top: 1rem;">
            <button id="btnBorrarSolo" style="padding: 0.5rem 1rem; background: #ff9800; color: white; border: none; border-radius: 4px; cursor: pointer;">Solo esta</button>
            <button id="btnBorrarSerie" style="padding: 0.5rem 1rem; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Toda la serie</button>
            <button id="btnCancelarBorrar" style="padding: 0.5rem 1rem; background: #9E9E9E; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancelar</button>
          </div>
        </div>
      `;
      document.body.appendChild(confirmModal);
    }

    confirmModal.style.display = 'flex';

    document.getElementById('btnBorrarSolo').onclick = async () => {
      const taskId = event.extendedProps.taskId;
      
      // Eliminar de la base de datos
      const result = await deleteTask(taskId);
      
      if (result.success) {
        tasks = tasks.filter(t => t.id !== taskId);
        event.remove();
      } else {
        alert('Error al eliminar la tarea');
      }
      
      confirmModal.style.display = 'none';
      modal.style.display = 'none';
    };

    document.getElementById('btnBorrarSerie').onclick = async () => {
      const seriesId = event.extendedProps.seriesId || null;
      
      // Eliminar de la base de datos
      const result = await deleteTask(null, seriesId);
      
      if (result.success) {
        if (seriesId) {
          tasks = tasks.filter(t => t.seriesId !== seriesId);
          calendar.getEvents().forEach(ev => {
            if (ev.extendedProps.seriesId === seriesId) ev.remove();
          });
        } else {
          const nombre = event.title;
          tasks = tasks.filter(t => t.name !== nombre);
          calendar.getEvents().forEach(ev => {
            if (ev.title === nombre) ev.remove();
          });
        }
      } else {
        alert('Error al eliminar la serie de tareas');
      }
      
      confirmModal.style.display = 'none';
      modal.style.display = 'none';
    };

    document.getElementById('btnCancelarBorrar').onclick = () => {
      confirmModal.style.display = 'none';
    };
  };

  document.getElementById('btnCerrar').onclick = () => {
    modal.style.display = 'none';
  };
}

function siguienteEstado(actual) {
  if (actual === 'pendiente') return 'en proceso';
  if (actual === 'en proceso') return 'completada';
  return 'pendiente';
}

function prioridadColor(priority, status) {
  const coloresFijos = {
    alta: '#ff5252',
    media: '#ffd600',
    baja: '#00e676',
    completada: '#90caf9'
  };
  if (status === 'completada') return coloresFijos.completada;
  return coloresFijos[priority] || coloresFijos.completada;
}