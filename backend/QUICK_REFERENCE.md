"""
QUICK REFERENCE GUIDE - Volunteer Matching System

Copy-paste snippets for common tasks.
"""

# ============================================================================
# 1. INITIALIZE THE SYSTEM
# ============================================================================

# Import required modules
from models import Volunteer, Task, TaskPerformanceFeedback
from matching_algorithm import get_best_volunteers
from learning_system import update_volunteer_after_task
from storage import storage
import requests

# Start API server
# $ python -m uvicorn main:app --reload


# ============================================================================
# 2. CREATE A VOLUNTEER
# ============================================================================

# Method 1: Via Python
vol = Volunteer(
    id="vol_001",
    name="John Doe",
    email="john@example.com",
    skills=["cleanup", "organizing"],
    location={"lat": 28.6139, "lng": 77.2090},
    availability=True,
    reliability_score=50,  # Starts at 50
    domain_scores={}
)
storage.create_volunteer(vol)

# Method 2: Via API
response = requests.post(
    "http://localhost:8000/api/matching/volunteers",
    json={
        "id": "vol_001",
        "name": "John Doe",
        "email": "john@example.com",
        "skills": ["cleanup", "organizing"],
        "location": {"lat": 28.6139, "lng": 77.2090},
        "availability": True
    }
)


# ============================================================================
# 3. CREATE A TASK
# ============================================================================

# Method 1: Via Python
task = Task(
    id="task_001",
    title="Ghat Cleanup",
    description="Clean plastic waste",
    required_skills=["cleanup", "organizing"],
    location={"lat": 28.6140, "lng": 77.2091},
    domain="pollution",
    urgency="high",
    volunteers_needed=10
)
storage.create_task(task)

# Method 2: Via API
response = requests.post(
    "http://localhost:8000/api/matching/tasks",
    json={
        "id": "task_001",
        "title": "Ghat Cleanup",
        "description": "Clean plastic waste",
        "required_skills": ["cleanup", "organizing"],
        "location": {"lat": 28.6140, "lng": 77.2091},
        "domain": "pollution",
        "urgency": "high",
        "volunteers_needed": 10
    }
)


# ============================================================================
# 4. GET MATCHED VOLUNTEERS FOR A TASK
# ============================================================================

# Method 1: Via Python
task = storage.get_task("task_001")
volunteers = storage.get_all_volunteers()
matches = get_best_volunteers(task, volunteers, top_n=5)

for vol, score, breakdown in matches:
    print(f"{vol.name}: {score}/100")
    print(f"  Skill Match: {breakdown['skill_match']}")
    print(f"  Proximity: {breakdown['proximity']}")

# Method 2: Via API
response = requests.get(
    "http://localhost:8000/api/matching/match/task_001?top_n=5"
)
matches = response.json()

for match in matches:
    print(f"{match['volunteer']['name']}: {match['match_score']}")
    print(f"  {match['score_breakdown']}")


# ============================================================================
# 5. SUBMIT TASK COMPLETION FEEDBACK (LEARNING TRIGGER)
# ============================================================================

# Method 1: Via Python
volunteer = storage.get_volunteer("vol_001")
task = storage.get_task("task_001")

updated_vol = update_volunteer_after_task(
    volunteer=volunteer,
    task=task,
    success=True,           # False if no-show
    rating=4.5,             # 1-5 stars (if success=True)
    feedback="Excellent"    # Optional text
)

storage.update_volunteer(updated_vol)

# Method 2: Via API
response = requests.post(
    "http://localhost:8000/api/matching/update-performance",
    json={
        "volunteer_id": "vol_001",
        "task_id": "task_001",
        "success": True,
        "rating": 4.5,
        "feedback": "Excellent work!"
    }
)


# ============================================================================
# 6. GET VOLUNTEER PERFORMANCE METRICS
# ============================================================================

# Method 1: Via Python
from learning_system import get_volunteer_performance_summary

volunteer = storage.get_volunteer("vol_001")
summary = get_volunteer_performance_summary(volunteer)

print(f"Tasks: {summary['tasks_completed']}")
print(f"No-shows: {summary['no_show_count']}")
print(f"Success Rate: {summary['success_rate']:.1%}")
print(f"Reliability: {summary['reliability_score']}/100")
print(f"Rating: {summary['average_rating']}/5")
print(f"Status: {summary['status']}")

# Method 2: Via API
response = requests.get(
    "http://localhost:8000/api/matching/volunteers/vol_001/performance"
)
summary = response.json()


# ============================================================================
# 7. GET LEADERBOARD
# ============================================================================

# Method 1: Via Python
from learning_system import get_volunteer_performance_summary

volunteers = storage.get_all_volunteers()
summaries = [get_volunteer_performance_summary(v) for v in volunteers]

# Sort by composite score
summaries.sort(
    key=lambda v: v['reliability_score'] * 0.5 + v['success_rate'] * 50,
    reverse=True
)

for rank, vol in enumerate(summaries[:10], 1):
    print(f"{rank}. {vol['name']} - Status: {vol['status']}")

# Method 2: Via API
response = requests.get(
    "http://localhost:8000/api/matching/leaderboard?limit=10"
)
leaderboard = response.json()

for entry in leaderboard:
    print(f"{entry['rank']}. {entry['name']} ({entry['status']})")


# ============================================================================
# 8. UPDATE VOLUNTEER PROFILE
# ============================================================================

# Method 1: Via Python
volunteer = storage.get_volunteer("vol_001")
volunteer.skills.append("new_skill")
volunteer.availability = False
storage.update_volunteer(volunteer)

# Method 2: Via API
response = requests.put(
    "http://localhost:8000/api/matching/volunteers/vol_001",
    json={
        "id": "vol_001",
        "name": "John Doe",
        "email": "john@example.com",
        "skills": ["cleanup", "organizing", "new_skill"],
        "location": {"lat": 28.6139, "lng": 77.2090},
        "availability": False,
        "reliability_score": 75
    }
)


# ============================================================================
# 9. GET VOLUNTEERS BY SKILL
# ============================================================================

# Method 1: Via Python
skilled_volunteers = storage.get_volunteers_by_skill("cleanup")
print(f"Found {len(skilled_volunteers)} volunteers with 'cleanup' skill")

# Method 2: Via API
response = requests.get(
    "http://localhost:8000/api/matching/volunteers?skill=cleanup"
)
volunteers = response.json()


# ============================================================================
# 10. GET TASKS BY DOMAIN
# ============================================================================

# Method 1: Via Python
pollution_tasks = storage.get_tasks_by_domain("pollution")
print(f"Found {len(pollution_tasks)} pollution tasks")

# Method 2: Via API
response = requests.get(
    "http://localhost:8000/api/matching/tasks?domain=pollution"
)
tasks = response.json()


# ============================================================================
# LEARNING SYSTEM EXAMPLES
# ============================================================================

# SCENARIO 1: Volunteer completes with high rating
response = requests.post(
    "http://localhost:8000/api/matching/update-performance",
    json={
        "volunteer_id": "vol_001",
        "task_id": "task_001",
        "success": True,
        "rating": 5.0,  # Excellent
        "feedback": "Perfect work!"
    }
)
# Result: +5 reliability, +5 domain score, +1 rating to avg

# SCENARIO 2: Volunteer completes with low rating
response = requests.post(
    "http://localhost:8000/api/matching/update-performance",
    json={
        "volunteer_id": "vol_001",
        "task_id": "task_001",
        "success": True,
        "rating": 2.0,  # Poor
        "feedback": "Did not follow instructions"
    }
)
# Result: +5 reliability, +3 domain score, -2 reliability penalty, avg rating updated

# SCENARIO 3: Volunteer no-shows
response = requests.post(
    "http://localhost:8000/api/matching/update-performance",
    json={
        "volunteer_id": "vol_001",
        "task_id": "task_001",
        "success": False
    }
)
# Result: -10 reliability, +1 no-show count, success rate recalculated


# ============================================================================
# ADVANCED: CUSTOMIZE MATCHING WEIGHTS
# ============================================================================

# Edit matching_algorithm.py
weights = {
    "skill_match": 0.35,      # 35% - Skill matching is most important
    "proximity": 0.10,        # 10% - Don't care about distance
    "availability": 0.10,
    "reliability": 0.25,
    "domain_expertise": 0.20
}
# Total must = 1.0


# ============================================================================
# ADVANCED: CUSTOMIZE LEARNING RATES
# ============================================================================

# Edit learning_system.py
RELIABILITY_INCREASE_SUCCESS = 10    # Increase for faster learning
RELIABILITY_DECREASE_FAILURE = 15
DOMAIN_SCORE_INCREASE = 5
HIGH_RATING_THRESHOLD = 4.0


# ============================================================================
# TESTING: RUN DEMO
# ============================================================================

# $ python example_usage.py
# Creates demo data and runs:
# - Matching algorithm demo
# - Self-learning system demo
# - Before/after comparison


# ============================================================================
# API ENDPOINTS SUMMARY
# ============================================================================

"""
VOLUNTEERS:
  POST   /api/matching/volunteers               → Create
  GET    /api/matching/volunteers               → List (filter by ?skill=X)
  GET    /api/matching/volunteers/{id}          → Get one
  GET    /api/matching/volunteers/{id}/performance → Performance
  PUT    /api/matching/volunteers/{id}          → Update

TASKS:
  POST   /api/matching/tasks                    → Create
  GET    /api/matching/tasks                    → List (filter by ?domain=X)
  GET    /api/matching/tasks/{id}               → Get one
  PUT    /api/matching/tasks/{id}               → Update

MATCHING (Main Endpoints):
  GET    /api/matching/match/{task_id}          → Get matches (?top_n=5)
  POST   /api/matching/update-performance       → Record feedback (LEARNING!)

ANALYTICS:
  GET    /api/matching/leaderboard              → Top volunteers (?domain=X&limit=10)

HEALTH:
  GET    /api/matching/health                   → Status check
"""


# ============================================================================
# PERFORMANCE MONITORING
# ============================================================================

import time

# Time a matching operation
start = time.time()
matches = get_best_volunteers(task, volunteers, top_n=5)
elapsed = time.time() - start
print(f"Matching took {elapsed*1000:.1f}ms")

# Monitor volunteer metrics over time
vol = storage.get_volunteer("vol_001")
print(f"Reliability Trend: {vol.reliability_score}")
print(f"Domain Growth: {vol.domain_scores}")
print(f"Engagement: {vol.tasks_completed}/{vol.tasks_completed + vol.no_show_count}")
