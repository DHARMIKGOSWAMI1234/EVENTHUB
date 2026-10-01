// frontend/src/types/index.ts

/**
 * EVENTHUB TypeScript Domain Types
 * Exactly matches FastAPI backend schemas and DTOs with flexible convenience aliases
 */

export type UserRole = 'CUSTOMER' | 'ORGANIZER' | 'ADMIN';

export interface User {
  id: number;
  user_id?: number;
  full_name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in_seconds: number;
}

export interface Category {
  id: number;
  category_id?: number;
  name: string;
  category_name?: string;
  description?: string | null;
  created_at?: string;
}

export interface CategoryCreateRequest {
  name?: string;
  category_name?: string;
  description?: string | null;
}

export interface CategoryUpdateRequest {
  name?: string;
  category_name?: string;
  description?: string | null;
}

export interface Venue {
  id: number;
  venue_id?: number;
  name: string;
  city: string;
  address?: string | null;
  address_line?: string | null;
  state?: string | null;
  country?: string | null;
  capacity: number;
  created_at?: string;
}

export interface VenueCreateRequest {
  name: string;
  city: string;
  address: string;
  capacity: number;
}

export interface VenueUpdateRequest {
  name?: string;
  city?: string;
  address?: string;
  capacity?: number;
}

export interface VenueSeat {
  id: number;
  seat_id?: number;
  venue_id: number;
  section_name?: string;
  section?: string;
  row_label?: string;
  row_number?: string;
  seat_number: number | string;
  seat_label: string;
  seat_type?: string;
  is_active?: boolean;
}

export interface VenueSeatCreateRequest {
  section_name?: string;
  section?: string;
  row_label?: string;
  row_number?: string;
  seat_number: number | string;
  seat_label?: string;
  seat_type?: string;
}

export type SeatingMode =
  | 'GENERAL_ADMISSION'
  | 'RESERVED_SEATING'
  | 'GENERAL'
  | 'RESERVED';

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';

export interface EventItem {
  id: number;
  event_id?: number;
  organizer_id: number;
  category_id: number;
  venue_id: number;
  title: string;
  slug?: string;
  description: string;
  event_date?: string;
  start_time: string;
  end_time?: string | null;
  seating_mode: SeatingMode;
  status: EventStatus;
  banner_image_url?: string | null;
  created_at?: string;
  updated_at?: string;
  category_name?: string | null;
  venue_name?: string | null;
  venue_city?: string | null;
  venue_address?: string | null;
  organization_name?: string | null;
  organizer_name?: string | null;
  min_price?: number;
  avg_rating?: number | null;
  average_rating?: number | null;
  review_count?: number | null;
}

export interface TicketType {
  id: number;
  ticket_type_id?: number;
  event_id?: number;
  name: string;
  description?: string | null;
  price: string | number;
  capacity: number;
  sold_count?: number;
  is_active?: boolean;
}

export interface TicketTypeCreateRequest {
  name: string;
  description?: string | null;
  price: string | number;
  capacity: number;
}

export interface EventDetail extends EventItem {
  ticket_types: TicketType[];
  available_ticket_count?: number | null;
  average_rating?: number | null;
  avg_rating?: number | null;
  review_count?: number | null;
}

export interface EventAvailability {
  event_id: number;
  title: string;
  seating_mode: SeatingMode;
  total_capacity: number;
  sold_tickets: number;
  total_reserved?: number;
  available_tickets: number;
  occupancy_percentage: number;
  is_sold_out?: boolean;
}

export type SeatStatus = 'AVAILABLE' | 'HELD' | 'BOOKED' | 'BLOCKED';

export interface EventSeat {
  id: number;
  event_seat_id?: number;
  event_id: number;
  venue_seat_id?: number;
  seat_id?: number;
  status: SeatStatus;
  section_name?: string;
  section?: string;
  row_label?: string;
  row_number?: string;
  seat_number: number | string;
  seat_label: string;
  seat_type?: string;
}

export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUNDED';

export type PaymentMethod = 'UPI' | 'CARD' | 'NET_BANKING' | 'CASH';

export interface BookingItem {
  id: number;
  booking_item_id?: number;
  ticket_type_id: number;
  ticket_type_name?: string | null;
  seat_label?: string | null;
  quantity: number;
  unit_price: string | number;
  subtotal: string | number;
}

export interface Booking {
  id: number;
  booking_id?: number;
  user_id: number;
  event_id: number;
  event_title?: string | null;
  venue_name?: string | null;
  start_time?: string | null;
  booking_reference: string;
  status: BookingStatus;
  subtotal: string | number;
  discount_amount: string | number;
  tax_amount: string | number;
  total_amount: string | number;
  created_at: string;
  expires_at?: string | null;
}

export interface BookingDetail extends Booking {
  items: BookingItem[];
  ticket_count: number;
  payment?: Payment;
}

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: number;
  payment_id?: number;
  booking_id: number;
  transaction_reference: string;
  amount: string | number;
  payment_method: string;
  status: PaymentStatus;
  paid_at?: string | null;
  created_at: string;
}

export type TicketStatus =
  | 'ACTIVE'
  | 'ISSUED'
  | 'USED'
  | 'CHECKED_IN'
  | 'CANCELLED'
  | 'REFUNDED';

export interface Ticket {
  id: number;
  ticket_id?: number;
  booking_id: number;
  ticket_type_id: number;
  ticket_type_name?: string | null;
  event_id?: number | null;
  event_title?: string | null;
  venue_name?: string | null;
  start_time?: string | null;
  event_seat_id?: number | null;
  seat_label?: string | null;
  price?: number;
  ticket_code: string;
  qr_token: string;
  status: TicketStatus;
  checked_in_at?: string | null;
  issued_at?: string | null;
  created_at?: string | null;
}

export interface TicketValidateResponse {
  id: number;
  ticket_code: string;
  previous_status: string;
  current_status: string;
  message: string;
  validated_at: string;
}

export interface TicketValidationResponse {
  valid: boolean;
  status?: string;
  message: string;
  ticket?: Ticket;
}

export interface Review {
  id: number;
  review_id?: number;
  user_id: number;
  user_name?: string | null;
  event_id: number;
  rating: number;
  comment?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Favorite {
  id: number;
  favorite_id?: number;
  user_id: number;
  event_id: number;
  event_title?: string | null;
  venue_name?: string | null;
  start_time?: string | null;
  event_date?: string | null;
  created_at: string;
}

export interface Notification {
  id: number;
  notification_id?: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface OrganizerProfile {
  id: number;
  user_id: number;
  organization_name: string;
  bio?: string | null;
  description?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  website_url?: string | null;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  pages: number;
}

export interface MessageResponse {
  message: string;
  detail?: string;
}

// Analytics Types (PostgreSQL Views)
export interface SalesSummary {
  event_id: number;
  event_title: string;
  organization_name?: string;
  category_name?: string;
  event_status?: string;
  event_date?: string;
  total_bookings: number;
  confirmed_bookings?: number;
  cancelled_bookings?: number;
  refunded_bookings?: number;
  tickets_sold: number;
  gross_revenue: string | number;
  total_revenue?: string | number;
}

export interface OccupancySummary {
  event_id: number;
  event_title: string;
  venue_name: string;
  event_date?: string;
  seating_mode: string;
  total_ticket_capacity?: number;
  total_capacity?: number;
  sold_tickets?: number;
  booked_tickets?: number;
  available_tickets: number;
  occupancy_percentage: number;
}

export interface OrganizerRevenue {
  organizer_id: number;
  organization_name?: string;
  organizer_name?: string;
  total_events: number;
  confirmed_bookings: number;
  tickets_sold: number;
  gross_revenue: string | number;
  total_revenue?: string | number;
  average_booking_value?: string | number | null;
}

export interface MonthlyBooking {
  booking_year: number;
  booking_month?: number | string;
  month_label?: string;
  total_bookings: number;
  confirmed_bookings?: number;
  cancelled_bookings?: number;
  refunded_bookings?: number;
  total_revenue: string | number;
}

export interface RatingSummary {
  event_id: number;
  event_title: string;
  category_name?: string;
  review_count?: number;
  total_reviews?: number;
  average_rating: number;
  minimum_rating?: number;
  maximum_rating?: number;
}

export interface AdminOverview {
  total_users: number;
  total_events: number;
  total_bookings: number;
  confirmed_bookings: number;
  gross_revenue: string | number;
  total_tickets_sold: number;
  average_platform_rating: number;
}

export interface AuditLog {
  id: number;
  audit_id?: number;
  user_id?: number | null;
  action: string;
  entity_type?: string;
  entity_name?: string;
  entity_id?: number | null;
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
  created_at: string;
}
