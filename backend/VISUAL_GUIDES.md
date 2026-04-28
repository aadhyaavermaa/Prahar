# Visual Guides - Volunteer Matching System

## 1. Scoring Formula Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│           VOLUNTEER-TASK MATCHING SCORE CALCULATION            │
└─────────────────────────────────────────────────────────────────┘

For each volunteer-task pair:

┌──────────────────┐         ┌──────────────────┐
│  SKILL MATCH     │ × 30% = │  Weighted Score  │
│   0-100 points   │         │                  │
└──────────────────┘         └──────────────────┘
        │
        │ Skill Overlap Analysis
        │ Count matching skills / total required
        │
        ├─ All skills match? → 100
        ├─ 50% match? → 50
        ├─ 0% match? → 0

┌──────────────────┐         ┌──────────────────┐
│  PROXIMITY       │ × 20% = │  Weighted Score  │
│   0-100 points   │         │                  │
└──────────────────┘         └──────────────────┘
        │
        │ Haversine Distance Calculation
        │ Distance scoring thresholds:
        │
        ├─ 0-1 km → 100 (excellent)
        ├─ 1-5 km → 80-99 (very good)
        ├─ 5-15 km → 40-79 (good)
        └─ 15+ km → 0-40 (decreasing)

┌──────────────────┐         ┌──────────────────┐
│  AVAILABILITY    │ × 10% = │  Weighted Score  │
│   0 or 100       │         │                  │
└──────────────────┘         └──────────────────┘
        │
        │ Simple boolean
        │
        ├─ Available? → 100
        └─ Not available? → 0

┌──────────────────┐         ┌──────────────────┐
│  RELIABILITY     │ × 25% = │  Weighted Score  │
│   0-100 points   │         │                  │
└──────────────────┘         └──────────────────┘
        │
        │ Volunteer's historical performance
        │ Starts at 50, adjusted based on:
        │
        ├─ Success completion +5
        ├─ No-show -10
        ├─ High ratings (4+) +2 bonus
        └─ Always clamped 0-100

┌──────────────────┐         ┌──────────────────┐
│  DOMAIN          │ × 15% = │  Weighted Score  │
│  EXPERTISE       │         │                  │
│   0-100 points   │         │                  │
└──────────────────┘         └──────────────────┘
        │
        │ Experience in this specific domain
        │
        ├─ Has domain score? → Use it (0-100)
        └─ No experience? → Baseline 20

                         ▼

                ┌────────────────────┐
                │   FINAL SCORE      │
                │   0-100 points     │
                │                    │
                │  Sum of all        │
                │  weighted scores   │
                └────────────────────┘
                         │
                         ▼
                ┌────────────────────┐
                │   VOLUNTEER RANK   │
                │   (sorted by score)│
                └────────────────────┘
```

---

## 2. Self-Learning System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  TASK COMPLETION FEEDBACK                       │
└─────────────────────────────────────────────────────────────────┘

           Volunteer completes task
                    │
                    ▼
        ┌─────────────────────────┐
        │ Did they complete it?   │
        └────────┬────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
    SUCCESS            NO-SHOW
        │                 │
        │                 ├─ Reliability Score: -10
        │                 ├─ No-show Count: +1
        │                 └─ Success Rate: Recalculate
        │
        ├─ Reliability Score: +5
        ├─ Tasks Completed: +1
        ├─ Domain Expertise: +3
        │
        ├─ Rating provided? (1-5 stars)
        │   │
        │   ├─ YES:
        │   │   ├─ Avg Rating: (old_avg × N + new_rating) / (N+1)
        │   │   ├─ Rating ≥ 4.0? +2 domain bonus
        │   │   └─ Rating ≤ 2.5? -2 reliability penalty
        │   │
        │   └─ NO: (Skip rating update)
        │
        └─ Success Rate: tasks_completed / (tasks_completed + no_shows)

┌─────────────────────────────────────────────────────────────────┐
│                    BOUNDS ENFORCEMENT                           │
└─────────────────────────────────────────────────────────────────┘

All scores automatically clamped to valid ranges:

  Reliability Score:    0 ─────────────────── 100
  Domain Expertise:     0 ─────────────────── 100
  Average Rating:       0 ─────── 5 (0.0-5.0)
  Success Rate:         0 ─────── 1 (0-100%)
  
Example:
  reliability_score = 95, +5 applied → 100 ✓
  reliability_score = 5, -10 applied → 0 ✓
  avg_rating = 4.8, +1.0 applied → 5.0 ✓

┌─────────────────────────────────────────────────────────────────┐
│                VOLUNTEER STATUS CLASSIFICATION                  │
└─────────────────────────────────────────────────────────────────┘

Based on composite metrics:

  EXCELLENT        GOOD           AVERAGE        CONCERNING      INACTIVE
  └─────────────┬──────────┬─────────────┬──────────────┬──────────┘
    Risk < 10   Risk<20   Risk<35     Risk≥35      No tasks
  
  Factors:
  - Reliability (40% of risk)
  - Success rate (40% of risk)
  - Average rating (20% of risk)
  - High no-show rate: Concerning
```

---

## 3. Matching Algorithm Performance

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENT CONTRIBUTIONS                       │
└─────────────────────────────────────────────────────────────────┘

Scenario: Match volunteer to "Cleanup" task

Volunteer A (Good match):
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Skills: 100  │  │ Proximity: 90 │  │ Available: 100│ (Skill=cleanup, 3km away, available)
└──────────────┘  └──────────────┘  └──────────────┘
 × 30%            × 20%              × 10%
   = 30             = 18               = 10

┌──────────────┐  ┌──────────────┐
│Reliability:75│  │Domain Exp:80 │  (Good history, some domain exp)
└──────────────┘  └──────────────┘
 × 25%            × 15%
   = 18.75         = 12

                    TOTAL = 88.75/100 ✓ Good match

─────────────────────────────────────────

Volunteer B (Poor match):
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Skills: 30   │  │ Proximity: 20 │  │ Available: 0  │ (No cleanup skill, 25km, unavailable)
└──────────────┘  └──────────────┘  └──────────────┘
 × 30%            × 20%              × 10%
   = 9             = 4                = 0

┌──────────────┐  ┌──────────────┐
│Reliability:40│  │Domain Exp:20 │  (Poor history, no domain exp)
└──────────────┘  └──────────────┘
 × 25%            × 15%
   = 10            = 3

                    TOTAL = 26/100 ✗ Poor match

─────────────────────────────────────────

Ranking:
  1. Volunteer A: 88.75
  2. Volunteer B: 26.00
```

---

## 4. Database Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                    FIRESTORE STRUCTURE                          │
└─────────────────────────────────────────────────────────────────┘

COLLECTION: volunteers
├── doc: vol_001
│   ├── id: "vol_001"
│   ├── name: "Raj Kumar"
│   ├── email: "raj@example.com"
│   ├── skills: ["cleanup", "organizing"]
│   ├── location: {lat: 28.6139, lng: 77.2090}
│   ├── availability: true
│   ├── reliability_score: 75
│   ├── tasks_completed: 12
│   ├── success_rate: 0.92
│   ├── avg_rating: 4.5
│   ├── no_show_count: 1
│   ├── domain_scores: {pollution: 25, urban: 15}
│   ├── created_at: Timestamp
│   └── updated_at: Timestamp
│
├── doc: vol_002
│   └── ... (similar structure)
│
└── ...

COLLECTION: tasks
├── doc: task_001
│   ├── id: "task_001"
│   ├── title: "Yamuna Ghat Cleanup"
│   ├── description: "Clean plastic waste"
│   ├── required_skills: ["cleanup", "organizing"]
│   ├── location: {lat: 28.6140, lng: 77.2091}
│   ├── domain: "pollution"
│   ├── urgency: "high"
│   ├── volunteers_needed: 10
│   ├── status: "open"
│   ├── created_at: Timestamp
│   └── ...
│
├── doc: task_002
│   └── ... (similar structure)
│
└── ...
```

---

## 5. API Request/Response Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                     REQUEST FLOW DIAGRAM                           │
└────────────────────────────────────────────────────────────────────┘

CLIENT REQUEST
│
├─ Method: GET
├─ URL: /api/matching/match/task_001?top_n=5
└─ Headers: Content-Type: application/json

                    ▼

       ┌──────────────────────────┐
       │ FastAPI Router           │
       │ (matching_routes.py)     │
       └──────────┬───────────────┘
                  │
                  ├─ Validate path parameters
                  ├─ Validate query parameters
                  ├─ Type checking
                  └─ Range checking (top_n: 1-20)

                  ▼

       ┌──────────────────────────┐
       │ Storage Layer            │
       │ (storage.py)             │
       └──────────┬───────────────┘
                  │
                  ├─ Get task from database
                  ├─ Get all volunteers
                  └─ Filter unavailable

                  ▼

       ┌──────────────────────────┐
       │ Matching Algorithm       │
       │ (matching_algorithm.py)  │
       └──────────┬───────────────┘
                  │
                  ├─ For each volunteer:
                  │   ├─ Calculate skill match
                  │   ├─ Calculate proximity
                  │   ├─ Calculate reliability
                  │   ├─ Calculate domain expertise
                  │   └─ Combine with weights
                  │
                  ├─ Sort by score
                  └─ Return top N

                  ▼

       ┌──────────────────────────┐
       │ Response Builder         │
       │ (models.py)              │
       └──────────┬───────────────┘
                  │
                  ├─ Volunteer object
                  ├─ Match score
                  └─ Score breakdown

                  ▼

SERVER RESPONSE
│
├─ Status: 200 OK
├─ Body: JSON array of MatchedVolunteer objects
│   [
│     {
│       "volunteer": {...},
│       "match_score": 88.75,
│       "score_breakdown": {
│         "skill_match": 85,
│         "proximity": 90,
│         "availability": 100,
│         "reliability": 75,
│         "domain_expertise": 80
│       }
│     },
│     ...
│   ]
└─ Headers: Content-Type: application/json
```

---

## 6. Learning System Timeline

```
┌────────────────────────────────────────────────────────────────────┐
│              VOLUNTEER PERFORMANCE EVOLUTION (Example)             │
└────────────────────────────────────────────────────────────────────┘

Day 1: New Volunteer Joins
┌──────────────────────┐
│ Reliability: 50      │ ← Starting score
│ Domain Scores: {}    │
│ Avg Rating: 0        │
│ Success Rate: N/A    │
└──────────────────────┘

Day 3: First Task (SUCCESS, Rating 4.5/5)
┌──────────────────────┐
│ Reliability: 55 ↑    │ (+5 for success)
│ Domain Scores:       │
│   pollution: 5 ↑     │ (+3 base)
│ Avg Rating: 4.5      │
│ Success Rate: 100%   │ (1/1 completed)
│ Tasks: 1             │
└──────────────────────┘

Day 5: Second Task (SUCCESS, Rating 5.0/5)
┌──────────────────────┐
│ Reliability: 62 ↑    │ (+5 success + 2 bonus for 5.0)
│ Domain Scores:       │
│   pollution: 10 ↑    │ (+3 base)
│ Avg Rating: 4.75     │ (avg of 4.5, 5.0)
│ Success Rate: 100%   │ (2/2 completed)
│ Tasks: 2             │
└──────────────────────┘

Day 7: Third Task (NO-SHOW)
┌──────────────────────┐
│ Reliability: 52 ↓    │ (-10 for no-show)
│ Domain Scores:       │
│   pollution: 10      │ (unchanged)
│ Avg Rating: 4.75     │ (unchanged)
│ Success Rate: 67%    │ (2/3 total)
│ No-shows: 1          │
│ Status: CONCERNING   │ ← Changed!
└──────────────────────┘

Day 10: Fourth Task (SUCCESS, Rating 4.0/5)
┌──────────────────────┐
│ Reliability: 57 ↑    │ (+5 success)
│ Domain Scores:       │
│   pollution: 13 ↑    │ (+3 base)
│ Avg Rating: 4.56     │ (avg of all ratings)
│ Success Rate: 75%    │ (3/4 total)
│ Tasks: 4             │
│ Status: GOOD         │ ← Recovered!
└──────────────────────┘

Pattern Visible: Learning over time, with accountability
```

---

## 7. Error Handling Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING PATHS                            │
└────────────────────────────────────────────────────────────────────┘

Request arrives
        │
        ▼
    Parameter Validation
        │
    ┌───┴───┐
    │       │
    ✓       ✗ → 400 Bad Request
    │         {"detail": "Invalid parameters"}
    │
    ▼
Business Logic
        │
    ┌───┴──────────┐
    │              │
    ✓              ✗ → Exception
    │                 │
    │                 ├─ Resource not found → 404
    │                 ├─ Validation error → 422
    │                 ├─ Server error → 500
    │                 └─ {"detail": "Error message"}
    │
    ▼
Response Serialization
        │
    ┌───┴───┐
    │       │
    ✓       ✗ → 500 Server Error
    │         {"detail": "Serialization failed"}
    │
    ▼
Return to Client
    - Status: 200, 400, 404, 422, 500
    - Body: JSON response or error message
    - Headers: Content-Type: application/json
```

---

## 8. Module Dependencies

```
┌────────────────────────────────────────────────────────────────────┐
│                    MODULE DEPENDENCIES                             │
└────────────────────────────────────────────────────────────────────┘

main.py
  ├── matching_routes.py
  │   ├── models.py
  │   ├── storage.py
  │   │   ├── firebase_admin
  │   │   └── Firestore
  │   ├── matching_algorithm.py
  │   │   └── models.py
  │   └── learning_system.py
  │       ├── models.py
  │       └── datetime
  ├── fastapi
  ├── pydantic
  └── cors_middleware

example_usage.py
  ├── models.py
  ├── matching_algorithm.py
  ├── learning_system.py
  ├── storage.py
  └── uuid, datetime

test_matching_system.py
  ├── pytest
  ├── models.py
  ├── matching_algorithm.py
  ├── learning_system.py
  └── storage.py
```

---

This visual guide helps understand the system structure, data flow, and algorithm logic!
