"""
Data models for the volunteer matching system.
Defines Pydantic models for validation and serialization.
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime


class Volunteer(BaseModel):
    """Model for a volunteer with skills, location, and performance metrics."""
    
    id: str
    name: str
    email: str
    skills: List[str] = Field(default_factory=list)  # e.g., ["planting", "cleanup"]
    location: Dict[str, float]  # {"lat": 28.6139, "lng": 77.2090}
    availability: bool = True  # True if available now
    reliability_score: float = 50  # 0-100, starts at 50
    tasks_completed: int = 0
    success_rate: float = 0.0  # 0-1
    avg_rating: float = 0.0  # 0-5
    no_show_count: int = 0
    domain_scores: Dict[str, float] = Field(default_factory=dict)  # e.g., {"pollution": 10, "medical": 5}
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "vol_001",
                "name": "Raj Kumar",
                "email": "raj@example.com",
                "skills": ["cleanup", "planting", "sorting"],
                "location": {"lat": 28.6139, "lng": 77.2090},
                "availability": True,
                "reliability_score": 75,
                "tasks_completed": 12,
                "success_rate": 0.92,
                "avg_rating": 4.5,
                "no_show_count": 1,
                "domain_scores": {"pollution": 25, "medical": 10, "urban": 15}
            }
        }


class Task(BaseModel):
    """Model for a task that needs to be completed by volunteers."""
    
    id: str
    title: str
    description: str
    required_skills: List[str] = Field(default_factory=list)  # e.g., ["cleanup", "organizing"]
    location: Dict[str, float]  # {"lat": 28.6139, "lng": 77.2090}
    domain: str  # e.g., "pollution", "medical", "urban"
    urgency: str = "medium"  # "low", "medium", "high"
    volunteers_needed: int = 5
    status: str = "open"  # "open", "in_progress", "completed"
    created_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        json_schema_extra = {
            "example": {
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
        }


class TaskPerformanceFeedback(BaseModel):
    """Model for submitting feedback after a task is completed."""
    
    volunteer_id: str
    task_id: str
    success: bool  # True if volunteer completed, False if no-show
    rating: Optional[float] = None  # 1-5 stars (only if success=True)
    feedback: Optional[str] = None  # Optional text feedback
    
    class Config:
        json_schema_extra = {
            "example": {
                "volunteer_id": "vol_001",
                "task_id": "task_001",
                "success": True,
                "rating": 4.5,
                "feedback": "Excellent work! Very thorough cleanup."
            }
        }


class MatchedVolunteer(BaseModel):
    """Model for returning matched volunteer with score breakdown."""
    
    volunteer: Volunteer
    match_score: float  # 0-100
    score_breakdown: Dict[str, float]  # Components: skill_match, proximity, availability, etc.
    
    class Config:
        json_schema_extra = {
            "example": {
                "volunteer": {
                    "id": "vol_001",
                    "name": "Raj Kumar",
                    "email": "raj@example.com",
                    "skills": ["cleanup"],
                    "location": {"lat": 28.6139, "lng": 77.2090},
                    "availability": True,
                    "reliability_score": 75,
                    "tasks_completed": 12,
                    "success_rate": 0.92,
                    "avg_rating": 4.5,
                    "no_show_count": 1,
                    "domain_scores": {"pollution": 25}
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
        }
