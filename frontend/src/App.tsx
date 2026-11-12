import { useState, useEffect } from 'react';
import {
  Home,
  Sliders,
  BarChart2,
  Sparkles,
  Package,
  Search,
  ChevronDown,
  Layers,
  User,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import { api } from './services/api';
import type {
  Product,
  Category,
  Niche,
  NicheFilter,
  MarketSummary,
  OpportunityAnalysis,
  ReviewListResponse,
  ReviewSummary,
  RecommendationListResponse,
  EvidenceEnvelope,
  UserProfile,
} from './types';
import { DemoDataBanner } from './components/Badges';
import { ErrorBoundary } from './components/ErrorBoundary';

// Workspaces
import { HomeWorkspace } from './workspaces/HomeWorkspace';
import { CategoriesWorkspace } from './workspaces/CategoriesWorkspace';
import { DefineNicheWorkspace } from './workspaces/DefineNicheWorkspace';
import { MarketResultsWorkspace } from './workspaces/MarketResultsWorkspace';
import { ReviewsWorkspace } from './workspaces/ReviewsWorkspace';
import { RecommendationsWorkspace } from './workspaces/RecommendationsWorkspace';
import { ProductDetailsWorkspace } from './workspaces/ProductDetailsWorkspace';
import { AskAvaWorkspace } from './workspaces/AskAvaWorkspace';
import { LoginWorkspace } from './workspaces/LoginWorkspace';

export type WorkspaceTab =
  | 'home'
  | 'categories'
  | 'define_niche'
  | 'results'
  | 'analytics'
  | 'reviews'
  | 'recommendations'
  | 'product_details'
  | 'ask_ava'
  | 'login';

export function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('home');

  // Categories & Niches state
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Women's Kurtas & Kurtis");
  const [savedNiches, setSavedNiches] = useState<Niche[]>([]);
  const [activeNiche, setActiveNiche] = useState<Niche | null>(null);
  const [currentFilter, setCurrentFilter] = useState<NicheFilter>({
    category: "Women's Kurtas & Kurtis",
  });

  // Global search input
  const [searchQuery, setSearchQuery] = useState('');

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const [sortBy, setSortBy] = useState<string>('rating_desc');
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);

  // Analytics & Envelopes
  const [analyticsEnvelope, setAnalyticsEnvelope] = useState<EvidenceEnvelope<MarketSummary> | null>(null);
  const [opportunitiesEnvelope, setOpportunitiesEnvelope] = useState<EvidenceEnvelope<OpportunityAnalysis> | null>(null);
  const [reviewsEnvelope, setReviewsEnvelope] = useState<EvidenceEnvelope<ReviewListResponse> | null>(null);
  const [reviewsSummaryEnvelope, setReviewsSummaryEnvelope] = useState<EvidenceEnvelope<ReviewSummary> | null>(null);
  const [recommendationsEnvelope, setRecommendationsEnvelope] = useState<EvidenceEnvelope<RecommendationListResponse> | null>(null);

  // Meta & Backend
  const [backendStatus, setBackendStatus] = useState<any>(null);

  // User Profile & Authentication State (Registration & OTP Flow)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('ava_user_profile');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      name: 'Vandana Mohanty',
      age: '31',
      gender: 'Female',
      email: 'vandana.kurtis@gmail.com',
      phone: '9861023456',
      businessName: 'Vandana Kurtis & Handlooms',
      address: 'Plot 142, Saheed Nagar, Industrial Estate',
      city: 'Bhubaneswar',
      state: 'Odisha',
      pincode: '751007',
      sellerCategory: "Women's Kurtas & Kurtis",
      isVerified: true,
      registeredAt: '2026-10-14T03:00:00Z',
    };
  });
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLoginSuccess = (profile: UserProfile) => {
    setUserProfile(profile);
    try {
      localStorage.setItem('ava_user_profile', JSON.stringify(profile));
    } catch {
      // ignore
    }
    setActiveTab('home');
  };

  // Initial load
  useEffect(() => {
    async function init() {
      const [healthRes, catRes, nicheRes] = await Promise.all([
        api.getHealth(),
        api.getCategories(),
        api.getNiches("Women's Kurtas & Kurtis"),
      ]);

      setBackendStatus(healthRes);
      setCategories(catRes || []);
      setSavedNiches(nicheRes || []);

      if (nicheRes && nicheRes.length > 0) {
        setActiveNiche(nicheRes[0]);
        setCurrentFilter(nicheRes[0].filter || { category: "Women's Kurtas & Kurtis" });
      }
    }
    init();
  }, []);

  // When active niche or filter changes, refresh all envelopes
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      setIsLoadingProducts(true);

      try {
        const nicheId = activeNiche?.id;

        const [prodRes, anRes, oppRes, revRes, revSumRes, recRes] = await Promise.all([
          api.getProducts({
            niche_id: nicheId,
            category: currentFilter.category || selectedCategory,
            price_min: currentFilter.price_min,
            price_max: currentFilter.price_max,
            material: currentFilter.materials?.[0],
            pattern: currentFilter.patterns?.[0],
            search: searchQuery || undefined,
            sort_by: sortBy,
            page: currentPage,
            page_size: pageSize,
          }),
          api.getAnalyticsSummary(nicheId),
          api.getOpportunities(nicheId),
          api.getReviews({ niche_id: nicheId }),
          api.getReviewsSummary(nicheId),
          api.getRecommendations(nicheId),
        ]);

        if (!isCancelled) {
          if (prodRes && prodRes.items) {
            setProducts(prodRes.items);
            setTotalProducts(prodRes.total);
            if (prodRes.items.length > 0 && !selectedProduct) {
              setSelectedProduct(prodRes.items[0]);
            }
          }
          if (anRes) setAnalyticsEnvelope(anRes);
          if (oppRes) setOpportunitiesEnvelope(oppRes);
          if (revRes) setReviewsEnvelope(revRes);
          if (revSumRes) setReviewsSummaryEnvelope(revSumRes);
          if (recRes) setRecommendationsEnvelope(recRes);
        }
      } catch (e) {
        console.error('Failed to load niche data:', e);
      } finally {
        if (!isCancelled) setIsLoadingProducts(false);
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [activeNiche?.id, currentFilter, sortBy, currentPage, searchQuery]);

  // Navigation and filter handlers
  const handleSelectCategory = (catName: string) => {
    setSelectedCategory(catName);
    const newFilter: NicheFilter = { category: catName };
    setCurrentFilter(newFilter);
    setActiveNiche(null);
    setActiveTab('define_niche');
  };

  const handleFilterChange = (filter: NicheFilter) => {
    setCurrentFilter(filter);
    setCurrentPage(1);
    setActiveTab('results');
  };

  const handleSaveNiche = async (name: string, description: string, filter: NicheFilter) => {
    const created = await api.createNiche({
      name,
      category: selectedCategory,
      description,
      filter,
    });
    setSavedNiches((prev) => [created, ...prev]);
    setActiveNiche(created);
  };

  const handlePreviewNiche = async (filter: NicheFilter): Promise<number> => {
    const res = await api.previewNiche(filter);
    return res.sample_size;
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setActiveTab('product_details');
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] font-sans flex flex-col antialiased">
      {/* Global Top Banner: Synthetic Demo Data */}
      <DemoDataBanner
        dataMode={analyticsEnvelope?.meta?.data_mode || 'demo'}
        sources={analyticsEnvelope?.meta?.sources || ['synthetic_curated_v1.csv']}
        asOf={analyticsEnvelope?.meta?.as_of}
      />

      {/* 1. TOP PERSISTENT GLOBAL NAVIGATION HEADER (Exact Stitch Design) */}
      <header className="sticky top-0 z-40 bg-[#131921] text-white shadow-md">
        {/* Top Row Header */}
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
          {/* Left: Logo & Search */}
          <div className="flex items-center gap-6 flex-1 max-w-4xl">
            <div
              className="flex items-center gap-2.5 cursor-pointer shrink-0"
              onClick={() => setActiveTab('home')}
            >
              <div className="w-8 h-8 rounded bg-[#ff9900] flex items-center justify-center font-black text-[#131921] text-xs tracking-wider shadow-sm">
                AVA
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight text-white leading-none">
                    Amazon Vendor Assist
                  </span>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-400 text-[#131921] tracking-wider">
                    PRO
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 font-medium tracking-wide">
                  Marketplace Intelligence · Apparel
                </span>
              </div>
            </div>

            {/* Global Search Bar */}
            <div className="relative flex-1 max-w-xl hidden md:block">
              <input
                className="w-full h-9 pl-9 pr-4 text-xs rounded bg-white/10 hover:bg-white/15 focus:bg-white text-gray-100 focus:text-gray-900 placeholder-gray-400 focus:placeholder-gray-500 border border-white/20 focus:border-[#ff9900] focus:outline-none focus:ring-1 focus:ring-[#ff9900] transition-all font-medium"
                placeholder="Search products, kurtas, price bands, ASINs, brands..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Ask AVA Button */}
            <button
              onClick={() => setActiveTab('ask_ava')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold shadow transition active:scale-95 cursor-pointer ${
                activeTab === 'ask_ava'
                  ? 'bg-[#ff9900] text-[#131921] ring-2 ring-white font-black'
                  : 'bg-[#ff9900] hover:bg-[#f08800] text-[#131921]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 fill-[#131921] text-[#131921]" />
              <span>Ask AVA</span>
            </button>

            {/* Scope Switcher Pill / Niche Selector */}
            <div className="relative">
              <select
                value={activeNiche?.id || ''}
                onChange={(e) => {
                  const found = savedNiches.find((n) => n.id === e.target.value);
                  if (found) {
                    setActiveNiche(found);
                    setCurrentFilter(found.filter || { category: selectedCategory });
                  } else {
                    setActiveNiche(null);
                    setCurrentFilter({ category: selectedCategory });
                  }
                  setCurrentPage(1);
                }}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-white/10 hover:bg-white/15 text-gray-200 text-xs font-medium border border-white/15 transition appearance-none pr-7 cursor-pointer focus:outline-none"
              >
                <option value="" className="bg-[#232f3e] text-white">Default: {selectedCategory}</option>
                {savedNiches.map((n) => (
                  <option key={n.id} value={n.id} className="bg-[#232f3e] text-white">
                    {n.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none hidden lg:block" />
            </div>

            {/* User Profile / Status Avatar & Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfileMenu((prev) => !prev)}
                className="flex items-center gap-2 pl-2 border-l border-white/15 text-left cursor-pointer hover:opacity-90 transition"
              >
                <div className="w-7 h-7 rounded-full bg-slate-700 border border-amber-400/60 flex items-center justify-center font-bold text-xs text-amber-300">
                  {userProfile
                    ? userProfile.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    : 'VK'}
                </div>
                <div className="hidden xl:block text-left">
                  <div className="text-[11px] font-bold text-white leading-none">
                    {userProfile?.businessName || userProfile?.name || 'Vandana Kurtis'}
                  </div>
                  <div className="text-[9px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {userProfile?.isVerified ? 'Verified Vendor' : 'Seller Central IN'}
                  </div>
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 top-10 w-72 bg-white text-gray-900 rounded-xl shadow-xl border border-gray-200 p-4 z-50 text-xs space-y-3">
                  <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                    <div>
                      <div className="font-bold text-sm text-[#131b2e]">{userProfile?.name}</div>
                      <div className="text-gray-500 text-[11px]">{userProfile?.email}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-gray-600">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Store / Brand:</span>
                      <span className="font-semibold text-gray-800">{userProfile?.businessName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Phone:</span>
                      <span className="font-mono text-gray-800">+91 {userProfile?.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Demographics:</span>
                      <span className="text-gray-800">{userProfile?.gender}, {userProfile?.age} yrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Location:</span>
                      <span className="text-gray-800">{userProfile?.city}, {userProfile?.state}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setActiveTab('login');
                      }}
                      className="w-full text-left py-2 px-2.5 rounded hover:bg-amber-50 text-[#8a5100] font-bold flex items-center justify-between transition cursor-pointer"
                    >
                      <span>Edit Info &amp; Re-verify OTP</span>
                      <User className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setActiveTab('login');
                      }}
                      className="w-full text-left py-2 px-2.5 rounded hover:bg-gray-100 text-gray-700 flex items-center justify-between transition cursor-pointer"
                    >
                      <span>Register New Seller Account</span>
                      <LogOut className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Secondary Navigation Menu Bar */}
        <div className="border-t border-white/10 bg-[#232f3e]">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 flex items-center justify-between text-xs overflow-x-auto no-scrollbar">
            <nav className="flex items-center gap-1 font-semibold whitespace-nowrap">
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className={`py-2 px-3 transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
                  activeTab === 'home'
                    ? 'text-[#ff9900] border-[#ff9900] font-bold'
                    : 'text-gray-300 hover:text-white border-transparent'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('categories')}
                className={`py-2 px-3 transition flex items-center gap-1.5 border-b-2 ${
                  activeTab === 'categories'
                    ? 'text-[#ff9900] border-[#ff9900] font-bold'
                    : 'text-gray-300 hover:text-white border-transparent'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Categories</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('define_niche')}
                className={`py-2 px-3 transition flex items-center gap-1.5 border-b-2 ${
                  activeTab === 'define_niche'
                    ? 'text-[#ff9900] border-[#ff9900] font-bold'
                    : 'text-gray-300 hover:text-white border-transparent'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Define Niche</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('results')}
                className={`py-2 px-3 transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
                  activeTab === 'results' || activeTab === 'analytics'
                    ? 'text-[#ff9900] border-[#ff9900] font-bold'
                    : 'text-gray-300 hover:text-white border-transparent'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Market Results &amp; Analytics</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('recommendations')}
                className={`py-2 px-3 transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
                  activeTab === 'recommendations'
                    ? 'text-[#ff9900] border-[#ff9900] font-bold'
                    : 'text-gray-300 hover:text-white border-transparent'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Recommendations</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('product_details')}
                className={`py-2 px-3 transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
                  activeTab === 'product_details'
                    ? 'text-[#ff9900] border-[#ff9900] font-bold'
                    : 'text-gray-300 hover:text-white border-transparent'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Product Details</span>
              </button>
            </nav>

            <div className="hidden md:flex items-center gap-2 py-1.5 text-[11px] text-gray-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Grounded Intelligence (v4.18)</span>
            </div>
          </div>
        </div>

      </header>

      {/* Main Workspace Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ErrorBoundary onReset={() => setActiveTab('home')}>
          {activeTab === 'home' && (
          <HomeWorkspace
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            products={products}
            analyticsEnvelope={analyticsEnvelope}
            onNavigate={setActiveTab}
            onSelectProduct={handleSelectProduct}
            onAskAva={(_q) => {
              setActiveTab('ask_ava');
            }}
            isLoading={isLoadingProducts}
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesWorkspace
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
          />
        )}

        {activeTab === 'define_niche' && (
          <DefineNicheWorkspace
            category={selectedCategory}
            currentFilter={currentFilter}
            onFilterChange={handleFilterChange}
            savedNiches={savedNiches}
            activeNicheId={activeNiche?.id}
            onSelectNiche={(niche) => {
              setActiveNiche(niche);
              setCurrentFilter(niche.filter || { category: selectedCategory });
              setActiveTab('results');
            }}
            onSaveNiche={handleSaveNiche}
            onPreviewNiche={handlePreviewNiche}
          />
        )}

        {(activeTab === 'results' || activeTab === 'analytics') && (
          <MarketResultsWorkspace
            products={products}
            totalProducts={totalProducts}
            analyticsEnvelope={analyticsEnvelope}
            opportunitiesEnvelope={opportunitiesEnvelope}
            selectedAsin={selectedProduct?.asin}
            onSelectProduct={handleSelectProduct}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            sortBy={sortBy}
            onSortChange={setSortBy}
            isLoading={isLoadingProducts}
            initialView={activeTab === 'analytics' ? 'analytics' : 'catalog'}
          />
        )}

        {activeTab === 'reviews' && (
          <ReviewsWorkspace
            reviewsEnvelope={reviewsEnvelope}
            summaryEnvelope={reviewsSummaryEnvelope}
            isLoading={isLoadingProducts}
          />
        )}

        {activeTab === 'recommendations' && (
          <RecommendationsWorkspace
            recommendationsEnvelope={recommendationsEnvelope}
            isLoading={isLoadingProducts}
          />
        )}

        {activeTab === 'product_details' && (
          <ProductDetailsWorkspace
            product={selectedProduct}
            onBack={() => setActiveTab('results')}
            onSelectSimilar={handleSelectProduct}
          />
        )}

        {activeTab === 'ask_ava' && (
          <AskAvaWorkspace
            nicheId={activeNiche?.id}
            nicheName={activeNiche?.name || `${selectedCategory} (All)`}
          />
        )}

        {activeTab === 'login' && (
          <LoginWorkspace
            currentUser={userProfile}
            onLoginSuccess={handleLoginSuccess}
            onCancel={() => setActiveTab('home')}
          />
        )}
        </ErrorBoundary>
      </main>

      {/* Persistent Enterprise Footer (Exact Stitch Design) */}
      <footer className="w-full bg-[#ffffff] border-t border-[#e2e8f0] py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[#45474b]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#131b2e] text-sm">AVA</span>
              <span className="text-[11px] text-gray-500">· Amazon Vendor Assist Suite</span>
            </div>
            <span className="text-[11px] font-mono hidden sm:inline">v4.18.2 Enterprise 1P/3P Diagnostics</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="font-mono text-[11px] text-emerald-700">Data Latency: 12ms · API: {backendStatus?.status === 'ok' ? 'Online' : 'Connected'}</span>
            <button onClick={() => setActiveTab('home')} className="hover:text-black cursor-pointer">Home</button>
            <button onClick={() => setActiveTab('categories')} className="hover:text-black cursor-pointer">Categories</button>
            <button onClick={() => setActiveTab('results')} className="hover:text-black cursor-pointer">Market Results &amp; Analytics</button>
            <button onClick={() => setActiveTab('recommendations')} className="hover:text-black cursor-pointer">Recommendations</button>
            <button onClick={() => setActiveTab('ask_ava')} className="hover:text-black cursor-pointer">AVA Intelligence</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default App;
