"""
Unit tests for the volunteer matching system.

Run with: pytest test_matching_system.py -v
"""

import pytest
from models import Volunteer, Task
from matching_algorithm import (
    calculate_distance,
    normalize_score,
    calculate_skill_match,
    calculate_proximity_score,
    calculate_volunteer_match_score,
    get_best_volunteers
)
from learning_system import (
    update_volunteer_after_task,
    update_success_rate,
    get_volunteer_performance_summary
)
from storage import InMemoryStorage


# ============================================================================
# TEST SETUP
# ============================================================================

@pytest.fixture
def storage():
    """Create in-memory storage for testing."""
    return InMemoryStorage()


@pytest.fixture
def sample_volunteer():
    """Create a sample volunteer."""
    return Volunteer(
        id="vol_test_001",
        name="Test Volunteer",
        email="test@example.com",
        skills=["cleanup", "organizing"],
        location={"lat": 28.6139, "lng": 77.2090},
        availability=True,
        reliability_score=75,
        tasks_completed=10,
        success_rate=0.9,
        avg_rating=4.5,
        no_show_count=1,
        domain_scores={"pollution": 30}
    )


@pytest.fixture
def sample_task():
    """Create a sample task."""
    return Task(
        id="task_test_001",
        title="Test Task",
        description="This is a test task",
        required_skills=["cleanup"],
        location={"lat": 28.6140, "lng": 77.2091},
        domain="pollution",
        urgency="high",
        volunteers_needed=5
    )


# ============================================================================
# DISTANCE CALCULATION TESTS
# ============================================================================

class TestDistanceCalculation:
    
    def test_distance_same_location(self):
        """Distance between same location should be 0."""
        loc = {"lat": 28.6139, "lng": 77.2090}
        distance = calculate_distance(loc, loc)
        assert distance < 0.1  # Small floating point error
    
    def test_distance_known_points(self):
        """Test distance between known points."""
        # Delhi city center
        loc1 = {"lat": 28.6139, "lng": 77.2090}
        # ~1km away (approximate)
        loc2 = {"lat": 28.6200, "lng": 77.2100}
        
        distance = calculate_distance(loc1, loc2)
        assert 0.5 < distance < 2.0  # Should be approximately 1-2 km
    
    def test_distance_far_points(self):
        """Test distance for far locations."""
        # Delhi
        loc1 = {"lat": 28.6139, "lng": 77.2090}
        # Mumbai (approximately 1400km away)
        loc2 = {"lat": 19.0760, "lng": 72.8777}
        
        distance = calculate_distance(loc1, loc2)
        assert 1300 < distance < 1500


# ============================================================================
# SKILL MATCHING TESTS
# ============================================================================

class TestSkillMatching:
    
    def test_exact_skill_match(self):
        """Test when all required skills match."""
        volunteer_skills = ["cleanup", "organizing"]
        required_skills = ["cleanup", "organizing"]
        
        score = calculate_skill_match(volunteer_skills, required_skills)
        assert score == 100.0
    
    def test_partial_skill_match(self):
        """Test when some skills match."""
        volunteer_skills = ["cleanup", "organizing", "driving"]
        required_skills = ["cleanup", "organizing", "photography"]
        
        score = calculate_skill_match(volunteer_skills, required_skills)
        assert 50 < score < 100  # 2 out of 3 skills match
    
    def test_no_skill_match(self):
        """Test when no skills match."""
        volunteer_skills = ["driving", "photography"]
        required_skills = ["cleanup", "organizing"]
        
        score = calculate_skill_match(volunteer_skills, required_skills)
        assert score == 0.0
    
    def test_empty_required_skills(self):
        """Test when no skills are required."""
        volunteer_skills = ["cleanup"]
        required_skills = []
        
        score = calculate_skill_match(volunteer_skills, required_skills)
        assert score == 100.0


# ============================================================================
# PROXIMITY TESTS
# ============================================================================

class TestProximityScoring:
    
    def test_proximity_very_close(self):
        """Very close locations should get high score."""
        volunteer_loc = {"lat": 28.6139, "lng": 77.2090}
        task_loc = {"lat": 28.6139, "lng": 77.2090}
        
        score = calculate_proximity_score(volunteer_loc, task_loc)
        assert score > 95
    
    def test_proximity_far(self):
        """Far locations should get lower score."""
        volunteer_loc = {"lat": 28.6139, "lng": 77.2090}
        task_loc = {"lat": 28.4000, "lng": 77.0000}  # ~20km away
        
        score = calculate_proximity_score(volunteer_loc, task_loc)
        assert score < 50


# ============================================================================
# LEARNING SYSTEM TESTS
# ============================================================================

class TestLearningSystem:
    
    def test_success_updates_reliability(self, sample_volunteer, sample_task):
        """Successful task should increase reliability."""
        initial_score = sample_volunteer.reliability_score
        
        updated = update_volunteer_after_task(
            sample_volunteer,
            sample_task,
            success=True,
            rating=4.5
        )
        
        assert updated.reliability_score > initial_score
        assert updated.tasks_completed == sample_volunteer.tasks_completed + 1
    
    def test_failure_decreases_reliability(self, sample_volunteer, sample_task):
        """No-show should decrease reliability."""
        initial_score = sample_volunteer.reliability_score
        
        updated = update_volunteer_after_task(
            sample_volunteer,
            sample_task,
            success=False
        )
        
        assert updated.reliability_score < initial_score
        assert updated.no_show_count == sample_volunteer.no_show_count + 1
    
    def test_domain_score_increases(self, sample_volunteer, sample_task):
        """Domain expertise should increase on success."""
        initial_domain_score = sample_volunteer.domain_scores.get(sample_task.domain, 0)
        
        updated = update_volunteer_after_task(
            sample_volunteer,
            sample_task,
            success=True,
            rating=4.5
        )
        
        assert updated.domain_scores[sample_task.domain] > initial_domain_score
    
    def test_rating_updates_average(self, sample_volunteer, sample_task):
        """Rating should update average rating."""
        initial_avg = sample_volunteer.avg_rating
        
        updated = update_volunteer_after_task(
            sample_volunteer,
            sample_task,
            success=True,
            rating=3.0
        )
        
        # Average should move towards new rating
        assert updated.avg_rating != initial_avg
    
    def test_success_rate_calculation(self, sample_volunteer, sample_task):
        """Success rate should be calculated correctly."""
        updated = update_volunteer_after_task(
            sample_volunteer,
            sample_task,
            success=True
        )
        
        expected_rate = (sample_volunteer.tasks_completed + 1) / (
            sample_volunteer.tasks_completed + 1 + sample_volunteer.no_show_count
        )
        
        assert abs(updated.success_rate - expected_rate) < 0.01
    
    def test_scores_stay_in_bounds(self, sample_volunteer, sample_task):
        """All scores should stay within valid bounds."""
        # Multiple failures to try to drive scores negative
        updated = sample_volunteer
        for _ in range(20):
            updated = update_volunteer_after_task(updated, sample_task, success=False)
        
        assert 0 <= updated.reliability_score <= 100
        assert 0 <= updated.avg_rating <= 5
        assert 0 <= updated.success_rate <= 1


# ============================================================================
# MATCHING ALGORITHM TESTS
# ============================================================================

class TestMatchingAlgorithm:
    
    def test_perfect_match_scores_highest(self, sample_task, storage):
        """Perfect volunteer should score higher than others."""
        # Perfect volunteer: right skills, close location, available, high reliability
        perfect_vol = Volunteer(
            id="perfect_vol",
            name="Perfect Volunteer",
            email="perfect@example.com",
            skills=["cleanup", "organizing"],
            location=sample_task.location,
            availability=True,
            reliability_score=95,
            domain_scores={sample_task.domain: 80}
        )
        
        # Poor volunteer: no skills, far away, unavailable
        poor_vol = Volunteer(
            id="poor_vol",
            name="Poor Volunteer",
            email="poor@example.com",
            skills=[],
            location={"lat": 20.0, "lng": 70.0},
            availability=False,
            reliability_score=20,
            domain_scores={}
        )
        
        storage.create_volunteer(perfect_vol)
        storage.create_volunteer(poor_vol)
        
        matches = get_best_volunteers(sample_task, [perfect_vol, poor_vol], top_n=2)
        
        # Perfect volunteer should be first
        assert matches[0][0].id == "perfect_vol"
        assert matches[0][1] > matches[1][1]  # Higher score
    
    def test_unavailable_volunteers_excluded(self, sample_task):
        """Unavailable volunteers should not be returned."""
        available_vol = Volunteer(
            id="available",
            name="Available",
            email="avail@example.com",
            skills=["cleanup"],
            location=sample_task.location,
            availability=True,
            reliability_score=80
        )
        
        unavailable_vol = Volunteer(
            id="unavailable",
            name="Unavailable",
            email="unavail@example.com",
            skills=["cleanup"],
            location=sample_task.location,
            availability=False,
            reliability_score=95  # Even with higher reliability
        )
        
        matches = get_best_volunteers(
            sample_task,
            [available_vol, unavailable_vol],
            top_n=5
        )
        
        # Only available volunteer should be returned
        assert len(matches) == 1
        assert matches[0][0].id == "available"
    
    def test_top_n_limit(self, sample_task):
        """Only top_n volunteers should be returned."""
        volunteers = []
        for i in range(10):
            vol = Volunteer(
                id=f"vol_{i}",
                name=f"Volunteer {i}",
                email=f"vol{i}@example.com",
                skills=["cleanup"],
                location=sample_task.location,
                availability=True,
                reliability_score=50 + i,
                domain_scores={sample_task.domain: i}
            )
            volunteers.append(vol)
        
        matches = get_best_volunteers(sample_task, volunteers, top_n=3)
        
        assert len(matches) == 3


# ============================================================================
# STORAGE TESTS
# ============================================================================

class TestStorage:
    
    def test_create_and_retrieve_volunteer(self, storage, sample_volunteer):
        """Should be able to create and retrieve a volunteer."""
        storage.create_volunteer(sample_volunteer)
        retrieved = storage.get_volunteer(sample_volunteer.id)
        
        assert retrieved is not None
        assert retrieved.name == sample_volunteer.name
    
    def test_create_and_retrieve_task(self, storage, sample_task):
        """Should be able to create and retrieve a task."""
        storage.create_task(sample_task)
        retrieved = storage.get_task(sample_task.id)
        
        assert retrieved is not None
        assert retrieved.title == sample_task.title
    
    def test_filter_by_skill(self, storage):
        """Should be able to filter volunteers by skill."""
        vol1 = Volunteer(id="1", name="V1", email="v1@test.com", skills=["cleanup"])
        vol2 = Volunteer(id="2", name="V2", email="v2@test.com", skills=["teaching"])
        vol3 = Volunteer(id="3", name="V3", email="v3@test.com", skills=["cleanup", "teaching"])
        
        storage.create_volunteer(vol1)
        storage.create_volunteer(vol2)
        storage.create_volunteer(vol3)
        
        cleanup_volunteers = storage.get_volunteers_by_skill("cleanup")
        assert len(cleanup_volunteers) == 2
    
    def test_filter_by_domain(self, storage):
        """Should be able to filter tasks by domain."""
        task1 = Task(id="1", title="T1", domain="pollution", required_skills=[])
        task2 = Task(id="2", title="T2", domain="medical", required_skills=[])
        task3 = Task(id="3", title="T3", domain="pollution", required_skills=[])
        
        storage.create_task(task1)
        storage.create_task(task2)
        storage.create_task(task3)
        
        pollution_tasks = storage.get_tasks_by_domain("pollution")
        assert len(pollution_tasks) == 2


# ============================================================================
# INTEGRATION TESTS
# ============================================================================

class TestIntegration:
    
    def test_full_workflow(self, storage):
        """Test complete workflow: create volunteers, task, match, update."""
        # Create volunteers
        vol1 = Volunteer(
            id="vol1",
            name="Vol 1",
            email="vol1@test.com",
            skills=["cleanup"],
            location={"lat": 28.6139, "lng": 77.2090},
            availability=True,
            reliability_score=70
        )
        vol2 = Volunteer(
            id="vol2",
            name="Vol 2",
            email="vol2@test.com",
            skills=["cleanup", "organizing"],
            location={"lat": 28.6150, "lng": 77.2100},
            availability=True,
            reliability_score=80
        )
        
        storage.create_volunteer(vol1)
        storage.create_volunteer(vol2)
        
        # Create task
        task = Task(
            id="task1",
            title="Cleanup",
            required_skills=["cleanup", "organizing"],
            location={"lat": 28.6140, "lng": 77.2091},
            domain="pollution",
            volunteers_needed=2
        )
        storage.create_task(task)
        
        # Get matches
        volunteers = storage.get_all_volunteers()
        matches = get_best_volunteers(task, volunteers, top_n=2)
        
        assert len(matches) == 2
        # vol2 should score higher (has all skills)
        assert matches[0][0].id == "vol2"
        
        # Update after task completion
        updated_vol2 = update_volunteer_after_task(
            vol2, task, success=True, rating=4.5
        )
        storage.update_volunteer(updated_vol2)
        
        # Verify update
        retrieved = storage.get_volunteer("vol2")
        assert retrieved.tasks_completed == 1
        assert retrieved.reliability_score > vol2.reliability_score


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
