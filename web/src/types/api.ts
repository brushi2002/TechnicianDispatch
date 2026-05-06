// TypeScript interfaces matching FastAPI response shapes.
// Response interfaces use PascalCase aliases (what FastAPI serializes by_alias=True).
// Create/Update interfaces use snake_case Python field names (accepted via populate_by_name=True).

export interface Job {
  id: string
  Name: string | null
  DurationInHours: number
  StartTime: string // ISO 8601 with timezone
}

export interface JobCreate {
  name?: string
  duration_in_hours: number
  start_time: string
}

export interface JobUpdate {
  name?: string
  duration_in_hours?: number
  start_time?: string
}

export interface Technician {
  id: string
  Name: string
  Address: string | null
}

export interface TechnicianCreate {
  name: string
  address?: string
}

export interface TechnicianUpdate {
  name?: string
  address?: string
}

export interface JobAssignment {
  JobId: string
  TechnicianId: string
  JobStartDateTime: string | null    // ISO 8601 datetime (TIMESTAMPTZ)
  JobEndDateTime: string | null  // ISO 8601 datetime (TIMESTAMPTZ)
}

export interface TechnicianAvailability {
  TechnicianID: string
  DayofWeek: number // 1=Mon … 5=Fri (ISODOW weekdays only)
  StartTime: string | null // "HH:MM:SS±HH" (TIMETZ)
  EndTime: string | null   // "HH:MM:SS±HH" (TIMETZ)
}

export interface TechnicianAvailabilityCreate {
  TechnicianID: string
  DayofWeek: number
  StartTime?: string
  EndTime?: string
}

export interface TechnicianAvailabilityUpdate {
  StartTime?: string
  EndTime?: string
}

export const DAY_LABELS: Record<number, string> = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
}
