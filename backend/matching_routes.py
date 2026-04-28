"""
FastAPI routes for the volunteer matching system.
Handles HTTP requests and integrates all components.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List
from models import (
    Volunteer,
    Task,
    TaskPerformanceFeedback,
    MatchedVolunteer
)
from matching_algorithm import get_best_volunteers
from learning_system import update_volunteer_after_task, get_volunteer_performance_summary
from storage import storage

# Create router for matching system endpoints
matching_router = APIRouter(prefix="/api/matching", tags=["volunteer-matching"])


# ============================================================================
# VOLUNTEER ENDPOINTS
# ============================================================================

@matching_router.post("/volunteers", response_model=Volunteer)
async def create_volunteer(volunteer: Volunteer):
    """
    Create a new volunteer profile.
    
    Args:
        volunteer: Volunteer data
    
    Returns:
        Created volunteer
    """
    try:
        created = storage.create_volunteer(volunteer)
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create volunteer: {str(e)}")


@matching_router.get("/volunteers/{volunteer_id}", response_model=Volunteer)
async def get_volunteer(volunteer_id: str):
    """
    Get volunteer profile by ID.
    
    Args:
        volunteer_id: Volunteer ID
    
    Returns:
        Volunteer data
    """
    volunteer = storage.get_volunteer(volunteer_id)
    if not volunteer:
        raise HTTPException(status_code=404, detail=f"Volunteer {volunteer_id} not found")
    return volunteer


@matching_router.put("/volunteers/{volunteer_id}", response_model=Volunteer)
async def update_volunteer(volunteer_id: str, volunteer_data: Volunteer):
    """
    Update volunteer profile.
    
    Args:
        volunteer_id: Volunteer ID
        volunteer_data: Updated volunteer data
    
    Returns:
        Updated volunteer
    """
    existing = storage.get_volunteer(volunteer_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Volunteer {volunteer_id} not found")
    
    try:
        updated = storage.update_volunteer(volunteer_data)
        return updated
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update volunteer: {str(e)}")


@matching_router.get("/volunteers", response_model=List[Volunteer])
async def list_volunteers(skill: str = Query(None)):
    """
    List all volunteers, optionally filtered by skill.
    
    Args:
        skill: Optional skill filter
    
    Returns:
        List of volunteers
    """
    if skill:
        return storage.get_volunteers_by_skill(skill)
    return storage.get_all_volunteers()


@matching_router.get("/volunteers/{volunteer_id}/performance")
async def get_volunteer_performance(volunteer_id: str):
    """
    Get performance summary for a volunteer.
    
    Args:
        volunteer_id: Volunteer ID
    
    Returns:
        Performance metrics
    """
    volunteer = storage.get_volunteer(volunteer_id)
    if not volunteer:
        raise HTTPException(status_code=404, detail=f"Volunteer {volunteer_id} not found")
    
    return get_volunteer_performance_summary(volunteer)


# ============================================================================
# TASK ENDPOINTS
# ============================================================================

@matching_router.post("/tasks", response_model=Task)
async def create_task(task: Task):
    """
    Create a new task.
    
    Args:
        task: Task data
    
    Returns:
        Created task
    """
    try:
        created = storage.create_task(task)
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create task: {str(e)}")


@matching_router.get("/tasks/{task_id}", response_model=Task)
async def get_task(task_id: str):
    """
    Get task by ID.
    
    Args:
        task_id: Task ID
    
    Returns:
        Task data
    """
    task = storage.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return task


@matching_router.put("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, task_data: Task):
    """
    Update a task.
    
    Args:
        task_id: Task ID
        task_data: Updated task data
    
    Returns:
        Updated task
    """
    existing = storage.get_task(task_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    
    try:
        updated = storage.update_task(task_data)
        return updated
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update task: {str(e)}")


@matching_router.get("/tasks", response_model=List[Task])
async def list_tasks(domain: str = Query(None)):
    """
    List all tasks, optionally filtered by domain.
    
    Args:
        domain: Optional domain filter
    
    Returns:
        List of tasks
    """
    if domain:
        return storage.get_tasks_by_domain(domain)
    return storage.get_all_tasks()


# ============================================================================
# MATCHING ENDPOINTS (Core functionality)
# ============================================================================

@matching_router.get("/match/{task_id}", response_model=List[MatchedVolunteer])
async def match_volunteers_for_task(
    task_id: str,
    top_n: int = Query(5, ge=1, le=20)
):
    """
    Get best matched volunteers for a task.
    
    This is the main matching endpoint. It returns the top N volunteers
    ranked by compatibility score considering:
    - Skill match (30%)
    - Proximity (20%)
    - Availability (10%)
    - Reliability (25%)
    - Domain expertise (15%)
    
    Args:
        task_id: ID of the task
        top_n: Number of top matches to return (1-20)
    
    Returns:
        List of matched volunteers with scores
    
    Example:
        GET /api/matching/match/task_001?top_n=5
    """
    # Get the task
    task = storage.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    
    # Get all available volunteers
    all_volunteers = storage.get_all_volunteers()
    
    if not all_volunteers:
        return []
    
    try:
        # Get best matches
        matched = get_best_volunteers(task, all_volunteers, top_n=top_n)
        
        # Format response
        result = [
            MatchedVolunteer(
                volunteer=volunteer,
                match_score=score,
                score_breakdown=breakdown
            )
            for volunteer, score, breakdown in matched
        ]
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matching failed: {str(e)}")


# ============================================================================
# LEARNING ENDPOINTS (Self-learning system)
# ============================================================================

@matching_router.post("/update-performance")
async def update_volunteer_performance(feedback: TaskPerformanceFeedback):
    """
    Update volunteer metrics based on task performance (LEARNING ENDPOINT).
    
    This endpoint is the core of the self-learning system. After a task is
    completed or a volunteer no-shows, this endpoint should be called to
    update their performance metrics.
    
    Rules:
    - If success=True:
      - Reliability score increases by 5
      - Domain expertise increases by 3 (+ 2 bonus if rating >= 4.0)
      - Tasks completed counter increments
    - If success=False:
      - Reliability score decreases by 10
      - No-show counter increments
    
    All scores are normalized to valid ranges.
    
    Args:
        feedback: Performance feedback
    
    Returns:
        Updated volunteer
    
    Example:
        POST /api/matching/update-performance
        {
            "volunteer_id": "vol_001",
            "task_id": "task_001",
            "success": true,
            "rating": 4.5,
            "feedback": "Excellent work!"
        }
    """
    # Get volunteer and task
    volunteer = storage.get_volunteer(feedback.volunteer_id)
    if not volunteer:
        raise HTTPException(status_code=404, detail=f"Volunteer {feedback.volunteer_id} not found")
    
    task = storage.get_task(feedback.task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {feedback.task_id} not found")
    
    try:
        # Update volunteer using learning system
        updated_volunteer = update_volunteer_after_task(
            volunteer=volunteer,
            task=task,
            success=feedback.success,
            rating=feedback.rating,
            feedback=feedback.feedback
        )
        
        # Save updated volunteer
        storage.update_volunteer(updated_volunteer)
        
        return {
            "status": "success",
            "volunteer": updated_volunteer,
            "message": f"Volunteer performance updated. New reliability score: {updated_volunteer.reliability_score}, Success rate: {updated_volunteer.success_rate:.1%}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update performance: {str(e)}")


@matching_router.get("/leaderboard")
async def get_leaderboard(domain: str = Query(None), limit: int = Query(10, ge=1, le=100)):
    """
    Get leaderboard of top volunteers.
    
    Args:
        domain: Optional domain filter
        limit: Number of volunteers to return
    
    Returns:
        List of top performers with metrics
    """
    volunteers = storage.get_all_volunteers()
    
    # Filter by domain if specified
    if domain:
        volunteers = [
            v for v in volunteers
            if domain in v.domain_scores and v.domain_scores[domain] > 0
        ]
    
    # Sort by composite score (reliability + success rate + avg rating)
    volunteers.sort(
        key=lambda v: (v.reliability_score * 0.5 + v.success_rate * 50 + v.avg_rating * 10),
        reverse=True
    )
    
    # Get top N
    leaderboard = []
    for rank, vol in enumerate(volunteers[:limit], 1):
        summary = get_volunteer_performance_summary(vol)
        summary["rank"] = rank
        leaderboard.append(summary)
    
    return leaderboard


# ============================================================================
# HEALTH CHECK
# ============================================================================

@matching_router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "volunteer-matching",
        "storage_type": "firestore" if hasattr(storage, 'db') else "in-memory"
    }
