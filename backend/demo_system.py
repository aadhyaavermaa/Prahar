"""
Demo script showcasing the complete Autonomous Task Generation System
"""
import asyncio
import json
from datetime import datetime
from task_models import Domain, Severity, TaskStatus
from data_simulator import EnvironmentalDataSimulator, SimulatedDataConfig
from task_generator import TaskGenerationEngine, TaskGenerationConfig


def print_header(title):
    """Print formatted header"""
    print("\n" + "=" * 80)
    print(f"🚀 {title}")
    print("=" * 80)


def print_section(title):
    """Print formatted section"""
    print(f"\n📍 {title}")
    print("-" * 60)


async def demo_system():
    """Complete system demonstration"""
    
    print_header("AUTONOMOUS TASK GENERATION SYSTEM - COMPLETE DEMO")
    
    # Section 1: System Initialization
    print_section("1. SYSTEM INITIALIZATION")
    
    print("Initializing autonomous task generation system...")
    
    # Configure system
    sim_config = SimulatedDataConfig(
        num_zones=12,
        noise_factor=0.15,
        aqi_range=(50, 500),
        rainfall_range=(0, 200),
        water_level_range=(0, 8)
    )
    
    task_config = TaskGenerationConfig(
        enabled=True,
        generation_interval_minutes=60,
        max_tasks_per_zone=4,
        duplicate_threshold_hours=24,
        volunteers_per_severity_unit=100.0
    )
    
    print(f"✅ Data simulation configured: {sim_config.num_zones} zones")
    print(f"✅ Task generation configured: {task_config.generation_interval_minutes}min interval")
    print(f"✅ Duplicate prevention: {task_config.duplicate_threshold_hours}h window")
    
    # Section 2: Environmental Data Generation
    print_section("2. ENVIRONMENTAL DATA GENERATION")
    
    simulator = EnvironmentalDataSimulator(sim_config)
    zones = simulator.generate_zones()
    
    print(f"Generated {len(zones)} monitoring zones with environmental data:")
    
    # Show sample zones
    for i, zone in enumerate(zones[:3]):
        print(f"\n📍 Zone {i+1}: {zone.name}")
        print(f"   🌍 Location: ({zone.latitude:.2f}, {zone.longitude:.2f})")
        print(f"   🏷️  Domain: {zone.domain.upper()}")
        print(f"   💨 AQI: {zone.aqi:.1f}")
        print(f"   🌧️  Rainfall: {zone.rainfall:.1f}mm")
        print(f"   💧 Water Level: {zone.water_level:.2f}")
        print(f"   👥 Population: {zone.population_density:.0f}/km²")
        if zone.temperature:
            print(f"   🌡️  Temperature: {zone.temperature:.1f}°C")
            print(f"   💨 Humidity: {zone.humidity:.1f}%")
    
    # Section 3: Task Generation
    print_section("3. AUTONOMOUS TASK GENERATION")
    
    engine = TaskGenerationEngine(task_config)
    tasks, log = engine.generate_tasks_from_data(zones)
    
    print(f"🎯 Task Generation Results:")
    print(f"   📊 Zones processed: {log.zones_processed}")
    print(f"   📋 Tasks generated: {log.tasks_generated}")
    print(f"   ⏭️  Tasks skipped (duplicates): {log.tasks_skipped}")
    print(f"   ⏱️  Processing time: {log.processing_time:.2f} seconds")
    
    # Show task distribution
    severity_counts = {s.value: 0 for s in Severity}
    domain_counts = {d.value: 0 for d in Domain}
    
    for task in tasks:
        severity_counts[task.severity] += 1
        domain_counts[task.domain] += 1
    
    print(f"\n📈 Task Distribution:")
    print(f"   By Severity:")
    for severity, count in severity_counts.items():
        if count > 0:
            print(f"     🔴 {severity.capitalize()}: {count} tasks")
    
    print(f"   By Domain:")
    for domain, count in domain_counts.items():
        if count > 0:
            print(f"     🏷️  {domain.capitalize()}: {count} tasks")
    
    # Section 4: High-Priority Tasks Showcase
    print_section("4. HIGH-PRIORITY TASKS SHOWCASE")
    
    high_priority_tasks = [t for t in tasks if t.severity == Severity.HIGH]
    print(f"Found {len(high_priority_tasks)} high-priority tasks requiring immediate attention:")
    
    for i, task in enumerate(high_priority_tasks[:3]):
        print(f"\n🚨 Task {i+1}: {task.title}")
        print(f"   📍 Zone: {task.zone_name}")
        print(f"   🎯 Domain: {task.domain}")
        print(f"   👥 Volunteers Needed: {task.volunteers_needed}")
        print(f"   ⚠️  Risk Level: {task.predicted_risk}")
        print(f"   📊 Severity Score: {task.severity_score:.1f}")
        print(f"   💡 Creation Reason: {task.creation_reason}")
        print(f"   📋 Status: {task.status}")
    
    # Section 5: Risk Prediction Analysis
    print_section("5. RISK PREDICTION ANALYSIS")
    
    risk_categories = {}
    for task in tasks:
        risk = task.predicted_risk
        if risk not in risk_categories:
            risk_categories[risk] = 0
        risk_categories[risk] += 1
    
    print("Risk prediction distribution:")
    for risk, count in risk_categories.items():
        print(f"   ⚠️  {risk}: {count} tasks")
    
    # Section 6: Resource Allocation Analysis
    print_section("6. RESOURCE ALLOCATION ANALYSIS")
    
    total_volunteers_needed = sum(task.volunteers_needed for task in tasks)
    avg_volunteers = total_volunteers_needed / len(tasks) if tasks else 0
    
    print(f"📊 Volunteer Requirements:")
    print(f"   👥 Total volunteers needed: {total_volunteers_needed}")
    print(f"   📈 Average per task: {avg_volunteers:.1f}")
    print(f"   🔢 Min volunteers: {min(t.volunteers_needed for t in tasks) if tasks else 0}")
    print(f"   🔢 Max volunteers: {max(t.volunteers_needed for t in tasks) if tasks else 0}")
    
    # Section 7: System Performance Metrics
    print_section("7. SYSTEM PERFORMANCE METRICS")
    
    zones_per_second = len(zones) / log.processing_time if log.processing_time > 0 else 0
    tasks_per_second = len(tasks) / log.processing_time if log.processing_time > 0 else 0
    
    print(f"⚡ Performance Metrics:")
    print(f"   📊 Zones processed/second: {zones_per_second:.1f}")
    print(f"   📋 Tasks generated/second: {tasks_per_second:.1f}")
    print(f"   ⏱️  Average processing time: {log.processing_time/len(zones)*1000:.1f}ms/zone")
    
    # Section 8: System Configuration
    print_section("8. SYSTEM CONFIGURATION SUMMARY")
    
    print(f"⚙️  Current Configuration:")
    print(f"   🔄 Auto-generation: {'Enabled' if task_config.enabled else 'Disabled'}")
    print(f"   ⏰ Generation interval: {task_config.generation_interval_minutes} minutes")
    print(f"   📊 Max tasks per zone: {task_config.max_tasks_per_zone}")
    print(f"   🚫 Duplicate window: {task_config.duplicate_threshold_hours} hours")
    print(f"   🎲 Noise factor: {sim_config.noise_factor}")
    
    # Section 9: Generation Log Details
    print_section("9. GENERATION LOG DETAILS")
    
    print(f"📋 Recent Generation Activity:")
    for detail in log.details[:5]:
        print(f"   📝 {detail}")
    
    if len(log.details) > 5:
        print(f"   ... and {len(log.details) - 5} more details")
    
    # Section 10: Next Steps & Recommendations
    print_section("10. NEXT STEPS & RECOMMENDATIONS")
    
    print(f"🎯 System Recommendations:")
    
    # Analyze high-risk zones
    high_risk_zones = [zone for zone in zones if zone.aqi > 300 or zone.rainfall > 100 or zone.water_level > 5]
    if high_risk_zones:
        print(f"   ⚠️  {len(high_risk_zones)} zones require immediate monitoring")
        for zone in high_risk_zones[:2]:
            print(f"      📍 {zone.name}: AQI={zone.aqi:.0f}, Rain={zone.rainfall:.0f}mm")
    
    # Volunteer allocation suggestions
    if total_volunteers_needed > 100:
        print(f"   👥 High volunteer demand: Consider mobilizing additional resources")
    
    # System optimization suggestions
    if zones_per_second < 50:
        print(f"   ⚡ Performance is optimal for current zone count")
    else:
        print(f"   ⚡ Consider performance optimization for larger datasets")
    
    # Section 11: API Simulation
    print_section("11. API ENDPOINT SIMULATION")
    
    print(f"🌐 Simulated API Calls:")
    print(f"   GET /zones → {len(zones)} zones returned")
    print(f"   GET /tasks → {len(tasks)} tasks returned")
    print(f"   GET /tasks?severity=high → {len(high_priority_tasks)} high-priority tasks")
    print(f"   POST /run-task-generator → {log.tasks_generated} tasks created")
    print(f"   GET /system/status → System running normally")
    
    # Final Summary
    print_header("DEMO COMPLETION SUMMARY")
    
    print(f"🎉 Autonomous Task Generation System Demo Complete!")
    print(f"\n📊 System Statistics:")
    print(f"   🌍 Monitoring zones: {len(zones)}")
    print(f"   📋 Tasks generated: {len(tasks)}")
    print(f"   👥 Volunteers mobilized: {total_volunteers_needed}")
    print(f"   ⚠️  High-priority alerts: {len(high_priority_tasks)}")
    print(f"   ⏱️  Processing time: {log.processing_time:.2f}s")
    
    print(f"\n🚀 System Capabilities Demonstrated:")
    print(f"   ✅ Environmental data simulation")
    print(f"   ✅ Autonomous task generation")
    print(f"   ✅ Smart severity calculation")
    print(f"   ✅ Dynamic volunteer allocation")
    print(f"   ✅ Duplicate prevention")
    print(f"   ✅ Risk prediction")
    print(f"   ✅ Performance optimization")
    print(f"   ✅ Configurable thresholds")
    
    print(f"\n🎯 Ready for Production!")
    print(f"   🌐 Start API server: python autonomous_tasks_api.py")
    print(f"   📖 View docs: http://localhost:8000/docs")
    print(f"   🧪 Run tests: python test_autonomous_system.py")
    
    print(f"\n" + "=" * 80)
    print(f"🏁 END OF DEMO - SYSTEM READY FOR DEPLOYMENT 🏁")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(demo_system())
