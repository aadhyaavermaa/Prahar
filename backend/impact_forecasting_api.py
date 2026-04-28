"""
Impact Forecasting System - FastAPI Endpoints
REST API for predicting task impact before execution
"""
import os
import time
from datetime import datetime
from typing import List, Dict, Optional, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

from impact_models import (
    Task, Zone, HistoricalTask, ImpactPrediction, ImpactPredictionConfig,
    TaskDomain, TaskSeverity, ImpactForecastingRequest, ImpactForecastingResponse,
    PredictionLog
)
from impact_predictor import ImpactPredictor
from gemini_integration import GeminiImpactEnhancer


# In-memory storage (can be replaced with database/Firestore)
class ImpactStorage:
    """Simple in-memory storage for impact forecasting"""
    
    def __init__(self):
        self.tasks: Dict[str, Task] = {}
        self.zones: Dict[str, Zone] = {}
        self.historical_tasks: List[HistoricalTask] = []
        self.predictions: Dict[str, ImpactPrediction] = {}
        self.prediction_logs: List[PredictionLog] = []
        self.config = ImpactPredictionConfig()
        self.start_time = datetime.utcnow()
    
    def add_task(self, task: Task):
        self.tasks[task.id] = task
    
    def get_task(self, task_id: str) -> Optional[Task]:
        return self.tasks.get(task_id)
    
    def add_zone(self, zone: Zone):
        self.zones[zone.id] = zone
    
    def get_zone(self, zone_id: str) -> Optional[Zone]:
        return self.zones.get(zone_id)
    
    def add_historical_task(self, historical_task: HistoricalTask):
        self.historical_tasks.append(historical_task)
    
    def get_historical_tasks(self, task_domain: Optional[TaskDomain] = None,
                           zone_id: Optional[str] = None) -> List[HistoricalTask]:
        tasks = self.historical_tasks
        
        if task_domain:
            tasks = [task for task in tasks if task.domain == task_domain]
        
        if zone_id:
            tasks = [task for task in tasks if task.zone_id == zone_id]
        
        return tasks
    
    def add_prediction(self, prediction: ImpactPrediction):
        self.predictions[prediction.task_id] = prediction
    
    def get_prediction(self, task_id: str) -> Optional[ImpactPrediction]:
        return self.predictions.get(task_id)
    
    def add_prediction_log(self, log: PredictionLog):
        self.prediction_logs.append(log)
    
    def get_prediction_logs(self, limit: int = 50) -> List[PredictionLog]:
        return sorted(self.prediction_logs, key=lambda x: x.requested_at, reverse=True)[:limit]


# Global storage instance
storage = ImpactStorage()

# Initialize components
predictor = ImpactPredictor(storage.config)
try:
    gemini_enhancer = GeminiImpactEnhancer()
    gemini_available = True
except Exception as e:
    print(f"Gemini API not available: {str(e)}")
    gemini_enhancer = None
    gemini_available = False


# Application lifecycle management
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown"""
    # Startup
    print("Starting Impact Forecasting System...")
    
    # Initialize with sample data
    await initialize_sample_data()
    
    print(f"Gemini API available: {gemini_available}")
    print("Impact Forecasting System ready!")
    
    yield
    
    # Shutdown
    print("Shutting down Impact Forecasting System...")


# Create FastAPI app
app = FastAPI(
    title="Impact Forecasting API",
    description="Predict task impact before execution using rule-based logic and Gemini AI",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def initialize_sample_data():
    """Initialize system with sample tasks and zones"""
    # Sample zones
    zones_data = [
        Zone(
            id="zone_1",
            name="Marine Beach Area",
            latitude=19.0760,
            longitude=72.8777,
            current_severity_score=65.0,
            population_density=2500,
            area_size=10.0,
            pollution_level=180.5,
            water_quality=45.0
        ),
        Zone(
            id="zone_2",
            name="Industrial District",
            latitude=19.1344,
            longitude=72.8826,
            current_severity_score=78.0,
            population_density=3500,
            area_size=12.0,
            pollution_level=245.0,
            medical_need=65.0
        ),
        Zone(
            id="zone_3",
            name="Riverside Community",
            latitude=19.0176,
            longitude=72.8560,
            current_severity_score=52.0,
            population_density=1800,
            area_size=8.0,
            flood_risk=35.0,
            water_quality=55.0
        )
    ]
    
    for zone in zones_data:
        storage.add_zone(zone)
    
    # Sample tasks
    tasks_data = [
        Task(
            id="task_1",
            title="Beach Cleanup Drive",
            description="Clean up polluted beach area and collect waste",
            domain=TaskDomain.POLLUTION,
            severity=TaskSeverity.MEDIUM,
            volunteers_assigned=15,
            zone_id="zone_1",
            zone_name="Marine Beach Area",
            estimated_duration_hours=4.0
        ),
        Task(
            id="task_2",
            title="Medical Camp Setup",
            description="Organize free medical checkup camp for residents",
            domain=TaskDomain.MEDICAL,
            severity=TaskSeverity.HIGH,
            volunteers_assigned=8,
            zone_id="zone_2",
            zone_name="Industrial District",
            estimated_duration_hours=6.0
        ),
        Task(
            id="task_3",
            title="Flood Relief Preparation",
            description="Prepare flood relief materials and evacuation plans",
            domain=TaskDomain.FLOOD,
            severity=TaskSeverity.HIGH,
            volunteers_assigned=25,
            zone_id="zone_3",
            zone_name="Riverside Community",
            estimated_duration_hours=8.0
        )
    ]
    
    for task in tasks_data:
        storage.add_task(task)
    
    # Sample historical tasks
    historical_data = [
        HistoricalTask(
            task_id="hist_1",
            domain=TaskDomain.POLLUTION,
            severity=TaskSeverity.MEDIUM,
            volunteers_assigned=12,
            zone_id="zone_1",
            actual_impact_score=68.0,
            improvement_percentage=25.0,
            duration_hours=3.5,
            volunteer_satisfaction=4.2,
            completed_at=datetime.utcnow()
        ),
        HistoricalTask(
            task_id="hist_2",
            domain=TaskDomain.MEDICAL,
            severity=TaskSeverity.HIGH,
            volunteers_assigned=10,
            zone_id="zone_2",
            actual_impact_score=82.0,
            improvement_percentage=35.0,
            duration_hours=5.5,
            volunteer_satisfaction=4.5,
            completed_at=datetime.utcnow()
        )
    ]
    
    for hist_task in historical_data:
        storage.add_historical_task(hist_task)
    
    print(f"Initialized {len(zones_data)} zones, {len(tasks_data)} tasks, and {len(historical_data)} historical records")


# API Endpoints
@app.get("/", response_model=Dict[str, Any])
async def root():
    """Root endpoint with API information"""
    return {
        "name": "Impact Forecasting API",
        "version": "1.0.0",
        "description": "Predict task impact before execution using rule-based logic and Gemini AI",
        "features": [
            "Rule-based impact prediction",
            "Gemini AI enhancement",
            "Confidence scoring",
            "Historical data analysis",
            "Real-time processing"
        ],
        "endpoints": {
            "predict": "/predict-impact/{task_id}",
            "tasks": "/tasks",
            "zones": "/zones",
            "history": "/historical-tasks",
            "predictions": "/predictions",
            "logs": "/prediction-logs",
            "config": "/config"
        },
        "gemini_available": gemini_available
    }


@app.get("/tasks", response_model=List[Dict[str, Any]])
async def get_tasks():
    """Get all available tasks"""
    tasks = []
    for task_id, task in storage.tasks.items():
        task_dict = task.dict()
        task_dict["has_prediction"] = task_id in storage.predictions
        tasks.append(task_dict)
    
    return tasks


@app.get("/tasks/{task_id}", response_model=Dict[str, Any])
async def get_task(task_id: str):
    """Get specific task by ID"""
    task = storage.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task_dict = task.dict()
    task_dict["has_prediction"] = task_id in storage.predictions
    
    if task_id in storage.predictions:
        task_dict["prediction"] = storage.predictions[task_id].dict()
    
    return task_dict


@app.get("/zones", response_model[List[Dict[str, Any]])
async def get_zones():
    """Get all zones"""
    return [zone.dict() for zone in storage.zones.values()]


@app.get("/zones/{zone_id}", response_model=Dict[str, Any])
async def get_zone(zone_id: str):
    """Get specific zone by ID"""
    zone = storage.get_zone(zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    return zone.dict()


@app.get("/historical-tasks", response_model=List[Dict[str, Any]])
async def get_historical_tasks(domain: Optional[TaskDomain] = None, zone_id: Optional[str] = None):
    """Get historical tasks for analysis"""
    tasks = storage.get_historical_tasks(domain, zone_id)
    return [task.dict() for task in tasks]


@app.get("/predict-impact/{task_id}", response_model=ImpactForecastingResponse)
async def predict_task_impact(task_id: str, request: ImpactForecastingRequest = None):
    """
    Predict impact for a specific task
    """
    start_time = time.time()
    
    try:
        # Validate task exists
        task = storage.get_task(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Get zone
        zone = storage.get_zone(task.zone_id)
        if not zone:
            raise HTTPException(status_code=404, detail="Zone not found")
        
        # Override config if requested
        use_gemini = storage.config.use_gemini
        include_historical = storage.config.use_historical_data
        
        if request:
            if request.use_gemini is not None:
                use_gemini = request.use_gemini
            if request.include_historical is not None:
                include_historical = request.include_historical
        
        # Validate inputs
        is_valid, errors = predictor.validate_prediction_inputs(task, zone)
        if not is_valid:
            raise HTTPException(status_code=400, detail=f"Validation errors: {errors}")
        
        # Get historical data if requested
        historical_tasks = None
        if include_historical:
            historical_tasks = storage.get_historical_tasks(task.domain, task.zone_id)
        
        # Generate prediction
        prediction = predictor.predict_impact(task, zone, historical_tasks)
        
        # Enhance with Gemini if available and requested
        if use_gemini and gemini_enhancer:
            try:
                prediction = gemini_enhancer.enhance_prediction(prediction, task, zone)
            except Exception as e:
                prediction.calculation_log.append(f"Gemini enhancement failed: {str(e)}")
        
        # Store prediction
        storage.add_prediction(prediction)
        
        # Calculate processing time
        processing_time_ms = (time.time() - start_time) * 1000
        
        # Check confidence threshold
        warnings = []
        if request and request.confidence_threshold:
            if prediction.confidence_score < request.confidence_threshold:
                warnings.append(f"Low confidence score: {prediction.confidence_score:.1f}% < {request.confidence_threshold}%")
        
        return ImpactForecastingResponse(
            success=True,
            prediction=prediction,
            message="Impact prediction completed successfully",
            processing_time_ms=processing_time_ms,
            warnings=warnings
        )
        
    except HTTPException:
        raise
    except Exception as e:
        processing_time_ms = (time.time() - start_time) * 1000
        return ImpactForecastingResponse(
            success=False,
            prediction=None,
            message=f"Prediction failed: {str(e)}",
            processing_time_ms=processing_time_ms,
            warnings=["Internal server error"]
        )


@app.get("/predictions", response_model=List[Dict[str, Any]])
async def get_predictions(task_id: Optional[str] = None, zone_id: Optional[str] = None):
    """Get impact predictions"""
    predictions = list(storage.predictions.values())
    
    if task_id:
        predictions = [p for p in predictions if p.task_id == task_id]
    
    if zone_id:
        predictions = [p for p in predictions if p.zone_id == zone_id]
    
    return [prediction.dict() for prediction in predictions]


@app.get("/predictions/{task_id}", response_model=Dict[str, Any])
async def get_prediction(task_id: str):
    """Get specific prediction by task ID"""
    prediction = storage.get_prediction(task_id)
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    
    return prediction.dict()


@app.get("/prediction-logs", response_model=List[Dict[str, Any]])
async def get_prediction_logs(limit: int = 50):
    """Get prediction logs"""
    logs = storage.get_prediction_logs(limit)
    return [log.dict() for log in logs]


@app.get("/config", response_model=Dict[str, Any])
async def get_config():
    """Get current configuration"""
    return {
        "prediction_config": storage.config.dict(),
        "gemini_available": gemini_available,
        "system_uptime": str(datetime.utcnow() - storage.start_time),
        "statistics": {
            "total_tasks": len(storage.tasks),
            "total_zones": len(storage.zones),
            "total_predictions": len(storage.predictions),
            "total_historical_tasks": len(storage.historical_tasks)
        }
    }


@app.put("/config")
async def update_config(config_updates: Dict[str, Any]):
    """Update system configuration"""
    try:
        # Update prediction config
        if "prediction_config" in config_updates:
            for key, value in config_updates["prediction_config"].items():
                if hasattr(storage.config, key):
                    setattr(storage.config, key, value)
        
        return {"message": "Configuration updated successfully", "config": storage.config.dict()}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Configuration update failed: {str(e)}")


@app.post("/tasks", response_model=Dict[str, Any])
async def create_task(task_data: Dict[str, Any]):
    """Create a new task"""
    try:
        task = Task(**task_data)
        storage.add_task(task)
        
        return {
            "message": "Task created successfully",
            "task_id": task.id,
            "task": task.dict()
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Task creation failed: {str(e)}")


@app.post("/zones", response_model=Dict[str, Any])
async def create_zone(zone_data: Dict[str, Any]):
    """Create a new zone"""
    try:
        zone = Zone(**zone_data)
        storage.add_zone(zone)
        
        return {
            "message": "Zone created successfully",
            "zone_id": zone.id,
            "zone": zone.dict()
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Zone creation failed: {str(e)}")


@app.post("/historical-tasks", response_model=Dict[str, Any])
async def add_historical_task(historical_data: Dict[str, Any]):
    """Add historical task data"""
    try:
        historical_task = HistoricalTask(**historical_data)
        storage.add_historical_task(historical_task)
        
        return {
            "message": "Historical task added successfully",
            "historical_task_id": historical_task.id,
            "historical_task": historical_task.dict()
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to add historical task: {str(e)}")


@app.get("/insights/{task_id}", response_model=Dict[str, Any])
async def get_task_insights(task_id: str):
    """Get AI-powered insights for a task"""
    task = storage.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    zone = storage.get_zone(task.zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    if not gemini_enhancer:
        return {
            "success": False,
            "insights": ["Gemini API not available"],
            "recommendations": ["Use rule-based prediction"]
        }
    
    try:
        insights = gemini_enhancer.get_impact_insights(task, zone)
        return insights
    except Exception as e:
        return {
            "success": False,
            "insights": [f"Error getting insights: {str(e)}"],
            "recommendations": ["Proceed with standard analysis"]
        }


@app.get("/system/health", response_model=Dict[str, Any])
async def health_check():
    """System health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "components": {
            "predictor": "active",
            "gemini": "active" if gemini_available else "inactive",
            "storage": "active"
        },
        "statistics": {
            "tasks": len(storage.tasks),
            "zones": len(storage.zones),
            "predictions": len(storage.predictions),
            "historical_tasks": len(storage.historical_tasks),
            "prediction_logs": len(storage.prediction_logs)
        }
    }


# Run the application
if __name__ == "__main__":
    uvicorn.run(
        "impact_forecasting_api:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
