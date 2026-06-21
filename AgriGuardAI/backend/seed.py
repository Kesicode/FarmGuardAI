import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import engine, Base, SessionLocal
from app.models.user import User
from app.models.animal import Animal
from app.models.device import Device
from app.core.security import hash_password

def seed_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if users exist
        if db.query(User).filter(User.email == "admin@agriguard.ai").first():
            print("Database already seeded!")
            return

        print("Seeding Users...")
        admin = User(
            email="admin@agriguard.ai",
            password_hash=hash_password("admin123"),
            full_name="System Admin",
            role="admin"
        )
        farmer = User(
            email="farmer@agriguard.ai",
            password_hash=hash_password("farmer123"),
            full_name="Demo Farmer",
            role="farmer"
        )
        db.add(admin)
        db.add(farmer)
        db.commit()
        db.refresh(farmer)

        print("Seeding Devices & Animals...")
        device1 = Device(device_serial="ESP32_BULL_01", owner_id=farmer.id)
        device2 = Device(device_serial="ESP32_COW_02", owner_id=farmer.id)
        db.add(device1)
        db.add(device2)
        db.commit()
        db.refresh(device1)
        db.refresh(device2)

        animal1 = Animal(
            name="Barnaby",
            animal_type="cow",
            breed="Angus",
            age_months=36,
            owner_id=farmer.id,
            health_score=95.0,
            risk_level="low"
        )
        animal2 = Animal(
            name="Bessie",
            animal_type="cow",
            breed="Holstein",
            age_months=48,
            owner_id=farmer.id,
            health_score=88.0,
            risk_level="low"
        )
        db.add(animal1)
        db.add(animal2)
        
        # Link devices to animals
        db.commit()
        db.refresh(animal1)
        db.refresh(animal2)
        
        device1.animal_id = animal1.id
        device2.animal_id = animal2.id
        db.commit()
        
        print("Successfully seeded Database with demo users and data!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
