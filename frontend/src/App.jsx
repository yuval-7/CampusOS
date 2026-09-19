import { useEffect, useState } from 'react'
import './App.css'

const API = 'https://campus-os-99x6.vercel.app/'

const ENDPOINTS = [
  ['subjects', '/subjects'],
  ['tasks', '/tasks'],
  ['classes', '/timetable'],
  ['attendance', '/attendance'],
  ['exams', '/exams'],
  ['notes', '/notes'],
  ['expenses', '/expenses'],
]

function formatTime(value) {
  if (typeof value === 'number') {
    const totalMinutes = Math.floor(value / 60)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }

  if (typeof value === 'string') {
    const match = value.match(/(\d{2}):(\d{2})/)

    if (match) {
      return `${match[1]}:${match[2]}`
    }
  }

  return value
}

function App() {
  const [page, setPage] = useState('Dashboard')
  const [modal, setModal] = useState(null)

  // The app itself is never blocked by backend loading.
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [failedSections, setFailedSections] = useState([])

  const [subjects, setSubjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [classes, setClasses] = useState([])
  const [attendance, setAttendance] = useState([])
  const [exams, setExams] = useState([])
  const [notes, setNotes] = useState([])
  const [expenses, setExpenses] = useState([])

  const navItems = [
    ['📊', 'Dashboard'],
    ['📅', 'Timetable'],
    ['📝', 'Tasks'],
    ['📚', 'Subjects'],
    ['📈', 'Attendance'],
    ['🧪', 'Exams'],
    ['📒', 'Notes'],
    ['💰', 'Expenses'],
  ]

  async function api(path, options = {}, retries = 1) {
    let lastError

    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController()

      const timeout = setTimeout(() => {
        controller.abort()
      }, 25000)

      try {
        const isGet = !options.method || options.method === 'GET'

        const response = await fetch(`${API}${path}`, {
          ...options,
          headers: {
            ...(isGet ? {} : { 'Content-Type': 'application/json' }),
            ...(options.headers || {}),
          },
          signal: controller.signal,
        })

        const text = await response.text()

        if (!response.ok) {
          throw new Error(
            text || `API request failed with status ${response.status}`
          )
        }

        try {
          return JSON.parse(text)
        } catch {
          throw new Error(`Invalid JSON response from ${path}`)
        }
      } catch (err) {
        lastError = err

        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1500))
        }
      } finally {
        clearTimeout(timeout)
      }
    }

    if (lastError?.name === 'AbortError') {
      throw new Error(`${path} timed out while waking the backend`)
    }

    throw new Error(
      `${path}: ${lastError?.message || 'Request failed'}`
    )
  }

  async function loadData() {
    setLoading(true)
    setError('')
    setFailedSections([])

    const results = await Promise.allSettled(
      ENDPOINTS.map(async ([name, path]) => {
        const data = await api(path)

        return {
          name,
          path,
          data,
        }
      })
    )

    const failed = []

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        const { name, data } = result.value

        if (name === 'subjects') {
          setSubjects(Array.isArray(data) ? data : [])
        }

        if (name === 'tasks') {
          setTasks(Array.isArray(data) ? data : [])
        }

        if (name === 'classes') {
          setClasses(Array.isArray(data) ? data : [])
        }

        if (name === 'attendance') {
          setAttendance(Array.isArray(data) ? data : [])
        }

        if (name === 'exams') {
          setExams(Array.isArray(data) ? data : [])
        }

        if (name === 'notes') {
          setNotes(Array.isArray(data) ? data : [])
        }

        if (name === 'expenses') {
          setExpenses(Array.isArray(data) ? data : [])
        }
      } else {
        const message = result.reason?.message || 'Request failed'

        failed.push(message)
        console.error('CampusOS API error:', message)
      }
    })

    setFailedSections(failed)

    if (failed.length === ENDPOINTS.length) {
      setError(
        'CampusOS could not reach the backend. It may still be waking up — try Retry.'
      )
    } else if (failed.length > 0) {
      setError(
        'Some CampusOS data could not load. You can keep using the app and retry.'
      )
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  async function addItem(type, data) {
    try {
      setError('')

      if (type === 'subject') {
        await api('/subjects', {
          method: 'POST',
          body: JSON.stringify({
            name: data.name,
            teacher: data.teacher || null,
          }),
        })
      }

      if (type === 'task') {
        await api('/tasks', {
          method: 'POST',
          body: JSON.stringify({
            title: data.title,
            description: data.description || null,
            due_date: data.due || null,
            priority: data.priority || 'medium',
            completed: false,
          }),
        })
      }

      if (type === 'class') {
        const subject = subjects.find(
          item =>
            item.name.toLowerCase() ===
            String(data.subject).toLowerCase()
        )

        if (!subject) {
          setError('Add the subject first, then create its timetable class.')
          return
        }

        await api('/timetable', {
          method: 'POST',
          body: JSON.stringify({
            subject_id: subject.id,
            day: data.day,
            start_time: data.start,
            end_time: data.end,
            room: data.room || null,
          }),
        })
      }

      if (type === 'attendance') {
        await api('/attendance', {
          method: 'POST',
          body: JSON.stringify({
            subject_id: Number(data.subjectId),
            classes_held: Number(data.held),
            classes_attended: Number(data.attended),
          }),
        })
      }

      if (type === 'exam') {
        const subject = subjects.find(
          item =>
            item.name.toLowerCase() ===
            String(data.subject).toLowerCase()
        )

        if (!subject) {
          setError('Add the subject first, then create its exam.')
          return
        }

        await api('/exams', {
          method: 'POST',
          body: JSON.stringify({
            subject_id: subject.id,
            title: data.title,
            exam_date: data.date,
            description: null,
          }),
        })
      }

      if (type === 'note') {
        let subjectId = null

        if (data.subject?.trim()) {
          const subject = subjects.find(
            item =>
              item.name.toLowerCase() ===
              data.subject.trim().toLowerCase()
          )

          if (!subject) {
            setError('That subject does not exist.')
            return
          }

          subjectId = subject.id
        }

        await api('/notes', {
          method: 'POST',
          body: JSON.stringify({
            title: data.title,
            content: data.content,
            subject_id: subjectId,
          }),
        })
      }

      if (type === 'expense') {
        await api('/expenses', {
          method: 'POST',
          body: JSON.stringify({
            title: data.title,
            amount: Number(data.amount),
            category: data.category || null,
            expense_date: data.date,
            notes: null,
          }),
        })
      }

      setModal(null)
      await loadData()
    } catch (err) {
      console.error('CampusOS save error:', err)
      setError(
        `Something went wrong while saving: ${err.message}`
      )
    }
  }

  async function deleteItem(type, id) {
    try {
      setError('')

      const endpoints = {
        subject: `/subjects/${id}`,
        class: `/timetable/${id}`,
        attendance: `/attendance/${id}`,
        task: `/tasks/${id}`,
        exam: `/exams/${id}`,
        note: `/notes/${id}`,
        expense: `/expenses/${id}`,
      }

      await api(endpoints[type], {
        method: 'DELETE',
      })

      await loadData()
    } catch (err) {
      console.error('CampusOS delete error:', err)
      setError(
        `Something went wrong while deleting: ${err.message}`
      )
    }
  }

  async function toggleTask(id) {
    try {
      setError('')

      await api(`/tasks/${id}/toggle`, {
        method: 'PUT',
      })

      await loadData()
    } catch (err) {
      console.error('CampusOS task error:', err)
      setError(
        `Could not update the task: ${err.message}`
      )
    }
  }

  const pendingTasks = tasks.filter(task => !task.completed).length

  const totalHeld = attendance.reduce(
    (sum, item) => sum + Number(item.classes_held || 0),
    0
  )

  const totalAttended = attendance.reduce(
    (sum, item) => sum + Number(item.classes_attended || 0),
    0
  )

  const attendancePercentage =
    totalHeld > 0
      ? Math.round((totalAttended / totalHeld) * 100)
      : null

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">C</div>

          <div>
            <strong>CampusOS</strong>
            <span>Student OS</span>
          </div>
        </div>

        <nav>
          <p className="nav-label">MENU</p>

          {navItems.map(([icon, name]) => (
            <button
              key={name}
              className={`nav-item ${
                page === name ? 'active' : ''
              }`}
              onClick={() => setPage(name)}
            >
              <span>{icon}</span>
              {name}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="tip">
            <span>💡</span>

            <div>
              <strong>CampusOS</strong>
              <p>Your personal student workspace.</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        {loading && (
          <div
            className="panel"
            style={{
              marginBottom: '18px',
              color: '#526071',
              background: '#f8fafc',
            }}
          >
            <strong>Connecting to CampusOS...</strong>
            <p style={{ margin: '6px 0 0' }}>
              The backend may be waking up. Your dashboard is still available.
            </p>
          </div>
        )}

        {error && (
          <div
            className="panel"
            style={{
              marginBottom: '18px',
              color: '#9a4b00',
              background: '#fff8ed',
            }}
          >
            <strong>{error}</strong>

            <div style={{ marginTop: '10px' }}>
              <button
                className="primary-button"
                onClick={loadData}
                disabled={loading}
              >
                {loading ? 'Retrying...' : 'Retry'}
              </button>
            </div>
          </div>
        )}

        {!loading && page === 'Dashboard' && (
          <>
            <PageHeader
              title="Good morning 👋"
              description="Welcome back to your student dashboard."
            />

            <section className="stats-grid">
              <StatCard
                icon="📅"
                title="Today's Classes"
                value={classes.length}
                subtitle="Classes scheduled"
              />

              <StatCard
                icon="📝"
                title="Pending Tasks"
                value={pendingTasks}
                subtitle="Tasks remaining"
              />

              <StatCard
                icon="📈"
                title="Attendance"
                value={
                  attendancePercentage === null
                    ? '—'
                    : `${attendancePercentage}%`
                }
                subtitle={
                  attendancePercentage === null
                    ? 'No data yet'
                    : 'Overall attendance'
                }
              />

              <StatCard
                icon="🧪"
                title="Upcoming Exams"
                value={exams.length}
                subtitle="Exams scheduled"
              />
            </section>

            <section className="dashboard-grid">
              <Panel
                title="Today's Timetable"
                subtitle="Your scheduled classes"
                action="View all"
                onAction={() => setPage('Timetable')}
              >
                {classes.length === 0 ? (
                  <EmptyState text="No classes added yet." />
                ) : (
                  classes.map(item => (
                    <div className="schedule-item" key={item.id}>
                      <div className="time">
                        {formatTime(item.start_time)}
                      </div>

                      <div className="schedule-line" />

                      <div className="schedule-content">
                        <strong>{item.subject}</strong>

                        <span>
                          📍 {item.room || 'No room'} · {item.day}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </Panel>

              <Panel
                title="Pending Tasks"
                subtitle="Things you need to finish"
                action="View all"
                onAction={() => setPage('Tasks')}
              >
                {tasks.length === 0 ? (
                  <EmptyState text="No tasks added yet." />
                ) : (
                  tasks.map(task => (
                    <div className="task-row" key={task.id}>
                      <button
                        className={`check-button ${
                          task.completed ? 'checked' : ''
                        }`}
                        onClick={() => toggleTask(task.id)}
                      >
                        {task.completed ? '✓' : ''}
                      </button>

                      <div>
                        <strong
                          className={
                            task.completed ? 'completed' : ''
                          }
                        >
                          {task.title}
                        </strong>

                        <span>
                          {task.due_date || 'No due date'}
                        </span>
                      </div>

                      <small
                        className={`priority ${
                          task.priority || 'medium'
                        }`}
                      >
                        {task.priority || 'medium'}
                      </small>
                    </div>
                  ))
                )}
              </Panel>
            </section>

            <section className="bottom-grid">
              <Panel
                title="Subjects"
                subtitle="Your current subjects"
                action="Manage"
                onAction={() => setPage('Subjects')}
              >
                {subjects.length === 0 ? (
                  <EmptyState text="No subjects added yet." />
                ) : (
                  subjects.map(subject => (
                    <div
                      className="subject-row"
                      key={subject.id}
                    >
                      <div className="subject-icon">📚</div>

                      <div>
                        <strong>{subject.name}</strong>

                        <span>
                          {subject.teacher || 'No teacher'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </Panel>

              <Panel
                title="Upcoming Exams"
                subtitle="Stay prepared"
                action="View all"
                onAction={() => setPage('Exams')}
              >
                {exams.length === 0 ? (
                  <EmptyState text="No exams added yet." />
                ) : (
                  exams.map(exam => (
                    <div
                      className="data-row"
                      key={exam.id}
                    >
                      <div>
                        <strong>{exam.title}</strong>

                        <span>
                          {exam.subject || 'No subject'} ·{' '}
                          {exam.exam_date || 'No date'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </Panel>
            </section>
          </>
        )}

        {!loading && page === 'Subjects' && (
          <ResourcePage
            title="Subjects"
            description="Manage your subjects and teachers."
            button="+ Add Subject"
            onAdd={() => setModal('subject')}
          >
            {subjects.length === 0 ? (
              <EmptyState text="No subjects added yet." />
            ) : (
              subjects.map(subject => (
                <div
                  className="data-row"
                  key={subject.id}
                >
                  <div>
                    <strong>{subject.name}</strong>

                    <span>
                      {subject.teacher || 'No teacher'}
                    </span>
                  </div>

                  <button
                    className="delete-button"
                    onClick={() =>
                      deleteItem('subject', subject.id)
                    }
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </ResourcePage>
        )}

        {!loading && page === 'Tasks' && (
          <ResourcePage
            title="Tasks"
            description="Manage your assignments and work."
            button="+ Add Task"
            onAdd={() => setModal('task')}
          >
            {tasks.length === 0 ? (
              <EmptyState text="No tasks added yet." />
            ) : (
              tasks.map(task => (
                <div
                  className="data-row"
                  key={task.id}
                >
                  <div className="task-left">
                    <button
                      className={`check-button ${
                        task.completed ? 'checked' : ''
                      }`}
                      onClick={() => toggleTask(task.id)}
                    >
                      {task.completed ? '✓' : ''}
                    </button>

                    <div>
                      <strong
                        className={
                          task.completed
                            ? 'completed'
                            : ''
                        }
                      >
                        {task.title}
                      </strong>

                      <span>
                        {task.description ||
                          'No description'}{' '}
                        ·{' '}
                        {task.due_date ||
                          'No due date'}
                      </span>
                    </div>
                  </div>

                  <div className="row-actions">
                    <span
                      className={`priority ${
                        task.priority || 'medium'
                      }`}
                    >
                      {task.priority || 'medium'}
                    </span>

                    <button
                      className="delete-button"
                      onClick={() =>
                        deleteItem('task', task.id)
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </ResourcePage>
        )}

        {!loading && page === 'Timetable' && (
          <ResourcePage
            title="Timetable"
            description="Organize your weekly class schedule."
            button="+ Add Class"
            onAdd={() => setModal('class')}
          >
            <div className="week-grid">
              {[
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
              ].map(day => {
                const dayClasses = classes.filter(
                  item => item.day === day
                )

                return (
                  <div
                    className="day-card"
                    key={day}
                  >
                    <h3>{day}</h3>

                    {dayClasses.length === 0 ? (
                      <p className="muted">
                        No classes
                      </p>
                    ) : (
                      dayClasses.map(item => (
                        <div
                          className="class-card"
                          key={item.id}
                        >
                          <strong>
                            {item.subject}
                          </strong>

                          <span>
                            {formatTime(
                              item.start_time
                            )}{' '}
                            –{' '}
                            {formatTime(
                              item.end_time
                            )}
                          </span>

                          <span>
                            📍{' '}
                            {item.room ||
                              'No room'}
                          </span>

                          <button
                            className="delete-button"
                            onClick={() =>
                              deleteItem(
                                'class',
                                item.id
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )
              })}
            </div>
          </ResourcePage>
        )}

        {!loading && page === 'Attendance' && (
          <ResourcePage
            title="Attendance"
            description="Track attendance for every subject."
            button="+ Add Record"
            onAdd={() => setModal('attendance')}
          >
            {subjects.length === 0 ? (
              <EmptyState text="Add subjects first." />
            ) : (
              <div className="attendance-grid">
                {subjects.map(subject => {
                  const record = attendance.find(
                    item =>
                      Number(item.subject_id) ===
                      Number(subject.id)
                  )

                  const held = Number(
                    record?.classes_held || 0
                  )

                  const attended = Number(
                    record?.classes_attended || 0
                  )

                  const percentage =
                    held > 0
                      ? Math.round(
                          (attended / held) * 100
                        )
                      : 0

                  return (
                    <div
                      className="attendance-card"
                      key={subject.id}
                    >
                      <div className="subject-icon">
                        📚
                      </div>

                      <h3>{subject.name}</h3>

                      <div className="attendance-percent">
                        {held
                          ? `${percentage}%`
                          : '—'}
                      </div>

                      <div className="progress">
                        <div
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>

                      <p>
                        {held
                          ? `${attended} of ${held} classes attended`
                          : 'No attendance recorded'}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </ResourcePage>
        )}

        {!loading && page === 'Exams' && (
          <ResourcePage
            title="Exams"
            description="Keep track of upcoming examinations."
            button="+ Add Exam"
            onAdd={() => setModal('exam')}
          >
            {exams.length === 0 ? (
              <EmptyState text="No exams added yet." />
            ) : (
              exams.map(exam => (
                <div
                  className="data-row"
                  key={exam.id}
                >
                  <div>
                    <strong>{exam.title}</strong>

                    <span>
                      {exam.subject ||
                        'No subject'}{' '}
                      ·{' '}
                      {exam.exam_date ||
                        'No date'}
                    </span>
                  </div>

                  <button
                    className="delete-button"
                    onClick={() =>
                      deleteItem(
                        'exam',
                        exam.id
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </ResourcePage>
        )}

        {!loading && page === 'Notes' && (
          <ResourcePage
            title="Notes"
            description="Keep your study notes organized."
            button="+ Add Note"
            onAdd={() => setModal('note')}
          >
            {notes.length === 0 ? (
              <EmptyState text="No notes added yet." />
            ) : (
              <div className="notes-grid">
                {notes.map(note => (
                  <div
                    className="note-card"
                    key={note.id}
                  >
                    <span>📒</span>

                    <h3>{note.title}</h3>

                    <p>{note.content}</p>

                    <button
                      className="delete-button"
                      onClick={() =>
                        deleteItem(
                          'note',
                          note.id
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </ResourcePage>
        )}

        {!loading && page === 'Expenses' && (
          <ResourcePage
            title="Expenses"
            description="Track your student spending."
            button="+ Add Expense"
            onAdd={() => setModal('expense')}
          >
            <div className="expense-total">
              <span>Total expenses</span>

              <strong>
                ₹
                {expenses
                  .reduce(
                    (sum, item) =>
                      sum +
                      Number(
                        item.amount || 0
                      ),
                    0
                  )
                  .toFixed(2)}
              </strong>
            </div>

            {expenses.length === 0 ? (
              <EmptyState text="No expenses added yet." />
            ) : (
              expenses.map(expense => (
                <div
                  className="data-row"
                  key={expense.id}
                >
                  <div>
                    <strong>
                      {expense.title}
                    </strong>

                    <span>
                      {expense.category ||
                        'Other'}{' '}
                      ·{' '}
                      {expense.expense_date ||
                        'No date'}
                    </span>
                  </div>

                  <strong>
                    ₹
                    {Number(
                      expense.amount
                    ).toFixed(2)}
                  </strong>

                  <button
                    className="delete-button"
                    onClick={() =>
                      deleteItem(
                        'expense',
                        expense.id
                      )
                    }
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </ResourcePage>
        )}
      </main>

      {modal && (
        <Modal
          type={modal}
          onClose={() => setModal(null)}
          onSubmit={data =>
            addItem(modal, data)
          }
          subjects={subjects}
        />
      )}
    </div>
  )
}

function ResourcePage({
  title,
  description,
  button,
  onAdd,
  children,
}) {
  return (
    <>
      <PageHeader
        title={title}
        description={description}
        button={button}
        onClick={onAdd}
      />

      <div className="panel">
        {children}
      </div>
    </>
  )
}

function PageHeader({
  title,
  description,
  button,
  onClick,
}) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      {button && (
        <button
          className="primary-button"
          onClick={onClick}
        >
          {button}
        </button>
      )}
    </header>
  )
}

function Panel({
  title,
  subtitle,
  action,
  onAction,
  children,
}) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        {action && (
          <button onClick={onAction}>
            {action}
          </button>
        )}
      </div>

      {children}
    </div>
  )
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <div className="stat-icon">
          {icon}
        </div>
      </div>

      <strong className="stat-value">
        {value}
      </strong>

      <h3>{title}</h3>

      <p>{subtitle}</p>
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <div className="empty">
      <div>📭</div>

      <h3>{text}</h3>

      <p>Add something to see it here.</p>
    </div>
  )
}

function Modal({
  type,
  onClose,
  onSubmit,
  subjects,
}) {
  const [form, setForm] = useState({
    priority: 'medium',
  })

  const configs = {
    subject: {
      title: 'Add Subject',
      fields: [
        ['name', 'Subject name', 'text', true],
        ['teacher', 'Teacher', 'text', false],
      ],
    },

    task: {
      title: 'Add Task',
      fields: [
        ['title', 'Task title', 'text', true],
        ['description', 'Description', 'text', false],
        ['due', 'Due date', 'date', false],
      ],
    },

    class: {
      title: 'Add Class',
      fields: [
        ['subject', 'Subject', 'text', true],
        ['start', 'Start time', 'time', true],
        ['end', 'End time', 'time', true],
        ['room', 'Room', 'text', false],
      ],
    },

    attendance: {
      title: 'Add Attendance',
      fields: [
        ['subjectId', 'Subject ID', 'number', true],
        ['held', 'Classes held', 'number', true],
        ['attended', 'Classes attended', 'number', true],
      ],
    },

    exam: {
      title: 'Add Exam',
      fields: [
        ['title', 'Exam title', 'text', true],
        ['subject', 'Subject', 'text', true],
        ['date', 'Exam date', 'date', true],
      ],
    },

    note: {
      title: 'Add Note',
      fields: [
        ['title', 'Note title', 'text', true],
        ['content', 'Content', 'textarea', true],
        ['subject', 'Subject', 'text', false],
      ],
    },

    expense: {
      title: 'Add Expense',
      fields: [
        ['title', 'Expense title', 'text', true],
        ['amount', 'Amount', 'number', true],
        ['category', 'Category', 'text', false],
        ['date', 'Date', 'date', true],
      ],
    },
  }

  const config = configs[type]

  function update(key, value) {
    setForm(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  function submit(e) {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={onClose}
    >
      <div
        className="modal"
        onMouseDown={e =>
          e.stopPropagation()
        }
      >
        <div className="modal-header">
          <h2>{config.title}</h2>

          <button onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={submit}>
          {config.fields.map(
            ([key, label, inputType, required]) => (
              <label key={key}>
                {label}

                {inputType ===
                'textarea' ? (
                  <textarea
                    value={form[key] || ''}
                    onChange={e =>
                      update(
                        key,
                        e.target.value
                      )
                    }
                    required={required}
                  />
                ) : type ===
                    'attendance' &&
                  key === 'subjectId' ? (
                  <select
                    value={form[key] || ''}
                    onChange={e =>
                      update(
                        key,
                        e.target.value
                      )
                    }
                    required={required}
                  >
                    <option value="">
                      Select subject
                    </option>

                    {subjects.map(
                      subject => (
                        <option
                          key={
                            subject.id
                          }
                          value={
                            subject.id
                          }
                        >
                          {subject.name}
                        </option>
                      )
                    )}
                  </select>
                ) : type ===
                    'class' &&
                  key === 'subject' ? (
                  <select
                    value={form[key] || ''}
                    onChange={e =>
                      update(
                        key,
                        e.target.value
                      )
                    }
                    required={required}
                  >
                    <option value="">
                      Select subject
                    </option>

                    {subjects.map(
                      subject => (
                        <option
                          key={
                            subject.id
                          }
                          value={
                            subject.name
                          }
                        >
                          {subject.name}
                        </option>
                      )
                    )}
                  </select>
                ) : type ===
                    'exam' &&
                  key === 'subject' ? (
                  <select
                    value={form[key] || ''}
                    onChange={e =>
                      update(
                        key,
                        e.target.value
                      )
                    }
                    required={required}
                  >
                    <option value="">
                      Select subject
                    </option>

                    {subjects.map(
                      subject => (
                        <option
                          key={
                            subject.id
                          }
                          value={
                            subject.name
                          }
                        >
                          {subject.name}
                        </option>
                      )
                    )}
                  </select>
                ) : type ===
                    'note' &&
                  key === 'subject' ? (
                  <select
                    value={form[key] || ''}
                    onChange={e =>
                      update(
                        key,
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      No subject
                    </option>

                    {subjects.map(
                      subject => (
                        <option
                          key={
                            subject.id
                          }
                          value={
                            subject.name
                          }
                        >
                          {subject.name}
                        </option>
                      )
                    )}
                  </select>
                ) : (
                  <input
                    type={inputType}
                    value={form[key] || ''}
                    onChange={e =>
                      update(
                        key,
                        e.target.value
                      )
                    }
                    required={required}
                  />
                )}
              </label>
            )
          )}

          {type === 'task' && (
            <label>
              Priority

              <select
                value={form.priority}
                onChange={e =>
                  update(
                    'priority',
                    e.target.value
                  )
                }
              >
                <option value="low">
                  Low
                </option>

                <option value="medium">
                  Medium
                </option>

                <option value="high">
                  High
                </option>
              </select>
            </label>
          )}

          {type === 'class' && (
            <label>
              Day

              <select
                value={form.day || ''}
                onChange={e =>
                  update(
                    'day',
                    e.target.value
                  )
                }
                required
              >
                <option value="">
                  Select day
                </option>

                <option value="Monday">
                  Monday
                </option>

                <option value="Tuesday">
                  Tuesday
                </option>

                <option value="Wednesday">
                  Wednesday
                </option>

                <option value="Thursday">
                  Thursday
                </option>

                <option value="Friday">
                  Friday
                </option>

                <option value="Saturday">
                  Saturday
                </option>
              </select>
            </label>
          )}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default App