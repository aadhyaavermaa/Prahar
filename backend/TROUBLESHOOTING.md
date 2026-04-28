# Troubleshooting & FAQ

## 🐛 Common Issues & Solutions

### Issue 1: ImportError - Module Not Found

**Error:**
```
ModuleNotFoundError: No module named 'firebase_admin'
```

**Solution:**
```bash
# Install missing dependencies
pip install -r requirements.txt

# Or manually install
pip install firebase-admin google-cloud-firestore pydantic fastapi python-dotenv
```

---

### Issue 2: Firestore Connection Fails

**Error:**
```
google.auth.exceptions.DefaultCredentialsError: Could not automatically determine credentials
```

**Solution:**

```bash
# Option 1: Set credentials environment variable
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json

# Option 2: In code
import os
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/path/to/serviceAccountKey.json'

# Option 3: Use in-memory storage (development)
# Set in .env: USE_FIRESTORE=false
```

Get credentials from:
1. Go to Firebase Console
2. Project Settings → Service Accounts
3. Generate new private key
4. Save as JSON

---

### Issue 3: CORS Error on Frontend

**Error:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution:**

Edit [main.py](main.py#L22):

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://your-frontend.com"  # Add your domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Or for development (allow all):
```python
allow_origins=["*"]
```

---

### Issue 4: API Server Won't Start

**Error:**
```
Address already in use: ('127.0.0.1', 8000)
```

**Solution:**

```bash
# Kill process on port 8000
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :8000
kill -9 <PID>

# Or use different port
python -m uvicorn main:app --port 8001
```

---

### Issue 5: Scores Always Return 0

**Problem:** Match scores are always 0 or don't change after learning

**Diagnosis:**

```python
# Check if volunteers exist
vols = storage.get_all_volunteers()
print(f"Volunteers: {len(vols)}")

# Check if task exists
task = storage.get_task("task_001")
print(f"Task: {task}")

# Manual scoring test
from matching_algorithm import calculate_volunteer_match_score
score, breakdown = calculate_volunteer_match_score(vols[0], task)
print(f"Score: {score}")
print(f"Breakdown: {breakdown}")
```

**Common Causes:**
- No volunteers in database
- Volunteers set as unavailable
- Task doesn't exist
- Location data missing

---

### Issue 6: Matching Takes Too Long

**Problem:** `/match/{task_id}` response is slow

**Solution 1: Pagination**
```python
# Limit volunteers being matched
all_volunteers = storage.get_all_volunteers()[:100]  # Limit to 100
matches = get_best_volunteers(task, all_volunteers, top_n=5)
```

**Solution 2: Caching**
```python
from functools import lru_cache

@lru_cache(maxsize=32)
def get_volunteers_cached():
    return storage.get_all_volunteers()
```

**Solution 3: Database Index**
```python
# If using Firestore, create index on:
# - volunteers: availability (Ascending)
# - volunteers: skills (Array)
```

---

### Issue 7: Reliability Score Doesn't Update

**Problem:** After calling `update-performance`, scores don't change

**Diagnosis:**

```python
# Check if update is being called
volunteer = storage.get_volunteer("vol_001")
print(f"Before: {volunteer.reliability_score}")

# Manually call learning function
from learning_system import update_volunteer_after_task
updated = update_volunteer_after_task(
    volunteer=volunteer,
    task=task,
    success=True,
    rating=4.5
)
print(f"After: {updated.reliability_score}")

# Check if storage.update is being called
storage.update_volunteer(updated)
retrieved = storage.get_volunteer("vol_001")
print(f"Retrieved: {retrieved.reliability_score}")
```

**Common Causes:**
- Update not saved to storage
- Using wrong volunteer ID
- Location data format incorrect
- Rating out of bounds (1-5)

---

### Issue 8: Database Bloats with Duplicate Data

**Problem:** Storage grows too large with duplicate records

**Solution:**

```python
# Clean up duplicates
all_volunteers = storage.get_all_volunteers()
unique_ids = set()

for vol in all_volunteers:
    if vol.id in unique_ids:
        storage.delete_volunteer(vol.id)  # Remove duplicate
    else:
        unique_ids.add(vol.id)
```

For Firestore:
```python
# Use batch operations
batch = db.batch()
for vol_id in duplicates:
    batch.delete(volunteers_ref.document(vol_id))
batch.commit()
```

---

## ❓ Frequently Asked Questions

### Q: Can I use this without Firestore?

**A:** Yes! Use in-memory storage for development:
```
# .env
USE_FIRESTORE=false
```
Data will be stored in memory only (lost when server restarts).

---

### Q: How do I change the matching weights?

**A:** Edit [matching_algorithm.py](matching_algorithm.py#L153):
```python
weights = {
    "skill_match": 0.40,      # Increase if skills are important
    "proximity": 0.15,        # Decrease for remote work
    "availability": 0.10,
    "reliability": 0.20,
    "domain_expertise": 0.15
}
# Total must equal 1.0
```

---

### Q: How do I add a new domain?

**A:** Just use it in a task!
```python
task = Task(
    domain="environmental",  # New domain
    ...
)
```

Domain scores are created automatically when a volunteer completes a task in that domain.

---

### Q: What's the difference between reliability_score and success_rate?

**A:** 
- **reliability_score** (0-100): Historical performance + feedback. Starts at 50. Increases on success, decreases on failure.
- **success_rate** (0-1): Percentage of completed tasks. Calculated as: tasks_completed / (tasks_completed + no_shows)

Example:
```
Volunteer A: 10 tasks completed, 0 no-shows → success_rate = 1.0 (100%)
Volunteer B: 10 tasks completed, 2 no-shows → success_rate = 0.83 (83%)
```

---

### Q: Can multiple volunteers be matched to one task?

**A:** Yes! The `/match/{task_id}` endpoint returns up to N volunteers:
```
GET /api/matching/match/task_001?top_n=10
```

Returns top 10 matched volunteers for the task.

---

### Q: How does location-based matching work?

**A:** Uses Haversine formula to calculate distance, then scores:
- 0-1 km: 100 points
- 1-5 km: 80-99 points  
- 5-15 km: 40-79 points
- 15+ km: 0-40 points (decreasing)

---

### Q: What happens if volunteer data is missing?

**A:** Missing data is handled gracefully:

```python
# Missing skills → treated as no skills
# Missing location → scores poorly on proximity
# Missing domain_scores → treated as 20 (baseline)
# Missing rating → success_rate still calculated

# All handled in matching_algorithm.py
```

To avoid issues, always provide:
```python
Volunteer(
    id="...",
    name="...",
    email="...",
    skills=[],              # Can be empty
    location={"lat": 0, "lng": 0},  # Must have
    availability=True,              # Must have
    reliability_score=50            # Must have
)
```

---

### Q: Can I use this on mobile?

**A:** Yes! The API is RESTful and works with any client:

```swift
// iOS example
let url = URL(string: "http://localhost:8000/api/matching/match/task_001")!
let task = URLSession.shared.dataTask(with: url) { data, response, error in
    let matches = try JSONDecoder().decode([MatchedVolunteer].self, from: data!)
}
```

---

### Q: How do I test the system?

**A:** Run the demo:
```bash
python example_usage.py
```

Or run unit tests:
```bash
pip install pytest
pytest test_matching_system.py -v
```

---

### Q: Can I run this in production?

**A:** Yes, with these steps:

1. Use Firestore (not in-memory)
   ```
   USE_FIRESTORE=true
   ```

2. Use production ASGI server
   ```bash
   pip install gunicorn
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
   ```

3. Set up monitoring/logging
4. Enable authentication
5. Configure CORS properly
6. Use HTTPS
7. Add rate limiting
8. Set up backups

---

### Q: How do I deploy to AWS/Azure/GCP?

**A:** 

**AWS Lambda:**
```bash
pip install aws-lambda-wsgi
# Deploy with Zappa
```

**Google Cloud Run:**
```bash
gcloud run deploy prahar-matching \
  --source . \
  --platform managed \
  --region us-central1
```

**Azure:**
```bash
az functionapp create \
  --resource-group mygroup \
  --consumption-plan-name myplan \
  --name myfunction
```

---

### Q: What's the maximum number of volunteers/tasks?

**A:** 

- **In-memory**: Limited by RAM (thousands)
- **Firestore**: Unlimited (scales to millions)

For best performance:
- Return matching results in batches
- Use Firestore indexes
- Implement caching
- Consider sharding by geography

---

### Q: Can I customize the scoring formula?

**A:** Yes! Edit [matching_algorithm.py](matching_algorithm.py):

```python
# Change component weights
weights = {...}

# Change proximity thresholds
if distance <= 2:  # Instead of 1
    return 100.0

# Add new components
def calculate_new_component():
    return score
```

Then update the final score calculation.

---

### Q: How do I debug a bad match?

**A:** Check the score breakdown:

```json
{
    "volunteer": {...},
    "match_score": 45.2,
    "score_breakdown": {
        "skill_match": 20,      # ← Too low?
        "proximity": 30,        # ← Location too far?
        "availability": 0,      # ← Not available?
        "reliability": 40,      # ← Low history?
        "domain_expertise": 60   # ← No experience?
    }
}
```

Each component shows what factors are affecting the score.

---

### Q: Can I integrate with Firebase Auth?

**A:** Yes! Add to [matching_routes.py](matching_routes.py):

```python
from firebase_admin import auth

async def verify_token(token: str):
    try:
        decoded = auth.verify_id_token(token)
        return decoded
    except:
        raise HTTPException(status_code=401)

@matching_router.get("/match/{task_id}")
async def match_volunteers(
    task_id: str,
    authorization: str = Header(None)
):
    token = authorization.split(" ")[1]
    user = verify_token(token)
    # ... rest of endpoint
```

---

### Q: How do I monitor the system?

**A:** Add logging:

```python
import logging

logger = logging.getLogger(__name__)

@matching_router.get("/match/{task_id}")
async def match_volunteers(task_id: str):
    logger.info(f"Matching request for task {task_id}")
    matches = get_best_volunteers(...)
    logger.info(f"Found {len(matches)} matches")
    return matches
```

Then collect logs with ELK Stack, Datadog, etc.

---

## 📞 Getting Help

If you're stuck:

1. **Check this file** - You might find your issue here
2. **Read the README** - [MATCHING_SYSTEM_README.md](MATCHING_SYSTEM_README.md)
3. **Check Architecture** - [ARCHITECTURE.md](ARCHITECTURE.md)
4. **Run the demo** - `python example_usage.py`
5. **Check logs** - Look at console output and error messages
6. **Debug manually** - Use Python REPL to test functions
7. **Write tests** - Create test cases to isolate issues

---

## 📝 Version History

- **v1.0** (2026-04-28): Initial release
  - Basic matching algorithm
  - Self-learning system
  - In-memory and Firestore storage
  - Full API endpoints
  - Comprehensive documentation

---

**Need more help?** Review the example code or open a terminal and test directly!
