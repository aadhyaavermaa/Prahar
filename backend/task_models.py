"""
Data models for autonomous task generation system
"""
from datetime import datetime, timedelta
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field
import uuid


class Domain(str, Enum):
    """Environmental domains for monitoring"""
    AIR = "air"
    FLOOD = "flood"
    WATER = "water"
    GENERAL = "general"


class Severity(str, Enum):
    """Task severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TaskStatus(str, Enum):
    """Task status tracking"""
    OPEN = "open"
    ASSIGNED = "assigned"
    COMPLETED = "completed"


class Zone(BaseModel):
    """
    Zone model representing a geographical area with environmental data
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., description="Human-readable zone name")
    latitude: float = Field(..., ge=-90, le=90, description="Geographic latitude")
    longitude: float = Field(..., ge=-180, le=180, description="Geographic longitude")
    aqi: float = Field(..., ge=0, description="Air Quality Index")
    rainfall: float = Field(..., ge=0, description="Rainfall in mm")
    water_level: float = Field(..., ge=0, description="Water level measurement")
    population_density: float = Field(..., ge=0, description="People per square km")
    domain: Domain = Field(..., description="Primary environmental domain")
    
    # Optional fields for enhanced monitoring
    temperature: Optional[float] = Field(None, description="Temperature in Celsius")
    humidity: Optional[float] = Field(None, ge=0, le=100, description="Humidity percentage")
    wind_speed: Optional[float] = Field(None, ge=0, description="Wind speed km/h")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        use_enum_values = True


class Task(BaseModel):
    """
    Task model representing autonomous generated civic tasks
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = Field(..., description="Task title")
    description: str = Field(..., description="Detailed task description")
    zone_id: str = Field(..., description="Associated zone ID")
    zone_name: str = Field(..., description="Zone name for reference")
    domain: Domain = Field(..., description="Task domain category")
    severity: Severity = Field(..., description="Task severity level")
    volunteers_needed: int = Field(..., ge=1, le=100, description="Number of volunteers required")
    status: TaskStatus = Field(default=TaskStatus.OPEN, description="Current task status")
    
    # Enhanced fields for autonomous system
    severity_score: float = Field(..., description="Calculated severity score")
    predicted_risk: str = Field(..., description="Risk prediction timeframe")
    creation_reason: str = Field(..., description="Why this task was created")
    data_triggers: List[str] = Field(default_factory=list, description="Data values that triggered task")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    assigned_at: Optional[datetime] = Field(None, description="Task assignment timestamp")
    completed_at: Optional[datetime] = Field(None, description="Task completion timestamp")
    
    class Config:
        use_enum_values = True


class TaskGenerationLog(BaseModel):
    """
    Log entry for task generation process
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    zones_processed: int = Field(..., description="Number of zones analyzed")
    tasks_generated: int = Field(..., description="Number of tasks created")
    tasks_skipped: int = Field(..., description="Number of duplicate tasks avoided")
    processing_time: float = Field(..., description="Processing time in seconds")
    details: List[str] = Field(default_factory=list, description="Detailed log entries")


class EnvironmentalThreshold(BaseModel):
    """
    Configuration for environmental thresholds
    """
    domain: Domain
    parameter: str  # e.g., 'aqi', 'rainfall', 'water_level'
    threshold_value: float
    comparison: str  # '>', '<', '>=', '<='
    task_template: str
    severity_multiplier: float = 1.0


class TaskGenerationConfig(BaseModel):
    """
    Configuration for task generation system
    """
    enabled: bool = True
    generation_interval_minutes: int = Field(default=60, description="Auto-generation interval")
    max_tasks_per_zone: int = Field(default=5, description="Maximum tasks per zone")
    duplicate_threshold_hours: int = Field(default=24, description="Hours to consider tasks duplicate")
    noise_factor: float = Field(default=0.1, description="Data noise factor for realism")
    
    # Severity calculation parameters
    severity_weights: dict = Field(default_factory=lambda: {
        'aqi': 1.0,
        'rainfall': 0.8,
        'water_level': 0.9,
        'population_density': 0.5
    })
    
    # Volunteer calculation parameters
    volunteers_per_severity_unit: float = Field(default=100.0, description="Volunteers per severity score unit")
    min_volunteers: int = Field(default=5, description="Minimum volunteers needed")
    max_volunteers: int = Field(default=50, description="Maximum volunteers needed")


class SimulatedDataConfig(BaseModel):
    """
    Configuration for simulated environmental data
    """
    num_zones: int = Field(default=20, description="Number of zones to simulate")
    update_frequency_minutes: int = Field(default=30, description="Data update frequency")
    noise_factor: float = Field(default=0.1, description="Data noise factor for realism")
    
    # Data ranges for simulation
    aqi_range: tuple = Field(default=(50, 500), description="AQI range")
    rainfall_range: tuple = Field(default=(0, 200), description="Rainfall range in mm")
    water_level_range: tuple = Field(default=(0, 10), description="Water level range")
    population_density_range: tuple = Field(default=(100, 5000), description="Population density range")
    temperature_range: tuple = Field(default=(15, 45), description="Temperature range")
    humidity_range: tuple = Field(default=(30, 90), description="Humidity range")
    wind_speed_range: tuple = Field(default=(0, 50), description="Wind speed range")
