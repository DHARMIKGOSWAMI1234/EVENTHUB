"""EVENTHUB — Deterministic Database Seeder

Populates the PostgreSQL database with a realistic, relationally consistent,
and completely fictional demo dataset for analytics, testing, and UI demonstrations.

Seed: 2026 (Deterministic)
Safety: All names, emails, phone numbers, and transactions are purely fictional.
"""

import os
import sys
import random
import hashlib
from datetime import datetime, date, time, timedelta, timezone
from decimal import Decimal

# Ensure backend directory is in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, "..", "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import engine
from app.models import (
    User,
    Organizer,
    Category,
    Venue,
    VenueSeat,
    Event,
    TicketType,
    EventSeat,
    Booking,
    BookingItem,
    Payment,
    Ticket,
    Review,
    Notification,
    AuditLog,
    Favorite,
)

# Fixed seed for repeatable deterministic demo data
SEED = 2026


def hash_demo_password(password: str, salt: str = "eventhub_demo_salt_2026") -> str:
    """Generate a standard PBKDF2-HMAC-SHA256 password hash for fictional demo accounts."""
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000,
    )
    return f"pbkdf2:sha256:100000${salt}${key.hex()}"


def clean_database(session: Session) -> None:
    """Idempotently reset all 16 core tables in reverse foreign key dependency order."""
    truncate_sql = text("""
        TRUNCATE TABLE 
            tickets,
            payments,
            booking_items,
            event_seats,
            bookings,
            ticket_types,
            reviews,
            favorites,
            notifications,
            audit_logs,
            events,
            venue_seats,
            venues,
            organizers,
            categories,
            users
        RESTART IDENTITY CASCADE;
    """)
    session.execute(truncate_sql)
    session.flush()


def seed_database(db_engine=None) -> dict[str, int]:
    """Execute the full transactional seeding process and return row counts."""
    random.seed(SEED)
    target_engine = db_engine or engine

    with Session(target_engine) as session:
        try:
            print("Beginning idempotent database reset...")
            clean_database(session)

            base_dt = datetime(2026, 8, 1, 10, 0, 0, tzinfo=timezone.utc)
            demo_password_hash = hash_demo_password("DemoUser@2026")

            # -----------------------------------------------------------------
            # 1. USERS (45 fictional users: 3 Admins, 10 Organizers, 32 Customers)
            # -----------------------------------------------------------------
            print("Seeding Users...")
            admin_data = [
                ("Priya Nair", "priya.nair.admin@example.com", "+1-555-0101"),
                ("David Chen", "david.chen.admin@example.com", "+1-555-0102"),
                ("Rajesh Gupta", "rajesh.gupta.admin@example.com", "+1-555-0103"),
            ]
            organizer_user_data = [
                ("Vikram Malhotra", "vikram.malhotra@example.com", "+1-555-0104"),
                ("Sarah Jenkins", "sarah.jenkins@example.com", "+1-555-0105"),
                ("Arjun Kapoor", "arjun.kapoor@example.com", "+1-555-0106"),
                ("Elena Rostova", "elena.rostova@example.com", "+1-555-0107"),
                ("Rahul Sen", "rahul.sen@example.com", "+1-555-0108"),
                ("Neha Varma", "neha.varma@example.com", "+1-555-0109"),
                ("Tanmay Bhatia", "tanmay.bhatia@example.com", "+1-555-0110"),
                ("Michael Chang", "michael.chang@example.com", "+1-555-0111"),
                ("Sneha Reddy", "sneha.reddy@example.com", "+1-555-0112"),
                ("Devendra Patel", "devendra.patel@example.com", "+1-555-0113"),
            ]
            customer_names = [
                "Aarav Mehta", "Riya Shah", "Kabir Patel", "Anaya Desai", "Vihaan Joshi",
                "Zara Khan", "Rohan Verma", "Pooja Sharma", "Siddharth Nair", "Meera Iyer",
                "Aditya Roy", "Isha Singhania", "Kunal Ghosh", "Shreya Kulkarni", "Nikhil Rao",
                "Diya Sengupta", "Farhan Akhtar", "Lavanya Sundaram", "Varun Tej", "Kriti Sanon",
                "Harshwardhan Rathi", "Natasha Paul", "Gautam Gambhir", "Alisha Chinai", "Manav Kaul",
                "Parineeti Sethi", "Chetan Bhagat", "Sania Mirza", "Pranav Anand", "Simran Kaur",
                "Ojasvi Trivedi", "Tushar Kapoor",
            ]

            users: list[User] = []
            # Admins
            for name, email, phone in admin_data:
                users.append(User(
                    full_name=name,
                    email=email,
                    password_hash=demo_password_hash,
                    phone=phone,
                    role="ADMIN",
                    is_active=True,
                    created_at=base_dt - timedelta(days=120),
                    updated_at=base_dt - timedelta(days=120),
                ))
            # Organizers
            for name, email, phone in organizer_user_data:
                users.append(User(
                    full_name=name,
                    email=email,
                    password_hash=demo_password_hash,
                    phone=phone,
                    role="ORGANIZER",
                    is_active=True,
                    created_at=base_dt - timedelta(days=100),
                    updated_at=base_dt - timedelta(days=100),
                ))
            # Customers
            for idx, name in enumerate(customer_names, start=14):
                parts = name.lower().split()
                email = f"{parts[0]}.{parts[1]}@example.com"
                phone = f"+1-555-01{idx:02d}"
                users.append(User(
                    full_name=name,
                    email=email,
                    password_hash=demo_password_hash,
                    phone=phone,
                    role="CUSTOMER",
                    is_active=True,
                    created_at=base_dt - timedelta(days=random.randint(10, 90)),
                    updated_at=base_dt - timedelta(days=random.randint(1, 10)),
                ))
            session.add_all(users)
            session.flush()

            admin_users = [u for u in users if u.role == "ADMIN"]
            organizer_users = [u for u in users if u.role == "ORGANIZER"]
            customer_users = [u for u in users if u.role == "CUSTOMER"]

            # -----------------------------------------------------------------
            # 2. ORGANIZERS (10 organizations linked 1:1 to organizer users)
            # -----------------------------------------------------------------
            print("Seeding Organizers...")
            org_configs = [
                ("PulseWave Events", "Pioneering live electronic, acoustic, and festival experiences across India.", "contact@pulsewave.example.org"),
                ("TechNova Conferences", "Premier technology and AI symposium organizers connecting developers and leaders.", "events@technova.example.org"),
                ("UrbanStage Productions", "Curators of premier comedy specials, live theatre, and spoken word showcases.", "booking@urbanstage.example.org"),
                ("NextGen Learning", "Hands-on professional technology bootcamps, workshops, and certifications.", "hello@nextgenlearning.example.org"),
                ("GameSphere Events", "Competitive esports tournaments, LAN parties, and game development summits.", "info@gamesphere.example.org"),
                ("BrightPath Workshops", "Inspiring creativity, design thinking, and leadership masterclasses.", "team@brightpath.example.org"),
                ("CampusConnect Youth", "Dynamic inter-collegiate youth festivals, hackathons, and talent expos.", "engage@campusconnect.example.org"),
                ("SummitWorks Global", "High-level executive leadership summits and investor networking galas.", "summit@summitworks.example.org"),
                ("Velocity Sports Media", "Community marathons, cycling grand tours, and athletic championships.", "sports@velocitymedia.example.org"),
                ("Artisan Cultural Collective", "Traditional folk festivals, culinary carnivals, and cultural galas.", "culture@artisancollective.example.org"),
            ]

            organizers: list[Organizer] = []
            for i, (org_name, desc, contact_email) in enumerate(org_configs):
                organizers.append(Organizer(
                    user_id=organizer_users[i].id,
                    organization_name=org_name,
                    description=desc,
                    contact_email=contact_email,
                    contact_phone=f"+1-555-02{i+1:02d}",
                    created_at=base_dt - timedelta(days=95),
                    updated_at=base_dt - timedelta(days=95),
                ))
            session.add_all(organizers)
            session.flush()

            # -----------------------------------------------------------------
            # 3. CATEGORIES (Exactly the 10 approved categories)
            # -----------------------------------------------------------------
            print("Seeding Categories...")
            category_data = [
                ("Music", "Concerts, acoustic sessions, symphony performances, and music festivals."),
                ("Technology", "Developer conferences, AI hackathons, cloud summits, and tech expos."),
                ("Sports", "Marathons, football championships, cricket tournaments, and fitness expos."),
                ("Education", "Academic seminars, competitive research symposiums, and college fairs."),
                ("Business", "Investor roundtables, startup pitch fests, and corporate conferences."),
                ("Comedy", "Stand-up specials, improv nights, and open mic comedy showcases."),
                ("Workshop", "Skill-building masterclasses, creative writing, and design sprints."),
                ("Festival", "Multi-day cultural celebrations, food fiestas, and seasonal carnivals."),
                ("Gaming", "Competitive esports leagues, video game showcases, and board game galas."),
                ("Networking", "Professional mixer evenings, alumni reunions, and career meetups."),
            ]
            categories: list[Category] = [
                Category(name=c_name, description=c_desc, created_at=base_dt - timedelta(days=110))
                for c_name, c_desc in category_data
            ]
            session.add_all(categories)
            session.flush()

            # -----------------------------------------------------------------
            # 4. VENUES (10 realistic fictional venues across major cities)
            # -----------------------------------------------------------------
            print("Seeding Venues...")
            venue_data = [
                ("Aurora Convention Center", "Multi-tier convention arena with cutting-edge acoustics.", "104 Outer Ring Road", "Bengaluru", "Karnataka", "India", 2500),
                ("Skyline Arena", "Premier indoor sports and music entertainment colosseum.", "45 Coastal Boulevard, Worli", "Mumbai", "Maharashtra", "India", 5000),
                ("Riverfront Auditorium", "State-of-the-art concert hall overlooking the promenade.", "12 Riverfront Park West", "Ahmedabad", "Gujarat", "India", 1200),
                ("Innovation Hub", "Flexible open-concept tech pavilion and startup forum.", "88 HITEC City Phase 2", "Hyderabad", "Telangana", "India", 800),
                ("Grand Civic Hall", "Historic neo-classical hall with multi-level balcony tiers.", "15 Parliament Enclave", "Delhi", "Delhi", "India", 1500),
                ("Metro Arts Pavilion", "Intimate theater for comedy, chamber music, and drama.", "22 Koregaon Park Road", "Pune", "Maharashtra", "India", 600),
                ("TechPark Conference Center", "Sprawling corporate convention auditorium.", "50 Electronics City Phase 1", "Bengaluru", "Karnataka", "India", 1000),
                ("Galaxy Expo Grounds", "Gigantic multi-acre outdoor exhibition and festival park.", "70 Western Express Highway", "Mumbai", "Maharashtra", "India", 10000),
                ("Royal Heritage Amphitheatre", "Open-air scenic stone amphitheatre.", "9 Amer Palace Road", "Jaipur", "Rajasthan", "India", 2000),
                ("Zenith Sports Complex", "High-capacity modern athletic arena and stadium.", "33 Marina Coastline Road", "Chennai", "Tamil Nadu", "India", 8000),
            ]
            venues: list[Venue] = []
            for v_name, v_desc, addr, city, state, country, cap in venue_data:
                venues.append(Venue(
                    name=v_name,
                    description=v_desc,
                    address_line=addr,
                    city=city,
                    state=state,
                    country=country,
                    capacity=cap,
                    created_at=base_dt - timedelta(days=100),
                    updated_at=base_dt - timedelta(days=100),
                ))
            session.add_all(venues)
            session.flush()

            # -----------------------------------------------------------------
            # 5. VENUE SEATS (For 6 reserved seating venues: ~624 seats)
            # -----------------------------------------------------------------
            print("Seeding Venue Seats...")
            reserved_venue_indices = [0, 1, 2, 4, 5, 9]  # Aurora, Skyline, Riverfront, Civic, Metro Arts, Zenith
            venue_seats: list[VenueSeat] = []
            seat_layout = [
                ("Section A", "VIP", ["A", "B"], 10),       # 20 seats
                ("Section B", "PREMIUM", ["C", "D", "E"], 12), # 36 seats
                ("Section C", "STANDARD", ["F", "G", "H", "J"], 12), # 48 seats
            ]  # 104 seats per venue * 6 = 624 seats

            for v_idx in reserved_venue_indices:
                v = venues[v_idx]
                for sec_name, seat_type, rows, count_per_row in seat_layout:
                    for row_str in rows:
                        for s_num in range(1, count_per_row + 1):
                            label = f"{sec_name[8]}-{row_str}-{s_num:02d}"
                            venue_seats.append(VenueSeat(
                                venue_id=v.id,
                                section_name=sec_name,
                                row_label=row_str,
                                seat_number=s_num,
                                seat_label=label,
                                seat_type=seat_type,
                                is_active=True,
                            ))
            session.add_all(venue_seats)
            session.flush()

            # Build a lookup of venue_id -> list of venue_seats
            venue_seat_map: dict[int, list[VenueSeat]] = {}
            for vs in venue_seats:
                venue_seat_map.setdefault(vs.venue_id, []).append(vs)

            # -----------------------------------------------------------------
            # 6. EVENTS (32 events: 7 COMPLETED, 20 PUBLISHED, 3 DRAFT, 2 CANCELLED)
            # -----------------------------------------------------------------
            print("Seeding Events...")
            event_templates = [
                # Completed Events (Past)
                ("SoundWave Monsoon Music Festival", "soundwave-monsoon-fest-2026", "A celebration of indie and electronic beats.", 0, 0, 7, date(2026, 6, 12), time(16, 0), time(23, 0), "GENERAL_ADMISSION", "COMPLETED"),
                ("TechNova AI Leadership Summit 2026", "technova-ai-leadership-2026", "Keynotes on frontier models, reasoning, and agents.", 1, 1, 0, date(2026, 6, 25), time(9, 30), time(18, 0), "RESERVED_SEATING", "COMPLETED"),
                ("Laughter Therapy Live with Rohan & Friends", "laughter-therapy-live-2026", "Top-rated stand-up comedy showcase.", 2, 5, 5, date(2026, 7, 10), time(19, 0), time(21, 30), "RESERVED_SEATING", "COMPLETED"),
                ("FullStack Cloud Architect Masterclass", "fullstack-cloud-masterclass-2026", "Intensive hands-on systems engineering workshop.", 3, 6, 3, date(2026, 7, 22), time(10, 0), time(17, 0), "GENERAL_ADMISSION", "COMPLETED"),
                ("Pro Gaming League Summer Qualifier", "pgl-summer-qualifier-2026", "High-stakes collegiate esports face-off.", 4, 8, 1, date(2026, 8, 5), time(11, 0), time(20, 0), "RESERVED_SEATING", "COMPLETED"),
                ("Bengaluru Founder & Investor Mixer", "bengaluru-founder-investor-mixer", "Curated networking evening for funded startups.", 7, 9, 6, date(2026, 8, 18), time(18, 30), time(22, 0), "GENERAL_ADMISSION", "COMPLETED"),
                ("Monsoon Midnight Half Marathon", "monsoon-midnight-half-marathon-2026", "Night-time marathon along the coastal freeway.", 8, 2, 7, date(2026, 8, 28), time(22, 0), time(23, 59), "GENERAL_ADMISSION", "COMPLETED"),

                # Published Upcoming Events
                ("Symphony Under the Stars", "symphony-under-the-stars-2026", "Classical orchestra and live strings performance.", 0, 0, 2, date(2026, 10, 24), time(18, 30), time(21, 30), "RESERVED_SEATING", "PUBLISHED"),
                ("Global DevCon India 2026", "global-devcon-india-2026", "India's largest open-source software conference.", 1, 1, 0, date(2026, 11, 14), time(9, 0), time(18, 0), "RESERVED_SEATING", "PUBLISHED"),
                ("The Great Stand-Up Comedy Fest", "great-stand-up-comedy-fest-2026", "An evening with 6 premier touring comedians.", 2, 5, 4, date(2026, 11, 20), time(19, 30), time(22, 30), "RESERVED_SEATING", "PUBLISHED"),
                ("UI/UX Design Systems Sprint", "uiux-design-systems-sprint-2026", "Hands-on tokens, accessibility, and micro-animations.", 5, 6, 3, date(2026, 11, 28), time(10, 0), time(16, 30), "GENERAL_ADMISSION", "PUBLISHED"),
                ("CyberDefend Security Summit 2026", "cyberdefend-security-summit-2026", "Zero-trust architecture and threat hunting.", 1, 1, 6, date(2026, 12, 5), time(9, 30), time(17, 30), "GENERAL_ADMISSION", "PUBLISHED"),
                ("National Esports Championship Finals", "national-esports-championship-2026", "Grand finals of Valorant and Rocket League.", 4, 8, 1, date(2026, 12, 12), time(12, 0), time(21, 0), "RESERVED_SEATING", "PUBLISHED"),
                ("Global Biotech Innovations Expo", "global-biotech-innovations-2026", "Life sciences showcase and healthcare panel.", 1, 1, 3, date(2026, 12, 18), time(10, 0), time(17, 0), "GENERAL_ADMISSION", "PUBLISHED"),
                ("New Year Acoustic Sunset Gala", "new-year-acoustic-sunset-gala", "Acoustic indie sets celebrating the upcoming year.", 0, 0, 8, date(2026, 12, 31), time(17, 0), time(23, 0), "GENERAL_ADMISSION", "PUBLISHED"),
                ("National Collegiate Hackathon 2027", "national-collegiate-hackathon-2027", "36-hour sprint for undergraduate innovators.", 6, 1, 6, date(2027, 1, 15), time(8, 0), time(20, 0), "GENERAL_ADMISSION", "PUBLISHED"),
                ("Enterprise AI & Data Architecture Summit", "enterprise-ai-data-summit-2027", "Big data pipelines and real-time streaming.", 1, 1, 0, date(2027, 1, 22), time(9, 0), time(18, 0), "RESERVED_SEATING", "PUBLISHED"),
                ("Kite & Cultural Heritage Fiesta", "kite-cultural-heritage-fiesta-2027", "Vibrant folk dances, kite craft, and traditional food.", 9, 7, 2, date(2027, 1, 28), time(11, 0), time(20, 0), "GENERAL_ADMISSION", "PUBLISHED"),
                ("Annual Health & Marathon Expo", "annual-health-marathon-expo-2027", "Pre-race expo, nutrition talks, and gear showcase.", 8, 2, 9, date(2027, 2, 6), time(9, 0), time(19, 0), "RESERVED_SEATING", "PUBLISHED"),
                ("Indie Rock Underground Showcase", "indie-rock-underground-showcase", "Four breakthrough bands in an electric set.", 0, 0, 5, date(2027, 2, 13), time(19, 0), time(23, 0), "RESERVED_SEATING", "PUBLISHED"),
                ("FinTech Disruptors Forum", "fintech-disruptors-forum-2027", "Cross-border payments, UPI 2.0, and digital lending.", 7, 4, 3, date(2027, 2, 20), time(10, 0), time(17, 0), "GENERAL_ADMISSION", "PUBLISHED"),
                ("CleanTech & Renewable Energy Expo", "cleantech-renewable-energy-expo", "Solar, hydrogen, and sustainable urban tech.", 1, 4, 7, date(2027, 3, 5), time(9, 30), time(18, 0), "GENERAL_ADMISSION", "PUBLISHED"),
                ("Spring Stand-Up Extravaganza", "spring-standup-extravaganza-2027", "A two-hour punchline marathon with top comics.", 2, 5, 4, date(2027, 3, 12), time(19, 30), time(22, 0), "RESERVED_SEATING", "PUBLISHED"),
                ("Robotics & Embedded Systems Conclave", "robotics-embedded-systems-2027", "Autonomous drones, ROS2, and edge compute.", 3, 1, 0, date(2027, 3, 20), time(9, 0), time(17, 30), "RESERVED_SEATING", "PUBLISHED"),
                ("VR & Immersive Entertainment Expo", "vr-immersive-entertainment-2027", "Virtual reality, spatial audio, and haptics showcase.", 4, 8, 1, date(2027, 3, 27), time(10, 0), time(19, 0), "RESERVED_SEATING", "PUBLISHED"),
                ("South India Culinary Heritage Carnival", "south-india-culinary-carnival-2027", "Authentic dishes, chef workshops, and spices.", 9, 7, 8, date(2027, 4, 10), time(11, 0), time(22, 0), "GENERAL_ADMISSION", "PUBLISHED"),
                ("Venture Growth & Scaling Masterclass", "venture-growth-scaling-masterclass", "Series A-C operational playbooks for executives.", 7, 4, 6, date(2027, 4, 17), time(9, 30), time(17, 0), "GENERAL_ADMISSION", "PUBLISHED"),

                # Draft Events (Upcoming Future Planning)
                ("Next-Gen Web3 & Decentralized Systems", "nextgen-web3-decentralized-systems", "Draft agenda exploring decentralized compute.", 1, 1, 3, date(2027, 5, 15), time(10, 0), time(17, 0), "GENERAL_ADMISSION", "DRAFT"),
                ("Global Animation & VFX Film Summit", "global-animation-vfx-summit-2027", "Draft proposal for computer graphics and 3D modeling.", 0, 0, 0, date(2027, 6, 10), time(9, 0), time(18, 0), "RESERVED_SEATING", "DRAFT"),
                ("Artificial Intelligence Ethics Round Table", "ai-ethics-round-table-2027", "Closed-door draft dialogue on AI governance.", 7, 4, 6, date(2027, 6, 20), time(14, 0), time(18, 0), "GENERAL_ADMISSION", "DRAFT"),

                # Cancelled Events
                ("Monsoon Rock Open Air (Rescheduled)", "monsoon-rock-open-air-cancelled", "Cancelled due to tropical weather warning.", 0, 0, 7, date(2026, 7, 18), time(16, 0), time(22, 0), "GENERAL_ADMISSION", "CANCELLED"),
                ("International Drone Racing Sprint", "international-drone-racing-cancelled", "Cancelled due to airspace permissions.", 4, 2, 9, date(2026, 8, 22), time(14, 0), time(20, 0), "RESERVED_SEATING", "CANCELLED"),
            ]

            events: list[Event] = []
            for title, slug, desc, org_idx, cat_idx, ven_idx, ev_date, st_time, end_time, mode, status in event_templates:
                events.append(Event(
                    organizer_id=organizers[org_idx].id,
                    category_id=categories[cat_idx].id,
                    venue_id=venues[ven_idx].id,
                    title=title,
                    slug=slug,
                    description=desc,
                    event_date=ev_date,
                    start_time=st_time,
                    end_time=end_time,
                    seating_mode=mode,
                    status=status,
                    banner_image_url=f"https://images.example.com/events/{slug}.jpg",
                    created_at=base_dt - timedelta(days=random.randint(60, 100)),
                    updated_at=base_dt - timedelta(days=random.randint(1, 30)),
                ))
            session.add_all(events)
            session.flush()

            # -----------------------------------------------------------------
            # 7. TICKET TYPES (2-3 ticket types per suitable event: ~80 total)
            # -----------------------------------------------------------------
            print("Seeding Ticket Types...")
            ticket_types: list[TicketType] = []
            for ev in events:
                if ev.seating_mode == "RESERVED_SEATING":
                    # Reserved seating events map to VIP, Premium, Standard
                    ticket_types.append(TicketType(
                        event_id=ev.id,
                        name="VIP Reserved",
                        description="Front-row premium reserved seating with lounge access.",
                        price=Decimal("2499.00"),
                        capacity=20,
                        sold_count=0,
                        sale_start=datetime.combine(ev.event_date - timedelta(days=45), time(9, 0), tzinfo=timezone.utc),
                        sale_end=datetime.combine(ev.event_date, ev.start_time, tzinfo=timezone.utc),
                        is_active=True,
                    ))
                    ticket_types.append(TicketType(
                        event_id=ev.id,
                        name="Premium Reserved",
                        description="Center-tier seating with excellent stage sightlines.",
                        price=Decimal("1299.00"),
                        capacity=36,
                        sold_count=0,
                        sale_start=datetime.combine(ev.event_date - timedelta(days=45), time(9, 0), tzinfo=timezone.utc),
                        sale_end=datetime.combine(ev.event_date, ev.start_time, tzinfo=timezone.utc),
                        is_active=True,
                    ))
                    ticket_types.append(TicketType(
                        event_id=ev.id,
                        name="Standard Reserved",
                        description="Rear-tier reserved seating with clear acoustic experience.",
                        price=Decimal("699.00"),
                        capacity=48,
                        sold_count=0,
                        sale_start=datetime.combine(ev.event_date - timedelta(days=45), time(9, 0), tzinfo=timezone.utc),
                        sale_end=datetime.combine(ev.event_date, ev.start_time, tzinfo=timezone.utc),
                        is_active=True,
                    ))
                else:
                    # General Admission events
                    ticket_types.append(TicketType(
                        event_id=ev.id,
                        name="Early Bird Pass",
                        description="Discounted admission for early community registrants.",
                        price=Decimal("399.00"),
                        capacity=100,
                        sold_count=0,
                        sale_start=datetime.combine(ev.event_date - timedelta(days=60), time(9, 0), tzinfo=timezone.utc),
                        sale_end=datetime.combine(ev.event_date - timedelta(days=30), time(23, 59), tzinfo=timezone.utc),
                        is_active=True,
                    ))
                    ticket_types.append(TicketType(
                        event_id=ev.id,
                        name="General Admission",
                        description="Full single-day admission to all keynotes and showcase floors.",
                        price=Decimal("799.00"),
                        capacity=min(ev.venue.capacity, 500),
                        sold_count=0,
                        sale_start=datetime.combine(ev.event_date - timedelta(days=30), time(0, 0), tzinfo=timezone.utc),
                        sale_end=datetime.combine(ev.event_date, ev.start_time, tzinfo=timezone.utc),
                        is_active=True,
                    ))
                    if ev.category.name in ["Technology", "Business", "Workshop"]:
                        ticket_types.append(TicketType(
                            event_id=ev.id,
                            name="Executive / Workshop Pass",
                            description="Includes networking dinner and all breakout workshops.",
                            price=Decimal("1799.00"),
                            capacity=50,
                            sold_count=0,
                            sale_start=datetime.combine(ev.event_date - timedelta(days=45), time(9, 0), tzinfo=timezone.utc),
                            sale_end=datetime.combine(ev.event_date, ev.start_time, tzinfo=timezone.utc),
                            is_active=True,
                        ))
            session.add_all(ticket_types)
            session.flush()

            # Build event_id -> ticket_types map
            event_tt_map: dict[int, list[TicketType]] = {}
            for tt in ticket_types:
                event_tt_map.setdefault(tt.event_id, []).append(tt)

            # -----------------------------------------------------------------
            # 8. EVENT SEATS (For reserved seating events: ~800+ seats)
            # -----------------------------------------------------------------
            print("Seeding Event Seats...")
            event_seats_list: list[EventSeat] = []
            reserved_events = [ev for ev in events if ev.seating_mode == "RESERVED_SEATING"]
            
            for rev in reserved_events:
                seats_for_venue = venue_seat_map.get(rev.venue_id, [])
                for vs in seats_for_venue:
                    event_seats_list.append(EventSeat(
                        event_id=rev.id,
                        venue_seat_id=vs.id,
                        status="AVAILABLE",
                        hold_expires_at=None,
                        held_by_booking_id=None,
                    ))
            session.add_all(event_seats_list)
            session.flush()

            # Build (event_id, seat_type) -> list of EventSeat
            event_seat_pool: dict[tuple[int, str], list[EventSeat]] = {}
            for es in event_seats_list:
                s_type = es.venue_seat.seat_type  # VIP, PREMIUM, STANDARD
                event_seat_pool.setdefault((es.event_id, s_type), []).append(es)

            # -----------------------------------------------------------------
            # 9. BOOKINGS, ITEMS, PAYMENTS, TICKETS
            # (Target: 110 bookings, ~180 items, 110 payments, ~210 tickets)
            # -----------------------------------------------------------------
            print("Seeding Bookings, Booking Items, Payments, and Tickets...")
            bookings: list[Booking] = []
            booking_items: list[BookingItem] = []
            payments: list[Payment] = []
            tickets_list: list[Ticket] = []

            # We will book across completed events and published events
            bookable_events = [ev for ev in events if ev.status in ["COMPLETED", "PUBLISHED"]]

            booking_counter = 1
            ticket_counter = 1

            for b_idx in range(1, 111):
                # Distribute bookings
                cust = customer_users[(b_idx - 1) % len(customer_users)]
                ev = bookable_events[(b_idx - 1) % len(bookable_events)]
                avail_tts = event_tt_map.get(ev.id, [])

                # Booking status logic
                if ev.status == "COMPLETED":
                    b_status = "CONFIRMED"
                else:
                    if b_idx % 20 == 0:
                        b_status = "REFUNDED"
                    elif b_idx % 15 == 0:
                        b_status = "EXPIRED"
                    elif b_idx % 11 == 0:
                        b_status = "CANCELLED"
                    elif b_idx % 7 == 0:
                        b_status = "PENDING_PAYMENT"
                    else:
                        b_status = "CONFIRMED"

                b_ref = f"EVH-2026-{booking_counter:06d}"
                booking_counter += 1

                # Select 1 or 2 ticket types
                num_items = 2 if (b_idx % 2 == 0 and len(avail_tts) > 1) else 1
                chosen_tts = avail_tts[:num_items]

                b_subtotal = Decimal("0.00")
                item_specs: list[tuple[TicketType, int, Decimal]] = []

                for tt in chosen_tts:
                    qty = 1 if ev.seating_mode == "RESERVED_SEATING" else (2 if b_idx % 2 == 0 else 1)
                    item_sub = tt.price * Decimal(qty)
                    b_subtotal += item_sub
                    item_specs.append((tt, qty, item_sub))

                # Discount & tax
                discount = Decimal("50.00") if (b_subtotal > Decimal("1000.00") and b_idx % 4 == 0) else Decimal("0.00")
                taxable = max(Decimal("0.00"), b_subtotal - discount)
                tax = (taxable * Decimal("0.18")).quantize(Decimal("0.01"))
                total = taxable + tax

                b_created_at = datetime.combine(
                    ev.event_date - timedelta(days=random.randint(15, 30)),
                    time(random.randint(9, 21), random.randint(0, 59)),
                    tzinfo=timezone.utc,
                )

                booking = Booking(
                    user_id=cust.id,
                    event_id=ev.id,
                    booking_reference=b_ref,
                    status=b_status,
                    subtotal=b_subtotal,
                    discount_amount=discount,
                    tax_amount=tax,
                    total_amount=total,
                    expires_at=b_created_at + timedelta(minutes=15) if b_status == "PENDING_PAYMENT" else None,
                    created_at=b_created_at,
                    updated_at=b_created_at,
                )
                session.add(booking)
                session.flush()
                bookings.append(booking)

                # Booking Items & Tickets
                for tt, qty, item_sub in item_specs:
                    b_item = BookingItem(
                        booking_id=booking.id,
                        ticket_type_id=tt.id,
                        quantity=qty,
                        unit_price=tt.price,
                        subtotal=item_sub,
                    )
                    booking_items.append(b_item)

                    # Update sold_count if confirmed
                    if b_status == "CONFIRMED":
                        tt.sold_count = min(tt.capacity, tt.sold_count + qty)

                    # Create tickets for confirmed, completed, or refunded bookings
                    if b_status in ["CONFIRMED", "REFUNDED", "CANCELLED"]:
                        for q in range(qty):
                            t_code = f"EVH-TKT-{ticket_counter:06d}"
                            t_hash = hashlib.sha256(f"{t_code}-{SEED}".encode()).hexdigest()[:16]
                            qr_token = f"EVH-QR-{t_hash.upper()}"
                            ticket_counter += 1

                            if ev.status == "COMPLETED" and b_status == "CONFIRMED":
                                t_status = "USED"
                                checked_in_at = datetime.combine(ev.event_date, ev.start_time, tzinfo=timezone.utc) + timedelta(minutes=random.randint(5, 45))
                            elif b_status == "CONFIRMED":
                                t_status = "ACTIVE"
                                checked_in_at = None
                            elif b_status == "REFUNDED":
                                t_status = "REFUNDED"
                                checked_in_at = None
                            else:
                                t_status = "CANCELLED"
                                checked_in_at = None

                            # Assign event seat if reserved
                            assigned_seat_id = None
                            if ev.seating_mode == "RESERVED_SEATING":
                                # Determine seat type from ticket name
                                s_type = "VIP" if "VIP" in tt.name else ("PREMIUM" if "Premium" in tt.name else "STANDARD")
                                pool = event_seat_pool.get((ev.id, s_type), [])
                                for es_cand in pool:
                                    if es_cand.status == "AVAILABLE":
                                        es_cand.status = "BOOKED" if t_status in ["ACTIVE", "USED"] else "AVAILABLE"
                                        assigned_seat_id = es_cand.id
                                        break

                            tickets_list.append(Ticket(
                                booking_id=booking.id,
                                ticket_type_id=tt.id,
                                event_seat_id=assigned_seat_id,
                                ticket_code=t_code,
                                qr_token=qr_token,
                                status=t_status,
                                issued_at=b_created_at,
                                checked_in_at=checked_in_at,
                            ))

                # Handle event seat hold for PENDING_PAYMENT
                if b_status == "PENDING_PAYMENT" and ev.seating_mode == "RESERVED_SEATING":
                    pool = event_seat_pool.get((ev.id, "STANDARD"), [])
                    for es_cand in pool:
                        if es_cand.status == "AVAILABLE":
                            es_cand.status = "HELD"
                            es_cand.held_by_booking_id = booking.id
                            es_cand.hold_expires_at = booking.expires_at
                            break

                # Create Payment record
                p_ref = f"TXN-EVH-{b_idx:06d}"
                pay_method = ["UPI", "CARD", "NET_BANKING", "CASH"][b_idx % 4]

                if b_status == "CONFIRMED":
                    p_status = "SUCCESS"
                    p_paid_at = b_created_at + timedelta(minutes=random.randint(1, 8))
                elif b_status == "PENDING_PAYMENT":
                    p_status = "PENDING"
                    p_paid_at = None
                elif b_status == "REFUNDED":
                    p_status = "REFUNDED"
                    p_paid_at = b_created_at + timedelta(minutes=5)
                else:
                    p_status = "FAILED"
                    p_paid_at = None

                payments.append(Payment(
                    booking_id=booking.id,
                    transaction_reference=p_ref,
                    amount=booking.total_amount,
                    payment_method=pay_method,
                    status=p_status,
                    paid_at=p_paid_at,
                    created_at=b_created_at,
                ))

            session.add_all(booking_items)
            session.add_all(payments)
            session.add_all(tickets_list)
            session.flush()

            # -----------------------------------------------------------------
            # 10. REVIEWS (55 realistic reviews for customers with attended events)
            # -----------------------------------------------------------------
            print("Seeding Reviews...")
            completed_events = [ev for ev in events if ev.status == "COMPLETED"]
            reviews: list[Review] = []
            review_pairs: set[tuple[int, int]] = set()

            review_comments = [
                (5, "Absolutely breathtaking sound design and stage presence! Will definitely attend next year."),
                (5, "Incredible insights from the speakers. Seamless badge collection and great networking tracks."),
                (4, "Great lineup and well organized. The venue was easy to access, though lines were long."),
                (4, "Hilarious performances throughout! Highly recommend Catching this live."),
                (5, "Hands-on, highly practical content that I immediately applied to my job."),
                (3, "Good content overall, but the auditorium acoustics had noticeable echo in back rows."),
                (4, "Very high energy and smooth game casting. Super fun community tournament."),
                (5, "Wonderful evening and high quality connections made with fellow founders."),
                (2, "Content was decent but the parking management at the venue was quite chaotic."),
                (4, "Splendid organization and prompt schedule adherence. Well done to the team!"),
                (5, "Phenomenal musical experience! The light show during the finale was top notch."),
                (4, "Thought-provoking panel discussions. Appreciate the clear timekeeping."),
            ]

            # Find valid (user_id, event_id) combinations from completed bookings
            valid_review_candidates: list[tuple[int, int, datetime]] = []
            for b in bookings:
                if b.status == "CONFIRMED" and b.event.status == "COMPLETED":
                    valid_review_candidates.append((b.user_id, b.event_id, b.event.event_date))

            # Pick distinct combinations
            rev_idx = 0
            for u_id, ev_id, ev_d in valid_review_candidates:
                if (u_id, ev_id) not in review_pairs and len(reviews) < 55:
                    review_pairs.add((u_id, ev_id))
                    rating, comment = review_comments[rev_idx % len(review_comments)]
                    rev_idx += 1
                    rev_created = datetime.combine(ev_d + timedelta(days=random.randint(1, 5)), time(14, 0), tzinfo=timezone.utc)
                    reviews.append(Review(
                        user_id=u_id,
                        event_id=ev_id,
                        rating=rating,
                        comment=comment,
                        created_at=rev_created,
                        updated_at=rev_created,
                    ))

            # If more reviews needed to reach 55, add from remaining customers for completed events
            for ev in completed_events:
                for c in customer_users:
                    if len(reviews) >= 55:
                        break
                    if (c.id, ev.id) not in review_pairs:
                        review_pairs.add((c.id, ev.id))
                        rating, comment = review_comments[rev_idx % len(review_comments)]
                        rev_idx += 1
                        rev_created = datetime.combine(ev.event_date + timedelta(days=2), time(16, 0), tzinfo=timezone.utc)
                        reviews.append(Review(
                            user_id=c.id,
                            event_id=ev.id,
                            rating=rating,
                            comment=comment,
                            created_at=rev_created,
                            updated_at=rev_created,
                        ))

            session.add_all(reviews)
            session.flush()

            # -----------------------------------------------------------------
            # 11. FAVORITES (75 favorite records across customers and events)
            # -----------------------------------------------------------------
            print("Seeding Favorites...")
            favorites: list[Favorite] = []
            candidate_pairs = [(c.id, ev.id) for c in customer_users for ev in events]
            random.Random(SEED).shuffle(candidate_pairs)

            for u_id, ev_id in candidate_pairs[:75]:
                favorites.append(Favorite(
                    user_id=u_id,
                    event_id=ev_id,
                    created_at=base_dt - timedelta(days=random.randint(5, 50)),
                ))

            session.add_all(favorites)
            session.flush()

            # -----------------------------------------------------------------
            # 12. NOTIFICATIONS (80 notifications with read/unread statuses)
            # -----------------------------------------------------------------
            print("Seeding Notifications...")
            notif_templates = [
                ("Booking Confirmed", "Your reservation for '{title}' is confirmed! Ticket reference: {ref}.", "BOOKING_CONFIRMATION"),
                ("Payment Successful", "We received your payment of INR {amt} for booking {ref}.", "PAYMENT_RECEIVED"),
                ("Event Reminder", "Reminder: '{title}' is happening tomorrow at {venue}. Check in starts 1 hr prior.", "EVENT_REMINDER"),
                ("Welcome to EVENTHUB", "Explore upcoming music, technology, and sports experiences near you.", "WELCOME"),
                ("Ticket Available for Download", "Your digital pass for '{title}' is now ready with QR access.", "TICKET_ISSUED"),
                ("Schedule Update", "Please note the revised start time for '{title}'. Details in your dashboard.", "SCHEDULE_UPDATE"),
            ]

            notifications: list[Notification] = []
            for idx in range(1, 81):
                b = bookings[(idx - 1) % len(bookings)]
                tpl_title, tpl_msg, n_type = notif_templates[(idx - 1) % len(notif_templates)]
                
                title = tpl_title
                msg = tpl_msg.format(
                    title=b.event.title[:30],
                    ref=b.booking_reference,
                    amt=b.total_amount,
                    venue=b.event.venue.name[:25],
                )
                is_read = True if idx % 3 != 0 else False

                notifications.append(Notification(
                    user_id=b.user_id,
                    title=title,
                    message=msg,
                    type=n_type,
                    is_read=is_read,
                    created_at=b.created_at + timedelta(minutes=random.randint(10, 120)),
                ))
            session.add_all(notifications)
            session.flush()

            # -----------------------------------------------------------------
            # 13. AUDIT LOGS (75 audit logs with valid JSONB snapshots)
            # -----------------------------------------------------------------
            print("Seeding Audit Logs...")
            audit_logs: list[AuditLog] = []
            audit_actions = [
                ("USER_REGISTRATION", "users", {"role": "CUSTOMER", "status": "active"}, None),
                ("ORGANIZER_VERIFIED", "organizers", {"verified": True}, {"verified": False}),
                ("EVENT_CREATED", "events", {"status": "DRAFT", "slug": "new-event"}, None),
                ("EVENT_PUBLISHED", "events", {"status": "PUBLISHED"}, {"status": "DRAFT"}),
                ("BOOKING_CREATED", "bookings", {"status": "PENDING_PAYMENT", "currency": "INR"}, None),
                ("PAYMENT_SUCCESS", "payments", {"status": "SUCCESS", "gateway": "SIMULATED"}, {"status": "PENDING"}),
                ("TICKET_ISSUED", "tickets", {"status": "ACTIVE", "seat_mode": "RESERVED"}, None),
                ("EVENT_COMPLETED", "events", {"status": "COMPLETED"}, {"status": "PUBLISHED"}),
            ]

            for a_idx in range(1, 76):
                act, e_type, new_d, old_d = audit_actions[(a_idx - 1) % len(audit_actions)]
                actor_user = customer_users[a_idx % len(customer_users)] if a_idx % 4 != 0 else admin_users[0]
                
                audit_logs.append(AuditLog(
                    user_id=actor_user.id,
                    action=act,
                    entity_type=e_type,
                    entity_id=a_idx,
                    old_data=old_d,
                    new_data=new_d,
                    created_at=base_dt - timedelta(days=random.randint(1, 60)),
                ))
            session.add_all(audit_logs)
            session.flush()

            # Commit the entire transaction
            session.commit()
            print("Database transaction successfully committed!")

            # Return exact counts
            counts = {
                "users": len(users),
                "organizers": len(organizers),
                "categories": len(categories),
                "venues": len(venues),
                "venue_seats": len(venue_seats),
                "events": len(events),
                "ticket_types": len(ticket_types),
                "event_seats": len(event_seats_list),
                "bookings": len(bookings),
                "booking_items": len(booking_items),
                "payments": len(payments),
                "tickets": len(tickets_list),
                "reviews": len(reviews),
                "notifications": len(notifications),
                "audit_logs": len(audit_logs),
                "favorites": len(favorites),
            }
            return counts

        except Exception as e:
            session.rollback()
            print(f"Error during seeding, transaction rolled back: {e}", file=sys.stderr)
            raise


if __name__ == "__main__":
    print("=" * 60)
    print("EVENTHUB — Phase 3 Demo Data Seeding")
    print("=" * 60)
    seeded_counts = seed_database()
    print("\nSuccessfully seeded tables:")
    for tbl, count in sorted(seeded_counts.items()):
        print(f"  {tbl:<18}: {count:>5} records")
    print("\nPhase 3 database seeding completed successfully.")
