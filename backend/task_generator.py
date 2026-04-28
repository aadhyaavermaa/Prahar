"""
Autonomous Task Generation Engine
Generates civic tasks based on environmental data without IoT devices
"""
import math
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from task_models import (
    Zone, Task, Domain, Severity, TaskStatus, 
    TaskGenerationLog, TaskGenerationConfig, EnvironmentalThreshold
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TaskGenerationEngine:
    """
    Core engine for autonomous task generation based on environmental data
    """
    
    def __init__(self, config: TaskGenerationConfig = None):
        self.config = config or TaskGenerationConfig()
        self.thresholds = self._initialize_thresholds()
        self.generation_logs: List[TaskGenerationLog] = []
        
    def _initialize_thresholds(self) -> List[EnvironmentalThreshold]:
        """Initialize environmental thresholds for task generation"""
        return [
            # Air pollution thresholds
            EnvironmentalThreshold(
                domain=Domain.AIR,
                parameter="aqi",
                threshold_value=300,
                comparison=">",
                task_template="Air pollution awareness drive",
                severity_multiplier=1.5
            ),
            EnvironmentalThreshold(
                domain=Domain.AIR,
                parameter="aqi",
                threshold_value=200,
                comparison=">",
                task_template="Air quality monitoring campaign",
                severity_multiplier=1.0
            ),
            
            # Flood risk thresholds
            EnvironmentalThreshold(
                domain=Domain.FLOOD,
                parameter="rainfall",
                threshold_value=100,
                comparison=">",
                task_template="Flood relief preparation",
                severity_multiplier=2.0
            ),
            EnvironmentalThreshold(
                domain=Domain.FLOOD,
                parameter="water_level",
                threshold_value=5,
                comparison=">",
                task_template="Emergency flood response",
                severity_multiplier=2.5
            ),
            
            # Water pollution thresholds
            EnvironmentalThreshold(
                domain=Domain.WATER,
                parameter="water_level",
                threshold_value=3,
                comparison=">",
                task_template="Water cleanup drive",
                severity_multiplier=1.2
            ),
            EnvironmentalThreshold(
                domain=Domain.WATER,
                parameter="rainfall",
                threshold_value=50,
                comparison=">",
                task_template="Drainage clearing operation",
                severity_multiplier=1.3
            ),
            
            # General thresholds
            EnvironmentalThreshold(
                domain=Domain.GENERAL,
                parameter="population_density",
                threshold_value=2000,
                comparison=">",
                task_template="Community health awareness program",
                severity_multiplier=0.8
            ),
        ]
    
    def _calculate_severity_score(self, zone: Zone) -> float:
        """
        Calculate severity score based on environmental data and population
        Formula: weighted sum of environmental factors * population density
        """
        weights = self.config.severity_weights
        
        # Base environmental score
        env_score = (
            zone.aqi * weights.get('aqi', 1.0) +
            zone.rainfall * weights.get('rainfall', 0.8) +
            zone.water_level * weights.get('water_level', 0.9)
        )
        
        # Population density impact
        population_factor = zone.population_density / 1000  # Normalize by 1000
        
        # Calculate final severity score
        severity_score = env_score * population_factor
        
        # Add domain-specific multipliers
        if zone.domain == Domain.FLOOD and zone.rainfall > 50:
            severity_score *= 1.5
        elif zone.domain == Domain.AIR and zone.aqi > 200:
            severity_score *= 1.3
        elif zone.domain == Domain.WATER and zone.water_level > 2:
            severity_score *= 1.2
        
        return severity_score
    
    def _determine_severity(self, severity_score: float) -> Severity:
        """
        Determine severity level based on calculated score
        """
        if severity_score < 1000:
            return Severity.LOW
        elif severity_score <= 3000:
            return Severity.MEDIUM
        else:
            return Severity.HIGH
    
    def _calculate_volunteers_needed(self, severity_score: float) -> int:
        """
        Calculate number of volunteers needed based on severity score
        Formula: severity_score / volunteers_per_severity_unit
        Clamped between min_volunteers and max_volunteers
        """
        volunteers = int(severity_score / self.config.volunteers_per_severity_unit)
        
        # Clamp to configured bounds
        volunteers = max(self.config.min_volunteers, volunteers)
        volunteers = min(self.config.max_volunteers, volunteers)
        
        return volunteers
    
    def _predict_risk_timeframe(self, zone: Zone, severity_score: float) -> str:
        """
        Predict when the risk might peak based on current conditions
        """
        if severity_score > 5000:
            return "Critical - immediate action required"
        elif severity_score > 3000:
            return "High risk - expect peak within 24 hours"
        elif severity_score > 1500:
            return "Moderate risk - monitor closely for 48-72 hours"
        else:
            return "Low risk - conditions stable"
    
    def _check_threshold_breach(self, zone: Zone, threshold: EnvironmentalThreshold) -> bool:
        """
        Check if a zone's data breaches a specific threshold
        """
        value = getattr(zone, threshold.parameter, 0)
        
        if threshold.comparison == ">":
            return value > threshold.threshold_value
        elif threshold.comparison == ">=":
            return value >= threshold.threshold_value
        elif threshold.comparison == "<":
            return value < threshold.threshold_value
        elif threshold.comparison == "<=":
            return value <= threshold.threshold_value
        
        return False
    
    def _generate_task_title(self, template: str, zone: Zone, severity: Severity) -> str:
        """
        Generate a descriptive task title based on template and conditions
        """
        base_title = template
        
        # Add severity context
        if severity == Severity.HIGH:
            base_title = f"URGENT: {base_title}"
        elif severity == Severity.MEDIUM:
            base_title = f"Priority: {base_title}"
        
        # Add zone context
        base_title = f"{base_title} - {zone.name}"
        
        return base_title
    
    def _generate_task_description(self, zone: Zone, threshold: EnvironmentalThreshold, 
                                 severity_score: float, triggers: List[str]) -> str:
        """
        Generate detailed task description with context and data
        """
        description_parts = [
            f"Environmental monitoring has detected concerning conditions in {zone.name}.",
            f"",
            f"Current Conditions:",
            f"- Air Quality Index (AQI): {zone.aqi:.1f}",
            f"- Rainfall: {zone.rainfall:.1f}mm",
            f"- Water Level: {zone.water_level:.2f}",
            f"- Population Density: {zone.population_density:.0f} people/km²",
            f"",
            f"Triggering Factors: {', '.join(triggers)}",
            f"",
            f"Risk Assessment: {self._predict_risk_timeframe(zone, severity_score)}",
            f"",
            f"Volunteers are needed to address this situation and help mitigate potential risks.",
            f"Please join this effort to support the community."
        ]
        
        # Add domain-specific information
        if zone.domain == Domain.AIR:
            description_parts.extend([
                f"",
                f"Air Quality Details:",
                f"- Current AQI level indicates {'hazardous' if zone.aqi > 300 else 'unhealthy' if zone.aqi > 200 else 'moderate'} air quality",
                f"- Sensitive groups should avoid outdoor activities"
            ])
        elif zone.domain == Domain.FLOOD:
            description_parts.extend([
                f"",
                f"Flood Risk Assessment:",
                f"- High rainfall increases flood risk",
                f"- Water levels are {'critically high' if zone.water_level > 5 else 'elevated' if zone.water_level > 3 else 'normal'}"
            ])
        elif zone.domain == Domain.WATER:
            description_parts.extend([
                f"",
                f"Water Quality Concerns:",
                f"- Elevated water levels may indicate contamination",
                f"- Cleanup efforts needed to maintain water safety"
            ])
        
        return "\n".join(description_parts)
    
    def _check_duplicate_task(self, zone: Zone, existing_tasks: List[Task], 
                            task_template: str) -> bool:
        """
        Check if a similar task already exists for this zone
        """
        cutoff_time = datetime.utcnow() - timedelta(hours=self.config.duplicate_threshold_hours)
        
        for task in existing_tasks:
            if (task.zone_id == zone.id and 
                task.created_at > cutoff_time and
                task_template.lower() in task.title.lower()):
                return True
        
        return False
    
    def generate_tasks_from_data(self, zones: List[Zone], 
                              existing_tasks: List[Task] = None) -> Tuple[List[Task], TaskGenerationLog]:
        """
        Main function to generate tasks from environmental data
        """
        start_time = datetime.utcnow()
        existing_tasks = existing_tasks or []
        generated_tasks = []
        skipped_tasks = 0
        log_details = []
        
        logger.info(f"Starting task generation for {len(zones)} zones")
        
        for zone in zones:
            zone_tasks_generated = 0
            
            # Check each threshold for this zone
            for threshold in self.thresholds:
                if threshold.domain != zone.domain:
                    continue
                
                # Check if threshold is breached
                if not self._check_threshold_breach(zone, threshold):
                    continue
                
                # Check for duplicate tasks
                if self._check_duplicate_task(zone, existing_tasks + generated_tasks, threshold.task_template):
                    skipped_tasks += 1
                    log_details.append(
                        f"Skipped duplicate task for {zone.name}: {threshold.task_template}"
                    )
                    continue
                
                # Check maximum tasks per zone
                if zone_tasks_generated >= self.config.max_tasks_per_zone:
                    log_details.append(
                        f"Max tasks reached for {zone.name}, skipping: {threshold.task_template}"
                    )
                    continue
                
                # Calculate severity and requirements
                base_severity_score = self._calculate_severity_score(zone)
                adjusted_severity_score = base_severity_score * threshold.severity_multiplier
                severity = self._determine_severity(adjusted_severity_score)
                volunteers_needed = self._calculate_volunteers_needed(adjusted_severity_score)
                
                # Generate task details
                triggers = [
                    f"{threshold.parameter}: {getattr(zone, threshold.parameter):.1f} "
                    f"(threshold: {threshold.threshold_value})"
                ]
                
                title = self._generate_task_title(threshold.task_template, zone, severity)
                description = self._generate_task_description(zone, threshold, adjusted_severity_score, triggers)
                predicted_risk = self._predict_risk_timeframe(zone, adjusted_severity_score)
                
                # Create task
                task = Task(
                    title=title,
                    description=description,
                    zone_id=zone.id,
                    zone_name=zone.name,
                    domain=zone.domain,
                    severity=severity,
                    volunteers_needed=volunteers_needed,
                    severity_score=adjusted_severity_score,
                    predicted_risk=predicted_risk,
                    creation_reason=f"Threshold breach: {threshold.parameter} {threshold.comparison} {threshold.threshold_value}",
                    data_triggers=triggers
                )
                
                generated_tasks.append(task)
                zone_tasks_generated += 1
                
                log_details.append(
                    f"Generated task for {zone.name}: {title} "
                    f"(Severity: {severity}, Volunteers: {volunteers_needed}, Score: {adjusted_severity_score:.1f})"
                )
                
                logger.info(f"Generated task: {title}")
        
        # Calculate processing time
        processing_time = (datetime.utcnow() - start_time).total_seconds()
        
        # Create generation log
        log = TaskGenerationLog(
            zones_processed=len(zones),
            tasks_generated=len(generated_tasks),
            tasks_skipped=skipped_tasks,
            processing_time=processing_time,
            details=log_details
        )
        
        self.generation_logs.append(log)
        
        logger.info(f"Task generation completed: {len(generated_tasks)} tasks generated, "
                   f"{skipped_tasks} duplicates skipped in {processing_time:.2f}s")
        
        return generated_tasks, log
    
    def get_generation_summary(self) -> Dict:
        """Get summary of task generation activity"""
        if not self.generation_logs:
            return {"message": "No generation logs available"}
        
        total_tasks = sum(log.tasks_generated for log in self.generation_logs)
        total_skipped = sum(log.tasks_skipped for log in self.generation_logs)
        avg_processing_time = sum(log.processing_time for log in self.generation_logs) / len(self.generation_logs)
        
        return {
            "total_generations": len(self.generation_logs),
            "total_tasks_generated": total_tasks,
            "total_tasks_skipped": total_skipped,
            "average_processing_time": avg_processing_time,
            "last_generation": self.generation_logs[-1].timestamp.isoformat()
        }
    
    def add_custom_threshold(self, threshold: EnvironmentalThreshold):
        """Add a custom threshold for task generation"""
        self.thresholds.append(threshold)
        logger.info(f"Added custom threshold: {threshold.domain}.{threshold.parameter} {threshold.comparison} {threshold.threshold_value}")
    
    def remove_threshold(self, domain: Domain, parameter: str, threshold_value: float):
        """Remove a specific threshold"""
        self.thresholds = [
            t for t in self.thresholds 
            if not (t.domain == domain and t.parameter == parameter and t.threshold_value == threshold_value)
        ]
        logger.info(f"Removed threshold: {domain}.{parameter} > {threshold_value}")


# Example usage and testing
if __name__ == "__main__":
    from data_simulator import EnvironmentalDataSimulator, SimulatedDataConfig
    
    # Create configuration
    config = TaskGenerationConfig(
        max_tasks_per_zone=3,
        duplicate_threshold_hours=12,
        volunteers_per_severity_unit=80.0
    )
    
    # Initialize engine
    engine = TaskGenerationEngine(config)
    
    # Generate test zones
    simulator = EnvironmentalDataSimulator()
    zones = simulator.generate_zones(5)
    
    # Generate tasks
    tasks, log = engine.generate_tasks_from_data(zones)
    
    # Print results
    print(f"\nGenerated {len(tasks)} tasks:")
    for task in tasks:
        print(f"\n{task.title}")
        print(f"  Zone: {task.zone_name}")
        print(f"  Severity: {task.severity} (Score: {task.severity_score:.1f})")
        print(f"  Volunteers Needed: {task.volunteers_needed}")
        print(f"  Risk: {task.predicted_risk}")
        print(f"  Reason: {task.creation_reason}")
    
    # Print log summary
    print(f"\nGeneration Log:")
    print(f"  Zones processed: {log.zones_processed}")
    print(f"  Tasks generated: {log.tasks_generated}")
    print(f"  Tasks skipped: {log.tasks_skipped}")
    print(f"  Processing time: {log.processing_time:.2f}s")
    
    # Print engine summary
    summary = engine.get_generation_summary()
    print(f"\nEngine Summary: {summary}")
