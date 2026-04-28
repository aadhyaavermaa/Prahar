"""
Example usage and testing of the volunteer matching system.

This script demonstrates:
1. Creating volunteers and tasks
2. Running the matching algorithm
3. Using the self-learning system
4. Checking performance updates
"""

import uuid
from datetime import datetime
from models import Volunteer, Task
from matching_algorithm import get_best_volunteers
from learning_system import update_volunteer_after_task, get_volunteer_performance_summary
from storage import storage


def create_demo_volunteers():
    """Create demo volunteers for testing."""
    
    # Volunteer 1: Experienced cleanup specialist
    vol1 = Volunteer(
        id="vol_001",
        name="Raj Kumar",
        email="raj@example.com",
        skills=["cleanup", "organizing", "physical_labor"],
        location={"lat": 28.6139, "lng": 77.2090},
        availability=True,
        reliability_score=80,
        tasks_completed=25,
        success_rate=0.95,
        avg_rating=4.6,
        no_show_count=1,
        domain_scores={"pollution": 45, "urban": 30}
    )
    
    # Volunteer 2: New volunteer with relevant skills
    vol2 = Volunteer(
        id="vol_002",
        name="Priya Singh",
        email="priya@example.com",
        skills=["cleanup", "education"],
        location={"lat": 28.6200, "lng": 77.2100},
        availability=True,
        reliability_score=60,
        tasks_completed=8,
        success_rate=0.87,
        avg_rating=4.1,
        no_show_count=1,
        domain_scores={"pollution": 15, "education": 20}
    )
    
    # Volunteer 3: Far away but available
    vol3 = Volunteer(
        id="vol_003",
        name="Amit Patel",
        email="amit@example.com",
        skills=["cleanup"],
        location={"lat": 28.5500, "lng": 77.1800},
        availability=True,
        reliability_score=50,
        tasks_completed=3,
        success_rate=0.67,
        avg_rating=3.5,
        no_show_count=1,
        domain_scores={"pollution": 5}
    )
    
    # Volunteer 4: Unavailable
    vol4 = Volunteer(
        id="vol_004",
        name="Neha Gupta",
        email="neha@example.com",
        skills=["cleanup", "organizing"],
        location={"lat": 28.6150, "lng": 77.2095},
        availability=False,
        reliability_score=85,
        tasks_completed=30,
        success_rate=0.93,
        avg_rating=4.8,
        no_show_count=2,
        domain_scores={"pollution": 50}
    )
    
    # Store volunteers
    for vol in [vol1, vol2, vol3, vol4]:
        storage.create_volunteer(vol)
    
    return [vol1, vol2, vol3, vol4]


def create_demo_task():
    """Create a demo task."""
    
    task = Task(
        id="task_001",
        title="Yamuna Ghat Cleanup Drive",
        description="Emergency cleanup needed at Yamuna Ghat 7. High plastic waste accumulation.",
        required_skills=["cleanup", "organizing"],
        location={"lat": 28.6140, "lng": 77.2091},
        domain="pollution",
        urgency="high",
        volunteers_needed=10,
        status="open"
    )
    
    storage.create_task(task)
    return task


def demo_matching():
    """Demonstrate the matching algorithm."""
    
    print("=" * 80)
    print("MATCHING DEMO")
    print("=" * 80)
    
    # Get task and volunteers
    task = storage.get_task("task_001")
    volunteers = storage.get_all_volunteers()
    
    print(f"\nTask: {task.title}")
    print(f"Location: {task.location}")
    print(f"Required Skills: {task.required_skills}")
    print(f"Domain: {task.domain}")
    print(f"\nMatching {len(volunteers)} volunteers...\n")
    
    # Get best matches
    matches = get_best_volunteers(task, volunteers, top_n=5)
    
    # Display results
    for i, (volunteer, score, breakdown) in enumerate(matches, 1):
        print(f"\n{i}. {volunteer.name} (ID: {volunteer.id})")
        print(f"   Overall Score: {score}/100")
        print(f"   Skill Match: {breakdown['skill_match']}/100")
        print(f"   Proximity: {breakdown['proximity']}/100")
        print(f"   Availability: {breakdown['availability']}/100")
        print(f"   Reliability: {breakdown['reliability']}/100")
        print(f"   Domain Expertise: {breakdown['domain_expertise']}/100")
        print(f"   Status: {'✓ Available' if volunteer.availability else '✗ Unavailable'}")


def demo_learning():
    """Demonstrate the self-learning system."""
    
    print("\n" + "=" * 80)
    print("SELF-LEARNING SYSTEM DEMO")
    print("=" * 80)
    
    task = storage.get_task("task_001")
    
    # Get initial state of volunteer 2
    vol2_id = "vol_002"
    vol2 = storage.get_volunteer(vol2_id)
    
    print(f"\n--- Initial State: {vol2.name} ---")
    print(f"Reliability Score: {vol2.reliability_score}")
    print(f"Tasks Completed: {vol2.tasks_completed}")
    print(f"Success Rate: {vol2.success_rate:.1%}")
    print(f"Avg Rating: {vol2.avg_rating}/5")
    print(f"Domain Scores: {vol2.domain_scores}")
    print(f"No-shows: {vol2.no_show_count}")
    
    # Scenario 1: Successful task with high rating
    print(f"\n--- Scenario 1: Task completed with 4.5★ rating ---")
    updated_vol2 = update_volunteer_after_task(
        volunteer=vol2,
        task=task,
        success=True,
        rating=4.5,
        feedback="Excellent work! Very thorough cleanup."
    )
    storage.update_volunteer(updated_vol2)
    
    print(f"Reliability Score: {updated_vol2.reliability_score} (was {vol2.reliability_score})")
    print(f"Tasks Completed: {updated_vol2.tasks_completed} (was {vol2.tasks_completed})")
    print(f"Success Rate: {updated_vol2.success_rate:.1%} (was {vol2.success_rate:.1%})")
    print(f"Avg Rating: {updated_vol2.avg_rating}/5 (was {vol2.avg_rating})")
    print(f"Domain Scores: {updated_vol2.domain_scores}")
    
    # Scenario 2: Another successful task with lower rating
    print(f"\n--- Scenario 2: Another task completed with 3.5★ rating ---")
    updated_vol2_2 = update_volunteer_after_task(
        volunteer=updated_vol2,
        task=task,
        success=True,
        rating=3.5,
        feedback="Good effort but could improve organization"
    )
    storage.update_volunteer(updated_vol2_2)
    
    print(f"Reliability Score: {updated_vol2_2.reliability_score}")
    print(f"Tasks Completed: {updated_vol2_2.tasks_completed}")
    print(f"Success Rate: {updated_vol2_2.success_rate:.1%}")
    print(f"Avg Rating: {updated_vol2_2.avg_rating}/5")
    print(f"Domain Scores: {updated_vol2_2.domain_scores}")
    
    # Scenario 3: No-show
    print(f"\n--- Scenario 3: Volunteer no-shows ---")
    updated_vol2_3 = update_volunteer_after_task(
        volunteer=updated_vol2_2,
        task=task,
        success=False
    )
    storage.update_volunteer(updated_vol2_3)
    
    print(f"Reliability Score: {updated_vol2_3.reliability_score}")
    print(f"No-shows: {updated_vol2_3.no_show_count}")
    print(f"Success Rate: {updated_vol2_3.success_rate:.1%}")
    
    # Show performance summary
    print(f"\n--- Final Performance Summary ---")
    summary = get_volunteer_performance_summary(updated_vol2_3)
    for key, value in summary.items():
        print(f"{key}: {value}")


def demo_comparison():
    """Compare matching scores before and after learning."""
    
    print("\n" + "=" * 80)
    print("BEFORE & AFTER LEARNING COMPARISON")
    print("=" * 80)
    
    task = storage.get_task("task_001")
    vol1 = storage.get_volunteer("vol_001")
    
    print(f"\nTask: {task.title}")
    print(f"Volunteer: {vol1.name}")
    
    # Get initial score
    from matching_algorithm import calculate_volunteer_match_score
    initial_score, initial_breakdown = calculate_volunteer_match_score(vol1, task)
    
    print(f"\n--- Before Learning ---")
    print(f"Overall Score: {initial_score}/100")
    for component, score in initial_breakdown.items():
        print(f"  {component}: {score}/100")
    
    # Simulate learning: multiple successes
    vol_updated = vol1
    for i in range(3):
        vol_updated = update_volunteer_after_task(
            volunteer=vol_updated,
            task=task,
            success=True,
            rating=4.5 + (i * 0.1)  # Increasing ratings
        )
    
    storage.update_volunteer(vol_updated)
    
    # Get final score
    final_score, final_breakdown = calculate_volunteer_match_score(vol_updated, task)
    
    print(f"\n--- After 3 Successful Tasks ---")
    print(f"Overall Score: {final_score}/100")
    for component, score in final_breakdown.items():
        print(f"  {component}: {score}/100")
    
    print(f"\nScore Change: {final_score - initial_score:+.1f} points")


if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("VOLUNTEER MATCHING SYSTEM - DEMONSTRATION")
    print("=" * 80)
    
    # Create demo data
    print("\n[1/4] Creating demo volunteers...")
    volunteers = create_demo_volunteers()
    print(f"✓ Created {len(volunteers)} volunteers")
    
    print("\n[2/4] Creating demo task...")
    task = create_demo_task()
    print(f"✓ Created task: {task.title}")
    
    print("\n[3/4] Running matching algorithm...")
    demo_matching()
    
    print("\n[4/4] Demonstrating self-learning system...")
    demo_learning()
    
    print("\n[5/5] Showing before/after learning comparison...")
    demo_comparison()
    
    print("\n" + "=" * 80)
    print("DEMO COMPLETE!")
    print("=" * 80)
    print("""
NEXT STEPS:
1. Start the FastAPI server: python -m uvicorn main:app --reload
2. API Documentation: http://localhost:8000/docs
3. Try the endpoints:
   - GET /api/matching/match/{task_id} - Get volunteer matches
   - POST /api/matching/update-performance - Update after task
   - GET /api/matching/leaderboard - See top volunteers
   
See matching_routes.py for full endpoint documentation.
""")
