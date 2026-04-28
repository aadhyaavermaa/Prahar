from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import json
import os
import uuid
from datetime import datetime
import google.generativeai as genai
from dotenv import load_dotenv
import os

# Import matching system modules
from matching_routes import matching_router

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

load_dotenv()

app = FastAPI(title="PRAHAR API")

# Include the matching system router
app.include_router(matching_router)

# Allow React frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)

# In-memory storage for demo (replace with Firestore later)
tasks_db = []
volunteers_db = []

# Load zones from JSON file
def load_zones():
    with open("zones.json", "r") as f:
        data = json.load(f)
    return data["zones"]

# Seed some demo tasks on startup
def seed_tasks():
    demo_tasks = [
        {
            "id": str(uuid.uuid4()),
            "title": "Yamuna Ghat 7 Cleanup Drive",
            "description": "Emergency cleanup needed at Ghat 7. High plastic waste accumulation detected via satellite.",
            "zone": "zone_001",
            "zone_name": "Yamuna Bank Ghat 7",
            "skills_needed": ["Physical Labor", "Photography"],
            "date": "2026-04-21",
            "volunteers_needed": 15,
            "volunteers_assigned": [],
            "status": "open",
            "priority": "high",
            "points_reward": 150,
            "created_by": "ngo_demo",
            "created_at": datetime.now().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Mask Distribution — Anand Vihar",
            "description": "AQI critical in Anand Vihar. Distribute N95 masks to residents near the bus terminal.",
            "zone": "zone_003",
            "zone_name": "Anand Vihar",
            "skills_needed": ["Event Management", "Social Media"],
            "date": "2026-04-20",
            "volunteers_needed": 12,
            "volunteers_assigned": [],
            "status": "open",
            "priority": "high",
            "points_reward": 120,
            "created_by": "ngo_demo",
            "created_at": datetime.now().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Food Surplus Redistribution — Lajpat Nagar",
            "description": "500kg surplus food available from weekend market. Needs volunteers to pack and deliver to 3 shelters.",
            "zone": "zone_007",
            "zone_name": "Lajpat Nagar",
            "skills_needed": ["Physical Labor", "Driving"],
            "date": "2026-04-22",
            "volunteers_needed": 7,
            "volunteers_assigned": [],
            "status": "open",
            "priority": "medium",
            "points_reward": 100,
            "created_by": "ngo_demo",
            "created_at": datetime.now().isoformat()
        }
    ]
    tasks_db.extend(demo_tasks)

seed_tasks()

# ─────────────────────────────────────────
# MODELS
# ─────────────────────────────────────────

class TaskCreate(BaseModel):
    title: str
    description: str
    zone: str
    zone_name: str
    skills_needed: list[str]
    date: str
    volunteers_needed: int
    priority: str
    points_reward: int
    created_by: str

class VolunteerCreate(BaseModel):
    id: str
    fullName: str
    location: str
    skills: list[str]
    availability: str
    causes: list[str]
    bio: str = ""

# ─────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "message": "PRAHAR backend is running"}

# ─────────────────────────────────────────
# ZONES
# ─────────────────────────────────────────

@app.get("/api/zones")
def get_zones():
    zones = load_zones()
    return {"zones": zones}

@app.get("/api/zones/{zone_id}")
def get_zone(zone_id: str):
    zones = load_zones()
    zone = next((z for z in zones if z["id"] == zone_id), None)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return zone

# ─────────────────────────────────────────
# TASKS
# ─────────────────────────────────────────

@app.get("/api/tasks")
def get_tasks(status: str = None, zone: str = None):
    filtered = tasks_db
    if status:
        filtered = [t for t in filtered if t["status"] == status]
    if zone:
        filtered = [t for t in filtered if t["zone"] == zone]
    return {"tasks": filtered}

@app.post("/api/tasks")
def create_task(task: TaskCreate):
    new_task = {
        "id": str(uuid.uuid4()),
        **task.model_dump(),
        "volunteers_assigned": [],
        "status": "open",
        "created_at": datetime.now().isoformat()
    }
    tasks_db.append(new_task)
    return {"message": "Task created", "task": new_task}

@app.post("/api/tasks/{task_id}/assign")
def assign_volunteer(task_id: str, volunteer_id: str):
    task = next((t for t in tasks_db if t["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if volunteer_id in task["volunteers_assigned"]:
        raise HTTPException(status_code=400, detail="Already assigned")
    if len(task["volunteers_assigned"]) >= task["volunteers_needed"]:
        raise HTTPException(status_code=400, detail="Task is full")
    task["volunteers_assigned"].append(volunteer_id)
    if len(task["volunteers_assigned"]) >= task["volunteers_needed"]:
        task["status"] = "in_progress"
    return {"message": "Assigned successfully", "task": task}

@app.get("/api/tasks/ngo/{ngo_id}")
def get_ngo_tasks(ngo_id: str):
    ngo_tasks = [t for t in tasks_db if t["created_by"] == ngo_id]
    return {"tasks": ngo_tasks}

# ─────────────────────────────────────────
# VOLUNTEERS
# ─────────────────────────────────────────

@app.get("/api/volunteers")
def get_volunteers():
    return {"volunteers": volunteers_db}

@app.get("/api/volunteers/{volunteer_id}")
def get_volunteer(volunteer_id: str):
    vol = next((v for v in volunteers_db if v["id"] == volunteer_id), None)
    if not vol:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    return vol

@app.post("/api/volunteers")
def add_volunteer(volunteer: VolunteerCreate):
    existing = next((v for v in volunteers_db if v["id"] == volunteer.id), None)
    if existing:
        volunteers_db.remove(existing)
    volunteers_db.append(volunteer.model_dump())
    return {"message": "Volunteer saved", "volunteer": volunteer}

# ─────────────────────────────────────────
# GEMINI AI MATCHING
# ─────────────────────────────────────────

@app.get("/api/match")
def match_volunteer_to_task(volunteer_id: str, task_id: str):
    volunteer = next((v for v in volunteers_db if v["id"] == volunteer_id), None)
    task = next((t for t in tasks_db if t["id"] == task_id), None)

    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    prompt = f"""
You are a volunteer matching system. Score how well this volunteer matches this task.

VOLUNTEER PROFILE:
- Name: {volunteer['fullName']}
- Location: {volunteer['location']}
- Skills: {', '.join(volunteer['skills'])}
- Availability: {volunteer['availability']}
- Causes they care about: {', '.join(volunteer['causes'])}

TASK DETAILS:
- Title: {task['title']}
- Description: {task['description']}
- Location/Zone: {task['zone_name']}
- Skills needed: {', '.join(task['skills_needed'])}
- Date: {task['date']}
- Priority: {task['priority']}

Respond in this exact format (no extra text):
SCORE: [number between 0 and 100]
REASONING: [one sentence explaining why]
RECOMMENDED: [YES or NO]
"""

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        text = response.text.strip()

        lines = text.split("\n")
        score = int(lines[0].replace("SCORE:", "").strip())
        reasoning = lines[1].replace("REASONING:", "").strip()
        recommended = lines[2].replace("RECOMMENDED:", "").strip() == "YES"

        return {
            "volunteer_id": volunteer_id,
            "task_id": task_id,
            "score": score,
            "reasoning": reasoning,
            "recommended": recommended
        }
    except Exception as e:
        return {
            "volunteer_id": volunteer_id,
            "task_id": task_id,
            "score": 75,
            "reasoning": "Good match based on skills and location alignment",
            "recommended": True,
            "note": "Gemini API not configured yet — showing demo score"
        }

@app.get("/api/tasks/{task_id}/recommendations")
def get_task_recommendations(task_id: str):
    task = next((t for t in tasks_db if t["id"] == task_id), None)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not volunteers_db:
        return {"task_id": task_id, "recommendations": []}

    results = []
    for vol in volunteers_db:
        skill_overlap = len(set(vol["skills"]) & set(task["skills_needed"]))
        score = min(100, 60 + (skill_overlap * 15))
        results.append({
            "volunteer": vol,
            "score": score,
            "recommended": score >= 70
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return {"task_id": task_id, "recommendations": results[:5]}

# ─────────────────────────────────────────
# WORKFORCE REDISTRIBUTION
# ─────────────────────────────────────────

@app.get("/api/redistribution")
def get_redistribution():
    zones = load_zones()
    analysis = []

    for zone in zones:
        demand = zone["volunteer_demand"]
        supply = zone["volunteers_available"]
        gap = demand - supply

        if gap > 5:
            status = "critical_shortage"
            message = f"Needs {gap} more volunteers urgently"
        elif gap > 0:
            status = "shortage"
            message = f"Needs {gap} more volunteers"
        elif gap < -3:
            status = "surplus"
            message = f"{abs(gap)} volunteers can be redirected elsewhere"
        else:
            status = "balanced"
            message = "Supply and demand balanced"

        analysis.append({
            "zone_id": zone["id"],
            "zone_name": zone["name"],
            "domain": zone["domain"],
            "volunteer_demand": demand,
            "volunteers_available": supply,
            "gap": gap,
            "status": status,
            "message": message
        })

    # Generate transfer suggestions
    shortage_zones = [z for z in analysis if z["status"] in ["critical_shortage", "shortage"]]
    surplus_zones = [z for z in analysis if z["status"] == "surplus"]

    suggestions = []
    for shortage in shortage_zones[:3]:
        for surplus in surplus_zones[:2]:
            transfer = min(abs(surplus["gap"]), shortage["gap"], 5)
            if transfer > 0:
                suggestions.append({
                    "from_zone": surplus["zone_name"],
                    "to_zone": shortage["zone_name"],
                    "volunteers_to_transfer": transfer,
                    "reason": f"{shortage['zone_name']} has a shortage of {shortage['gap']} volunteers"
                })

    return {
        "zone_analysis": analysis,
        "transfer_suggestions": suggestions,
        "total_demand": sum(z["volunteer_demand"] for z in zones),
        "total_supply": sum(z["volunteers_available"] for z in zones)
    }