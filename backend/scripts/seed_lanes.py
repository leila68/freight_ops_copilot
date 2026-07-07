"""
Seed script — inserts all Canadian city pairs from the distance map into the lanes table.
Run once from inside the backend container:
    docker compose exec backend python scripts/seed_lanes.py
"""
import sys
sys.path.insert(0, "/app")

from decimal import Decimal
from app.db.session import SessionLocal
from app.db.models import Lane

RATE_PER_KM = Decimal("0.96")

LANES = [
    ("Toronto", "ON", "Montreal", "QC", 541),
    ("Toronto", "ON", "Ottawa", "ON", 450),
    ("Toronto", "ON", "Windsor", "ON", 370),
    ("Toronto", "ON", "Kingston", "ON", 265),
    ("Toronto", "ON", "Hamilton", "ON", 68),
    ("Toronto", "ON", "London", "ON", 192),
    ("Toronto", "ON", "Kitchener", "ON", 110),
    ("Toronto", "ON", "Quebec City", "QC", 800),
    ("Toronto", "ON", "Mississauga", "ON", 30),
    ("Toronto", "ON", "Brampton", "ON", 45),
    ("Toronto", "ON", "Sherbrooke", "QC", 410),
    ("Toronto", "ON", "Winnipeg", "MB", 2088),
    ("Toronto", "ON", "Calgary", "AB", 3401),
    ("Toronto", "ON", "Vancouver", "BC", 4393),
    ("Montreal", "QC", "Ottawa", "ON", 199),
    ("Montreal", "QC", "Quebec City", "QC", 253),
    ("Montreal", "QC", "Sherbrooke", "QC", 155),
    ("Montreal", "QC", "Laval", "QC", 20),
    ("Montreal", "QC", "Moncton", "NB", 1062),
    ("Montreal", "QC", "Halifax", "NS", 1281),
    ("Montreal", "QC", "Winnipeg", "MB", 2356),
    ("Ottawa", "ON", "Kingston", "ON", 180),
    ("Ottawa", "ON", "Sherbrooke", "QC", 300),
    ("Ottawa", "ON", "Quebec City", "QC", 502),
    ("Ottawa", "ON", "Hamilton", "ON", 488),
    ("Ottawa", "ON", "London", "ON", 580),
    ("Ottawa", "ON", "Winnipeg", "MB", 2106),
    ("Kingston", "ON", "Hamilton", "ON", 295),
    ("Kingston", "ON", "London", "ON", 370),
    ("Hamilton", "ON", "London", "ON", 123),
    ("Hamilton", "ON", "Kitchener", "ON", 75),
    ("Hamilton", "ON", "Windsor", "ON", 302),
    ("London", "ON", "Kitchener", "ON", 95),
    ("London", "ON", "Windsor", "ON", 190),
    ("Mississauga", "ON", "Hamilton", "ON", 45),
    ("Mississauga", "ON", "Brampton", "ON", 15),
    ("Brampton", "ON", "Hamilton", "ON", 55),
    ("Quebec City", "QC", "Sherbrooke", "QC", 255),
    ("Quebec City", "QC", "Laval", "QC", 233),
    ("Vancouver", "BC", "Calgary", "AB", 972),
    ("Vancouver", "BC", "Kelowna", "BC", 395),
    ("Vancouver", "BC", "Victoria", "BC", 115),
    ("Vancouver", "BC", "Surrey", "BC", 30),
    ("Vancouver", "BC", "Burnaby", "BC", 25),
    ("Vancouver", "BC", "Edmonton", "AB", 1162),
    ("Surrey", "BC", "Burnaby", "BC", 25),
    ("Surrey", "BC", "Kelowna", "BC", 388),
    ("Calgary", "AB", "Edmonton", "AB", 299),
    ("Calgary", "AB", "Red Deer", "AB", 148),
    ("Calgary", "AB", "Kelowna", "BC", 608),
    ("Calgary", "AB", "Saskatoon", "SK", 617),
    ("Calgary", "AB", "Winnipeg", "MB", 1328),
    ("Edmonton", "AB", "Red Deer", "AB", 150),
    ("Edmonton", "AB", "Saskatoon", "SK", 525),
    ("Edmonton", "AB", "Winnipeg", "MB", 1378),
    ("Winnipeg", "MB", "Regina", "SK", 571),
    ("Winnipeg", "MB", "Saskatoon", "SK", 781),
    ("Winnipeg", "MB", "Brandon", "MB", 197),
    ("Regina", "SK", "Saskatoon", "SK", 258),
    ("Halifax", "NS", "Moncton", "NB", 262),
    ("Halifax", "NS", "Fredericton", "NB", 396),
    ("Moncton", "NB", "Fredericton", "NB", 195),
]


def seed():
    db = SessionLocal()
    inserted = 0
    skipped = 0

    try:
        for origin_city, origin_province, dest_city, dest_province, distance_km in LANES:
            # Skip if already exists (both directions)
            exists = db.query(Lane).filter(
                Lane.origin_city == origin_city,
                Lane.origin_province == origin_province,
                Lane.destination_city == dest_city,
                Lane.destination_province == dest_province,
            ).first()

            if exists:
                skipped += 1
                continue

            base_rate = (Decimal(distance_km) * RATE_PER_KM).quantize(Decimal("0.01"))
            transit_days = 1 if distance_km < 800 else 2

            lane = Lane(
                origin_city=origin_city,
                origin_province=origin_province,
                destination_city=dest_city,
                destination_province=dest_province,
                base_rate=base_rate,
                distance_km=distance_km,
                transit_days=transit_days,
            )
            db.add(lane)
            inserted += 1

        db.commit()
        print(f"Done — inserted {inserted} lanes, skipped {skipped} existing.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()