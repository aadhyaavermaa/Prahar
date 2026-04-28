"""
Self-learning system that updates volunteer metrics based on task performance.
This is the core "learning" component - it improves over time without ML.
"""

from typing import Dict, Optional
from models import Volunteer, Task
from datetime import datetime


# ============================================================================
# CONSTANTS
# ============================================================================

# Score adjustments
RELIABILITY_INCREASE_SUCCESS = 5  # Increase when task completed
RELIABILITY_DECREASE_FAILURE = 10  # Decrease on no-show
DOMAIN_SCORE_INCREASE = 3  # Increase domain expertise on success
DOMAIN_SCORE_INCREASE_HIGH_RATING = 2  # Extra increase for high ratings

# Bounds to keep scores valid
MIN_RELIABILITY_SCORE = 0
MAX_RELIABILITY_SCORE = 100
MIN_DOMAIN_SCORE = 0
MAX_DOMAIN_SCORE = 100
MIN_RATING = 1.0
MAX_RATING = 5.0

# Rating thresholds for bonus learning
HIGH_RATING_THRESHOLD = 4.0  # 4+ stars gets bonus
LOW_RATING_THRESHOLD = 2.5  # 2.5- stars is concerning


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def clamp_score(value: float, min_val: float, max_val: float) -> float:
    """
    Ensure a score stays within valid bounds.
    
    Args:
        value: The value to clamp
        min_val: Minimum acceptable value
        max_val: Maximum acceptable value
    
    Returns:
        Clamped value
    """
    return max(min_val, min(value, max_val))


def update_average_rating(
    current_avg: float,
    num_ratings: int,
    new_rating: float
) -> float:
    """
    Update running average rating with new rating.
    
    Args:
        current_avg: Current average rating
        num_ratings: Number of ratings so far (for next calculation)
        new_rating: New rating to add
    
    Returns:
        Updated average rating
    """
    # We use tasks_completed as proxy for number of successful ratings
    new_avg = (current_avg * num_ratings + new_rating) / (num_ratings + 1)
    return round(new_avg, 2)


def update_success_rate(
    current_success_rate: float,
    tasks_completed: int,
    no_shows: int
) -> float:
    """
    Update success rate based on successes and failures.
    
    Success rate = tasks_completed / (tasks_completed + no_shows)
    
    Args:
        current_success_rate: Current success rate (0-1)
        tasks_completed: Number of tasks completed
        no_shows: Number of no-shows
    
    Returns:
        Updated success rate (0-1)
    """
    total_tasks = tasks_completed + no_shows
    
    if total_tasks == 0:
        return 0.0
    
    success_rate = tasks_completed / total_tasks
    return round(success_rate, 3)


# ============================================================================
# MAIN UPDATE FUNCTION
# ============================================================================

def update_volunteer_after_task(
    volunteer: Volunteer,
    task: Task,
    success: bool,
    rating: Optional[float] = None,
    feedback: Optional[str] = None
) -> Volunteer:
    """
    Update volunteer's learning metrics based on task performance.
    This is the core self-learning mechanism.
    
    Args:
        volunteer: The volunteer to update
        task: The task that was completed/skipped
        success: True if volunteer completed task, False if no-show
        rating: Optional rating (1-5) given by task organizer
        feedback: Optional text feedback
    
    Returns:
        Updated volunteer object
    """
    
    # Create updated volunteer object (immutable updates)
    updated_vol = volunteer.copy(deep=True)
    updated_vol.updated_at = datetime.now()
    
    # ========================================================================
    # SUCCESS PATH: Volunteer completed the task
    # ========================================================================
    if success:
        # Increase reliability (positive reinforcement)
        updated_vol.reliability_score += RELIABILITY_INCREASE_SUCCESS
        
        # Increment task counter
        updated_vol.tasks_completed += 1
        
        # Add domain expertise score
        if task.domain not in updated_vol.domain_scores:
            updated_vol.domain_scores[task.domain] = 0
        
        updated_vol.domain_scores[task.domain] += DOMAIN_SCORE_INCREASE
        
        # Handle rating if provided
        if rating is not None:
            # Validate rating
            rating = clamp_score(rating, MIN_RATING, MAX_RATING)
            
            # Update average rating
            updated_vol.avg_rating = update_average_rating(
                updated_vol.avg_rating,
                updated_vol.tasks_completed - 1,  # Before increment
                rating
            )
            
            # Bonus learning: high ratings boost domain expertise more
            if rating >= HIGH_RATING_THRESHOLD:
                updated_vol.domain_scores[task.domain] += DOMAIN_SCORE_INCREASE_HIGH_RATING
            
            # Penalty: low ratings might indicate quality issues
            elif rating <= LOW_RATING_THRESHOLD:
                # Don't penalize heavily, but note it
                updated_vol.reliability_score -= 2
    
    # ========================================================================
    # FAILURE PATH: Volunteer no-showed
    # ========================================================================
    else:
        # Decrease reliability (negative reinforcement)
        updated_vol.reliability_score -= RELIABILITY_DECREASE_FAILURE
        updated_vol.no_show_count += 1
    
    # ========================================================================
    # UPDATE SUCCESS RATE (for both success and failure)
    # ========================================================================
    updated_vol.success_rate = update_success_rate(
        updated_vol.success_rate,
        updated_vol.tasks_completed,
        updated_vol.no_show_count
    )
    
    # ========================================================================
    # CLAMP ALL SCORES TO VALID RANGES
    # ========================================================================
    
    # Reliability score: 0-100
    updated_vol.reliability_score = clamp_score(
        updated_vol.reliability_score,
        MIN_RELIABILITY_SCORE,
        MAX_RELIABILITY_SCORE
    )
    
    # Domain scores: 0-100
    for domain in updated_vol.domain_scores:
        updated_vol.domain_scores[domain] = clamp_score(
            updated_vol.domain_scores[domain],
            MIN_DOMAIN_SCORE,
            MAX_DOMAIN_SCORE
        )
    
    # Average rating: 0-5
    updated_vol.avg_rating = clamp_score(
        updated_vol.avg_rating,
        0.0,
        MAX_RATING
    )
    
    # Success rate: 0-1
    updated_vol.success_rate = clamp_score(
        updated_vol.success_rate,
        0.0,
        1.0
    )
    
    return updated_vol


# ============================================================================
# ANALYTICS FUNCTIONS (for insights)
# ============================================================================

def get_volunteer_performance_summary(volunteer: Volunteer) -> Dict:
    """
    Generate a performance summary for a volunteer.
    Useful for dashboards and analytics.
    
    Args:
        volunteer: Volunteer to summarize
    
    Returns:
        Dictionary with performance metrics
    """
    return {
        "volunteer_id": volunteer.id,
        "name": volunteer.name,
        "tasks_completed": volunteer.tasks_completed,
        "no_show_count": volunteer.no_show_count,
        "total_engagements": volunteer.tasks_completed + volunteer.no_show_count,
        "success_rate": volunteer.success_rate,
        "reliability_score": volunteer.reliability_score,
        "average_rating": volunteer.avg_rating,
        "domain_expertise": volunteer.domain_scores,
        "status": determine_volunteer_status(volunteer)
    }


def determine_volunteer_status(volunteer: Volunteer) -> str:
    """
    Determine volunteer status based on performance metrics.
    
    Args:
        volunteer: Volunteer to evaluate
    
    Returns:
        Status string: "excellent", "good", "average", "concerning", "inactive"
    """
    # Inactive (no tasks)
    if volunteer.tasks_completed == 0:
        return "inactive"
    
    # Calculate risk factor: combine reliability, success rate, ratings
    risk_score = (
        (100 - volunteer.reliability_score) * 0.4 +
        (1 - volunteer.success_rate) * 40 +
        (MAX_RATING - volunteer.avg_rating) * 10
    )
    
    # High no-show rate is concerning
    if volunteer.no_show_count > volunteer.tasks_completed * 0.2:  # >20% no-shows
        return "concerning"
    
    # Status determination
    if risk_score < 10:
        return "excellent"
    elif risk_score < 20:
        return "good"
    elif risk_score < 35:
        return "average"
    else:
        return "concerning"
