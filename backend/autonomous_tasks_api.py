"""
FastAPI application for Autonomous Task Generation System
Provides REST API endpoints for environmental monitoring and task generation
"""
import asyncio
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

from task_models import (
    Zone, Task, Domain, Severity, TaskStatus,
    TaskGenerationLog, TaskGenerationConfig, SimulatedDataConfig
)
from data_simulator import EnvironmentalDataSimulator
from task_generator import TaskGenerationEngine


# Pydantic models for API requests/responses
class ZoneResponse(BaseModel):
    """Response model for zone data"""
    id: str
    name: str
    latitude: float
    longitude: float
    aqi: float
    rainfall: float
    water_level: float
    population_density: float
    domain: Domain
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    wind_speed: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        use_enum_values = True


class TaskResponse(BaseModel):
    """Response model for task data"""
    id: str
    title: str
    description: str
    zone_id: str
    zone_name: str
    domain: Domain
    severity: Severity
    volunteers_needed: int
    status: TaskStatus
    severity_score: float
    predicted_risk: str
    creation_reason: str
    data_triggers: List[str]
    created_at: datetime
    assigned_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        use_enum_values = True


class TaskGenerationRequest(BaseModel):
    """Request model for manual task generation"""
    zone_ids: Optional[List[str]] = Field(None, description="Specific zone IDs to process (empty for all)")
    force_regenerate: bool = Field(False, description="Force regeneration even for recent tasks")


class ConfigUpdateRequest(BaseModel):
    """Request model for updating configuration"""
    enabled: Optional[bool] = None
    generation_interval_minutes: Optional[int] = None
    max_tasks_per_zone: Optional[int] = None
    duplicate_threshold_hours: Optional[int] = None
    noise_factor: Optional[float] = None


class SystemStatusResponse(BaseModel):
    """Response model for system status"""
    status: str
    total_zones: int
    total_tasks: int
    active_tasks: int
    completed_tasks: int
    last_generation: Optional[datetime] = None
    next_scheduled_generation: Optional[datetime] = None
    system_uptime: str


# In-memory storage (can be replaced with database/Firestore)
class MemoryStorage:
    """Simple in-memory storage for zones and tasks"""
    
    def __init__(self):
        self.zones: List[Zone] = []
        self.tasks: List[Task] = []
        self.generation_logs: List[TaskGenerationLog] = []
        self.config = TaskGenerationConfig()
        self.simulator_config = SimulatedDataConfig()
        self.start_time = datetime.utcnow()
    
    def add_zone(self, zone: Zone):
        self.zones.append(zone)
    
    def get_zones(self) -> List[Zone]:
        return self.zones
    
    def get_zone_by_id(self, zone_id: str) -> Optional[Zone]:
        for zone in self.zones:
            if zone.id == zone_id:
                return zone
        return None
    
    def add_task(self, task: Task):
        self.tasks.append(task)
    
    def get_tasks(self, status: Optional[TaskStatus] = None) -> List[Task]:
        if status:
            return [task for task in self.tasks if task.status == status]
        return self.tasks
    
    def get_task_by_id(self, task_id: str) -> Optional[Task]:
        for task in self.tasks:
            if task.id == task_id:
                return task
        return None
    
    def update_task_status(self, task_id: str, status: TaskStatus):
        task = self.get_task_by_id(task_id)
        if task:
            task.status = status
            if status == TaskStatus.ASSIGNED:
                task.assigned_at = datetime.utcnow()
            elif status == TaskStatus.COMPLETED:
                task.completed_at = datetime.utcnow()
    
    def add_generation_log(self, log: TaskGenerationLog):
        self.generation_logs.append(log)
    
    def get_generation_logs(self, limit: int = 10) -> List[TaskGenerationLog]:
        return sorted(self.generation_logs, key=lambda x: x.timestamp, reverse=True)[:limit]


# Global storage instance
storage = MemoryStorage()

# Background task scheduler
class BackgroundScheduler:
    """Simple background scheduler for automatic task generation"""
    
    def __init__(self):
        self.running = False
        self.task = None
    
    async def start(self):
        """Start the background scheduler"""
        self.running = True
        self.task = asyncio.create_task(self._scheduler_loop())
    
    async def stop(self):
        """Stop the background scheduler"""
        self.running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
    
    async def _scheduler_loop(self):
        """Main scheduler loop"""
        while self.running:
            try:
                # Sleep for configured interval
                interval_minutes = storage.config.generation_interval_minutes
                await asyncio.sleep(interval_minutes * 60)
                
                # Run task generation if enabled
                if storage.config.enabled:
                    await self.run_task_generation()
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Scheduler error: {e}")
                await asyncio.sleep(60)  # Wait 1 minute before retrying
    
    async def run_task_generation(self):
        """Run task generation in background"""
        try:
            # Update zone data
            simulator = EnvironmentalDataSimulator(storage.simulator_config)
            for i, zone in enumerate(storage.zones):
                updated_zone = simulator.update_zone_data(zone)
                storage.zones[i] = updated_zone
            
            # Generate tasks
            engine = TaskGenerationEngine(storage.config)
            tasks, log = engine.generate_tasks_from_data(storage.zones, storage.tasks)
            
            # Store new tasks
            for task in tasks:
                storage.add_task(task)
            
            # Store log
            storage.add_generation_log(log)
            
            print(f"Background generation: {len(tasks)} tasks created")
            
        except Exception as e:
            print(f"Background task generation error: {e}")


# Global scheduler instance
scheduler = BackgroundScheduler()


# Application lifecycle management
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown"""
    # Startup
    print("Starting Autonomous Task Generation System...")
    
    # Initialize with sample data
    await initialize_sample_data()
    
    # Start background scheduler
    if storage.config.enabled:
        await scheduler.start()
        print(f"Background scheduler started (interval: {storage.config.generation_interval_minutes} minutes)")
    
    yield
    
    # Shutdown
    print("Shutting down...")
    await scheduler.stop()
    print("Shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="Autonomous Task Generation API",
    description="Environmental monitoring and autonomous civic task generation system",
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
    """Initialize system with sample zones and data"""
    simulator = EnvironmentalDataSimulator(storage.simulator_config)
    zones = simulator.generate_zones()
    
    for zone in zones:
        storage.add_zone(zone)
    
    print(f"Initialized {len(zones)} zones with environmental data")


# API Endpoints
@app.get("/", response_model=Dict[str, Any])
async def root():
    """Root endpoint with API information"""
    return {
        "name": "Autonomous Task Generation API",
        "version": "1.0.0",
        "description": "Environmental monitoring and autonomous civic task generation",
        "endpoints": {
            "zones": "/zones",
            "tasks": "/tasks",
            "generate": "/run-task-generator",
            "status": "/system/status",
            "config": "/system/config"
        }
    }


@app.get("/zones", response_model=List[ZoneResponse])
async def get_zones():
    """Get all zones with environmental data"""
    zones = storage.get_zones()
    return [ZoneResponse(**zone.dict()) for zone in zones]


@app.get("/zones/{zone_id}", response_model=ZoneResponse)
async def get_zone(zone_id: str):
    """Get specific zone by ID"""
    zone = storage.get_zone_by_id(zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return ZoneResponse(**zone.dict())


@app.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(status: Optional[TaskStatus] = None, domain: Optional[Domain] = None):
    """Get all tasks, optionally filtered by status or domain"""
    tasks = storage.get_tasks(status)
    
    if domain:
        tasks = [task for task in tasks if task.domain == domain]
    
    return [TaskResponse(**task.dict()) for task in tasks]


@app.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str):
    """Get specific task by ID"""
    task = storage.get_task_by_id(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskResponse(**task.dict())


@app.put("/tasks/{task_id}/status")
async def update_task_status(task_id: str, status: TaskStatus):
    """Update task status"""
    task = storage.get_task_by_id(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    storage.update_task_status(task_id, status)
    return {"message": f"Task {task_id} status updated to {status}"}


@app.post("/run-task-generator", response_model=Dict[str, Any])
async def run_task_generation(request: TaskGenerationRequest, background_tasks: BackgroundTasks):
    """Manually trigger task generation"""
    try:
        # Get zones to process
        zones_to_process = []
        if request.zone_ids:
            for zone_id in request.zone_ids:
                zone = storage.get_zone_by_id(zone_id)
                if zone:
                    zones_to_process.append(zone)
        else:
            zones_to_process = storage.get_zones()
        
        if not zones_to_process:
            raise HTTPException(status_code=400, detail="No zones found to process")
        
        # Update zone data if not forcing regeneration
        if not request.force_regenerate:
            simulator = EnvironmentalDataSimulator(storage.simulator_config)
            for i, zone in enumerate(storage.zones):
                if zone in zones_to_process:
                    updated_zone = simulator.update_zone_data(zone)
                    storage.zones[i] = updated_zone
                    zones_to_process[zones_to_process.index(zone)] = updated_zone
        
        # Generate tasks
        engine = TaskGenerationEngine(storage.config)
        existing_tasks = [] if request.force_regenerate else storage.tasks
        tasks, log = engine.generate_tasks_from_data(zones_to_process, existing_tasks)
        
        # Store new tasks
        for task in tasks:
            storage.add_task(task)
        
        # Store log
        storage.add_generation_log(log)
        
        return {
            "message": "Task generation completed successfully",
            "zones_processed": log.zones_processed,
            "tasks_generated": log.tasks_generated,
            "tasks_skipped": log.tasks_skipped,
            "processing_time": log.processing_time,
            "details": log.details[:5]  # Return first 5 details
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Task generation failed: {str(e)}")


@app.get("/system/status", response_model=SystemStatusResponse)
async def get_system_status():
    """Get system status and statistics"""
    total_tasks = len(storage.tasks)
    active_tasks = len(storage.get_tasks(TaskStatus.OPEN)) + len(storage.get_tasks(TaskStatus.ASSIGNED))
    completed_tasks = len(storage.get_tasks(TaskStatus.COMPLETED))
    
    # Calculate uptime
    uptime = datetime.utcnow() - storage.start_time
    uptime_str = str(uptime).split('.')[0]  # Remove microseconds
    
    # Get last generation time
    last_generation = None
    if storage.generation_logs:
        last_generation = storage.generation_logs[-1].timestamp
    
    # Calculate next scheduled generation
    next_scheduled = None
    if storage.config.enabled and last_generation:
        next_scheduled = last_generation + timedelta(minutes=storage.config.generation_interval_minutes)
    
    return SystemStatusResponse(
        status="running" if scheduler.running else "stopped",
        total_zones=len(storage.zones),
        total_tasks=total_tasks,
        active_tasks=active_tasks,
        completed_tasks=completed_tasks,
        last_generation=last_generation,
        next_scheduled_generation=next_scheduled,
        system_uptime=uptime_str
    )


@app.get("/system/config", response_model=Dict[str, Any])
async def get_system_config():
    """Get current system configuration"""
    return {
        "task_generation": storage.config.dict(),
        "data_simulation": storage.simulator_config.dict(),
        "scheduler": {
            "running": scheduler.running,
            "enabled": storage.config.enabled
        }
    }


@app.put("/system/config")
async def update_system_config(config_update: ConfigUpdateRequest):
    """Update system configuration"""
    # Update task generation config
    update_data = config_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        if hasattr(storage.config, key):
            setattr(storage.config, key, value)
    
    # Restart scheduler if interval changed
    if "generation_interval_minutes" in update_data and scheduler.running:
        await scheduler.stop()
        if storage.config.enabled:
            await scheduler.start()
    
    return {"message": "Configuration updated successfully", "config": storage.config.dict()}


@app.get("/system/logs", response_model=List[Dict[str, Any]])
async def get_generation_logs(limit: int = 10):
    """Get task generation logs"""
    logs = storage.get_generation_logs(limit)
    return [
        {
            "timestamp": log.timestamp.isoformat(),
            "zones_processed": log.zones_processed,
            "tasks_generated": log.tasks_generated,
            "tasks_skipped": log.tasks_skipped,
            "processing_time": log.processing_time,
            "details": log.details[:3]  # Return first 3 details
        }
        for log in logs
    ]


@app.post("/system/scheduler/start")
async def start_scheduler():
    """Start background scheduler"""
    if scheduler.running:
        return {"message": "Scheduler already running"}
    
    await scheduler.start()
    return {"message": "Scheduler started"}


@app.post("/system/scheduler/stop")
async def stop_scheduler():
    """Stop background scheduler"""
    if not scheduler.running:
        return {"message": "Scheduler already stopped"}
    
    await scheduler.stop()
    return {"message": "Scheduler stopped"}


@app.post("/zones/refresh")
async def refresh_zone_data():
    """Refresh all zone data with new simulated values"""
    simulator = EnvironmentalDataSimulator(storage.simulator_config)
    
    for i, zone in enumerate(storage.zones):
        updated_zone = simulator.update_zone_data(zone)
        storage.zones[i] = updated_zone
    
    return {"message": f"Refreshed data for {len(storage.zones)} zones"}


# Run the application
if __name__ == "__main__":
    uvicorn.run(
        "autonomous_tasks_api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
