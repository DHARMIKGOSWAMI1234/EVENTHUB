"""EVENTHUB Analytics and DBMS View Schemas"""

from datetime import datetime, date
from decimal import Decimal
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class SalesSummaryResponse(BaseModel):
    """Event sales summary mapping from v_event_sales_summary view."""
    event_id: int
    event_title: str
    organization_name: str
    category_name: str
    event_status: str
    event_date: date
    total_bookings: int
    confirmed_bookings: int
    cancelled_bookings: int
    refunded_bookings: int
    tickets_sold: int
    gross_revenue: Decimal

    model_config = ConfigDict(from_attributes=True)


class OccupancyResponse(BaseModel):
    """Event occupancy metrics mapping from v_event_occupancy view."""
    event_id: int
    event_title: str
    venue_name: str
    event_date: date
    seating_mode: str
    total_ticket_capacity: int
    sold_tickets: int
    available_tickets: int
    occupancy_percentage: float

    model_config = ConfigDict(from_attributes=True)


class OrganizerRevenueResponse(BaseModel):
    """Organizer revenue metrics mapping from v_organizer_revenue view."""
    organizer_id: int
    organization_name: str
    total_events: int
    confirmed_bookings: int
    tickets_sold: int
    gross_revenue: Decimal
    average_booking_value: Optional[Decimal] = None

    model_config = ConfigDict(from_attributes=True)


class MonthlyBookingResponse(BaseModel):
    """Monthly booking analytics mapping from v_monthly_booking_summary view."""
    booking_year: int
    booking_month: int
    month_label: str
    total_bookings: int
    confirmed_bookings: int
    cancelled_bookings: int
    refunded_bookings: int
    total_revenue: Decimal

    model_config = ConfigDict(from_attributes=True)


class RatingSummaryResponse(BaseModel):
    """Event rating summary mapping from v_event_rating_summary view."""
    event_id: int
    event_title: str
    category_name: str
    review_count: int
    average_rating: float
    minimum_rating: int
    maximum_rating: int

    model_config = ConfigDict(from_attributes=True)


class AdminOverviewResponse(BaseModel):
    """High-level platform system KPI metrics."""
    total_users: int
    total_events: int
    total_bookings: int
    confirmed_bookings: int
    gross_revenue: Decimal
    total_tickets_sold: int
    average_platform_rating: float


class AuditLogResponse(BaseModel):
    """Audit log entry representation with sanitized JSONB snapshots."""
    id: int
    user_id: Optional[int] = None
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    old_data: Optional[Dict[str, Any]] = None
    new_data: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        inst = super().model_validate(obj, *args, **kwargs)
        if inst.old_data and isinstance(inst.old_data, dict) and "password_hash" in inst.old_data:
            inst.old_data = {k: v for k, v in inst.old_data.items() if k != "password_hash"}
        if inst.new_data and isinstance(inst.new_data, dict) and "password_hash" in inst.new_data:
            inst.new_data = {k: v for k, v in inst.new_data.items() if k != "password_hash"}
        return inst

