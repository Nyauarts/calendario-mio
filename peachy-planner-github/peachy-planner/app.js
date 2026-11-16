const $ = (id) => document.getElementById(id);
const today = new Date();
const dateKey = (date) => {
  const y = date.getFullYear(), m = String(date.getMonth()+1).padStart(2,'0'), d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
};
const parseDate = (key) => {
  const [y,m,d] = key.split('-').map(Number);
  return new Date(y,m-1,d);
};
const monthNames = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const weekdays = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
let selectedDate = dateKey(today);
let shownMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let tasks = JSON.parse(localStorage.getItem('peachyTasks') || '[]');
let routines = JSON.parse(localStorage.getItem('peachyRoutines') || '[]');
let routineChecks = JSON.parse(localStorage.getItem('peachyRoutineChecks') || '{}');
let editingTaskId = null;

function save() {
  localStorage.setItem('peachyTasks', JSON.stringify(tasks));
  localStorage.setItem('peachyRoutines', JSON.stringify(routines));
  localStorage.setItem('peachyRoutineChecks', JSON.stringify(routineChecks));
}
function uid(){ return `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function safe(text){return String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function renderCalendar(){
  $('monthLabel').textContent = `${monthNames[shownMonth.getMonth()]} ${shownMonth.getFullYear()}`;
  const first = new Date(shownMonth.getFullYear(),shownMonth.getMonth(),1);
  const offset = (first.getDay()+6)%7;
  const start = new Date(first); start.setDate(first.getDate()-offset);
  let html = '';
  for(let i=0;i<42;i++){
    const d = new Date(start); d.setDate(start.getDate()+i);
    const key = dateKey(d);
    const hasTask = tasks.some(t=>t.date===key);
    const classes = ['calendar-day'];
    if(d.getMonth()!==shownMonth.getMonth()) classes.push('muted');
    if(key===dateKey(today)) classes.push('today');
    if(key===selectedDate) classes.push('selected');
    if(hasTask) classes.push('has-task');
    html += `<button class="${classes.join(' ')}" data-date="${key}" aria-label="${key}">${d.getDate()}</button>`;
  }
  $('calendarDays').innerHTML=html;
  $('calendarDays').querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>selectDate(btn.dataset.date)));
}
function selectDate(key){
  selectedDate=key;
  const d=parseDate(key);
  if(d.getMonth()!==shownMonth.getMonth()||d.getFullYear()!==shownMonth.getFullYear()) shownMonth=new Date(d.getFullYear(),d.getMonth(),1);
  renderAll();
}
function renderDay(){
  const d=parseDate(selectedDate);
  const isToday=selectedDate===dateKey(today);
  $('selectedDateTitle').textContent = isToday ? 'Today ✦' : `${weekdays[d.getDay()].charAt(0).toUpperCase()+weekdays[d.getDay()].slice(1)} ${d.getDate()} ${monthNames[d.getMonth()]}`;
  $('daySubtitle').textContent = isToday ? 'A fresh page waiting for you.' : 'Your plans for this day.';
  const todays=tasks.filter(t=>t.date===selectedDate).sort((a,b)=>{
    if(a.allDay!==b.allDay) return a.allDay?-1:1;
    return (a.time||'').localeCompare(b.time||'');
  });
  const done=todays.filter(t=>t.done).length;
  $('taskCount').textContent=`${done}/${todays.length}`;
  const pct=todays.length?Math.round(done/todays.length*100):0;
  $('progressBar').style.width=pct+'%'; $('progressLabel').textContent=pct+'% done';
  if(!todays.length){$('agenda').innerHTML='<div class="empty-state"><b>✿</b>No plans for this day yet.<br>Enjoy the blank space or add a little task!</div>';return;}
  $('agenda').innerHTML=todays.map(t=>{
    const accent={pink:'#e5a0b9',lilac:'#bba4d0',blue:'#9eb8d6',green:'#aabd94'}[t.color]||'#e5a0b9';
    const bg={pink:'#fff0f3',lilac:'#f3edf8',blue:'#edf4fa',green:'#f0f5e9'}[t.color]||'#fff0f3';
    return `<div class="agenda-row">
      <div class="agenda-time">${t.allDay?'ALL DAY':safe(t.time||'09:00')}</div>
      <div class="task-card ${t.done?'done':''}" style="--task-accent:${accent};--task-bg:${bg}">
        <input class="task-check" type="checkbox" data-task-check="${t.id}" ${t.done?'checked':''} aria-label="Marcar tarea como completada">
        <div><div class="task-title">${safe(t.title)}</div><div class="task-meta">${t.allDay?'Plan for the whole day':'Scheduled task'}</div></div>
      </div>
      <button class="delete-task" data-delete-task="${t.id}" aria-label="Eliminar tarea">×</button>
    </div>`;
  }).join('');
  $('agenda').querySelectorAll('[data-task-check]').forEach(el=>el.addEventListener('change',()=>{const t=tasks.find(x=>x.id===el.dataset.taskCheck);if(t){t.done=el.checked;save();renderAll();}}));
  $('agenda').querySelectorAll('[data-delete-task]').forEach(el=>el.addEventListener('click',()=>{tasks=tasks.filter(t=>t.id!==el.dataset.deleteTask);save();renderAll();}));
}
function renderRoutines(){
  $('routineList').innerHTML=routines.length?routines.map(r=>{
    const checked=(routineChecks[selectedDate]||[]).includes(r.id);
    return `<div class="routine-item ${checked?'done':''}">
      <input type="checkbox" data-routine-check="${r.id}" ${checked?'checked':''} aria-label="Completar rutina">
      <span>${safe(r.title)}</span><button class="routine-delete" data-routine-delete="${r.id}" aria-label="Eliminar rutina">×</button>
    </div>`;
  }).join(''):'<div class="empty-state">No routines yet. Add a habit you want to repeat ♡</div>';
  $('routineList').querySelectorAll('[data-routine-check]').forEach(el=>el.addEventListener('change',()=>{
    routineChecks[selectedDate]=routineChecks[selectedDate]||[];
    if(el.checked) routineChecks[selectedDate].push(el.dataset.routineCheck);
    else routineChecks[selectedDate]=routineChecks[selectedDate].filter(id=>id!==el.dataset.routineCheck);
    save();renderRoutines();
  }));
  $('routineList').querySelectorAll('[data-routine-delete]').forEach(el=>el.addEventListener('click',()=>{
    routines=routines.filter(r=>r.id!==el.dataset.routineDelete);
    Object.keys(routineChecks).forEach(k=>routineChecks[k]=routineChecks[k].filter(id=>id!==el.dataset.routineDelete));
    save();renderRoutines();
  }));
}
function renderAll(){renderCalendar();renderDay();renderRoutines();}
function openTask(){
  editingTaskId=null;
  $('taskForm').reset();
  $('taskDate').value=selectedDate;
  $('taskTime').value='09:00';
  $('allDay').checked=false;
  $('timeFields').classList.remove('hidden');
  $('modalTitle').textContent='Add a task ✦';
  $('taskDialog').showModal();
  $('taskName').focus();
}
$('openTaskModal').addEventListener('click',openTask);
$('closeTaskModal').addEventListener('click',()=>$('taskDialog').close());
$('cancelTask').addEventListener('click',()=>$('taskDialog').close());
$('allDay').addEventListener('change',()=> $('timeFields').classList.toggle('hidden',$('allDay').checked));
$('taskForm').addEventListener('submit',e=>{
  e.preventDefault();
  const title=$('taskName').value.trim();
  if(!title)return;
  tasks.push({id:uid(),title,date:$('taskDate').value,time:$('taskTime').value,allDay:$('allDay').checked,color:$('taskCategory').value,done:false});
  selectedDate=$('taskDate').value;
  const d=parseDate(selectedDate);shownMonth=new Date(d.getFullYear(),d.getMonth(),1);
  save();$('taskDialog').close();renderAll();
});
$('prevMonth').addEventListener('click',()=>{shownMonth.setMonth(shownMonth.getMonth()-1);renderCalendar();});
$('nextMonth').addEventListener('click',()=>{shownMonth.setMonth(shownMonth.getMonth()+1);renderCalendar();});
$('todayBtn').addEventListener('click',()=>{shownMonth=new Date(today.getFullYear(),today.getMonth(),1);selectDate(dateKey(today));});
$('addRoutineBtn').addEventListener('click',()=>{$('routineForm').classList.toggle('hidden');if(!$('routineForm').classList.contains('hidden'))$('routineInput').focus();});
$('routineForm').addEventListener('submit',e=>{
  e.preventDefault();const title=$('routineInput').value.trim();if(!title)return;
  routines.push({id:uid(),title});$('routineInput').value='';$('routineForm').classList.add('hidden');save();renderRoutines();
});
document.querySelectorAll('.mobile-nav button').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.mobile-nav button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
  document.querySelector('.'+btn.dataset.scroll).scrollIntoView({behavior:'smooth',block:'start'});
}));
renderAll();
