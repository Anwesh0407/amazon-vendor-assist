/**
 * Typed API Client for AVA (Amazon Vendor Assist)
 * Built against docs/openapi.json
 * Supports VITE_API_BASE_URL and mock fallback mode
 */

import type {
  Product,
  ProductListResponse,
  Category,
  Niche,
  NicheFilter,
  EvidenceEnvelope,
  MarketSummary,
  OpportunityAnalysis,
  ReviewListResponse,
  ReviewSummary,
  RecommendationListResponse,
  ChatRequest,
  ChatResponse,
  ChatEvidenceItem,
} from '../types';

// Fixture imports for mock mode
import mockCategories from '../../fixtures/categories.json';
import mockProducts from '../../fixtures/products.json';
import mockAnalytics from '../../fixtures/analytics_summary.json';
import mockOpportunities from '../../fixtures/opportunities.json';
import mockReviewsSummary from '../../fixtures/reviews_summary.json';
import mockReviews from '../../fixtures/reviews.json';
import mockRecommendations from '../../fixtures/recommendations.json';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api/v1';
const FORCE_MOCKS = (import.meta as any).env?.VITE_USE_MOCKS === 'true';

async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (FORCE_MOCKS) {
    throw new Error('FORCE_MOCKS enabled');
  }

  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    let errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errorJson = await res.json();
      if (errorJson.detail) errorDetail = errorJson.detail;
    } catch {
      // ignore json parse error on error response
    }
    throw new Error(errorDetail);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Meta & Health
  async getHealth() {
    try {
      return await fetchJson<{ status: string; version: string; database: string }>('/health');
    } catch {
      return { status: 'mock_mode', version: '0.2.0', database: 'in_memory_fixtures' };
    }
  },

  async getMeta() {
    try {
      return await fetchJson<any>('/meta');
    } catch {
      return { app: 'Amazon Vendor Assist', version: '0.2.0', data_mode: 'demo' };
    }
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    try {
      return await fetchJson<Category[]>('/categories');
    } catch (e) {
      console.warn('Using mock categories:', e);
      return (mockCategories as any).categories || mockCategories;
    }
  },

  // Niches
  async getNiches(category?: string): Promise<Niche[]> {
    try {
      const q = category ? `?category=${encodeURIComponent(category)}` : '';
      return await fetchJson<Niche[]>(`/niches${q}`);
    } catch {
      return [
        {
          id: 'default-kurtas',
          name: "All Women's Kurtas & Kurtis",
          category: "Women's Kurtas & Kurtis",
          description: "Full marketplace category default snapshot",
          filter: { category: "Women's Kurtas & Kurtis" },
          sample_size: 32,
        },
      ];
    }
  },

  async createNiche(payload: { name: string; category: string; description?: string; filter: NicheFilter }): Promise<Niche> {
    try {
      return await fetchJson<Niche>('/niches', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      return {
        id: `niche-${Date.now()}`,
        name: payload.name,
        category: payload.category,
        description: payload.description,
        filter: payload.filter,
        sample_size: 24,
      };
    }
  },

  async previewNiche(filter: NicheFilter): Promise<{ sample_size: number; warning?: string }> {
    try {
      return await fetchJson<{ sample_size: number; warning?: string }>('/niches/preview', {
        method: 'POST',
        body: JSON.stringify(filter),
      });
    } catch {
      return { sample_size: 28, warning: 'Sample size below threshold 30' };
    }
  },

  // Products
  async getProducts(params: Record<string, any> = {}): Promise<ProductListResponse> {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          query.append(k, String(v));
        }
      });
      return await fetchJson<ProductListResponse>(`/products?${query.toString()}`);
    } catch (e) {
      console.warn('Using mock products:', e);
      return mockProducts as any;
    }
  },

  async getProduct(asin: string): Promise<Product | null> {
    try {
      return await fetchJson<Product>(`/products/${asin}`);
    } catch {
      const items = (mockProducts as any).items || [];
      return items.find((p: Product) => p.asin === asin) || null;
    }
  },

  async getSimilarProducts(asin: string): Promise<{ asin: string; count: number; similar_products: Product[] }> {
    try {
      return await fetchJson<{ asin: string; count: number; similar_products: Product[] }>(`/products/${asin}/similar`);
    } catch {
      const items = (mockProducts as any).items || [];
      return {
        asin,
        count: Math.min(3, items.length),
        similar_products: items.filter((p: Product) => p.asin !== asin).slice(0, 3),
      };
    }
  },

  // Analytics
  async getAnalyticsSummary(nicheId?: string): Promise<EvidenceEnvelope<MarketSummary>> {
    try {
      const q = nicheId ? `?niche_id=${encodeURIComponent(nicheId)}` : '';
      return await fetchJson<EvidenceEnvelope<MarketSummary>>(`/analytics/summary${q}`);
    } catch (e) {
      console.warn('Using mock analytics:', e);
      return mockAnalytics as any;
    }
  },

  async getOpportunities(nicheId?: string): Promise<EvidenceEnvelope<OpportunityAnalysis>> {
    try {
      const q = nicheId ? `?niche_id=${encodeURIComponent(nicheId)}` : '';
      return await fetchJson<EvidenceEnvelope<OpportunityAnalysis>>(`/analytics/opportunities${q}`);
    } catch (e) {
      console.warn('Using mock opportunities:', e);
      return mockOpportunities as any;
    }
  },

  // Reviews
  async getReviewsSummary(nicheId?: string, asin?: string): Promise<EvidenceEnvelope<ReviewSummary>> {
    try {
      const params = new URLSearchParams();
      if (nicheId) params.append('niche_id', nicheId);
      if (asin) params.append('asin', asin);
      const q = params.toString() ? `?${params.toString()}` : '';
      return await fetchJson<EvidenceEnvelope<ReviewSummary>>(`/reviews/summary${q}`);
    } catch (e) {
      console.warn('Using mock reviews summary:', e);
      return mockReviewsSummary as any;
    }
  },

  async getReviews(params: Record<string, any> = {}): Promise<EvidenceEnvelope<ReviewListResponse>> {
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          query.append(k, String(v));
        }
      });
      return await fetchJson<EvidenceEnvelope<ReviewListResponse>>(`/reviews?${query.toString()}`);
    } catch (e) {
      console.warn('Using mock reviews list:', e);
      return mockReviews as any;
    }
  },

  // Recommendations
  async getRecommendations(nicheId?: string): Promise<EvidenceEnvelope<RecommendationListResponse>> {
    try {
      const q = nicheId ? `?niche_id=${encodeURIComponent(nicheId)}` : '';
      return await fetchJson<EvidenceEnvelope<RecommendationListResponse>>(`/recommendations${q}`);
    } catch (e) {
      console.warn('Using mock recommendations:', e);
      return mockRecommendations as any;
    }
  },

  // Ask AVA Assistant
  async askAssistant(request: ChatRequest): Promise<EvidenceEnvelope<ChatResponse>> {
    try {
      const res = await fetchJson<any>('/assistant/ask', {
        method: 'POST',
        body: JSON.stringify(request),
      });

      // Backend returns AskQuestionResponse directly: { answer, evidence, limitations, follow_up_suggestions, mode, session_id }
      // Normalize it into EvidenceEnvelope<ChatResponse> expected by the frontend
      if (res && res.answer !== undefined && !res.data) {
        const evidenceItems: ChatEvidenceItem[] = (res.evidence || []).map((e: any) => ({
          metric: e.metric || 'metric',
          value: e.value,
          n: e.sample_size ?? e.n ?? 32,
          tool: e.source_tool ?? e.tool ?? 'database',
          niche: e.niche ?? 'All Listings',
        }));

        return {
          data: {
            answer: res.answer,
            evidence: evidenceItems,
            confidence: 'moderate',
            limitations: res.limitations || [],
            follow_up_suggestions: res.follow_up_suggestions || [],
            mode: (res.mode === 'gemini' ? 'gemini' : 'demo') as 'gemini' | 'demo',
          },
          meta: {
            niche: res.session_id || request.niche_id || "Women's Kurtas & Kurtis",
            sample_size: evidenceItems[0]?.n || 32,
            as_of: new Date().toISOString(),
            data_mode: res.mode || 'demo',
            sources: ['catalog_database'],
            limitations: res.limitations || [],
          },
        };
      }

      return res;
    } catch (e) {
      console.warn('Using mock assistant response:', e);
      return {
        data: {
          answer: "In Women's Kurtas & Kurtis, the median price is ₹849 with 62% of listings concentrated between ₹500 and ₹999. Pure Cotton is the dominant fabric (56% share).",
          evidence: [
            { metric: 'median_price', value: '₹849', n: 32, tool: 'get_market_summary', niche: "Women's Kurtas & Kurtis" },
            { metric: 'dominant_material', value: 'Cotton (56%)', n: 32, tool: 'get_brand_and_attribute_counts', niche: "Women's Kurtas & Kurtis" },
          ],
          confidence: 'moderate',
          limitations: ['Snapshot data only', 'Sample size n=32 is modest', 'No private sales figures'],
          follow_up_suggestions: [
            'What is the most competitive price band?',
            'What sizing gaps exist in 3XL+?',
            'Show top product opportunities',
          ],
          mode: 'demo',
        },
        meta: {
          niche: "Women's Kurtas & Kurtis",
          sample_size: 32,
          as_of: new Date().toISOString(),
          data_mode: 'demo',
          sources: ['synthetic_curated_v1.csv'],
          limitations: ['Synthetic sample data for MVP demonstration only'],
        },
      };
    }
  },

  async getAssistantStatus() {
    try {
      return await fetchJson<any>('/assistant/status');
    } catch {
      return { mode: 'demo', key_configured: false };
    }
  },
};
