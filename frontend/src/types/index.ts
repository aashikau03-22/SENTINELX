export interface SectorRule {
  id: number;
  sector_id: string;
  rule_name: string;
  rule_code: string;
  description: string;
  weight: number;
  threshold: number;
  is_enabled: boolean;
  created_at: string;
}

export interface Sector {
  id: string;
  name: string;
  description: string;
  icon: string;
  threat_categories: string[];
  recommended_checklist: string[];
  is_custom: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  rules?: SectorRule[];
  brands_count?: number;
  findings_count?: number;
  high_critical_count?: number;
  social_candidates_count?: number;
  app_candidates_count?: number;
}

export interface OfficialSocialAsset {
  id: number;
  brand_id: number;
  platform: string;
  handle: string;
  profile_url: string;
  is_primary: boolean;
  created_at: string;
}

export interface OfficialAppAsset {
  id: number;
  brand_id: number;
  app_name: string;
  store: string;
  package_id: string;
  app_url: string;
  developer_name: string;
  created_at: string;
}

export interface ApprovedAsset {
  id: number;
  brand_id: number;
  asset_type: string;
  identifier: string;
  reason: string;
  approved_by: string;
  created_at: string;
}

export interface BrandCreateInput {
  name: string;
  sector_id: string;
  description?: string;
  official_website: string;
  approved_domains?: string[];
  logo_url?: string;
  official_developer?: string;
  aliases?: string[];
  keywords?: string[];
  monitoring_status?: string;
  social_assets?: Partial<OfficialSocialAsset>[];
  app_assets?: Partial<OfficialAppAsset>[];
}

export interface Brand {
  id: number;
  name: string;
  sector_id: string;
  description: string;
  official_website: string;
  approved_domains: string[];
  logo_url?: string;
  official_developer?: string;
  aliases: string[];
  keywords: string[];
  monitoring_status: string;
  created_at: string;
  updated_at: string;
  social_assets: OfficialSocialAsset[];
  app_assets: OfficialAppAsset[];
  approved_assets: ApprovedAsset[];
  findings_count?: number;
}

export interface FindingEvidence {
  id: number;
  finding_id: number;
  signal_name: string;
  score: number;
  weight: number;
  explanation: string;
  evidence_metadata?: Record<string, any>;
  created_at: string;
}

export interface ReviewNote {
  id: number;
  finding_id: number;
  author: string;
  content: string;
  created_at: string;
}

export interface ReviewHistory {
  id: number;
  finding_id: number;
  previous_status: string;
  new_status: string;
  analyst: string;
  notes?: string;
  created_at: string;
}

export interface Finding {
  id: number;
  candidate_type: 'social' | 'app';
  social_candidate_id?: number;
  app_candidate_id?: number;
  brand_id: number;
  sector_id: string;
  risk_score: number;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'New' | 'Needs Review' | 'Confirmed Impersonation' | 'False Positive' | 'Resolved';
  is_official_excluded: boolean;
  exclusion_reason?: string;
  threat_category: string;
  recommended_steps: string[];
  assigned_analyst?: string;
  created_at: string;
  updated_at: string;
  brand_name?: string;
  candidate_name?: string;
  candidate_url?: string;
  candidate_platform_or_store?: string;
  evidence?: FindingEvidence[];
  notes?: ReviewNote[];
  history?: ReviewHistory[];
}

export interface SocialCandidate {
  id: number;
  platform: string;
  display_name: string;
  handle: string;
  profile_url: string;
  description?: string;
  image_url?: string;
  brand_id?: number;
  brand_name?: string;
  sector_id: string;
  source_type: string;
  first_seen: string;
  last_seen: string;
  created_at: string;
  finding?: {
    id: number;
    risk_score: number;
    severity: string;
    status: string;
    is_official_excluded: boolean;
    exclusion_reason?: string;
    threat_category: string;
    assigned_analyst?: string;
    ai_prediction?: {
      prediction: 'fake' | 'genuine' | string;
      is_fake: boolean;
      confidence: number;
      fake_probability: number;
      genuine_probability: number;
      sector_used: string;
    } | null;
  };
}

export interface AppCandidate {
  id: number;
  app_name: string;
  store: string;
  app_url: string;
  package_id: string;
  developer_name: string;
  description?: string;
  icon_url?: string;
  brand_id?: number;
  brand_name?: string;
  sector_id: string;
  source_type: string;
  first_seen: string;
  last_seen: string;
  created_at: string;
  finding?: {
    id: number;
    risk_score: number;
    severity: string;
    status: string;
    is_official_excluded: boolean;
    exclusion_reason?: string;
    threat_category: string;
    assigned_analyst?: string;
    ai_prediction?: {
      prediction: 'fake' | 'genuine' | string;
      is_fake: boolean;
      confidence: number;
      fake_probability: number;
      genuine_probability: number;
      sector_used: string;
    } | null;
  };
}

export interface DashboardSummary {
  protected_brands: number;
  candidates_analysed: number;
  potential_threats: number;
  high_critical_findings: number;
  awaiting_review: number;
  resolved_findings: number;
  total_findings: number;
  official_excluded_count: number;
}

export interface ThreatTrendItem {
  date: string;
  social_threats: number;
  app_threats: number;
  total_findings: number;
}

export interface SectorStatItem {
  sector_id: string;
  sector_name: string;
  icon: string;
  brand_count: number;
  findings_count: number;
  high_critical_count: number;
  awaiting_review_count: number;
  resolved_count: number;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'brand' | 'social' | 'app' | 'publisher' | 'domain';
  severity?: string;
  risk_score?: number;
  sector_id?: string;
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  evidence: string;
  confidence: number;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface DataSource {
  id: number;
  name: string;
  source_type: string;
  status: string;
  is_live: boolean;
  last_sync?: string;
  records_count: number;
  notes?: string;
  created_at: string;
}
