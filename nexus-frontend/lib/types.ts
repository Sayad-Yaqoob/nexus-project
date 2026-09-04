export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'expert' | 'client' | 'admin';
  public_handle: string;
  currency?: string;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  intent?: string;
  suggested_actions?: string[];
}

export interface AgentChatResponse {
  response: string;
  session_id: string;
  intent: string;
  role: string;
  suggested_actions: string[];
  conversation_history: { role: string; content: string }[];
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
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

export interface MatchResult {
  expert_id: number;
  full_name: string;
  professional_headline: string;
  category: string;
  match_score: number;
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
