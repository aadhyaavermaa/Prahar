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

class ImpactStoryRequest(BaseModel):
    ngo: str
    zone: str
    domain: str
    activity: str
    people_impacted: int
    volunteers: int = 0
    experience: str = ""
    challenge: str = ""
    memorable_moment: str = ""
    feedback: str = ""          # what user wants improved on regenerate
    previous_story: str = ""    # previous version to improve upon

# ─────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "message": "PRAHAR backend is running"}

@app.get("/api/test-gemini")
def test_gemini():
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content("Say 'Gemini is working' in one sentence.")
        return {"status": "ok", "response": response.text.strip(), "api_key_set": bool(GEMINI_API_KEY)}
    except Exception as e:
        return {"status": "error", "error": str(e), "error_type": type(e).__name__, "api_key_set": bool(GEMINI_API_KEY)}

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
# GEMINI IMPACT STORY GENERATOR
# ─────────────────────────────────────────

@app.post("/api/generate-impact-story")
def generate_impact_story(req: ImpactStoryRequest):
    import random
    tones = ["warm and human", "inspiring and energetic", "grounded and factual", "emotional and personal"]
    tone = random.choice(tones)

    is_regeneration = bool(req.feedback or req.previous_story)

    if is_regeneration:
        prompt = f"""
You are a skilled social impact writer for an NGO platform called PRAHAR.
You previously wrote an impact story and the user wants it improved.

ORIGINAL INPUTS:
- NGO Name: {req.ngo}
- Location/Zone: {req.zone}
- Domain: {req.domain}
- Activity Done: {req.activity}
- People Impacted: {req.people_impacted}
- Volunteers Involved: {req.volunteers if req.volunteers else 'not specified'}
- Volunteer Experience: {req.experience if req.experience else 'not provided'}
- Challenge Faced: {req.challenge if req.challenge else 'not provided'}
- Memorable Moment: {req.memorable_moment if req.memorable_moment else 'not provided'}

PREVIOUS STORY:
{req.previous_story if req.previous_story else 'Not available'}

USER FEEDBACK / WHAT TO IMPROVE:
{req.feedback if req.feedback else 'Make it more engaging and different from the previous version'}

INSTRUCTIONS:
- Address the user's feedback directly
- Keep all factual details accurate
- Make this version noticeably different from the previous story
- Writing style: {tone}
- Total length: 120-180 words
- No section headers, no bullet points
- Sound authentic, not robotic
- Write only the story, nothing else
"""
    else:
        prompt = f"""
You are a skilled social impact writer for an NGO platform called PRAHAR.
Write a compelling, authentic impact story based on the following real inputs.

INPUTS:
- NGO Name: {req.ngo}
- Location/Zone: {req.zone}
- Domain: {req.domain}
- Activity Done: {req.activity}
- People Impacted: {req.people_impacted}
- Volunteers Involved: {req.volunteers if req.volunteers else 'not specified'}
- Volunteer Experience: {req.experience if req.experience else 'not provided'}
- Challenge Faced: {req.challenge if req.challenge else 'not provided'}
- Memorable Moment: {req.memorable_moment if req.memorable_moment else 'not provided'}

WRITING STYLE: {tone}

STORY STRUCTURE (write naturally, not as labeled sections):
1. Open with the situation BEFORE the activity (1-2 sentences, paint the picture)
2. Describe WHAT was done — specific actions, not vague (2-3 sentences)
3. Show the IMPACT with numbers and human angle (2 sentences)
4. Include an emotional or human moment if provided (1-2 sentences)
5. Close with a forward-looking or inspiring line (1 sentence)

RULES:
- Total length: 120-180 words
- No robotic tone, no generic phrases like "making a difference"
- Use specific details from the inputs
- Each generation must feel fresh and unique
- Do NOT use section headers or bullet points
- Write as one flowing paragraph or 2-3 short paragraphs
- Sound like a real person wrote it, not AI

Write only the story, nothing else.
"""

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        story = response.text.strip()
        return {"story": story, "generated": True}
    except Exception as e:
        import random
        # Fallback that actually varies based on feedback
        feedback_lower = req.feedback.lower() if req.feedback else ""
        
        if "emotional" in feedback_lower or "human" in feedback_lower:
            opening = f"The streets of {req.zone} told a story of neglect — until {req.ngo} decided to act."
            closing = "For the families who witnessed it, this was more than a cleanup. It was hope."
        elif "short" in feedback_lower or "punchy" in feedback_lower:
            opening = f"{req.ngo} showed up. {req.zone} needed help. They delivered."
            closing = f"{req.people_impacted} lives changed. That's the whole story."
        elif "number" in feedback_lower or "specific" in feedback_lower:
            opening = f"By 7 AM, {req.volunteers or 'a team of'} volunteers had already gathered at {req.zone}."
            closing = f"Final count: {req.people_impacted} people reached, zero excuses made."
        elif "opening" in feedback_lower:
            opening = f"Nobody expected {req.zone} to look different by evening. {req.ngo} had other plans."
            closing = "Small actions, when multiplied, transform communities."
        elif "inspiring" in feedback_lower or "ending" in feedback_lower:
            opening = f"In {req.zone}, {req.ngo} took on a challenge that many had ignored."
            closing = f"This is what {req.people_impacted} people look like when someone finally shows up for them."
        else:
            opening = f"In {req.zone}, the situation demanded urgent attention."
            closing = "This is what community-driven impact looks like."
        
        fallback = (
            f"{opening} "
            f"{req.ngo} stepped in with a focused {req.domain.lower()} initiative — "
            f"{req.activity.lower()}. "
            f"The effort directly reached {req.people_impacted} people"
            f"{f', with {req.volunteers} dedicated volunteers on the ground' if req.volunteers else ''}. "
            f"{'The team faced real challenges: ' + req.challenge + '. ' if req.challenge else ''}"
            f"{'A moment that stood out: ' + req.memorable_moment + '. ' if req.memorable_moment else ''}"
            f"{closing}"
        )
        return {"story": fallback, "generated": False, "error": str(e), "error_type": type(e).__name__}


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