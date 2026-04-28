"""
Impact Forecasting System - Data Models and Structures
Models for predicting task impact before execution
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field
import uuid


class TaskDomain(str, Enum):
    """Task domain categories for impact calculation"""
    POLLUTION = "pollution"
    FLOOD = "flood"
    MEDICAL = "medical"
    WATER = "water"
    EDUCATION = "education"
    GENERAL = "general"


class TaskSeverity(str, Enum):
    """Task severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TaskStatus(str, Enum):
    """Task status tracking"""
    OPEN = "open"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class Task(BaseModel):
    """Task model for impact prediction"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = Field(..., description="Task title")
    description: str = Field(..., description="Task description")
    domain: TaskDomain = Field(..., description="Task domain")
    severity: TaskSeverity = Field(..., description="Task severity level")
    volunteers_assigned: int = Field(..., ge=0, description="Number of volunteers assigned")
    zone_id: str = Field(..., description="Associated zone ID")
    zone_name: str = Field(..., description="Zone name for reference")
    
    # Task metadata
    estimated_duration_hours: Optional[float] = Field(None, description="Estimated task duration")
    required_skills: List[str] = Field(default_factory=list, description="Required volunteer skills")
    resources_needed: List[str] = Field(default_factory=list, description="Resources needed for task")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    assigned_at: Optional[datetime] = Field(None, description="Task assignment timestamp")
    started_at: Optional[datetime] = Field(None, description="Task start timestamp")
    completed_at: Optional[datetime] = Field(None, description="Task completion timestamp")
    
    class Config:
        use_enum_values = True


class Zone(BaseModel):
    """Zone model for impact prediction"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., description="Zone name")
    latitude: float = Field(..., ge=-90, le=90, description="Geographic latitude")
    longitude: float = Field(..., ge=-180, le=180, description="Geographic longitude")
    
    # Environmental and demographic data
    current_severity_score: float = Field(..., ge=0, description="Current severity score (0-100)")
    population_density: float = Field(..., ge=0, description="People per square km")
    area_size: float = Field(..., ge=0, description="Area size in square km")
    
    # Domain-specific metrics
    pollution_level: Optional[float] = Field(None, ge=0, le=500, description="Air quality index")
    flood_risk: Optional[float] = Field(None, ge=0, le=100, description="Flood risk percentage")
    medical_need: Optional[float] = Field(None, ge=0, le=100, description="Medical need percentage")
    water_quality: Optional[float] = Field(None, ge=0, le=100, description="Water quality score")
    
    # Infrastructure data
    hospital_count: int = Field(default=0, ge=0, description="Number of hospitals")
    school_count: int = Field(default=0, ge=0, description="Number of schools")
    volunteer_availability: float = Field(default=50, ge=0, le=100, description="Volunteer availability percentage")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        use_enum_values = True


class HistoricalTask(BaseModel):
    """Historical task data for impact prediction improvement"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_id: str = Field(..., description="Original task ID")
    domain: TaskDomain = Field(..., description="Task domain")
    severity: TaskSeverity = Field(..., description="Task severity")
    volunteers_assigned: int = Field(..., ge=0, description="Volunteers assigned")
    zone_id: str = Field(..., description="Zone ID")
    
    # Actual impact results
    actual_impact_score: float = Field(..., ge=0, le=100, description="Actual measured impact")
    improvement_percentage: float = Field(..., description="Actual improvement percentage")
    duration_hours: float = Field(..., ge=0, description="Actual task duration")
    
    # Quality metrics
    volunteer_satisfaction: Optional[float] = Field(None, ge=0, le=5, description="Volunteer satisfaction rating")
    community_feedback: Optional[float] = Field(None, ge=0, le=5, description="Community feedback rating")
    
    # Timestamps
    completed_at: datetime = Field(..., description="Task completion timestamp")
    
    class Config:
        use_enum_values = True


class ImpactPrediction(BaseModel):
    """Impact prediction result model"""
    task_id: str = Field(..., description="Task ID")
    zone_id: str = Field(..., description="Zone ID")
    
    # Prediction results
    predicted_score: float = Field(..., ge=0, le=100, description="Predicted impact score (0-100)")
    improvement_percentage: float = Field(..., ge=0, le=100, description="Expected improvement percentage")
    confidence_score: float = Field(..., ge=0, le=100, description="Confidence in prediction (0-100)")
    
    # AI-generated content
    ai_explanation: str = Field(..., description="AI-generated explanation of expected impact")
    refined_prediction: Optional[float] = Field(None, ge=0, le=100, description="Gemini-refined prediction")
    
    # Calculation details
    calculation_log: List[str] = Field(default_factory=list, description="Step-by-step calculation log")
    base_efficiency: float = Field(..., description="Base efficiency used in calculation")
    severity_adjustment: float = Field(..., description="Severity adjustment factor")
    zone_factor: float = Field(..., description="Zone-specific adjustment factor")
    
    # Metadata
    prediction_method: str = Field(default="rule_based", description="Prediction method used")
    historical_data_used: bool = Field(default=False, description="Whether historical data was used")
    gemini_enhanced: bool = Field(default=False, description="Whether Gemini was used for enhancement")
    
    # Timestamps
    predicted_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        use_enum_values = True


class ImpactMetrics(BaseModel):
    """Impact metrics for domain-specific calculations"""
    domain: TaskDomain
    base_efficiency_per_volunteer: float = Field(..., description="Base impact points per volunteer")
    severity_multiplier: Dict[TaskSeverity, float] = Field(default_factory=dict, description="Severity multipliers")
    zone_factors: Dict[str, float] = Field(default_factory=dict, description="Zone-specific factors")
    
    class Config:
        use_enum_values = True


class ImpactPredictionConfig(BaseModel):
    """Configuration for impact prediction system"""
    enabled: bool = Field(default=True, description="Enable impact prediction")
    use_gemini: bool = Field(default=True, description="Use Gemini API for enhancement")
    use_historical_data: bool = Field(default=True, description="Use historical data for improvement")
    
    # Calculation parameters
    max_prediction_score: float = Field(default=100, description="Maximum prediction score")
    min_confidence_threshold: float = Field(default=30, description="Minimum confidence threshold")
    historical_weight: float = Field(default=0.3, description="Weight for historical data")
    
    # Gemini API settings
    gemini_model: str = Field(default="gemini-1.5-flash", description="Gemini model to use")
    gemini_temperature: float = Field(default=0.3, description="Gemini response temperature")
    gemini_max_tokens: int = Field(default=200, description="Maximum tokens for Gemini response")
    
    # Domain-specific base efficiencies
    domain_efficiencies: Dict[TaskDomain, float] = Field(default_factory=lambda: {
        TaskDomain.POLLUTION: 2.0,
        TaskDomain.FLOOD: 3.0,
        TaskDomain.MEDICAL: 4.0,
        TaskDomain.WATER: 2.5,
        TaskDomain.EDUCATION: 1.5,
        TaskDomain.GENERAL: 1.8
    })
    
    # Severity multipliers
    severity_multipliers: Dict[TaskSeverity, float] = Field(default_factory=lambda: {
        TaskSeverity.LOW: 1.0,
        TaskSeverity.MEDIUM: 1.3,
        TaskSeverity.HIGH: 1.6
    })


class PredictionLog(BaseModel):
    """Log entry for impact prediction requests"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_id: str = Field(..., description="Task ID")
    zone_id: str = Field(..., description="Zone ID")
    
    # Request details
    prediction_method: str = Field(..., description="Prediction method used")
    processing_time_ms: float = Field(..., description="Processing time in milliseconds")
    
    # Results
    predicted_score: float = Field(..., ge=0, le=100, description="Predicted impact score")
    confidence_score: float = Field(..., ge=0, le=100, description="Confidence score")
    gemini_used: bool = Field(default=False, description="Whether Gemini was used")
    
    # Status
    success: bool = Field(default=True, description="Whether prediction was successful")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    
    # Timestamps
    requested_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        use_enum_values = True


class ImpactForecastingRequest(BaseModel):
    """Request model for impact forecasting"""
    task_id: str = Field(..., description="Task ID to predict impact for")
    use_gemini: Optional[bool] = Field(None, description="Override Gemini usage")
    include_historical: Optional[bool] = Field(None, description="Include historical data analysis")
    confidence_threshold: Optional[float] = Field(None, description="Minimum confidence threshold")


class ImpactForecastingResponse(BaseModel):
    """Response model for impact forecasting"""
    success: bool = Field(..., description="Whether prediction was successful")
    prediction: Optional[ImpactPrediction] = Field(None, description="Impact prediction result")
    message: str = Field(..., description="Response message")
    processing_time_ms: float = Field(..., description="Processing time in milliseconds")
    warnings: List[str] = Field(default_factory=list, description="Warning messages")
    
    class Config:
        use_enum_values = True
