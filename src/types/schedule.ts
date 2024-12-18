// Keep old types for backward compatibility
export interface ScheduleContent {
    customer_name: string;
    description: string;
    start_time: string;
    end_time: string;
    location?: string;
}

export interface ScheduleEntry {
    id: string;
    profile_id: string;
    content: ScheduleContent;
    created_at: string;
    updated_at: string;
}

// New v2 types with simpler structure
export interface ScheduleEntryV2 {
    id: string;
    profile_id: string;
    customer_name: string;
    description: string;
    start_time: string;
    end_time: string;
    location?: string;
    created_at: string;
    updated_at: string;
}

export interface ScheduleFormData {
    customer_name: string;
    description: string;
    start_date: string;
    start_time: string;
    end_time: string;
    location?: string;
} 