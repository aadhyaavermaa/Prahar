"""
Gemini API Integration for Impact Forecasting System
Provides AI-powered explanations and prediction refinement
"""
import os
import json
import logging
from typing import Dict, Optional, Any
from google.generativeai import configure, GenerativeModel
import google.generativeai as genai

from impact_models import Task, Zone, ImpactPrediction, TaskDomain, TaskSeverity

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GeminiImpactEnhancer:
    """
    Gemini API integration for impact prediction enhancement
    """
    
    def __init__(self, api_key: str = None):
        """Initialize Gemini API client"""
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "AIzaSyBaBwtlDft8peLdmqHWKMCJ-Nu7FByuW-s")
        
        if not self.api_key:
            raise ValueError("Gemini API key is required")
        
        try:
            configure(api_key=self.api_key)
            self.model = GenerativeModel('gemini-1.5-flash')
            self.is_configured = True
            logger.info("Gemini API client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini API: {str(e)}")
            self.is_configured = False
            self.model = None
    
    def get_gemini_prediction(self, task: Task, zone: Zone, predicted_score: float) -> Dict[str, Any]:
        """
        Get Gemini-powered prediction and explanation
        """
        if not self.is_configured:
            return self._get_fallback_response(task, zone, predicted_score)
        
        try:
            # Construct the prompt
            prompt = self._build_prediction_prompt(task, zone, predicted_score)
            
            # Generate response
            response = self.model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.3,
                    "max_output_tokens": 200,
                    "top_p": 0.8,
                    "top_k": 40
                }
            )
            
            # Parse response
            return self._parse_gemini_response(response.text, task, zone, predicted_score)
            
        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            return self._get_fallback_response(task, zone, predicted_score)
    
    def _build_prediction_prompt(self, task: Task, zone: Zone, predicted_score: float) -> str:
        """Build comprehensive prompt for Gemini"""
        prompt = f"""
You are an expert in civic task impact analysis. Analyze this task and provide impact prediction insights.

TASK DETAILS:
- Title: {task.title}
- Description: {task.description}
- Domain: {task.domain.value}
- Severity: {task.severity.value}
- Volunteers Assigned: {task.volunteers_assigned}
- Estimated Duration: {task.estimated_duration_hours or 'Not specified'} hours

ZONE DETAILS:
- Name: {zone.name}
- Current Severity Score: {zone.current_severity_score}/100
- Population Density: {zone.population_density} people/km²
- Area Size: {zone.area_size} km²

ZONE-SPECIFIC METRICS:
"""
        
        # Add domain-specific metrics
        if zone.pollution_level is not None:
            prompt += f"- Pollution Level (AQI): {zone.pollution_level}\n"
        if zone.flood_risk is not None:
            prompt += f"- Flood Risk: {zone.flood_risk}%\n"
        if zone.medical_need is not None:
            prompt += f"- Medical Need: {zone.medical_need}%\n"
        if zone.water_quality is not None:
            prompt += f"- Water Quality: {zone.water_quality}/100\n"
        
        prompt += f"""
INFRASTRUCTURE:
- Hospitals: {zone.hospital_count}
- Schools: {zone.school_count}
- Volunteer Availability: {zone.volunteer_availability}%

RULE-BASED PREDICTION:
- Predicted Impact Score: {predicted_score:.1f}/100

ANALYSIS REQUEST:
1. Estimate the expected impact (0-100) based on your analysis
2. Provide a brief explanation (1-2 sentences) of expected outcomes
3. Consider the specific context of the zone and task
4. Factor in volunteer effectiveness and community conditions

RESPONSE FORMAT (JSON):
{{
    "refined_score": <number between 0-100>,
    "explanation": "<brief explanation of expected impact>",
    "confidence_factor": <number between 0-1>,
    "key_factors": ["<factor1>", "<factor2>", "<factor3>"],
    "expected_outcome": "<brief description of expected outcome>"
}}
"""
        
        return prompt
    
    def _parse_gemini_response(self, response_text: str, task: Task, zone: Zone, 
                             original_score: float) -> Dict[str, Any]:
        """Parse Gemini API response"""
        try:
            # Try to extract JSON from response
            response_text = response_text.strip()
            
            # Look for JSON pattern
            if "{" in response_text and "}" in response_text:
                start_idx = response_text.find("{")
                end_idx = response_text.rfind("}") + 1
                json_str = response_text[start_idx:end_idx]
                
                parsed = json.loads(json_str)
                
                # Validate and clean the response
                refined_score = max(0, min(100, float(parsed.get("refined_score", original_score))))
                explanation = parsed.get("explanation", "Impact prediction completed successfully.")
                confidence_factor = max(0, min(1, float(parsed.get("confidence_factor", 0.8))))
                key_factors = parsed.get("key_factors", [])
                expected_outcome = parsed.get("expected_outcome", "Positive community impact expected.")
                
                logger.info(f"Gemini response parsed successfully for task {task.id}")
                
                return {
                    "success": True,
                    "refined_score": refined_score,
                    "explanation": explanation,
                    "confidence_factor": confidence_factor,
                    "key_factors": key_factors,
                    "expected_outcome": expected_outcome,
                    "original_score": original_score,
                    "score_difference": refined_score - original_score
                }
            
            else:
                # Fallback to text parsing
                return self._parse_text_response(response_text, task, zone, original_score)
                
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse Gemini JSON response: {str(e)}")
            return self._parse_text_response(response_text, task, zone, original_score)
        except Exception as e:
            logger.error(f"Error parsing Gemini response: {str(e)}")
            return self._get_fallback_response(task, zone, original_score)
    
    def _parse_text_response(self, response_text: str, task: Task, zone: Zone,
                            original_score: float) -> Dict[str, Any]:
        """Parse non-JSON response from Gemini"""
        # Extract explanation from text
        explanation = response_text[:200]  # Truncate to reasonable length
        
        # Look for score in text
        refined_score = original_score
        if "score:" in response_text.lower():
            try:
                import re
                score_match = re.search(r'score[^\d]*(\d+)', response_text.lower())
                if score_match:
                    refined_score = float(score_match.group(1))
                    refined_score = max(0, min(100, refined_score))
            except:
                pass
        
        return {
            "success": True,
            "refined_score": refined_score,
            "explanation": explanation,
            "confidence_factor": 0.7,
            "key_factors": ["AI analysis"],
            "expected_outcome": "Impact predicted based on AI analysis",
            "original_score": original_score,
            "score_difference": refined_score - original_score
        }
    
    def _get_fallback_response(self, task: Task, zone: Zone, predicted_score: float) -> Dict[str, Any]:
        """Get fallback response when Gemini is unavailable"""
        domain_explanations = {
            TaskDomain.POLLUTION: f"With {task.volunteers_assigned} volunteers, expected improvement in air quality through cleanup efforts.",
            TaskDomain.FLOOD: f"Flood relief efforts with {task.volunteers_assigned} volunteers should help mitigate water damage and assist affected residents.",
            TaskDomain.MEDICAL: f"Medical support with {task.volunteers_assigned} volunteers will provide essential healthcare services to the community.",
            TaskDomain.WATER: f"Water quality improvement expected with {task.volunteers_assigned} volunteers conducting cleanup and monitoring.",
            TaskDomain.EDUCATION: f"Educational initiatives with {task.volunteers_assigned} volunteers will enhance community learning and awareness.",
            TaskDomain.GENERAL: f"Community improvement expected with {task.volunteers_assigned} volunteers working on general civic tasks."
        }
        
        explanation = domain_explanations.get(task.domain, "Positive community impact expected.")
        
        return {
            "success": False,
            "refined_score": predicted_score,
            "explanation": explanation,
            "confidence_factor": 0.6,
            "key_factors": ["Rule-based calculation"],
            "expected_outcome": "Impact predicted using rule-based logic",
            "original_score": predicted_score,
            "score_difference": 0.0,
            "fallback_used": True
        }
    
    def enhance_prediction(self, prediction: ImpactPrediction, task: Task, zone: Zone) -> ImpactPrediction:
        """
        Enhance existing prediction with Gemini insights
        """
        if not self.is_configured:
            logger.warning("Gemini not configured, returning original prediction")
            prediction.ai_explanation = self._get_fallback_response(task, zone, prediction.predicted_score)["explanation"]
            return prediction
        
        try:
            # Get Gemini enhancement
            gemini_result = self.get_gemini_prediction(task, zone, prediction.predicted_score)
            
            if gemini_result["success"]:
                # Update prediction with Gemini insights
                prediction.refined_prediction = gemini_result["refined_score"]
                prediction.ai_explanation = gemini_result["explanation"]
                prediction.gemini_enhanced = True
                prediction.calculation_log.append(f"Gemini enhancement: {prediction.predicted_score} → {gemini_result['refined_score']}")
                prediction.calculation_log.append(f"Gemini factors: {', '.join(gemini_result['key_factors'])}")
                
                logger.info(f"Prediction enhanced with Gemini for task {task.id}")
            else:
                # Use fallback
                prediction.ai_explanation = gemini_result["explanation"]
                prediction.calculation_log.append("Gemini enhancement failed, using fallback explanation")
            
            return prediction
            
        except Exception as e:
            logger.error(f"Error enhancing prediction with Gemini: {str(e)}")
            prediction.ai_explanation = self._get_fallback_response(task, zone, prediction.predicted_score)["explanation"]
            prediction.calculation_log.append("Gemini enhancement error, using fallback")
            return prediction
    
    def get_impact_insights(self, task: Task, zone: Zone) -> Dict[str, Any]:
        """
        Get additional insights about the task impact without specific prediction
        """
        if not self.is_configured:
            return {
                "success": False,
                "insights": ["Gemini API not configured for insights"],
                "recommendations": ["Proceed with rule-based prediction"]
            }
        
        try:
            prompt = f"""
Provide brief insights for this civic task:

TASK: {task.title} ({task.domain.value}, {task.severity.value})
VOLUNTEERS: {task.volunteers_assigned}
ZONE: {zone.name} (Severity: {zone.current_severity_score}/100, Population: {zone.population_density}/km²)

Give 3 key insights and 2 recommendations for maximizing impact.

RESPONSE FORMAT:
{{
    "insights": ["insight1", "insight2", "insight3"],
    "recommendations": ["rec1", "rec2"]
}}
"""
            
            response = self.model.generate_content(
                prompt,
                generation_config={
                    "temperature": 0.4,
                    "max_output_tokens": 150
                }
            )
            
            try:
                parsed = json.loads(response.text.strip())
                return {
                    "success": True,
                    "insights": parsed.get("insights", []),
                    "recommendations": parsed.get("recommendations", [])
                }
            except:
                return {
                    "success": False,
                    "insights": ["Unable to parse Gemini response"],
                    "recommendations": ["Use rule-based analysis"]
                }
                
        except Exception as e:
            logger.error(f"Error getting insights from Gemini: {str(e)}")
            return {
                "success": False,
                "insights": [f"Error: {str(e)}"],
                "recommendations": ["Proceed with standard prediction"]
            }
    
    def test_connection(self) -> bool:
        """Test Gemini API connection"""
        if not self.is_configured:
            return False
        
        try:
            response = self.model.generate_content("Test connection - respond with 'OK'")
            return "OK" in response.text
        except Exception as e:
            logger.error(f"Gemini connection test failed: {str(e)}")
            return False


# Example usage and testing
if __name__ == "__main__":
    # Test Gemini integration
    try:
        enhancer = GeminiImpactEnhancer()
        
        # Test connection
        if enhancer.test_connection():
            print("✅ Gemini API connection successful")
        else:
            print("❌ Gemini API connection failed")
        
        # Create test data
        task = Task(
            title="River Cleanup Initiative",
            description="Clean polluted river banks and water",
            domain=TaskDomain.WATER,
            severity=TaskSeverity.HIGH,
            volunteers_assigned=20,
            zone_id="zone_1",
            zone_name="Riverside District"
        )
        
        zone = Zone(
            name="Riverside District",
            latitude=19.0760,
            longitude=72.8777,
            current_severity_score=75.0,
            population_density=3000,
            area_size=15.0,
            water_quality=35.0,
            pollution_level=220.0
        )
        
        # Test Gemini prediction
        result = enhancer.get_gemini_prediction(task, zone, 65.0)
        print(f"\nGemini Prediction Result:")
        print(f"Success: {result['success']}")
        print(f"Refined Score: {result['refined_score']}")
        print(f"Explanation: {result['explanation']}")
        print(f"Confidence Factor: {result['confidence_factor']}")
        print(f"Key Factors: {result['key_factors']}")
        
        # Test insights
        insights = enhancer.get_impact_insights(task, zone)
        print(f"\nInsights: {insights}")
        
    except Exception as e:
        print(f"Error testing Gemini integration: {str(e)}")
        print("This is expected if API key is not configured")
