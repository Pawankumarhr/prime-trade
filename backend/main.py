from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, List
import httpx
import os
import logging
from dotenv import load_dotenv

load_dotenv()

# Logging setup
os.makedirs("logs", exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("logs/app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Config
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://uklatcuqwynnqszxfegz.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbGF0Y3Vxd3lubnFzenhmZWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NTE1ODIsImV4cCI6MjA4MDMyNzU4Mn0.bsU5Ll_5pz8nDjJ-gdFNA681iSyRW83SL1P8ksjMemg")
JWT_SECRET = os.getenv("JWT_SECRET", "8Zv6ujTX31+OyGU+p8AvEIbac521EAiTHbdPwkOWhItiPh7OkBHlMFCEqdEAIM38Z0bqFni2MyLKn0a58xclIA==")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# FastAPI App
app = FastAPI(title="Prime Trade API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Pydantic Models
class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: str

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    status: Optional[str] = "pending"
    priority: Optional[str] = "medium"
    due_date: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None

class TaskResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str]
    status: str
    priority: str
    due_date: Optional[str]
    created_at: str
    updated_at: str
    completed_at: Optional[str]

# Helper Functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Supabase helper
async def supabase_request(method: str, endpoint: str, data: dict = None, params: dict = None):
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    
    async with httpx.AsyncClient() as client:
        if method == "GET":
            response = await client.get(url, headers=headers, params=params)
        elif method == "POST":
            response = await client.post(url, headers=headers, json=data)
        elif method == "PATCH":
            response = await client.patch(url, headers=headers, json=data, params=params)
        elif method == "DELETE":
            response = await client.delete(url, headers=headers, params=params)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        if response.status_code >= 400:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
        if response.text:
            return response.json()
        return None

# ==================== AUTH ROUTES ====================

@app.post("/api/auth/signup")
async def signup(user: UserSignup):
    logger.info(f"Signup attempt for email: {user.email}")
    # Check if user exists
    existing = await supabase_request("GET", "users", params={"email": f"eq.{user.email}", "select": "id"})
    if existing:
        logger.warning(f"Signup failed - email already exists: {user.email}")
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    password_hash = hash_password(user.password)
    new_user = await supabase_request("POST", "users", data={
        "name": user.name,
        "email": user.email,
        "password_hash": password_hash
    })
    
    if not new_user:
        logger.error(f"Signup failed - database error for: {user.email}")
        raise HTTPException(status_code=500, detail="Failed to create user")
    
    user_data = new_user[0]
    token = create_token(user_data["id"])
    
    logger.info(f"Signup successful for: {user.email} (id: {user_data['id']})")
    return {
        "token": token,
        "user": {
            "id": user_data["id"],
            "name": user_data["name"],
            "email": user_data["email"],
            "created_at": user_data["created_at"]
        }
    }

@app.post("/api/auth/login")
async def login(credentials: UserLogin):
    logger.info(f"Login attempt for email: {credentials.email}")
    # Find user
    users = await supabase_request("GET", "users", params={"email": f"eq.{credentials.email}", "select": "*"})
    if not users:
        logger.warning(f"Login failed - user not found: {credentials.email}")
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user = users[0]
    if not verify_password(credentials.password, user["password_hash"]):
        logger.warning(f"Login failed - wrong password: {credentials.email}")
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user["id"])
    
    logger.info(f"Login successful for: {credentials.email} (id: {user['id']})")
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "created_at": user["created_at"]
        }
    }

@app.get("/api/auth/me")
async def get_current_user(user_id: str = Depends(verify_token)):
    users = await supabase_request("GET", "users", params={"id": f"eq.{user_id}", "select": "id,name,email,created_at"})
    if not users:
        raise HTTPException(status_code=404, detail="User not found")
    return users[0]

# ==================== TASK ROUTES ====================

@app.get("/api/tasks")
async def get_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    user_id: str = Depends(verify_token)
):
    params = {"user_id": f"eq.{user_id}", "select": "*", "order": "created_at.desc"}
    
    if status:
        params["status"] = f"eq.{status}"
    if priority:
        params["priority"] = f"eq.{priority}"
    if search:
        params["title"] = f"ilike.%{search}%"
    
    tasks = await supabase_request("GET", "tasks", params=params)
    return tasks or []

@app.post("/api/tasks")
async def create_task(task: TaskCreate, user_id: str = Depends(verify_token)):
    logger.info(f"Creating task for user: {user_id} - title: {task.title}")
    task_data = {
        "user_id": user_id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "due_date": task.due_date
    }
    
    new_task = await supabase_request("POST", "tasks", data=task_data)
    if not new_task:
        logger.error(f"Failed to create task for user: {user_id}")
        raise HTTPException(status_code=500, detail="Failed to create task")
    
    logger.info(f"Task created: {new_task[0]['id']} for user: {user_id}")
    return new_task[0]

@app.get("/api/tasks/{task_id}")
async def get_task(task_id: str, user_id: str = Depends(verify_token)):
    tasks = await supabase_request("GET", "tasks", params={
        "id": f"eq.{task_id}",
        "user_id": f"eq.{user_id}",
        "select": "*"
    })
    if not tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    return tasks[0]

@app.patch("/api/tasks/{task_id}")
async def update_task(task_id: str, task: TaskUpdate, user_id: str = Depends(verify_token)):
    logger.info(f"Updating task: {task_id} for user: {user_id}")
    update_data = {k: v for k, v in task.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    # Set completed_at if status is done
    if task.status == "done":
        update_data["completed_at"] = datetime.utcnow().isoformat()
    elif task.status and task.status != "done":
        update_data["completed_at"] = None
    
    updated = await supabase_request("PATCH", "tasks", data=update_data, params={
        "id": f"eq.{task_id}",
        "user_id": f"eq.{user_id}"
    })
    
    if not updated:
        logger.warning(f"Task not found: {task_id} for user: {user_id}")
        raise HTTPException(status_code=404, detail="Task not found")
    
    logger.info(f"Task updated: {task_id}")
    return updated[0]

@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: str, user_id: str = Depends(verify_token)):
    logger.info(f"Deleting task: {task_id} for user: {user_id}")
    await supabase_request("DELETE", "tasks", params={
        "id": f"eq.{task_id}",
        "user_id": f"eq.{user_id}"
    })
    logger.info(f"Task deleted: {task_id}")
    return {"message": "Task deleted"}

# ==================== ANALYTICS ROUTES ====================

@app.get("/api/analytics")
async def get_analytics(user_id: str = Depends(verify_token)):
    tasks = await supabase_request("GET", "tasks", params={
        "user_id": f"eq.{user_id}",
        "select": "*"
    })
    
    if not tasks:
        tasks = []
    
    today = datetime.utcnow().date()
    week_start = today - timedelta(days=today.weekday())
    
    total = len(tasks)
    done = len([t for t in tasks if t["status"] == "done"])
    in_progress = len([t for t in tasks if t["status"] == "in-progress"])
    pending = len([t for t in tasks if t["status"] == "pending"])
    
    # Overdue tasks
    overdue = 0
    for t in tasks:
        if t["due_date"] and t["status"] != "done":
            due = datetime.fromisoformat(t["due_date"]).date()
            if due < today:
                overdue += 1
    
    # Tasks completed today
    done_today = 0
    for t in tasks:
        if t["completed_at"]:
            completed = datetime.fromisoformat(t["completed_at"].replace("Z", "")).date()
            if completed == today:
                done_today += 1
    
    # Tasks completed this week
    done_this_week = 0
    for t in tasks:
        if t["completed_at"]:
            completed = datetime.fromisoformat(t["completed_at"].replace("Z", "")).date()
            if completed >= week_start:
                done_this_week += 1
    
    # Priority breakdown
    high = len([t for t in tasks if t["priority"] == "high"])
    medium = len([t for t in tasks if t["priority"] == "medium"])
    low = len([t for t in tasks if t["priority"] == "low"])
    
    # Completion rate
    completion_rate = round((done / total * 100) if total > 0 else 0, 1)
    
    return {
        "total_tasks": total,
        "completed_tasks": done,
        "in_progress": in_progress,
        "pending": pending,
        "overdue": overdue,
        "done_today": done_today,
        "done_this_week": done_this_week,
        "completion_rate": completion_rate,
        "priority_breakdown": {"high": high, "medium": medium, "low": low},
        "status_breakdown": {"pending": pending, "in-progress": in_progress, "done": done}
    }

@app.get("/api/insights")
async def get_insights(user_id: str = Depends(verify_token)):
    analytics = await get_analytics(user_id)
    
    insights = []
    suggestion = ""
    
    if analytics["done_this_week"] > 0:
        insights.append(f"🎉 You completed {analytics['done_this_week']} tasks this week!")
    
    if analytics["overdue"] > 0:
        insights.append(f"⚠️ You have {analytics['overdue']} overdue tasks. Consider prioritizing them.")
        suggestion = "Focus on completing overdue tasks first to stay on track."
    
    if analytics["completion_rate"] >= 70:
        insights.append(f"🚀 Great job! Your completion rate is {analytics['completion_rate']}%!")
        suggestion = "Keep up the momentum! You're doing great."
    elif analytics["completion_rate"] >= 50:
        insights.append(f"💪 Keep going! Your completion rate is {analytics['completion_rate']}%.")
        suggestion = "Try to complete a few more tasks to boost your productivity."
    elif analytics["total_tasks"] > 0:
        insights.append(f"📈 Your completion rate is {analytics['completion_rate']}%. Let's improve it!")
        suggestion = "Start with smaller tasks to build momentum."
    
    if analytics["priority_breakdown"]["high"] > analytics["priority_breakdown"]["medium"] + analytics["priority_breakdown"]["low"]:
        insights.append("🔥 Most of your tasks are high priority. You're ambitious!")
    
    if analytics["done_today"] > 0:
        insights.append(f"✅ You've completed {analytics['done_today']} tasks today!")
    
    if not insights:
        insights.append("📝 Start adding tasks to see insights!")
        suggestion = "Create your first task to get started!"
    
    # Calculate due this week
    tasks = await supabase_request("GET", "tasks", params={
        "user_id": f"eq.{user_id}",
        "select": "*"
    })
    
    today = datetime.utcnow().date()
    week_end = today + timedelta(days=(6 - today.weekday()))
    due_this_week = 0
    for t in (tasks or []):
        if t["due_date"] and t["status"] != "done":
            due = datetime.fromisoformat(t["due_date"]).date()
            if today <= due <= week_end:
                due_this_week += 1
    
    return {
        "insights": insights,
        "suggestion": suggestion,
        "completion_rate": analytics["completion_rate"],
        "overdue_count": analytics["overdue"],
        "due_this_week": due_this_week
    }

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
