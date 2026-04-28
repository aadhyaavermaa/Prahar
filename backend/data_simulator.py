"""
Environmental data simulation system
Generates realistic environmental data for zones without IoT devices
"""
import random
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from task_models import Zone, Domain, SimulatedDataConfig


class EnvironmentalDataSimulator:
    """
    Simulates environmental data for zones using realistic patterns and noise
    """
    
    def __init__(self, config: SimulatedDataConfig = None):
        self.config = config or SimulatedDataConfig()
        self.zone_names = self._generate_zone_names()
        
    def _generate_zone_names(self) -> List[str]:
        """Generate realistic zone names"""
        prefixes = ["North", "South", "East", "West", "Central", "Upper", "Lower", "Mid"]
        suffixes = ["District", "Area", "Zone", "Region", "Quarter", "Sector", "Block"]
        cities = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Ahmedabad"]
        
        names = []
        for i in range(self.config.num_zones):
            if i < len(cities):
                # Use real city names for first zones
                prefix = random.choice(prefixes)
                suffix = random.choice(suffixes)
                names.append(f"{prefix} {cities[i]} {suffix}")
            else:
                # Generate generic names for remaining zones
                prefix = random.choice(prefixes)
                suffix = random.choice(suffixes)
                names.append(f"{prefix} {suffix} {i+1}")
        
        return names
    
    def _add_noise(self, value: float, noise_factor: float = None) -> float:
        """Add realistic noise to sensor values"""
        noise_factor = noise_factor or self.config.noise_factor
        noise = random.gauss(0, value * noise_factor)
        return max(0, value + noise)
    
    def _simulate_aqi(self, zone_domain: Domain, base_value: float = None) -> float:
        """
        Simulate AQI values based on domain and realistic patterns
        """
        if base_value is None:
            # Base AQI ranges by domain
            domain_ranges = {
                Domain.AIR: (150, 400),
                Domain.FLOOD: (100, 250),
                Domain.WATER: (120, 300),
                Domain.GENERAL: (80, 200)
            }
            min_aqi, max_aqi = domain_ranges.get(zone_domain, (50, 300))
            base_value = random.uniform(min_aqi, max_aqi)
        
        # Add time-based variation (higher during certain hours)
        current_hour = datetime.now().hour
        if 7 <= current_hour <= 9 or 17 <= current_hour <= 19:  # Rush hours
            base_value *= 1.3
        elif 22 <= current_hour <= 24 or 0 <= current_hour <= 5:  # Night
            base_value *= 0.8
        
        # Add weather correlation
        if random.random() < 0.3:  # 30% chance of weather impact
            base_value *= random.uniform(0.8, 1.4)
        
        return self._add_noise(base_value)
    
    def _simulate_rainfall(self, zone_domain: Domain, base_value: float = None) -> float:
        """
        Simulate rainfall values with seasonal patterns
        """
        if base_value is None:
            # Different rainfall patterns by domain
            if zone_domain == Domain.FLOOD:
                base_value = random.uniform(20, 150)  # Higher in flood-prone areas
            elif zone_domain == Domain.WATER:
                base_value = random.uniform(10, 80)
            else:
                base_value = random.uniform(0, 50)
        
        # Add seasonal variation
        month = datetime.now().month
        if 6 <= month <= 9:  # Monsoon season
            base_value *= random.uniform(1.5, 3.0)
        elif 11 <= month <= 2:  # Winter
            base_value *= random.uniform(0.3, 0.7)
        
        # Add random heavy rainfall events
        if random.random() < 0.1:  # 10% chance of heavy rain
            base_value *= random.uniform(2.0, 5.0)
        
        return self._add_noise(base_value)
    
    def _simulate_water_level(self, zone_domain: Domain, rainfall: float) -> float:
        """
        Simulate water level based on rainfall and domain
        """
        # Base water level depends on domain
        domain_bases = {
            Domain.FLOOD: random.uniform(2, 6),
            Domain.WATER: random.uniform(1, 4),
            Domain.AIR: random.uniform(0.5, 2),
            Domain.GENERAL: random.uniform(0.5, 3)
        }
        
        base_level = domain_bases.get(zone_domain, random.uniform(1, 4))
        
        # Water level rises with rainfall
        rainfall_impact = rainfall * 0.05  # 5mm rainfall increases water level by 0.25 units
        base_level += rainfall_impact
        
        # Add gradual water level changes
        base_level += random.uniform(-0.5, 0.5)
        
        return max(0, self._add_noise(base_level))
    
    def _simulate_population_density(self) -> float:
        """
        Simulate population density with realistic urban/rural distribution
        """
        # 70% chance of urban area, 30% rural
        if random.random() < 0.7:
            # Urban: 1000-5000 people/km²
            return random.uniform(1000, 5000)
        else:
            # Rural: 100-800 people/km²
            return random.uniform(100, 800)
    
    def _simulate_temperature(self) -> float:
        """Simulate temperature with seasonal patterns"""
        month = datetime.now().month
        if 3 <= month <= 5:  # Spring
            return random.uniform(20, 35)
        elif 6 <= month <= 8:  # Summer
            return random.uniform(25, 45)
        elif 9 <= month <= 11:  # Fall
            return random.uniform(15, 30)
        else:  # Winter
            return random.uniform(10, 25)
    
    def _simulate_humidity(self, temperature: float, rainfall: float) -> float:
        """Simulate humidity based on temperature and rainfall"""
        base_humidity = 50 + (rainfall * 0.3)  # Rainfall increases humidity
        
        # Temperature affects humidity inversely
        if temperature > 30:
            base_humidity *= 0.8
        elif temperature < 15:
            base_humidity *= 1.2
        
        return max(20, min(95, self._add_noise(base_humidity, 0.05)))
    
    def _simulate_wind_speed(self) -> float:
        """Simulate wind speed"""
        # Most of the time: light to moderate wind
        if random.random() < 0.8:
            return random.uniform(5, 25)
        else:  # 20% chance of strong wind
            return random.uniform(25, 50)
    
    def generate_zones(self, num_zones: int = None) -> List[Zone]:
        """
        Generate simulated zones with environmental data
        """
        num_zones = num_zones or self.config.num_zones
        zones = []
        
        for i in range(num_zones):
            # Select zone name
            zone_name = self.zone_names[i % len(self.zone_names)]
            
            # Generate geographic coordinates (around India)
            latitude = random.uniform(8, 37)  # India's approximate lat range
            longitude = random.uniform(68, 97)  # India's approximate lng range
            
            # Select domain with realistic distribution
            domain_weights = [0.3, 0.25, 0.25, 0.2]  # AIR, FLOOD, WATER, GENERAL
            domain = random.choices(list(Domain), weights=domain_weights)[0]
            
            # Generate environmental data with correlations
            rainfall = self._simulate_rainfall(domain)
            aqi = self._simulate_aqi(domain)
            water_level = self._simulate_water_level(domain, rainfall)
            population_density = self._simulate_population_density()
            
            # Optional parameters
            temperature = self._simulate_temperature()
            humidity = self._simulate_humidity(temperature, rainfall)
            wind_speed = self._simulate_wind_speed()
            
            zone = Zone(
                name=zone_name,
                latitude=latitude,
                longitude=longitude,
                aqi=aqi,
                rainfall=rainfall,
                water_level=water_level,
                population_density=population_density,
                domain=domain,
                temperature=temperature,
                humidity=humidity,
                wind_speed=wind_speed
            )
            
            zones.append(zone)
        
        return zones
    
    def update_zone_data(self, zone: Zone) -> Zone:
        """
        Update existing zone data with new simulated values
        Maintains some correlation with previous values for realism
        """
        # Gradual changes with some randomness
        aqi_change = random.gauss(0, 20)  # AQI changes by ~20 units on average
        rainfall_change = random.gauss(0, 10)  # Rainfall changes by ~10mm
        water_level_change = random.gauss(0, 0.5)  # Water level changes
        
        # Update values with bounds checking
        new_aqi = max(0, zone.aqi + aqi_change)
        new_rainfall = max(0, zone.rainfall + rainfall_change)
        new_water_level = max(0, zone.water_level + water_level_change)
        
        # Add noise
        new_aqi = self._add_noise(new_aqi)
        new_rainfall = self._add_noise(new_rainfall)
        new_water_level = self._add_noise(new_water_level)
        
        # Update zone
        zone.aqi = new_aqi
        zone.rainfall = new_rainfall
        zone.water_level = new_water_level
        zone.updated_at = datetime.utcnow()
        
        # Update optional parameters
        if zone.temperature:
            zone.temperature = self._add_noise(zone.temperature, 0.02)
        if zone.humidity:
            zone.humidity = max(20, min(95, self._add_noise(zone.humidity, 0.03)))
        if zone.wind_speed:
            zone.wind_speed = max(0, self._add_noise(zone.wind_speed, 0.1))
        
        return zone
    
    def save_zones_to_json(self, zones: List[Zone], filename: str = "simulated_zones.json"):
        """Save zones to JSON file for persistence"""
        zones_data = []
        for zone in zones:
            zone_dict = zone.dict()
            # Convert datetime to string for JSON serialization
            zone_dict['created_at'] = zone.created_at.isoformat()
            zone_dict['updated_at'] = zone.updated_at.isoformat()
            zones_data.append(zone_dict)
        
        with open(filename, 'w') as f:
            json.dump(zones_data, f, indent=2)
        
        print(f"Saved {len(zones)} zones to {filename}")
    
    def load_zones_from_json(self, filename: str = "simulated_zones.json") -> List[Zone]:
        """Load zones from JSON file"""
        try:
            with open(filename, 'r') as f:
                zones_data = json.load(f)
            
            zones = []
            for zone_dict in zones_data:
                # Convert string timestamps back to datetime
                zone_dict['created_at'] = datetime.fromisoformat(zone_dict['created_at'])
                zone_dict['updated_at'] = datetime.fromisoformat(zone_dict['updated_at'])
                zones.append(Zone(**zone_dict))
            
            print(f"Loaded {len(zones)} zones from {filename}")
            return zones
        except FileNotFoundError:
            print(f"File {filename} not found. Generating new zones.")
            return self.generate_zones()


# Example usage and testing
if __name__ == "__main__":
    # Create simulator with custom config
    config = SimulatedDataConfig(
        num_zones=15,
        noise_factor=0.15
    )
    
    simulator = EnvironmentalDataSimulator(config)
    
    # Generate initial zones
    zones = simulator.generate_zones()
    
    # Print sample data
    print(f"Generated {len(zones)} zones:")
    for zone in zones[:3]:  # Show first 3 zones
        print(f"\nZone: {zone.name}")
        print(f"  Location: ({zone.latitude:.2f}, {zone.longitude:.2f})")
        print(f"  Domain: {zone.domain}")
        print(f"  AQI: {zone.aqi:.1f}")
        print(f"  Rainfall: {zone.rainfall:.1f}mm")
        print(f"  Water Level: {zone.water_level:.2f}")
        print(f"  Population Density: {zone.population_density:.0f}/km²")
        if zone.temperature:
            print(f"  Temperature: {zone.temperature:.1f}°C")
            print(f"  Humidity: {zone.humidity:.1f}%")
            print(f"  Wind Speed: {zone.wind_speed:.1f}km/h")
    
    # Save to file
    simulator.save_zones_to_json(zones)
    
    # Test data update
    print("\nTesting data update...")
    updated_zone = simulator.update_zone_data(zones[0])
    print(f"Before: AQI={zones[0].aqi:.1f}, Rainfall={zones[0].rainfall:.1f}")
    print(f"After:  AQI={updated_zone.aqi:.1f}, Rainfall={updated_zone.rainfall:.1f}")
