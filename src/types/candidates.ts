export interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  phone: string;
  linkedin_url?: string;
  location: string;
  
  // Current situation
  current_company?: string;
  current_position?: string;
  years_experience?: number;
  current_salary?: number;
  notice_period: boolean;
  notice_months?: number;
  
  // Recruitment
  position: string;
  expected_salary: number;
  contract_type: 'CDI' | 'CDD' | 'Stage' | 'Alternance' | 'Freelance';
  daily_rate?: number;
  skills: string[];
  is_technical_position: boolean;
  
  // Process
  status: 'draft' | 'pending' | 'pending_sales' | 'pending_tech' | 'validated' | 'rejected' | 'hired';
  hr_reference?: string;
  sales_reference?: string;
  hr_notes?: string;
  
  // Metadata
  created_at: string;
  created_by: string;
  override_by?: {
    full_name: string;
    role: string;
  };
  override_reason?: string;
  submitted_at?: string;
  last_contact?: string;
  is_favorite?: boolean;
}

export interface CandidateDocument {
  id: string;
  candidate_id: string;
  name: string;
  url: string;
  created_at: string;
}

export interface CandidateComment {
  id: string;
  candidate_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  user_profile?: {
    full_name: string;
    role: string;
  };
}

export interface CandidateValidation {
  id: string;
  candidate_id: string;
  user_id: string;
  type: 'sales' | 'tech';
  status: 'approved' | 'rejected';
  justification?: string;
  created_at: string;
  user_profile?: {
    full_name: string;
    role: string;
  };
}

export interface JobPosition {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CandidateTask {
  id: string;
  candidate_id: string;
  title: string;
  description: string;
  due_date: string;
  completed: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}