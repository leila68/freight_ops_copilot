// Shared API request/response types for Freight Ops Copilot.
// TODO: Adjust these shapes to match the real FastAPI backend contract once available.

export type UserRole = "staff" | "customer"

export interface User {
  id: string
  email: string
  full_name: string       
  role: UserRole
  company_name?: string   
  is_active: boolean
  created_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
  full_name: string      
  role: UserRole
  company_name?: string   
}

export interface AuthResponse {
  access_token: string
  token_type: string
}


// --- Reference data ---

export interface EquipmentType {
  id: string
  name: string // e.g. "Dry Van", "Reefer", "Flatbed"
  multiplier: number // e.g. 1.0, 1.25
  description?: string
}

// Alias used by the staff management UI.
export type Equipment = EquipmentType

export type AccessorialChargeType = "flat" | "percent"

export interface Accessorial {
  id: string
  name: string // e.g. "Liftgate", "Tailgate", "Appointment"
  charge_type: AccessorialChargeType
  amount: number // flat dollars OR percent of base depending on charge_type
  description?: string
}

export interface Lane {
  id: string
  origin_city: string
  origin_province: string
  destination_city: string
  destination_province: string
  base_rate: number
  distance_km: number
  transit_days: number
  is_active: boolean
}

// --- Quotes ---

export type QuoteStatus = "pending" | "accepted" | "expired" | "rejected"

export interface QuoteCalculateRequest {
  origin_city: string
  origin_province: string
  destination_city: string
  destination_province: string
  equipment_type_id: string
  total_weight: number // lbs
  pickup_date: string // ISO date
  accessorial_ids: string[]
}

export interface AccessorialLineItem {
  id: string
  name: string
  fee: number
}

export interface QuoteBreakdown {
  base_rate: number
  // equipment multiplier from equipment_types table
  equipment_multiplier: number
  // dollar increase/decrease caused by equipment multiplier
  equipment_adjustment: number
  // weight multiplier/factor
  weight_factor: number
  // extra charge caused by weight
  weight_adjustment: number
  // percentage from settings table
  fuel_surcharge_percent: number
  // calculated dollar amount from fuel surcharge
  fuel_surcharge: number
  accessorials: AccessorialLineItem[]
  total: number
}
export interface Quote {
  id: string
  customer_id: string
  customer_name?: string // present in staff views
  origin: string // "City, PROV"
  destination: string // "City, PROV"
  equipment_type: string
  total_weight: number
  pickup_date: string
  status: QuoteStatus
  total_price: number
  created_at: string // ISO datetime
  breakdown?: QuoteBreakdown
}

// --- Copilot ---

export type CopilotMessageRole = "user" | "assistant"

export interface CopilotChatRequest {
  message: string
  conversation_id: string | null
}

// A single status/tool-use step the backend may emit before the final answer.
export interface CopilotStep {
  type: "status" | "tool"
  text: string // e.g. "Looking up lane rate..."
}

export interface CopilotChatResponse {
  conversation_id: string
  message: string // final assistant answer
  steps?: CopilotStep[] // optional thinking / tool-use trace
}

export interface CopilotMessage {
  id: string
  role: CopilotMessageRole
  content: string
  steps?: CopilotStep[]
  pending?: boolean
}

// --- Generic list filters ---

export interface QuoteFilters {
  status?: QuoteStatus | "all"
  customer_id?: string
  lane?: string
  date_from?: string
  date_to?: string
}
