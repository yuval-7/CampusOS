from datetime import date, time
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import get_db_connection


app = FastAPI(title="CampusOS API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------
# MODELS
# -------------------------

class SubjectCreate(BaseModel):
    name: str
    teacher: Optional[str] = None


class TimetableCreate(BaseModel):
    subject_id: int
    day: str
    start_time: time
    end_time: time
    room: Optional[str] = None


class AttendanceCreate(BaseModel):
    subject_id: int
    classes_held: int = 0
    classes_attended: int = 0


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[date] = None
    priority: str = "medium"
    completed: bool = False


class ExamCreate(BaseModel):
    subject_id: int
    title: str
    exam_date: date
    description: Optional[str] = None


class NoteCreate(BaseModel):
    title: str
    content: Optional[str] = None
    subject_id: Optional[int] = None


class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category: Optional[str] = None
    expense_date: date
    notes: Optional[str] = None


# -------------------------
# HELPERS
# -------------------------

def fetch_all(query, params=()):
    connection = get_db_connection()

    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, params)
        return cursor.fetchall()
    finally:
        cursor.close()
        connection.close()


def execute_query(query, params=()):
    connection = get_db_connection()

    try:
        cursor = connection.cursor()
        cursor.execute(query, params)
        connection.commit()
        return cursor.lastrowid
    finally:
        cursor.close()
        connection.close()


def delete_query(query, params=()):
    connection = get_db_connection()

    try:
        cursor = connection.cursor()
        cursor.execute(query, params)
        connection.commit()
    finally:
        cursor.close()
        connection.close()


# -------------------------
# BASIC
# -------------------------

@app.get("/")
def root():
    return {
        "message": "CampusOS API is running"
    }


@app.get("/db-test")
def db_test():
    connection = get_db_connection()

    try:
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()

        return {
            "database": "connected",
            "result": result[0],
        }
    finally:
        cursor.close()
        connection.close()


# -------------------------
# SUBJECTS
# -------------------------

@app.get("/subjects")
def get_subjects():
    return fetch_all(
        """
        SELECT id, name, teacher, created_at
        FROM subjects
        ORDER BY id DESC
        """
    )


@app.post("/subjects")
def create_subject(subject: SubjectCreate):
    subject_id = execute_query(
        """
        INSERT INTO subjects (name, teacher)
        VALUES (%s, %s)
        """,
        (subject.name, subject.teacher),
    )

    return {
        "id": subject_id,
        "message": "Subject created",
    }


@app.delete("/subjects/{subject_id}")
def delete_subject(subject_id: int):
    # Remove records connected to this subject first
    delete_query("DELETE FROM timetable WHERE subject_id = %s", (subject_id,))
    delete_query("DELETE FROM attendance WHERE subject_id = %s", (subject_id,))
    delete_query("DELETE FROM exams WHERE subject_id = %s", (subject_id,))
    delete_query("DELETE FROM notes WHERE subject_id = %s", (subject_id,))

    # Now remove the subject itself
    delete_query("DELETE FROM subjects WHERE id = %s", (subject_id,))

    return {"message": "Subject deleted"}


# -------------------------
# TIMETABLE
# -------------------------

@app.get("/timetable")
def get_timetable():
    return fetch_all(
        """
        SELECT
            timetable.id,
            timetable.subject_id,
            subjects.name AS subject,
            timetable.day,
            timetable.start_time,
            timetable.end_time,
            timetable.room
        FROM timetable
        JOIN subjects
            ON timetable.subject_id = subjects.id
        ORDER BY
            FIELD(
                timetable.day,
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
                'Sunday'
            ),
            timetable.start_time
        """
    )


@app.post("/timetable")
def create_timetable(item: TimetableCreate):
    timetable_id = execute_query(
        """
        INSERT INTO timetable
            (subject_id, day, start_time, end_time, room)
        VALUES
            (%s, %s, %s, %s, %s)
        """,
        (
            item.subject_id,
            item.day,
            item.start_time,
            item.end_time,
            item.room,
        ),
    )

    return {
        "id": timetable_id,
        "message": "Class created",
    }


@app.delete("/timetable/{timetable_id}")
def delete_timetable(timetable_id: int):
    delete_query(
        "DELETE FROM timetable WHERE id = %s",
        (timetable_id,),
    )

    return {
        "message": "Class deleted"
    }


# -------------------------
# ATTENDANCE
# -------------------------

@app.get("/attendance")
def get_attendance():
    return fetch_all(
        """
        SELECT
            attendance.id,
            attendance.subject_id,
            subjects.name AS subject,
            attendance.classes_held,
            attendance.classes_attended
        FROM attendance
        JOIN subjects
            ON attendance.subject_id = subjects.id
        ORDER BY attendance.id DESC
        """
    )


@app.post("/attendance")
def create_attendance(item: AttendanceCreate):
    attendance_id = execute_query(
        """
        INSERT INTO attendance
            (subject_id, classes_held, classes_attended)
        VALUES
            (%s, %s, %s)
        """,
        (
            item.subject_id,
            item.classes_held,
            item.classes_attended,
        ),
    )

    return {
        "id": attendance_id,
        "message": "Attendance record created",
    }


@app.delete("/attendance/{attendance_id}")
def delete_attendance(attendance_id: int):
    delete_query(
        "DELETE FROM attendance WHERE id = %s",
        (attendance_id,),
    )

    return {
        "message": "Attendance record deleted"
    }


# -------------------------
# TASKS
# -------------------------

@app.get("/tasks")
def get_tasks():
    return fetch_all(
        """
        SELECT
            id,
            title,
            description,
            due_date,
            priority,
            completed,
            created_at
        FROM tasks
        ORDER BY
            completed ASC,
            due_date ASC,
            id DESC
        """
    )


@app.post("/tasks")
def create_task(item: TaskCreate):
    task_id = execute_query(
        """
        INSERT INTO tasks
            (title, description, due_date, priority, completed)
        VALUES
            (%s, %s, %s, %s, %s)
        """,
        (
            item.title,
            item.description,
            item.due_date,
            item.priority,
            item.completed,
        ),
    )

    return {
        "id": task_id,
        "message": "Task created",
    }


@app.put("/tasks/{task_id}/toggle")
def toggle_task(task_id: int):
    execute_query(
        """
        UPDATE tasks
        SET completed = NOT completed
        WHERE id = %s
        """,
        (task_id,),
    )

    return {
        "message": "Task updated"
    }


@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    delete_query(
        "DELETE FROM tasks WHERE id = %s",
        (task_id,),
    )

    return {
        "message": "Task deleted"
    }


# -------------------------
# EXAMS
# -------------------------

@app.get("/exams")
def get_exams():
    return fetch_all(
        """
        SELECT
            exams.id,
            exams.subject_id,
            subjects.name AS subject,
            exams.title,
            exams.exam_date,
            exams.description
        FROM exams
        JOIN subjects
            ON exams.subject_id = subjects.id
        ORDER BY exams.exam_date ASC
        """
    )


@app.post("/exams")
def create_exam(item: ExamCreate):
    exam_id = execute_query(
        """
        INSERT INTO exams
            (subject_id, title, exam_date, description)
        VALUES
            (%s, %s, %s, %s)
        """,
        (
            item.subject_id,
            item.title,
            item.exam_date,
            item.description,
        ),
    )

    return {
        "id": exam_id,
        "message": "Exam created",
    }


@app.delete("/exams/{exam_id}")
def delete_exam(exam_id: int):
    delete_query(
        "DELETE FROM exams WHERE id = %s",
        (exam_id,),
    )

    return {
        "message": "Exam deleted"
    }


# -------------------------
# NOTES
# -------------------------

@app.get("/notes")
def get_notes():
    return fetch_all(
        """
        SELECT
            notes.id,
            notes.title,
            notes.content,
            notes.subject_id,
            subjects.name AS subject,
            notes.created_at
        FROM notes
        LEFT JOIN subjects
            ON notes.subject_id = subjects.id
        ORDER BY notes.id DESC
        """
    )


@app.post("/notes")
def create_note(item: NoteCreate):
    note_id = execute_query(
        """
        INSERT INTO notes
            (title, content, subject_id)
        VALUES
            (%s, %s, %s)
        """,
        (
            item.title,
            item.content,
            item.subject_id,
        ),
    )

    return {
        "id": note_id,
        "message": "Note created",
    }


@app.delete("/notes/{note_id}")
def delete_note(note_id: int):
    delete_query(
        "DELETE FROM notes WHERE id = %s",
        (note_id,),
    )

    return {
        "message": "Note deleted"
    }


# -------------------------
# EXPENSES
# -------------------------

@app.get("/expenses")
def get_expenses():
    return fetch_all(
        """
        SELECT
            id,
            title,
            amount,
            category,
            expense_date,
            notes
        FROM expenses
        ORDER BY expense_date DESC, id DESC
        """
    )


@app.post("/expenses")
def create_expense(item: ExpenseCreate):
    expense_id = execute_query(
        """
        INSERT INTO expenses
            (title, amount, category, expense_date, notes)
        VALUES
            (%s, %s, %s, %s, %s)
        """,
        (
            item.title,
            item.amount,
            item.category,
            item.expense_date,
            item.notes,
        ),
    )

    return {
        "id": expense_id,
        "message": "Expense created",
    }


@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int):
    delete_query(
        "DELETE FROM expenses WHERE id = %s",
        (expense_id,),
    )

    return {
        "message": "Expense deleted"
    }