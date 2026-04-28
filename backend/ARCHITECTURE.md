# System Architecture & Integration Guide

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (React)                           │
│             http://localhost:5173                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    HTTP/REST
                         │
┌─────────────────────────▼────────────────────────────────────────┐
│                   FastAPI Application                            │
│  (main.py + matching_routes.py)                                 │
├──────────────────────────────────────────────────────────────────┤
│  • CORS enabled                                                  │
│  • Request validation (Pydantic)                                │
│  • Error handling                                               │
│  • Route organization                                           │
└────┬─────────────────────────────────────────────────────────┬──┘
     │                                                          │
     └──────────────┬──────────────────────────────────────────┘
                    │
     ┌──────────────┴──────────────┐
     │                             │
     ▼                             ▼
┌──────────────────────┐  ┌─────────────────────────────────┐
│  Business Logic      │  │    Data Storage Layer           │
│                      │  │  (storage.py)                   │
├──────────────────────┤  ├─────────────────────────────────┤
│ Matching Algorithm   │  │                                 │
│ (matching_algo...)   │  │  ┌──────────────────────────┐  │
│                      │  │  │ In-Memory Storage        │  │
│ - Scoring            │  │  │ (Development)            │  │
│ - Distance calc      │  │  └──────────────────────────┘  │
│ - Ranking            │  │                                 │
│                      │  │  ┌──────────────────────────┐  │
│                      │  │  │ Firestore Storage        │  │
│ Learning System      │  │  │ (Production)             │  │
│ (learning_system..)  │  │  │ • Firebase Admin SDK     │  │
│                      │  │  │ • Automatic Sync         │  │
│ - Metric updates     │  │  └──────────────────────────┘  │
│ - Reliability scoring│  │                                 │
│ - Success rate calc  │  │ Storage Interface (abstract)    │
│ - Domain expertise   │  │ • create_volunteer()            │
│                      │  │ • update_volunteer()            │
│ Data Models          │  │ • get_volunteer()               │
│ (models.py)          │  │ • get_all_volunteers()          │
│                      │  │ • Same for tasks                │
│ - Volunteer          │  │                                 │
│ - Task               │  └─────────────────────────────────┘
│ - Feedback           │
│                      │
└──────────────────────┘
```

## 🔄 Data Flow: Matching a Volunteer to a Task

```
User Request
    │
    ▼
GET /api/matching/match/{task_id}
    │
    ├─→ Validate task_id
    │
    ▼
Get Task from Storage
    │
    ├─→ Load required skills, location, domain, urgency
    │
    ▼
Get All Available Volunteers from Storage
    │
    ├─→ Filter out unavailable volunteers
    │
    ▼
For Each Volunteer:
    │
    ├─→ Calculate Skill Match Score
    │   └─→ Count overlapping skills / required skills
    │
    ├─→ Calculate Proximity Score
    │   └─→ Haversine distance formula
    │       └─→ Distance-based threshold scoring
    │
    ├─→ Calculate Availability Score
    │   └─→ 100 if available, 0 if not
    │
    ├─→ Calculate Reliability Score
    │   └─→ Use volunteer's reliability_score (0-100)
    │
    ├─→ Calculate Domain Expertise Score
    │   └─→ Look up volunteer's domain_scores[task.domain]
    │
    ├─→ Combine with Weights (0.30, 0.20, 0.10, 0.25, 0.15)
    │   └─→ Final Score = Weighted Average
    │
    ▼
Sort by Final Score (Descending)
    │
    ▼
Return Top N Volunteers
    │
    ├─→ With scores and breakdown
    │
    ▼
JSON Response to Client
```

## 🧠 Data Flow: Learning from Feedback

```
Task Completion Event
    │
    ▼
POST /api/matching/update-performance
    ├─→ volunteer_id
    ├─→ task_id
    ├─→ success (boolean)
    ├─→ rating (optional, 1-5)
    ├─→ feedback (optional)
    │
    ▼
Get Volunteer from Storage
Get Task from Storage
    │
    ▼
if success == True:
    │
    ├─→ reliability_score += 5
    ├─→ tasks_completed += 1
    ├─→ domain_scores[task.domain] += 3
    ├─→ if rating >= 4.0:
    │   └─→ domain_scores[task.domain] += 2 (bonus)
    ├─→ avg_rating = (avg_rating × N + rating) / (N+1)
    │
else (No-show):
    │
    ├─→ reliability_score -= 10
    ├─→ no_show_count += 1
    │
    ▼
Recalculate:
    │
    ├─→ success_rate = tasks_completed / (tasks_completed + no_shows)
    │
    ▼
Clamp to Valid Ranges:
    │
    ├─→ reliability_score: 0-100
    ├─→ domain_scores: 0-100
    ├─→ avg_rating: 0-5
    ├─→ success_rate: 0-1
    │
    ▼
Save Updated Volunteer to Storage
    │
    ▼
Return Updated Volunteer + Confirmation
```

## 📦 Database Schema (if using Firestore)

### Collection: `volunteers`
```
doc: vol_001
{
  "id": "vol_001",
  "name": "Raj Kumar",
  "email": "raj@example.com",
  "skills": ["cleanup", "organizing"],
  "location": {
    "lat": 28.6139,
    "lng": 77.2090
  },
  "availability": true,
  "reliability_score": 75,
  "tasks_completed": 12,
  "success_rate": 0.92,
  "avg_rating": 4.5,
  "no_show_count": 1,
  "domain_scores": {
    "pollution": 25,
    "urban": 15
  },
  "created_at": "2026-04-28T10:30:00Z",
  "updated_at": "2026-04-28T11:45:00Z"
}
```

### Collection: `tasks`
```
doc: task_001
{
  "id": "task_001",
  "title": "Yamuna Ghat Cleanup",
  "description": "Clean plastic waste",
  "required_skills": ["cleanup", "organizing"],
  "location": {
    "lat": 28.6139,
    "lng": 77.2090
  },
  "domain": "pollution",
  "urgency": "high",
  "volunteers_needed": 10,
  "status": "open",
  "created_at": "2026-04-28T10:00:00Z"
}
```

## 🔌 Integration Points

### 1. Frontend Integration (React)

```javascript
// Get matched volunteers
const getMatches = async (taskId) => {
  const response = await fetch(
    `http://localhost:8000/api/matching/match/${taskId}?top_n=5`
  );
  return response.json();
};

// Submit feedback after task
const submitFeedback = async (volunteerId, taskId, success, rating) => {
  const response = await fetch(
    'http://localhost:8000/api/matching/update-performance',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        volunteer_id: volunteerId,
        task_id: taskId,
        success: success,
        rating: rating
      })
    }
  );
  return response.json();
};
```

### 2. Authentication Integration

Add to `matching_routes.py`:

```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthCredentials

security = HTTPBearer()

async def verify_token(credentials: HTTPAuthCredentials = Depends(security)):
    # Verify JWT token from Firebase
    token = credentials.credentials
    try:
        decoded = verify_id_token(token)  # Firebase Auth
        return decoded
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

@matching_router.get("/match/{task_id}")
async def match_volunteers(
    task_id: str,
    current_user = Depends(verify_token)
):
    # Only authenticated users can match
    ...
```

### 3. Notifications Integration

Add after updating performance:

```python
# Send notification to volunteer
if updated_vol.tasks_completed == 10:  # Milestone
    send_notification(
        volunteer_id=updated_vol.id,
        title="Milestone Reached!",
        message="You've completed 10 tasks!"
    )

# Alert if reliability drops
if updated_vol.reliability_score < 30:
    send_alert(
        volunteer_id=updated_vol.id,
        title="Reliability Warning",
        message="Your reliability score is low"
    )
```

### 4. Analytics Integration

```python
# Track matching metrics
log_event("volunteer_matched", {
    "task_domain": task.domain,
    "num_matches": len(matches),
    "top_score": matches[0][1] if matches else 0
})

# Track learning events
log_event("performance_updated", {
    "volunteer_id": volunteer.id,
    "success": feedback.success,
    "rating": feedback.rating,
    "reliability_change": updated_vol.reliability_score - volunteer.reliability_score
})
```

## 🚀 Deployment Checklist

- [ ] Install all dependencies: `pip install -r requirements.txt`
- [ ] Set up Firestore credentials
- [ ] Configure environment variables in `.env`
- [ ] Run tests: `pytest test_matching_system.py`
- [ ] Start development server: `python -m uvicorn main:app --reload`
- [ ] Verify API docs at `http://localhost:8000/docs`
- [ ] Create sample data: `python example_usage.py`
- [ ] Test endpoints manually
- [ ] Set up CI/CD pipeline
- [ ] Configure production logging
- [ ] Set up monitoring/alerts
- [ ] Create Firestore indexes (if using)
- [ ] Deploy to production

## 📋 Firestore Index Setup

If using Firestore, create these composite indexes:

```
Index 1: Collection "volunteers"
  - skills (Ascending, Array)
  - availability (Ascending)

Index 2: Collection "tasks"
  - domain (Ascending)
  - status (Ascending)
```

## 🎯 Performance Optimization Tips

1. **Caching**
   ```python
   from functools import lru_cache
   
   @lru_cache(maxsize=128)
   def get_volunteers_cached(task_id):
       return storage.get_all_volunteers()
   ```

2. **Batch Operations**
   ```python
   # Update multiple volunteers at once
   batch = db.batch()
   for vol in volunteers:
       batch.update(volunteers_ref.document(vol.id), vol.dict())
   batch.commit()
   ```

3. **Async Processing**
   ```python
   from celery import Celery
   
   app = Celery('matching_system')
   
   @app.task
   def update_performance_async(volunteer_id, task_id, success, rating):
       # Run in background
       ...
   ```

## 🔒 Security Considerations

1. **Input Validation**: Pydantic models automatically validate
2. **Rate Limiting**: Add to API routes
3. **CORS**: Configured but restrict in production
4. **Authentication**: Add JWT verification
5. **Data Sanitization**: Escape user inputs
6. **Audit Logging**: Log all changes
7. **Access Control**: Enforce permissions

## 📞 Support & Maintenance

- **Logs**: Check `uvicorn` output for errors
- **Database**: Monitor Firestore usage
- **Performance**: Track API response times
- **Updates**: Keep dependencies current
- **Backups**: Regular Firestore exports
