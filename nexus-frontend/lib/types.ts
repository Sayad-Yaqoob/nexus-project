export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'expert' | 'client' | 'admin';
  public_handle: string;
}

export interface OfferingDraft {
  id?: number;
  title: string;
  offer_type: '1:1 Session' | 'Subscription' | 'Digital Product' | 'Custom Offer' | 'Book' | 'Highlight';
  price: number;
  duration?: string;
  description?: string;
  file_required?: boolean;
  file_path?: string;
  file_placeholder_valid?: boolean;
}

export interface PreviewCard {
  draft_id: string;
  user_id: number;
  full_name: string;
  professional_headline: string;
  bio: string;
  category: string;
  expertise_tags: string[];
  offerings: OfferingDraft[];
  is_verified: boolean;
  needs_file_upload: boolean;
  validation_error?: string;
}

export interface RequirementBrief {
  problem: string;
  category: string;
  goals: string[];
  constraints: string[];
  expertise_needed: string[];
  urgency: string;
  missing_information?: string[];
  clarification_questions?: string[];
  confidence_score: number;
}

export interface MatchResult {
  expert_id: number;
  full_name: string;
  professional_headline: string;
  category: string;
  match_score: number; // 0 to 100
  reasoning: string;
  rank: number;
  top_offering?: OfferingDraft;
}

export interface Top3Matches {
  matches: MatchResult[];
  summary?: string;
}

export interface ExpertProfileSummary {
  id: number;
  user_id: number;
  full_name: string;
  handle: string;
  headline: string;
  bio: string;
  category: string;
  tags: string[];
  is_verified: boolean;
  linkedin_url?: string;
  x_url?: string;
  timezone?: string;
  offerings: OfferingDraft[];
}

export interface UserContext {
  mode: 'expert' | 'client';
  user: User;
  existing_profile?: {
    id: number;
    headline: string;
    bio: string;
    category: string;
    tags: string;
    is_verified: boolean;
  };
  offerings?: OfferingDraft[];
  session_history?: { id: number; status: string; created_at: string }[];
}
