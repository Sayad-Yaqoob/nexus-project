export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'expert' | 'client' | 'admin';
  public_handle: string;
  currency?: string;
  capabilities?: ('client' | 'expert')[];
  perspective?: 'client' | 'expert';
}

export interface AgentContext {
  user: User;
  capabilities: ('client' | 'expert')[];
  perspective: 'client' | 'expert';
  route: string;
  screen: string;
  selected_entity?: Record<string, unknown> | null;
  active_task?: Record<string, unknown> | null;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  intent?: string;
  suggested_actions?: string[];
  draft?: OfferingDraft;
  response_type?: string;
  requires_confirmation?: boolean;
  action_result?: Record<string, unknown>;
  response_data?: Record<string, unknown>;
  navigation?: {
    route: string;
    params?: Record<string, unknown>;
  };
}

export type ResponseType =
  | 'greeting'
  | 'clarification'
  | 'action_preview'
  | 'action_success'
  | 'search_results'
  | 'profile'
  | 'offering'
  | 'booking'
  | 'earnings'
  | 'navigation'
  | 'general'
  | 'error';

export interface AgentChatResponse {
  response: string;
  session_id: string;
  intent: string;
  role: string;
  suggested_actions: string[];
  conversation_history: { role: string; content: string }[];
  response_type: ResponseType;
  draft?: OfferingDraft;
  action_result?: Record<string, unknown>;
  requires_confirmation: boolean;
  confirmation?: { action?: string };
  response_data?: Record<string, unknown>;
  navigation?: {
    route: string;
    params?: Record<string, unknown>;
  };
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface OfferingDraft {
  id?: number | string;
  title?: string;
  offer_type?: '1:1 Session' | 'Subscription' | 'Digital Product' | 'Custom Offer' | 'Book' | 'Highlight' | string;
  price?: number;
  duration?: string;
  description?: string;
  file_required?: boolean;
  file_path?: string;
  file_placeholder_valid?: boolean;
  currency?: string;
  professional_headline?: string;
  category?: string;
  bio?: string;
  expertise_tags?: string | string[];
  full_name?: string;
  availability?: {
    days: string[];
    start?: string;
    end?: string;
  };
  target_audience?: string;
  content_draft?: string;
  newsletter_subject?: string;
  delivery_timeline?: string;
  custom_scope?: string;
}

export type Offering = OfferingDraft;

export interface AvailabilityDay {
  available: boolean;
  start?: string;
  end?: string;
}

export interface WeeklyAvailability {
  [day: string]: AvailabilityDay;
}

export interface ExpertMatch {
  id: string | number;
  user_id: string | number;
  full_name: string;
  handle: string;
  headline: string;
  category: string;
  tags: string[];
  match_score: number;
  reasoning: string;
  is_verified: boolean;
  top_offering?: OfferingDraft;
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
