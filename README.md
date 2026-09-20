# CampusOS 🎓

**CampusOS** is a full-stack student productivity and campus management dashboard designed to keep academics, schedules, tasks, exams, notes, attendance, and expenses organized in one place.

🌐 **Live App:** https://campus-os-drab.vercel.app/
💻 **GitHub:** https://github.com/yuval-7/CampusOS

---

## ✨ Features

### 📊 Dashboard

A central overview of your campus life, including:

* Today's classes
* Upcoming exams
* Pending tasks
* Attendance information
* Recent notes
* Expense tracking

### 📚 Subjects

Manage your subjects and teachers.

### 🗓️ Timetable

Create and manage your weekly class schedule with:

* Subject
* Day
* Start and end time
* Room

### ✅ Tasks

Keep track of assignments and other tasks with:

* Title
* Description
* Due date
* Priority
* Completion status

### 📈 Attendance

Store attendance records for each subject.

### 📝 Exams

Manage upcoming exams with:

* Subject
* Exam title
* Exam date
* Description

### 📖 Notes

Create and organize notes, optionally associated with a subject.

### 💰 Expenses

Track student expenses with:

* Amount
* Category
* Date
* Notes

---

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* JavaScript
* CSS
* Vercel

### Backend

* Python
* FastAPI
* Pydantic
* Uvicorn
* Vercel

### Database

* MySQL
* Aiven

### Development & Deployment

* Git
* GitHub
* Vercel

---

## 🏗️ Architecture

```text
┌─────────────────────────┐
│       React + Vite      │
│        Frontend         │
│         Vercel          │
└────────────┬────────────┘
             │
             │ REST API
             ▼
┌─────────────────────────┐
│       FastAPI           │
│        Backend          │
│         Vercel          │
└────────────┬────────────┘
             │
             │ MySQL
             ▼
┌─────────────────────────┐
│       MySQL Database    │
│         Aiven           │
└─────────────────────────┘
```

---

## 📁 Project Structure

```text
CampusOS/
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── requirements.txt
│   ├── .gitignore
│   └── ...
│
└── README.md
```

---

## 🚀 Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/yuval-7/CampusOS.git
cd CampusOS
```

---

### 2. Set up the backend

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```powershell
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

### 3. Configure environment variables

Create a file called:

```text
backend/.env
```

Add your database configuration:

```env
DB_HOST=your_mysql_host
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=campusos
```

> Never commit your `.env` file or database credentials to GitHub.

---

### 4. Start the backend

From the `backend` directory:

```bash
uvicorn main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

You can check it with:

```text
http://127.0.0.1:8000/
```

---

### 5. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite will provide a local URL, usually:

```text
http://localhost:5173
```

---

## 🔌 API Endpoints

CampusOS provides REST endpoints for the main resources.

| Resource   | GET | POST | DELETE |
| ---------- | :-: | :--: | :----: |
| Subjects   |  ✅  |   ✅  |    ✅   |
| Timetable  |  ✅  |   ✅  |    ✅   |
| Attendance |  ✅  |   ✅  |    ✅   |
| Tasks      |  ✅  |   ✅  |    ✅   |
| Exams      |  ✅  |   ✅  |    ✅   |
| Notes      |  ✅  |   ✅  |    ✅   |
| Expenses   |  ✅  |   ✅  |    ✅   |

Tasks also support:

```text
PUT /tasks/{task_id}/toggle
```

Additional health endpoints:

```text
GET /
GET /db-test
```

---

## 🗄️ Database

CampusOS uses MySQL with the following main tables:

```text
subjects
timetable
attendance
tasks
exams
notes
expenses
```

The backend connects to MySQL using environment variables, keeping database credentials out of the source code.

---

## 🌐 Deployment

CampusOS is deployed using:

* **Frontend:** Vercel
* **Backend:** Vercel
* **Database:** Aiven MySQL

### Production

**Frontend**

https://campus-os-drab.vercel.app/

**Backend**

https://campus-os-99x6.vercel.app/

---

## 🔐 Security

Sensitive configuration is stored using environment variables rather than being committed to Git.

The repository ignores:

```text
.env
.venv/
__pycache__/
*.pyc
```

Database passwords and other credentials should never be committed to the repository.

---

## 🔮 Future Improvements

Some ideas for future versions:

* 🔐 User authentication
* 👤 Individual student accounts
* 📱 Improved mobile experience
* 📅 Calendar integration
* 🔔 Task and exam reminders
* 📊 More detailed attendance analytics
* 📈 Academic performance tracking
* 🔎 Search and filtering
* 🎨 Custom themes
* 📚 File attachments for notes
* 📤 Data export

---

## 🎯 Why CampusOS?

Students often have their schedules, assignments, exams, notes, attendance, and expenses spread across multiple apps.

CampusOS brings those everyday student-management tasks into one centralized dashboard.

**One campus. One dashboard. One place to stay organized.**

---

## 👨‍💻 Built With

Built as a Hack Club project using modern full-stack web technologies.

Made with React, FastAPI, MySQL, GitHub, and Vercel. 🚀

---

## 📄 License

This project is currently intended as a personal/student project.
