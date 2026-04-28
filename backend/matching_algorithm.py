"""
Volunteer matching algorithm.
Uses weighted scoring system to match volunteers to tasks.
No machine learning libraries - pure mathematical scoring.
"""

import math
from typing import List, Tuple, Dict
from models import Volunteer, Task


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def calculate_distance(loc1: Dict[str, float], loc2: Dict[str, float]) -> float:
    """
    Calculate distance between two locations using Haversine formula.
    Returns distance in kilometers.
    
    Args:
        loc1: {"lat": float, "lng": float}
        loc2: {"lat": float, "lng": float}
    
    Returns:
        Distance in kilometers
    """
    # Earth radius in km
    R = 6371
    
    lat1 = math.radians(loc1["lat"])
    lat2 = math.radians(loc2["lat"])
    delta_lat = math.radians(loc2["lat"] - loc1["lat"])
    delta_lng = math.radians(loc2["lng"] - loc1["lng"])
    
    # Haversine formula
    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(delta_lng / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    distance = R * c
    
    return distance


def normalize_score(value: float, min_val: float, max_val: float, inverse: bool = False) -> float:
    """
    Normalize a value to 0-100 scale.
    
    Args:
        value: The value to normalize
        min_val: Minimum possible value
        max_val: Maximum possible value
        inverse: If True, higher values give lower scores (for distance, for example)
    
    Returns:
        Normalized score 0-100
    """
    # Clamp value between min and max
    clamped = max(min_val, min(value, max_val))
    
    # Calculate normalized score 0-1
    if max_val == min_val:
        normalized = 0.5
    else:
        normalized = (clamped - min_val) / (max_val - min_val)
    
    # Invert if needed (distance: closer = higher score)
    if inverse:
        normalized = 1 - normalized
    
    # Scale to 0-100
    return normalized * 100


def calculate_skill_match(volunteer_skills: List[str], required_skills: List[str]) -> float:
    """
    Calculate skill match percentage.
    
    Args:
        volunteer_skills: List of skills volunteer has
        required_skills: List of skills required for task
    
    Returns:
        Score 0-100
    """
    if not required_skills:
        return 100.0
    
    if not volunteer_skills:
        return 0.0
    
    # Count matching skills
    matching_skills = len(set(volunteer_skills) & set(required_skills))
    match_percentage = (matching_skills / len(required_skills)) * 100
    
    return min(match_percentage, 100.0)


def calculate_proximity_score(volunteer_loc: Dict[str, float], task_loc: Dict[str, float]) -> float:
    """
    Calculate proximity score (closer = better).
    Distance thresholds:
    - 0-1 km: 100 points
    - 1-5 km: 80-99 points
    - 5-15 km: 40-79 points
    - 15+ km: 0-39 points
    
    Args:
        volunteer_loc: Volunteer's location
        task_loc: Task's location
    
    Returns:
        Score 0-100
    """
    distance = calculate_distance(volunteer_loc, task_loc)
    
    if distance <= 1:
        return 100.0
    elif distance <= 5:
        return normalize_score(distance, 1, 5, inverse=True) * 0.8 + 20
    elif distance <= 15:
        return normalize_score(distance, 5, 15, inverse=True) * 0.4 + 40
    else:
        return max(0, 40 - (distance - 15) * 2)  # Decay after 15 km


def calculate_availability_score(volunteer_available: bool) -> float:
    """
    Calculate availability score.
    
    Args:
        volunteer_available: Whether volunteer is available
    
    Returns:
        100 if available, 0 otherwise
    """
    return 100.0 if volunteer_available else 0.0


def calculate_reliability_score(reliability_score: float) -> float:
    """
    Use reliability_score directly (already on 0-100 scale).
    
    Args:
        reliability_score: Volunteer's reliability score (0-100)
    
    Returns:
        Score 0-100
    """
    return min(max(reliability_score, 0), 100)


def calculate_domain_expertise_score(volunteer_domain_scores: Dict[str, float], task_domain: str) -> float:
    """
    Calculate domain expertise score.
    Returns score for specific domain, or baseline if not present.
    
    Args:
        volunteer_domain_scores: Dict of domain scores
        task_domain: The task's domain
    
    Returns:
        Score 0-100
    """
    if task_domain in volunteer_domain_scores:
        # Normalize domain score (assume max domain score is 100)
        return min(volunteer_domain_scores[task_domain], 100)
    
    # Return baseline if no experience in this domain
    return 20.0


# ============================================================================
# MAIN MATCHING FUNCTION
# ============================================================================

def calculate_volunteer_match_score(
    volunteer: Volunteer,
    task: Task
) -> Tuple[float, Dict[str, float]]:
    """
    Calculate comprehensive match score for a volunteer for a specific task.
    
    Scoring weights (total = 100%):
    - Skill match: 30%
    - Proximity: 20%
    - Availability: 10%
    - Reliability: 25%
    - Domain expertise: 15%
    
    Args:
        volunteer: Volunteer object
        task: Task object
    
    Returns:
        Tuple of (final_score: float, score_breakdown: Dict)
    """
    # Calculate individual component scores (0-100)
    skill_match = calculate_skill_match(volunteer.skills, task.required_skills)
    proximity = calculate_proximity_score(volunteer.location, task.location)
    availability = calculate_availability_score(volunteer.availability)
    reliability = calculate_reliability_score(volunteer.reliability_score)
    domain_expertise = calculate_domain_expertise_score(volunteer.domain_scores, task.domain)
    
    # Apply weights
    weights = {
        "skill_match": 0.30,
        "proximity": 0.20,
        "availability": 0.10,
        "reliability": 0.25,
        "domain_expertise": 0.15
    }
    
    # Calculate weighted final score
    final_score = (
        skill_match * weights["skill_match"] +
        proximity * weights["proximity"] +
        availability * weights["availability"] +
        reliability * weights["reliability"] +
        domain_expertise * weights["domain_expertise"]
    )
    
    # Breakdown for debugging/transparency
    score_breakdown = {
        "skill_match": round(skill_match, 2),
        "proximity": round(proximity, 2),
        "availability": round(availability, 2),
        "reliability": round(reliability, 2),
        "domain_expertise": round(domain_expertise, 2)
    }
    
    return round(final_score, 2), score_breakdown


def get_best_volunteers(
    task: Task,
    volunteers: List[Volunteer],
    top_n: int = 5
) -> List[Tuple[Volunteer, float, Dict[str, float]]]:
    """
    Get the best matching volunteers for a task.
    
    Args:
        task: Task to match
        volunteers: List of available volunteers
        top_n: Number of top volunteers to return
    
    Returns:
        List of tuples: (volunteer, final_score, score_breakdown)
        Sorted by final_score descending
    """
    # Calculate scores for all volunteers
    scored_volunteers = []
    
    for volunteer in volunteers:
        # Filter out unavailable volunteers early
        if not volunteer.availability:
            continue
        
        final_score, breakdown = calculate_volunteer_match_score(volunteer, task)
        scored_volunteers.append((volunteer, final_score, breakdown))
    
    # Sort by score descending
    scored_volunteers.sort(key=lambda x: x[1], reverse=True)
    
    # Return top N
    return scored_volunteers[:top_n]
