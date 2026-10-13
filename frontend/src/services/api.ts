import axios from 'axios';
import {
  Sector, SectorRule, Brand, OfficialSocialAsset, OfficialAppAsset,
  ApprovedAsset, SocialCandidate, AppCandidate, Finding, DashboardSummary,
  ThreatTrendItem, SectorStatItem, GraphResponse, DataSource
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export const api = {
  // Health
  checkHealth: async () => {
    const res = await apiClient.get('/health');
    return res.data;
  },

  // Dashboard
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const res = await apiClient.get('/dashboard/summary');
    return res.data;
  },
  getSectorsSummary: async (): Promise<SectorStatItem[]> => {
    const res = await apiClient.get('/dashboard/sectors');
    return res.data;
  },
  getThreatTrends: async (): Promise<ThreatTrendItem[]> => {
    const res = await apiClient.get('/dashboard/trends');
    return res.data;
  },
  getRecentFindings: async (limit = 10): Promise<Finding[]> => {
    const res = await apiClient.get('/dashboard/recent-findings', { params: { limit } });
    return res.data;
  },

  // Sectors
  getSectors: async (): Promise<Sector[]> => {
    const res = await apiClient.get('/sectors');
    return res.data;
  },
  getSector: async (id: string): Promise<Sector> => {
    const res = await apiClient.get(`/sectors/${id}`);
    return res.data;
  },
  createSector: async (data: Partial<Sector>): Promise<Sector> => {
    const res = await apiClient.post('/sectors', data);
    return res.data;
  },
  updateSector: async (id: string, data: Partial<Sector>): Promise<Sector> => {
    const res = await apiClient.patch(`/sectors/${id}`, data);
    return res.data;
  },
  deleteSector: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete(`/sectors/${id}`);
    return res.data;
  },
  updateSectorRule: async (sectorId: string, ruleId: number, data: Partial<SectorRule>): Promise<SectorRule> => {
    const res = await apiClient.patch(`/sectors/${sectorId}/rules/${ruleId}`, data);
    return res.data;
  },

  // Brands
  getBrands: async (params?: { sector_id?: string; search?: string; status?: string }): Promise<Brand[]> => {
    const res = await apiClient.get('/brands', { params });
    return res.data;
  },
  getBrand: async (id: number): Promise<Brand> => {
    const res = await apiClient.get(`/brands/${id}`);
    return res.data;
  },
  createBrand: async (data: any): Promise<Brand> => {
    const res = await apiClient.post('/brands', data);
    return res.data;
  },
  updateBrand: async (id: number, data: Partial<Brand>): Promise<Brand> => {
    const res = await apiClient.patch(`/brands/${id}`, data);
    return res.data;
  },
  deleteBrand: async (id: number, force = false): Promise<{ message: string }> => {
    const res = await apiClient.delete(`/brands/${id}`, { params: { force } });
    return res.data;
  },
  addSocialAsset: async (brandId: number, data: Partial<OfficialSocialAsset>): Promise<OfficialSocialAsset> => {
    const res = await apiClient.post(`/brands/${brandId}/social-assets`, data);
    return res.data;
  },
  deleteSocialAsset: async (brandId: number, assetId: number) => {
    const res = await apiClient.delete(`/brands/${brandId}/social-assets/${assetId}`);
    return res.data;
  },
  addAppAsset: async (brandId: number, data: Partial<OfficialAppAsset>): Promise<OfficialAppAsset> => {
    const res = await apiClient.post(`/brands/${brandId}/app-assets`, data);
    return res.data;
  },
  deleteAppAsset: async (brandId: number, assetId: number) => {
    const res = await apiClient.delete(`/brands/${brandId}/app-assets/${assetId}`);
    return res.data;
  },
  addApprovedAsset: async (brandId: number, data: Partial<ApprovedAsset>): Promise<ApprovedAsset> => {
    const res = await apiClient.post(`/brands/${brandId}/approved-assets`, data);
    return res.data;
  },
  deleteApprovedAsset: async (brandId: number, assetId: number) => {
    const res = await apiClient.delete(`/brands/${brandId}/approved-assets/${assetId}`);
    return res.data;
  },

  // Social Candidates
  getSocialCandidates: async (params?: {
    sector_id?: string;
    brand_id?: number;
    platform?: string;
    severity?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    const res = await apiClient.get('/social/candidates', { params });
    return res.data;
  },
  analyzeSocial: async (data: Partial<SocialCandidate>) => {
    const res = await apiClient.post('/social/analyze', data);
    return res.data;
  },

  // App Candidates
  getAppCandidates: async (params?: {
    sector_id?: string;
    brand_id?: number;
    store?: string;
    severity?: string;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    const res = await apiClient.get('/apps/candidates', { params });
    return res.data;
  },
  analyzeApp: async (data: Partial<AppCandidate>) => {
    const res = await apiClient.post('/apps/analyze', data);
    return res.data;
  },

  // Findings
  getFindings: async (params?: {
    sector_id?: string;
    brand_id?: number;
    severity?: string;
    status?: string;
    candidate_type?: string;
    exclude_official?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Finding[]> => {
    const res = await apiClient.get('/findings', { params });
    return res.data;
  },
  getFinding: async (id: number): Promise<Finding> => {
    const res = await apiClient.get(`/findings/${id}`);
    return res.data;
  },
  updateFindingStatus: async (
    id: number,
    data: { status: string; analyst: string; notes?: string; add_to_approved_assets?: boolean }
  ): Promise<Finding> => {
    const res = await apiClient.patch(`/findings/${id}/status`, data);
    return res.data;
  },
  addFindingNote: async (id: number, data: { author: string; content: string }) => {
    const res = await apiClient.post(`/findings/${id}/notes`, data);
    return res.data;
  },
  getExportCsvUrl: (params?: { sector_id?: string; brand_id?: number; severity?: string; status?: string; candidate_type?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.sector_id) searchParams.append('sector_id', params.sector_id);
    if (params?.brand_id) searchParams.append('brand_id', params.brand_id.toString());
    if (params?.severity) searchParams.append('severity', params.severity);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.candidate_type) searchParams.append('candidate_type', params.candidate_type);
    return `${API_BASE_URL}/findings/export.csv?${searchParams.toString()}`;
  },

  // Threat Graph
  getThreatGraph: async (params?: { sector_id?: string; brand_id?: number; severity?: string }): Promise<GraphResponse> => {
    const res = await apiClient.get('/threat-graph', { params });
    return res.data;
  },

  // Data Sources & Demo
  getDataSources: async (): Promise<DataSource[]> => {
    const res = await apiClient.get('/sources');
    return res.data;
  },
  getSourcesStatus: async () => {
    const res = await apiClient.get('/sources/status');
    return res.data;
  },
  seedDemoData: async () => {
    const res = await apiClient.post('/demo/seed');
    return res.data;
  },

  // Reports
  getSectorReport: async (sectorId: string) => {
    const res = await apiClient.get(`/reports/sector/${sectorId}`);
    return res.data;
  },
  getBrandReport: async (brandId: number) => {
    const res = await apiClient.get(`/reports/brand/${brandId}`);
    return res.data;
  },

  // ML Fake Detection Model
  predictFakeDetection: async (text: string, sector: string) => {
    const res = await apiClient.post('/detection/predict', { text, sector });
    return res.data;
  },
};
