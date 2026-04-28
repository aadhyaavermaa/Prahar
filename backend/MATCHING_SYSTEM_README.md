# Volunteer Matching System - Self-Learning Without ML

A production-ready volunteer-task matching system that improves over time using scoring logic and feedback, **without any machine learning models**. Built with FastAPI, Firestore, and pure mathematical algorithms.

---

## 📋 Features

### Core Matching Algorithm
- **Weighted Scoring System** (30% skill + 20% proximity + 10% availability + 25% reliability + 15% domain expertise)
- **Haversine Distance Calculation** for accurate location-based matching
- **No ML Required** - Pure mathematical scoring
- **Transparency** - Score breakdowns show exactly how each component contributes

### Self-Learning System
- **Performance Tracking** - Reliability score, success rate, average rating
- **Domain Expertise** - Specialized scoring per task domain (pollution, medical, education, etc.)
- **Feedback Integration** - Learns from volunteer performance and ratings
- **Penalty/Reward System** - Automatic adjustments for success/no-shows

### Data Models
- **Volunteers**: Skills, location, availability, reliability, ratings, domain expertise
- **Tasks**: Required skills, location, domain, urgency, volunteers needed
- **Feedback**: Success flag, rating (1-5), optional text feedback

---

## 🏗️ Architecture

### Module Overview

```
backend/
├── models.py                 # Pydantic models (Volunteer, Task, etc.)
├── matching_algorithm.py     # Weighted scoring & matching logic
├── learning_system.py        # Self-learning & performance updates
├── storage.py                # Database layer (In-Memory / Firestore)
├── matching_routes.py        # FastAPI endpoints
├── example_usage.py          # Demo & testing
└── main.py                   # Main app entry point
```

### Component Interaction

```
HTTP Request
    ↓
FastAPI Router (matching_routes.py)
    ↓
Storage Layer (storage.py) ← Get volunteers/tasks
    ↓
Matching Algorithm (matching_algorithm.py) ← Calculate scores
    ↓
Learning System (learning_system.py) ← Update metrics
    ↓
Storage Layer (storage.py) ← Save changes
    ↓
HTTP Response
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

Ensure these are included:
```
fastapi
pydantic
python-dotenv
firebase-admin
google-cloud-firestore
```

### 2. Configure Storage

**Option A: In-Memory (Development)**
```python
# .env
USE_FIRESTORE=false
```

**Option B: Firestore (Production)**
```python
# .env
USE_FIRESTORE=true
GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccountKey.json
```

### 3. Run the Application

```bash
# Start server
python -m uvicorn main:app --reload

# API Docs available at:
# http://localhost:8000/docs (Swagger UI)
# http://localhost:8000/redoc (ReDoc)
```

### 4. Test the System

```bash
# Run demo
python example_usage.py
```

---

## 📊 Data Models

### Volunteer

```python
{
    "id": "vol_001",
    "name": "Raj Kumar",
    "email": "raj@example.com",
    "skills": ["cleanup", "organizing"],
    "location": {"lat": 28.6139, "lng": 77.2090},
    "availability": true,
    "reliability_score": 75,              # 0-100
    "tasks_completed": 12,
    "success_rate": 0.92,                 # 0-1
    "avg_rating": 4.5,                    # 0-5
    "no_show_count": 1,
    "domain_scores": {                    # 0-100 per domain
        "pollution": 25,
        "medical": 10,
        "urban": 15
    }
}
```

### Task

```python
{
    "id": "task_001",
    "title": "Yamuna Ghat Cleanup",
    "description": "Clean plastic waste from ghat area",
    "required_skills": ["cleanup", "organizing"],
    "location": {"lat": 28.6139, "lng": 77.2090},
    "domain": "pollution",
    "urgency": "high",
    "volunteers_needed": 10,
    "status": "open"
}
```

### Performance Feedback

```python
{
    "volunteer_id": "vol_001",
    "task_id": "task_001",
    "success": true,
    "rating": 4.5,                        # 1-5 stars
    "feedback": "Excellent work!"         # Optional
}
```

---

## 🎯 Matching Algorithm

### How It Works

1. **Retrieve Task**: Get the task requiring volunteers
2. **Load Volunteers**: Get all available volunteers from storage
3. **Calculate Scores**: For each volunteer, compute:
   - **Skill Match** (30%): How many required skills they have
   - **Proximity** (20%): Distance-based scoring
   - **Availability** (10%): Is volunteer available now?
   - **Reliability** (25%): Historical performance score
   - **Domain Expertise** (15%): Experience in this task's domain

4. **Rank & Return**: Sort by score, return top N

### Scoring Formula

```
Final Score = (skill_match × 0.30) +
              (proximity × 0.20) +
              (availability × 0.10) +
              (reliability × 0.25) +
              (domain_expertise × 0.15)
```

All components normalized to 0-100 scale.

### Distance-Based Proximity Scoring

| Distance | Score | Details |
|----------|-------|---------|
| 0-1 km   | 100   | Excellent |
| 1-5 km   | 80-99 | Very Good |
| 5-15 km  | 40-79 | Good |
| 15+ km   | <40   | Decreasing |

---

## 🧠 Self-Learning System

### What Gets Updated

When a task completes, the system automatically updates:

#### On Success (`success=true`)
- **Reliability Score** +5
- **Domain Score** +3 (+2 bonus if rating ≥ 4.0 stars)
- **Tasks Completed** +1
- **Average Rating** Updated
- **Success Rate** Recalculated

#### On No-Show (`success=false`)
- **Reliability Score** -10
- **No-Show Count** +1
- **Success Rate** Recalculated

### Bounds Enforcement

All scores automatically clamped to valid ranges:
- Reliability: 0-100
- Domain scores: 0-100
- Average rating: 0-5
- Success rate: 0-1

### Performance Summary Example

```python
{
    "volunteer_id": "vol_001",
    "name": "Raj Kumar",
    "tasks_completed": 12,
    "no_show_count": 1,
    "success_rate": 0.92,                 # 92% completion rate
    "reliability_score": 75,
    "average_rating": 4.5,
    "domain_expertise": {
        "pollution": 25,
        "urban": 15
    },
    "status": "excellent"                 # excellent/good/average/concerning/inactive
}
```

---

## 📡 API Endpoints

### Matching Endpoints

#### GET `/api/matching/match/{task_id}`
Get best matched volunteers for a task.

**Parameters:**
- `task_id` (string): Task ID
- `top_n` (int, optional): Number of matches (default: 5, max: 20)

**Response:**
```json
[
    {
        "volunteer": {
            "id": "vol_001",
            "name": "Raj Kumar",
            "skills": ["cleanup", "organizing"],
            "reliability_score": 75,
            ...
        },
        "match_score": 82.5,
        "score_breakdown": {
            "skill_match": 85,
            "proximity": 90,
            "availability": 100,
            "reliability": 75,
            "domain_expertise": 80
        }
    }
]
```

#### POST `/api/matching/update-performance`
Update volunteer metrics after task completion (LEARNING ENDPOINT).

**Request Body:**
```json
{
    "volunteer_id": "vol_001",
    "task_id": "task_001",
    "success": true,
    "rating": 4.5,
    "feedback": "Excellent work!"
}
```

**Response:**
```json
{
    "status": "success",
    "volunteer": { ... },
    "message": "Volunteer performance updated. New reliability score: 80, Success rate: 93.3%"
}
```

### Volunteer Endpoints

#### POST `/api/matching/volunteers`
Create a new volunteer.

#### GET `/api/matching/volunteers`
List all volunteers (optional skill filter).

#### GET `/api/matching/volunteers/{volunteer_id}`
Get volunteer profile.

#### GET `/api/matching/volunteers/{volunteer_id}/performance`
Get performance summary.

#### PUT `/api/matching/volunteers/{volunteer_id}`
Update volunteer profile.

### Task Endpoints

#### POST `/api/matching/tasks`
Create a new task.

#### GET `/api/matching/tasks`
List all tasks (optional domain filter).

#### GET `/api/matching/tasks/{task_id}`
Get task details.

#### PUT `/api/matching/tasks/{task_id}`
Update task.

### Analytics Endpoints

#### GET `/api/matching/leaderboard`
Get top volunteers by performance.

**Parameters:**
- `domain` (string, optional): Filter by domain
- `limit` (int, optional): Number of results (default: 10, max: 100)

**Response:**
```json
[
    {
        "rank": 1,
        "volunteer_id": "vol_001",
        "name": "Raj Kumar",
        "tasks_completed": 25,
        "success_rate": 0.95,
        "reliability_score": 85,
        "status": "excellent"
    }
]
```

#### GET `/api/matching/health`
Health check.

---

## 💻 Code Examples

### Create Volunteer

```python
from models import Volunteer

volunteer = Volunteer(
    id="vol_001",
    name="Raj Kumar",
    email="raj@example.com",
    skills=["cleanup", "organizing"],
    location={"lat": 28.6139, "lng": 77.2090},
    availability=True,
    reliability_score=50,  # Default starting score
    domain_scores={}
)

# Create via API
import requests
response = requests.post(
    "http://localhost:8000/api/matching/volunteers",
    json=volunteer.dict()
)
```

### Create Task

```python
from models import Task

task = Task(
    id="task_001",
    title="Yamuna Ghat Cleanup",
    description="Clean plastic waste",
    required_skills=["cleanup", "organizing"],
    location={"lat": 28.6139, "lng": 77.2090},
    domain="pollution",
    urgency="high",
    volunteers_needed=10
)

# Create via API
response = requests.post(
    "http://localhost:8000/api/matching/tasks",
    json=task.dict()
)
```

### Get Matches

```python
# Get top 5 matches for a task
response = requests.get(
    "http://localhost:8000/api/matching/match/task_001?top_n=5"
)
matches = response.json()

for match in matches:
    print(f"{match['volunteer']['name']}: {match['match_score']}/100")
```

### Submit Performance Feedback

```python
feedback = {
    "volunteer_id": "vol_001",
    "task_id": "task_001",
    "success": True,
    "rating": 4.5,
    "feedback": "Excellent work!"
}

response = requests.post(
    "http://localhost:8000/api/matching/update-performance",
    json=feedback
)

updated_vol = response.json()["volunteer"]
print(f"New reliability score: {updated_vol['reliability_score']}")
```

---

## 🔧 Customization

### Change Matching Weights

Edit [matching_algorithm.py](matching_algorithm.py#L153):

```python
weights = {
    "skill_match": 0.35,      # Increase to prioritize skills
    "proximity": 0.15,        # Decrease for remote tasks
    "availability": 0.10,
    "reliability": 0.25,
    "domain_expertise": 0.15
}
```

### Adjust Learning Rates

Edit [learning_system.py](learning_system.py#L10):

```python
RELIABILITY_INCREASE_SUCCESS = 5      # Increase for faster learning
RELIABILITY_DECREASE_FAILURE = 10
DOMAIN_SCORE_INCREASE = 3
HIGH_RATING_THRESHOLD = 4.0           # Bonus at 4+ stars
```

### Add New Domains

No code changes needed! Simply use new domain names in tasks:

```python
task = Task(
    domain="environmental",    # New domain
    ...
)
```

Domain scores automatically created when first task completes.

---

## 📈 Performance Tips

1. **Caching**: Add Redis caching for leaderboard queries
2. **Batch Updates**: Use batch operations for Firestore
3. **Indexing**: Create Firestore indexes on `skills`, `domain`, `availability`
4. **Pagination**: Add pagination to list endpoints for large datasets

---

## 🧪 Testing

### Run Demo

```bash
python example_usage.py
```

This creates demo data and runs:
- Matching algorithm demo
- Self-learning system demo
- Before/after comparison

### Unit Tests (Add pytest)

```bash
pip install pytest

# Example test file structure
# tests/test_matching.py
# tests/test_learning.py
# tests/test_api.py

pytest
```

---

## 🚨 Error Handling

All endpoints include proper error handling:

- **404**: Resource not found
- **400**: Invalid input
- **500**: Server error

Example error response:

```json
{
    "detail": "Volunteer vol_123 not found"
}
```

---

## 📝 License

This code is provided as-is for the PRAHAR volunteer platform.

---

## 🤝 Contributing

To extend the system:

1. **New Scoring Component**: Add to `calculate_*` functions
2. **New Learning Metric**: Update `update_volunteer_after_task()`
3. **New Endpoint**: Add route to `matching_routes.py`
4. **New Storage Backend**: Extend `Storage` class in `storage.py`

---

## 📚 Learn More

- **Haversine Formula**: Distance between coordinates
- **Weighted Scoring**: Linear combination of normalized components
- **Running Averages**: Incremental rating calculation
- **Clamping**: Bounds enforcement for valid ranges

---

## ❓ FAQ

**Q: Does this use machine learning?**  
A: No! It uses pure mathematical scoring with weighted components. No ML models needed.

**Q: Can I use this with my own database?**  
A: Yes! Implement the `Storage` interface in `storage.py`.

**Q: How do I improve match quality?**  
A: Adjust weights in `matching_algorithm.py` or learning rates in `learning_system.py`.

**Q: What if I don't have location data?**  
A: Set proximity weight to 0 in weights dictionary.

**Q: Can domains be added dynamically?**  
A: Yes! Domain scores are created on-the-fly as needed.

---

## 🎓 For Beginner-Intermediate Developers

All code includes:
- ✓ Detailed comments explaining logic
- ✓ Type hints for clarity
- ✓ Docstrings on all functions
- ✓ Example usage file
- ✓ Error handling patterns

Start with `example_usage.py` to understand the flow!
