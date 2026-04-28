"""
Database/Storage layer for volunteers and tasks.
Supports both in-memory storage and Firestore (Firebase).
Use in-memory by default, switch to Firestore when needed.
"""

from typing import List, Optional, Dict, Any
from models import Volunteer, Task
import os
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

load_dotenv()

# ============================================================================
# STORAGE MODE SELECTION
# ============================================================================

USE_FIRESTORE = os.getenv("USE_FIRESTORE", "false").lower() == "true"


# ============================================================================
# IN-MEMORY STORAGE (default for development)
# ============================================================================

class InMemoryStorage:
    """Simple in-memory storage for development and testing."""
    
    def __init__(self):
        self.volunteers: Dict[str, Volunteer] = {}
        self.tasks: Dict[str, Task] = {}
    
    # ---- VOLUNTEER OPERATIONS ----
    
    def create_volunteer(self, volunteer: Volunteer) -> Volunteer:
        """Store a new volunteer."""
        self.volunteers[volunteer.id] = volunteer
        return volunteer
    
    def get_volunteer(self, volunteer_id: str) -> Optional[Volunteer]:
        """Retrieve a volunteer by ID."""
        return self.volunteers.get(volunteer_id)
    
    def update_volunteer(self, volunteer: Volunteer) -> Volunteer:
        """Update an existing volunteer."""
        self.volunteers[volunteer.id] = volunteer
        return volunteer
    
    def get_all_volunteers(self) -> List[Volunteer]:
        """Get all volunteers."""
        return list(self.volunteers.values())
    
    def get_volunteers_by_skill(self, skill: str) -> List[Volunteer]:
        """Get volunteers with a specific skill."""
        return [v for v in self.volunteers.values() if skill in v.skills]
    
    def delete_volunteer(self, volunteer_id: str) -> bool:
        """Delete a volunteer."""
        if volunteer_id in self.volunteers:
            del self.volunteers[volunteer_id]
            return True
        return False
    
    # ---- TASK OPERATIONS ----
    
    def create_task(self, task: Task) -> Task:
        """Store a new task."""
        self.tasks[task.id] = task
        return task
    
    def get_task(self, task_id: str) -> Optional[Task]:
        """Retrieve a task by ID."""
        return self.tasks.get(task_id)
    
    def update_task(self, task: Task) -> Task:
        """Update an existing task."""
        self.tasks[task.id] = task
        return task
    
    def get_all_tasks(self) -> List[Task]:
        """Get all tasks."""
        return list(self.tasks.values())
    
    def get_tasks_by_domain(self, domain: str) -> List[Task]:
        """Get tasks in a specific domain."""
        return [t for t in self.tasks.values() if t.domain == domain]
    
    def delete_task(self, task_id: str) -> bool:
        """Delete a task."""
        if task_id in self.tasks:
            del self.tasks[task_id]
            return True
        return False


# ============================================================================
# FIRESTORE STORAGE (production)
# ============================================================================

class FirestoreStorage:
    """Firestore-backed storage for production."""
    
    def __init__(self):
        # Initialize Firebase if not already done
        if not firebase_admin._apps:
            # Assuming credentials are set up via environment
            # You might need to configure this based on your setup
            pass
        
        self.db = firestore.client()
        self.volunteers_ref = self.db.collection("volunteers")
        self.tasks_ref = self.db.collection("tasks")
    
    def _volunteer_to_dict(self, volunteer: Volunteer) -> Dict[str, Any]:
        """Convert Volunteer object to dictionary for Firestore."""
        return volunteer.dict()
    
    def _dict_to_volunteer(self, data: Dict[str, Any]) -> Volunteer:
        """Convert Firestore dictionary back to Volunteer object."""
        return Volunteer(**data)
    
    def _task_to_dict(self, task: Task) -> Dict[str, Any]:
        """Convert Task object to dictionary for Firestore."""
        return task.dict()
    
    def _dict_to_task(self, data: Dict[str, Any]) -> Task:
        """Convert Firestore dictionary back to Task object."""
        return Task(**data)
    
    # ---- VOLUNTEER OPERATIONS ----
    
    def create_volunteer(self, volunteer: Volunteer) -> Volunteer:
        """Store a new volunteer in Firestore."""
        self.volunteers_ref.document(volunteer.id).set(self._volunteer_to_dict(volunteer))
        return volunteer
    
    def get_volunteer(self, volunteer_id: str) -> Optional[Volunteer]:
        """Retrieve a volunteer from Firestore."""
        doc = self.volunteers_ref.document(volunteer_id).get()
        if doc.exists:
            return self._dict_to_volunteer(doc.to_dict())
        return None
    
    def update_volunteer(self, volunteer: Volunteer) -> Volunteer:
        """Update a volunteer in Firestore."""
        self.volunteers_ref.document(volunteer.id).update(self._volunteer_to_dict(volunteer))
        return volunteer
    
    def get_all_volunteers(self) -> List[Volunteer]:
        """Get all volunteers from Firestore."""
        docs = self.volunteers_ref.stream()
        return [self._dict_to_volunteer(doc.to_dict()) for doc in docs]
    
    def get_volunteers_by_skill(self, skill: str) -> List[Volunteer]:
        """Get volunteers with a specific skill."""
        docs = self.volunteers_ref.where("skills", "array-contains", skill).stream()
        return [self._dict_to_volunteer(doc.to_dict()) for doc in docs]
    
    def delete_volunteer(self, volunteer_id: str) -> bool:
        """Delete a volunteer from Firestore."""
        self.volunteers_ref.document(volunteer_id).delete()
        return True
    
    # ---- TASK OPERATIONS ----
    
    def create_task(self, task: Task) -> Task:
        """Store a new task in Firestore."""
        self.tasks_ref.document(task.id).set(self._task_to_dict(task))
        return task
    
    def get_task(self, task_id: str) -> Optional[Task]:
        """Retrieve a task from Firestore."""
        doc = self.tasks_ref.document(task_id).get()
        if doc.exists:
            return self._dict_to_task(doc.to_dict())
        return None
    
    def update_task(self, task: Task) -> Task:
        """Update a task in Firestore."""
        self.tasks_ref.document(task.id).update(self._task_to_dict(task))
        return task
    
    def get_all_tasks(self) -> List[Task]:
        """Get all tasks from Firestore."""
        docs = self.tasks_ref.stream()
        return [self._dict_to_task(doc.to_dict()) for doc in docs]
    
    def get_tasks_by_domain(self, domain: str) -> List[Task]:
        """Get tasks in a specific domain."""
        docs = self.tasks_ref.where("domain", "==", domain).stream()
        return [self._dict_to_task(doc.to_dict()) for doc in docs]
    
    def delete_task(self, task_id: str) -> bool:
        """Delete a task from Firestore."""
        self.tasks_ref.document(task_id).delete()
        return True


# ============================================================================
# STORAGE FACTORY
# ============================================================================

def get_storage():
    """
    Get the appropriate storage implementation.
    Returns Firestore if USE_FIRESTORE=true, otherwise in-memory.
    """
    if USE_FIRESTORE:
        return FirestoreStorage()
    else:
        return InMemoryStorage()


# Create global storage instance
storage = get_storage()
