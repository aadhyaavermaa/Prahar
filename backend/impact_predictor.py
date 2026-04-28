"""
Impact Forecasting System - Rule-Based Prediction Logic
Core logic for predicting task impact before execution
"""
import math
import logging
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from impact_models import (
    Task, Zone, HistoricalTask, ImpactPrediction, ImpactPredictionConfig,
    TaskDomain, TaskSeverity, PredictionLog
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ImpactPredictor:
    """
    Core impact prediction engine using rule-based logic
    """
    
    def __init__(self, config: ImpactPredictionConfig = None):
        self.config = config or ImpactPredictionConfig()
        self.prediction_logs: List[PredictionLog] = []
        
    def predict_impact(self, task: Task, zone: Zone, 
                      historical_tasks: Optional[List[HistoricalTask]] = None) -> ImpactPrediction:
        """
        Main prediction function using rule-based logic
        """
        start_time = datetime.utcnow()
        calculation_log = []
        
        try:
            # Step 1: Get base efficiency for domain
            base_efficiency = self._get_base_efficiency(task.domain)
            calculation_log.append(f"Base efficiency for {task.domain}: {base_efficiency} points/volunteer")
            
            # Step 2: Calculate raw impact
            raw_impact = self._calculate_raw_impact(task.volunteers_assigned, base_efficiency)
            calculation_log.append(f"Raw impact: {task.volunteers_assigned} volunteers × {base_efficiency} = {raw_impact}")
            
            # Step 3: Apply severity adjustment
            severity_multiplier = self._get_severity_multiplier(task.severity)
            severity_adjusted = raw_impact * severity_multiplier
            calculation_log.append(f"Severity adjustment: {raw_impact} × {severity_multiplier} = {severity_adjusted:.2f}")
            
            # Step 4: Apply zone factor adjustment
            zone_factor = self._calculate_zone_factor(zone, task.domain)
            zone_adjusted = severity_adjusted * zone_factor
            calculation_log.append(f"Zone factor adjustment: {severity_adjusted:.2f} × {zone_factor} = {zone_adjusted:.2f}")
            
            # Step 5: Normalize to 0-100 scale
            predicted_score = self._normalize_score(zone_adjusted)
            calculation_log.append(f"Normalized score: min(100, {zone_adjusted:.2f}) = {predicted_score}")
            
            # Step 6: Calculate improvement percentage
            improvement_percentage = self._calculate_improvement_percentage(predicted_score, zone.current_severity_score)
            calculation_log.append(f"Improvement percentage: ({predicted_score} / {zone.current_severity_score}) × 100 = {improvement_percentage:.1f}%")
            
            # Step 7: Calculate confidence score
            confidence_score = self._calculate_confidence_score(task, zone, historical_tasks)
            calculation_log.append(f"Confidence score: {confidence_score:.1f}%")
            
            # Step 8: Apply historical data adjustment if available
            if historical_tasks and self.config.use_historical_data:
                historical_adjustment = self._apply_historical_adjustment(
                    predicted_score, task, zone, historical_tasks
                )
                if historical_adjustment != predicted_score:
                    calculation_log.append(f"Historical adjustment: {predicted_score} → {historical_adjustment:.2f}")
                    predicted_score = historical_adjustment
            
            # Create prediction result
            prediction = ImpactPrediction(
                task_id=task.id,
                zone_id=zone.id,
                predicted_score=predicted_score,
                improvement_percentage=improvement_percentage,
                confidence_score=confidence_score,
                ai_explanation="Rule-based calculation completed. Gemini enhancement pending.",
                calculation_log=calculation_log,
                base_efficiency=base_efficiency,
                severity_adjustment=severity_multiplier,
                zone_factor=zone_factor,
                prediction_method="rule_based",
                historical_data_used=bool(historical_tasks and self.config.use_historical_data),
                gemini_enhanced=False
            )
            
            # Log the prediction
            processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000
            self._log_prediction(task.id, zone.id, "rule_based", processing_time, prediction)
            
            logger.info(f"Impact predicted for task {task.id}: score={predicted_score:.1f}, confidence={confidence_score:.1f}%")
            
            return prediction
            
        except Exception as e:
            logger.error(f"Error predicting impact for task {task.id}: {str(e)}")
            raise
    
    def _get_base_efficiency(self, domain: TaskDomain) -> float:
        """Get base efficiency points per volunteer for domain"""
        return self.config.domain_efficiencies.get(domain, 2.0)
    
    def _calculate_raw_impact(self, volunteers: int, base_efficiency: float) -> float:
        """Calculate raw impact based on volunteers and base efficiency"""
        return volunteers * base_efficiency
    
    def _get_severity_multiplier(self, severity: TaskSeverity) -> float:
        """Get severity multiplier for impact calculation"""
        return self.config.severity_multipliers.get(severity, 1.0)
    
    def _calculate_zone_factor(self, zone: Zone, domain: TaskDomain) -> float:
        """
        Calculate zone-specific adjustment factor
        Considers population density, current severity, and domain-specific metrics
        """
        factors = []
        
        # Population density factor
        if zone.population_density > 0:
            pop_factor = min(2.0, zone.population_density / 2000)  # Normalize to max 2.0
            factors.append(pop_factor)
        
        # Current severity factor (higher severity = more impact potential)
        if zone.current_severity_score > 0:
            severity_factor = min(1.5, zone.current_severity_score / 50)
            factors.append(severity_factor)
        
        # Domain-specific factors
        if domain == TaskDomain.POLLUTION and zone.pollution_level:
            pollution_factor = min(1.3, zone.pollution_level / 200)
            factors.append(pollution_factor)
        elif domain == TaskDomain.FLOOD and zone.flood_risk:
            flood_factor = min(1.4, zone.flood_risk / 50)
            factors.append(flood_factor)
        elif domain == TaskDomain.MEDICAL and zone.medical_need:
            medical_factor = min(1.5, zone.medical_need / 50)
            factors.append(medical_factor)
        elif domain == TaskDomain.WATER and zone.water_quality:
            water_factor = min(1.3, (100 - zone.water_quality) / 50)  # Lower quality = higher impact
            factors.append(water_factor)
        
        # Volunteer availability factor
        if zone.volunteer_availability > 0:
            volunteer_factor = zone.volunteer_availability / 100
            factors.append(volunteer_factor)
        
        # Calculate average factor
        if factors:
            return sum(factors) / len(factors)
        else:
            return 1.0
    
    def _normalize_score(self, raw_score: float) -> float:
        """Normalize score to 0-100 range"""
        return min(100, max(0, raw_score))
    
    def _calculate_improvement_percentage(self, predicted_score: float, current_severity: float) -> float:
        """Calculate expected improvement percentage"""
        if current_severity <= 0:
            return 0.0
        
        improvement = (predicted_score / current_severity) * 100
        return min(100, max(0, improvement))
    
    def _calculate_confidence_score(self, task: Task, zone: Zone, 
                                  historical_tasks: Optional[List[HistoricalTask]]) -> float:
        """
        Calculate confidence score for prediction
        Based on data availability and quality
        """
        confidence_factors = []
        
        # Base confidence
        base_confidence = 50.0
        confidence_factors.append(base_confidence)
        
        # Volunteer count confidence (more volunteers = higher confidence)
        if task.volunteers_assigned > 0:
            volunteer_confidence = min(20, task.volunteers_assigned * 2)
            confidence_factors.append(volunteer_confidence)
        
        # Zone data completeness
        zone_data_points = 0
        if zone.pollution_level is not None:
            zone_data_points += 1
        if zone.flood_risk is not None:
            zone_data_points += 1
        if zone.medical_need is not None:
            zone_data_points += 1
        if zone.water_quality is not None:
            zone_data_points += 1
        
        zone_confidence = min(15, zone_data_points * 5)
        confidence_factors.append(zone_confidence)
        
        # Historical data confidence
        if historical_tasks and self.config.use_historical_data:
            similar_tasks = [
                task for task in historical_tasks
                if task.domain == task.domain and task.zone_id == zone.id
            ]
            historical_confidence = min(15, len(similar_tasks) * 3)
            confidence_factors.append(historical_confidence)
        
        # Calculate final confidence
        total_confidence = sum(confidence_factors)
        return min(100, max(0, total_confidence))
    
    def _apply_historical_adjustment(self, predicted_score: float, task: Task, zone: Zone,
                                   historical_tasks: List[HistoricalTask]) -> float:
        """
        Apply historical data adjustment to prediction
        """
        # Find similar historical tasks
        similar_tasks = [
            task for task in historical_tasks
            if (task.domain == task.domain and 
                task.zone_id == zone.id and
                abs(task.volunteers_assigned - task.volunteers_assigned) <= 5)
        ]
        
        if not similar_tasks:
            return predicted_score
        
        # Calculate historical average impact
        historical_avg = sum(task.actual_impact_score for task in similar_tasks) / len(similar_tasks)
        
        # Apply weighted adjustment
        weight = self.config.historical_weight
        adjusted_score = (predicted_score * (1 - weight)) + (historical_avg * weight)
        
        return adjusted_score
    
    def _log_prediction(self, task_id: str, zone_id: str, method: str, 
                       processing_time_ms: float, prediction: ImpactPrediction):
        """Log prediction request and result"""
        log = PredictionLog(
            task_id=task_id,
            zone_id=zone_id,
            prediction_method=method,
            processing_time_ms=processing_time_ms,
            predicted_score=prediction.predicted_score,
            confidence_score=prediction.confidence_score,
            gemini_used=prediction.gemini_enhanced,
            success=True
        )
        self.prediction_logs.append(log)
    
    def get_prediction_summary(self) -> Dict[str, any]:
        """Get summary of prediction activity"""
        if not self.prediction_logs:
            return {"message": "No prediction logs available"}
        
        total_predictions = len(self.prediction_logs)
        successful_predictions = sum(1 for log in self.prediction_logs if log.success)
        avg_confidence = sum(log.confidence_score for log in self.prediction_logs) / total_predictions
        avg_processing_time = sum(log.processing_time_ms for log in self.prediction_logs) / total_predictions
        gemini_usage = sum(1 for log in self.prediction_logs if log.gemini_used)
        
        return {
            "total_predictions": total_predictions,
            "successful_predictions": successful_predictions,
            "success_rate": (successful_predictions / total_predictions) * 100,
            "average_confidence": avg_confidence,
            "average_processing_time_ms": avg_processing_time,
            "gemini_usage_count": gemini_usage,
            "gemini_usage_percentage": (gemini_usage / total_predictions) * 100
        }
    
    def validate_prediction_inputs(self, task: Task, zone: Zone) -> Tuple[bool, List[str]]:
        """
        Validate inputs for prediction
        Returns (is_valid, error_messages)
        """
        errors = []
        
        if not task.id:
            errors.append("Task ID is required")
        
        if not zone.id:
            errors.append("Zone ID is required")
        
        if task.volunteers_assigned <= 0:
            errors.append("Volunteers assigned must be greater than 0")
        
        if zone.current_severity_score < 0 or zone.current_severity_score > 100:
            errors.append("Zone current severity score must be between 0 and 100")
        
        if zone.population_density <= 0:
            errors.append("Zone population density must be greater than 0")
        
        return len(errors) == 0, errors
    
    def get_domain_efficiency_analysis(self) -> Dict[str, any]:
        """Get analysis of domain efficiencies"""
        return {
            domain.value: {
                "base_efficiency": efficiency,
                "severity_multipliers": {
                    severity.value: multiplier 
                    for severity, multiplier in self.config.severity_multipliers.items()
                }
            }
            for domain, efficiency in self.config.domain_efficiencies.items()
        }


# Example usage and testing
if __name__ == "__main__":
    # Create test data
    task = Task(
        title="Beach Cleanup Drive",
        description="Clean up polluted beach area",
        domain=TaskDomain.POLLUTION,
        severity=TaskSeverity.MEDIUM,
        volunteers_assigned=15,
        zone_id="zone_1",
        zone_name="Marine Beach Area"
    )
    
    zone = Zone(
        name="Marine Beach Area",
        latitude=19.0760,
        longitude=72.8777,
        current_severity_score=65.0,
        population_density=2500,
        area_size=10.0,
        pollution_level=180.5,
        flood_risk=20.0,
        medical_need=30.0,
        water_quality=45.0
    )
    
    # Create predictor
    predictor = ImpactPredictor()
    
    # Validate inputs
    is_valid, errors = predictor.validate_prediction_inputs(task, zone)
    if not is_valid:
        print(f"Validation errors: {errors}")
    else:
        # Predict impact
        prediction = predictor.predict_impact(task, zone)
        
        print(f"Impact Prediction Results:")
        print(f"  Task: {task.title}")
        print(f"  Zone: {zone.name}")
        print(f"  Predicted Score: {prediction.predicted_score:.1f}")
        print(f"  Improvement Percentage: {prediction.improvement_percentage:.1f}%")
        print(f"  Confidence Score: {prediction.confidence_score:.1f}%")
        print(f"  Base Efficiency: {prediction.base_efficiency}")
        print(f"  Severity Adjustment: {prediction.severity_adjustment}")
        print(f"  Zone Factor: {prediction.zone_factor}")
        print(f"\nCalculation Log:")
        for log_entry in prediction.calculation_log:
            print(f"  - {log_entry}")
        
        # Get summary
        summary = predictor.get_prediction_summary()
        print(f"\nPrediction Summary: {summary}")
