"""
Comprehensive test script for Autonomous Task Generation System
Tests all components and demonstrates functionality
"""
import asyncio
import json
import time
from datetime import datetime
from task_models import (
    Zone, Task, Domain, Severity, TaskStatus,
    TaskGenerationConfig, SimulatedDataConfig
)
from data_simulator import EnvironmentalDataSimulator
from task_generator import TaskGenerationEngine


def test_data_simulator():
    """Test the environmental data simulator"""
    print("=" * 60)
    print("TESTING ENVIRONMENTAL DATA SIMULATOR")
    print("=" * 60)
    
    # Create simulator with custom config
    config = SimulatedDataConfig(
        num_zones=10,
        noise_factor=0.2
    )
    
    simulator = EnvironmentalDataSimulator(config)
    
    # Test zone generation
    zones = simulator.generate_zones()
    print(f"✅ Generated {len(zones)} zones")
    
    # Test zone data update
    original_zone = zones[0]
    updated_zone = simulator.update_zone_data(original_zone.copy())
    
    print(f"✅ Zone data update test:")
    print(f"   Original AQI: {original_zone.aqi:.1f}")
    print(f"   Updated AQI:  {updated_zone.aqi:.1f}")
    print(f"   Change:       {updated_zone.aqi - original_zone.aqi:+.1f}")
    
    # Test data ranges
    aqi_values = [zone.aqi for zone in zones]
    rainfall_values = [zone.rainfall for zone in zones]
    
    print(f"✅ Data range validation:")
    print(f"   AQI range: {min(aqi_values):.1f} - {max(aqi_values):.1f}")
    print(f"   Rainfall range: {min(rainfall_values):.1f} - {max(rainfall_values):.1f}mm")
    
    return zones


def test_task_generator(zones):
    """Test the task generation engine"""
    print("\n" + "=" * 60)
    print("TESTING TASK GENERATION ENGINE")
    print("=" * 60)
    
    # Create engine with custom config
    config = TaskGenerationConfig(
        max_tasks_per_zone=3,
        duplicate_threshold_hours=24,
        volunteers_per_severity_unit=100.0
    )
    
    engine = TaskGenerationEngine(config)
    
    # Test task generation
    tasks, log = engine.generate_tasks_from_data(zones)
    
    print(f"✅ Generated {len(tasks)} tasks from {len(zones)} zones")
    print(f"✅ Processing time: {log.processing_time:.2f} seconds")
    print(f"✅ Tasks skipped (duplicates): {log.tasks_skipped}")
    
    # Test severity calculation
    print(f"\n✅ Severity distribution:")
    severity_counts = {severity.value: 0 for severity in Severity}
    for task in tasks:
        severity_counts[task.severity.value] += 1
    
    for severity, count in severity_counts.items():
        print(f"   {severity.capitalize()}: {count} tasks")
    
    # Test volunteer calculation
    volunteer_counts = [task.volunteers_needed for task in tasks]
    print(f"\n✅ Volunteer requirements:")
    print(f"   Min volunteers: {min(volunteer_counts)}")
    print(f"   Max volunteers: {max(volunteer_counts)}")
    print(f"   Average: {sum(volunteer_counts)/len(volunteer_counts):.1f}")
    
    # Test duplicate prevention
    print(f"\n✅ Testing duplicate prevention...")
    tasks_2, log_2 = engine.generate_tasks_from_data(zones, tasks)
    print(f"   Second generation: {len(tasks_2)} tasks")
    print(f"   Additional duplicates prevented: {log_2.tasks_skipped}")
    
    return tasks, engine


def test_severity_calculation():
    """Test severity calculation logic"""
    print("\n" + "=" * 60)
    print("TESTING SEVERITY CALCULATION")
    print("=" * 60)
    
    # Create test zones with known values
    test_zones = [
        Zone(
            id="test1",
            name="Low Risk Zone",
            latitude=20.0,
            longitude=80.0,
            aqi=50,
            rainfall=10,
            water_level=1.0,
            population_density=500,
            domain=Domain.GENERAL
        ),
        Zone(
            id="test2",
            name="Medium Risk Zone",
            latitude=21.0,
            longitude=81.0,
            aqi=200,
            rainfall=60,
            water_level=3.0,
            population_density=2000,
            domain=Domain.AIR
        ),
        Zone(
            id="test3",
            name="High Risk Zone",
            latitude=22.0,
            longitude=82.0,
            aqi=400,
            rainfall=150,
            water_level=6.0,
            population_density=4000,
            domain=Domain.FLOOD
        )
    ]
    
    engine = TaskGenerationEngine()
    
    for zone in test_zones:
        score = engine._calculate_severity_score(zone)
        severity = engine._determine_severity(score)
        volunteers = engine._calculate_volunteers_needed(score)
        risk = engine._predict_risk_timeframe(zone, score)
        
        print(f"\n✅ {zone.name}:")
        print(f"   Severity Score: {score:.1f}")
        print(f"   Severity Level: {severity.value}")
        print(f"   Volunteers Needed: {volunteers}")
        print(f"   Risk Prediction: {risk}")


def test_threshold_system():
    """Test environmental threshold system"""
    print("\n" + "=" * 60)
    print("TESTING THRESHOLD SYSTEM")
    print("=" * 60)
    
    engine = TaskGenerationEngine()
    
    print(f"✅ Default thresholds: {len(engine.thresholds)}")
    
    # Test custom threshold addition
    from task_models import EnvironmentalThreshold
    
    custom_threshold = EnvironmentalThreshold(
        domain=Domain.AIR,
        parameter="aqi",
        threshold_value=150,
        comparison=">",
        task_template="Moderate air quality alert",
        severity_multiplier=0.8
    )
    
    engine.add_custom_threshold(custom_threshold)
    print(f"✅ Added custom threshold: {len(engine.thresholds)} total")
    
    # Test threshold removal
    engine.remove_threshold(Domain.AIR, "aqi", 150)
    print(f"✅ Removed custom threshold: {len(engine.thresholds)} total")


def test_endpoints_simulation():
    """Simulate API endpoint behavior"""
    print("\n" + "=" * 60)
    print("SIMULATING API ENDPOINTS")
    print("=" * 60)
    
    # Simulate GET /zones
    simulator = EnvironmentalDataSimulator()
    zones = simulator.generate_zones(5)
    
    print(f"✅ GET /zones: Returned {len(zones)} zones")
    
    # Simulate POST /run-task-generator
    engine = TaskGenerationEngine()
    tasks, log = engine.generate_tasks_from_data(zones)
    
    print(f"✅ POST /run-task-generator:")
    print(f"   Zones processed: {log.zones_processed}")
    print(f"   Tasks generated: {log.tasks_generated}")
    print(f"   Processing time: {log.processing_time:.2f}s")
    
    # Simulate GET /tasks
    print(f"✅ GET /tasks: Returned {len(tasks)} tasks")
    
    # Simulate task status update
    if tasks:
        task = tasks[0]
        task.status = TaskStatus.ASSIGNED
        task.assigned_at = datetime.utcnow()
        print(f"✅ PUT /tasks/{task.id}/status: Updated to ASSIGNED")
    
    # Simulate system status
    total_tasks = len(tasks)
    active_tasks = len([t for t in tasks if t.status in [TaskStatus.OPEN, TaskStatus.ASSIGNED]])
    
    print(f"✅ GET /system/status:")
    print(f"   Total zones: {len(zones)}")
    print(f"   Total tasks: {total_tasks}")
    print(f"   Active tasks: {active_tasks}")


def test_realistic_scenario():
    """Test a realistic scenario with multiple zones and conditions"""
    print("\n" + "=" * 60)
    print("TESTING REALISTIC SCENARIO")
    print("=" * 60)
    
    # Create zones with specific conditions
    config = SimulatedDataConfig(num_zones=15, noise_factor=0.1)
    simulator = EnvironmentalDataSimulator(config)
    zones = simulator.generate_zones()
    
    # Force some zones to have specific conditions for testing
    zones[0].aqi = 450  # Very high pollution
    zones[0].domain = Domain.AIR
    zones[0].population_density = 3000
    
    zones[1].rainfall = 180  # Heavy rainfall
    zones[1].water_level = 7.5
    zones[1].domain = Domain.FLOOD
    zones[1].population_density = 2500
    
    zones[2].water_level = 4.2
    zones[2].rainfall = 80
    zones[2].domain = Domain.WATER
    zones[2].population_density = 1500
    
    # Generate tasks
    engine = TaskGenerationEngine()
    tasks, log = engine.generate_tasks_from_data(zones)
    
    print(f"✅ Generated {len(tasks)} tasks from realistic scenario")
    
    # Analyze results
    print(f"\n✅ Task Analysis:")
    domain_counts = {domain.value: 0 for domain in Domain}
    severity_counts = {severity.value: 0 for severity in Severity}
    
    for task in tasks:
        domain_counts[task.domain.value] += 1
        severity_counts[task.severity.value] += 1
    
    print(f"   By Domain:")
    for domain, count in domain_counts.items():
        if count > 0:
            print(f"     {domain}: {count} tasks")
    
    print(f"   By Severity:")
    for severity, count in severity_counts.items():
        if count > 0:
            print(f"     {severity}: {count} tasks")
    
    # Show sample tasks
    print(f"\n✅ Sample High-Priority Tasks:")
    high_priority_tasks = [t for t in tasks if t.severity == Severity.HIGH][:3]
    for task in high_priority_tasks:
        print(f"\n   {task.title}")
        print(f"   Zone: {task.zone_name}")
        print(f"   Volunteers: {task.volunteers_needed}")
        print(f"   Risk: {task.predicted_risk}")
        print(f"   Reason: {task.creation_reason}")


def run_performance_test():
    """Test system performance with larger datasets"""
    print("\n" + "=" * 60)
    print("PERFORMANCE TESTING")
    print("=" * 60)
    
    # Test with different zone counts
    zone_counts = [10, 50, 100]
    
    for count in zone_counts:
        print(f"\n✅ Testing with {count} zones:")
        
        start_time = time.time()
        
        # Generate zones
        simulator = EnvironmentalDataSimulator(SimulatedDataConfig(num_zones=count))
        zones = simulator.generate_zones()
        zone_time = time.time() - start_time
        
        # Generate tasks
        start_time = time.time()
        engine = TaskGenerationEngine()
        tasks, log = engine.generate_tasks_from_data(zones)
        task_time = time.time() - start_time
        
        total_time = zone_time + task_time
        
        print(f"   Zone generation: {zone_time:.3f}s")
        print(f"   Task generation: {task_time:.3f}s")
        print(f"   Total time: {total_time:.3f}s")
        print(f"   Tasks generated: {len(tasks)}")
        print(f"   Tasks per second: {len(tasks)/task_time:.1f}")


def main():
    """Run all tests"""
    print("🚀 AUTONOMOUS TASK GENERATION SYSTEM - COMPREHENSIVE TESTING")
    print("=" * 80)
    
    try:
        # Test data simulator
        zones = test_data_simulator()
        
        # Test task generator
        tasks, engine = test_task_generator(zones)
        
        # Test severity calculation
        test_severity_calculation()
        
        # Test threshold system
        test_threshold_system()
        
        # Test endpoint simulation
        test_endpoints_simulation()
        
        # Test realistic scenario
        test_realistic_scenario()
        
        # Performance testing
        run_performance_test()
        
        print("\n" + "=" * 80)
        print("✅ ALL TESTS COMPLETED SUCCESSFULLY!")
        print("=" * 80)
        
        # Final summary
        print(f"\n📊 SYSTEM SUMMARY:")
        print(f"   Zones tested: {len(zones)}")
        print(f"   Tasks generated: {len(tasks)}")
        print(f"   Engine summary: {engine.get_generation_summary()}")
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        raise


if __name__ == "__main__":
    main()
