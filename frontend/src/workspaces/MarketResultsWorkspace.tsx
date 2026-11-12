import { useState, useEffect } from 'react';
import type { Product, MarketSummary, OpportunityAnalysis, EvidenceEnvelope } from '../types';
import { SampleSizeBadge } from '../components/Badges';
import { AnalyticsWorkspace } from './AnalyticsWorkspace';
import {
  ShoppingBag,
  BarChart2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Star,
  Sparkles,
  ArrowRight,
  LayoutGrid,
  List,
  Info,
} from 'lucide-react';

interface MarketResultsWorkspaceProps {
  products: Product[];
  totalProducts: number;
  analyticsEnvelope: EvidenceEnvelope<MarketSummary> | null;
  opportunitiesEnvelope?: EvidenceEnvelope<OpportunityAnalysis> | null;
  selectedAsin?: string;
  onSelectProduct: (product: Product) => void;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  isLoading: boolean;
  initialView?: 'catalog' | 'analytics';
}

export function MarketResultsWorkspace({
  products,
  totalProducts,
  analyticsEnvelope,
  opportunitiesEnvelope,
  selectedAsin,
  onSelectProduct,
  currentPage,
  pageSize,
  onPageChange,
  sortBy,
  onSortChange,
  isLoading,
  initialView = 'catalog',
}: MarketResultsWorkspaceProps) {
  const [activeSection, setActiveSection] = useState<'catalog' | 'analytics'>(initialView);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    if (initialView) {
      setActiveSection(initialView);
    }
  }, [initialView]);

  const summary = analyticsEnvelope?.data;
  const sampleSize = analyticsEnvelope?.meta?.sample_size ?? totalProducts;

  // Filter products by local search term if typed
  const displayedProducts = searchTerm.trim()
    ? products.filter(
        (p) =>
          p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.asin.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;

  const totalPages = Math.ceil(totalProducts / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#e2e8f0]">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#75777c] uppercase font-mono tracking-wider">
            <span>Marketplace Intelligence</span>
            <span>/</span>
            <span>Kurtas &amp; Kurtis</span>
            <span>/</span>
            <span className="text-[#8a5100] font-bold">Odisha Cluster</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#131b2e] mt-1 flex items-center gap-2">
            <BarChart2 className="text-[#ff9900]" size={24} />
            Market Results &amp; Analytics
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented Switcher for Unified Workspace */}
          <div className="flex items-center bg-[#eaedff] p-1 rounded-lg border border-[#dae2fd]">
            <button
              type="button"
              onClick={() => setActiveSection('catalog')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                activeSection === 'catalog'
                  ? 'bg-[#131921] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ShoppingBag size={14} className={activeSection === 'catalog' ? 'text-[#ff9900]' : ''} />
              <span>Catalog &amp; Listings ({totalProducts})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                activeSection === 'analytics'
                  ? 'bg-[#131921] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart2 size={14} className={activeSection === 'analytics' ? 'text-[#ff9900]' : ''} />
              <span>Analytics &amp; Charts</span>
            </button>
          </div>

          <SampleSizeBadge n={sampleSize} minThreshold={30} label="Verified Listings" />

          {activeSection === 'catalog' && (
            <div className="flex items-center bg-[#eaedff] p-0.5 rounded border border-[#dae2fd]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition ${
                  viewMode === 'grid' ? 'bg-white shadow-xs text-black font-bold' : 'text-gray-500 hover:text-black'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition ${
                  viewMode === 'table' ? 'bg-white shadow-xs text-black font-bold' : 'text-gray-500 hover:text-black'
                }`}
                title="Dense Table View"
              >
                <List size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {activeSection === 'analytics' ? (
        <AnalyticsWorkspace
          analyticsEnvelope={analyticsEnvelope}
          opportunitiesEnvelope={opportunitiesEnvelope || null}
          isLoading={isLoading}
          hideHeader={true}
        />
      ) : (
        /* Main Grid: Left Filter Stack (3 cols) + Right Products Catalog (9 cols) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Filter Stack Sidebar (Exact Stitch Design) */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <Filter size={16} className="text-[#8a5100]" />
                <span className="font-bold text-xs uppercase tracking-wider text-[#131b2e]">
                  Active Filter Stack
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-[10px] font-bold uppercase text-[#8a5100] hover:underline cursor-pointer"
              >
                Clear all
              </button>
            </div>

            {/* Sub-Category */}
            <div className="space-y-1.5 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#75777c] block">
                Sub-Category
              </span>
              <div className="space-y-1">
                <label className="flex items-center justify-between p-1 rounded hover:bg-[#f2f3ff] cursor-pointer">
                  <span className="flex items-center gap-2 text-gray-800">
                    <input type="checkbox" defaultChecked className="rounded accent-[#131921] w-3.5 h-3.5" />
                    <span>Straight Cut Kurtis</span>
                  </span>
                  <span className="text-[11px] font-mono text-gray-500">
                    {Math.round(totalProducts * 0.6)}
                  </span>
                </label>
                <label className="flex items-center justify-between p-1 rounded hover:bg-[#f2f3ff] cursor-pointer">
                  <span className="flex items-center gap-2 text-gray-800">
                    <input type="checkbox" defaultChecked className="rounded accent-[#131921] w-3.5 h-3.5" />
                    <span>Anarkali Sets</span>
                  </span>
                  <span className="text-[11px] font-mono text-gray-500">
                    {Math.round(totalProducts * 0.25)}
                  </span>
                </label>
                <label className="flex items-center justify-between p-1 rounded hover:bg-[#f2f3ff] cursor-pointer">
                  <span className="flex items-center gap-2 text-gray-800">
                    <input type="checkbox" className="rounded accent-[#131921] w-3.5 h-3.5" />
                    <span>A-Line Flared</span>
                  </span>
                  <span className="text-[11px] font-mono text-gray-500">
                    {Math.round(totalProducts * 0.15)}
                  </span>
                </label>
              </div>
            </div>

            {/* Target Price Range */}
            <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#75777c]">
                  Target Price Range
                </span>
                <span className="font-mono text-xs font-bold text-[#8a5100]">
                  ₹{summary?.price?.p25 ? Math.round(summary.price.p25) : 500} - ₹{summary?.price?.p75 ? Math.round(summary.price.p75) : 1000}
                </span>
              </div>
              <div className="w-full bg-[#e2e7ff] h-1.5 rounded-full relative">
                <div className="absolute left-[20%] right-[30%] bg-[#8a5100] h-1.5 rounded-full" />
              </div>
              <div className="flex justify-between items-center text-[11px] text-gray-500 font-mono">
                <span>₹{summary?.price?.min ?? 299}</span>
                <span>₹{summary?.price?.max ?? 2499}</span>
              </div>
            </div>

            {/* Sizing Matrix */}
            <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#75777c] block">
                Sizing Matrix
              </span>
              <div className="flex flex-wrap gap-1 font-mono text-xs">
                {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map((sz) => (
                  <span
                    key={sz}
                    className="px-2 py-1 rounded bg-[#eaedff] hover:bg-[#dae2fd] text-[#131b2e] font-semibold text-[11px] cursor-pointer"
                  >
                    {sz}
                  </span>
                ))}
              </div>
            </div>

            {/* Regional Sync Box */}
            <div className="bg-[#eaedff] p-3 rounded-lg flex flex-col gap-1 text-xs">
              <div className="flex items-center gap-1 text-[#8a5100] font-bold">
                <Info size={14} />
                <span>Odisha Regional Fabric Sync</span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Sambalpuri handloom ikat & breathable pure cotton variants show peak customer engagement across Eastern India.
              </p>
            </div>
          </div>

          {/* Market Summary Bento Card (Exact Stitch) */}
          <div className="bg-[#161c24] text-white p-4 rounded-xl shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#fe9800]">
                Market Summary
              </span>
              <Sparkles size={14} className="text-[#fe9800]" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-bold text-white">{sampleSize}</span>
              <span className="text-xs text-gray-400">products observed</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-700 text-xs">
              <span className="text-gray-300 font-medium">Median Price:</span>
              <span className="font-mono font-bold text-[#fe9800]">
                ₹{summary?.price?.median ? Math.round(summary.price.median) : 782}
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Cotton Kurtas & Kurtis scope filtered under ₹500–₹1,000 range in Odisha region.
            </p>
          </div>
        </aside>

        {/* Right Products Catalog (9 cols) */}
        <div className="lg:col-span-9 space-y-4">
          {/* Search and Sort Toolbar */}
          <div className="bg-white p-3 rounded-xl border border-[#e2e8f0] shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Filter catalog by keyword or ASIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#ff9900]"
              />
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-gray-500 font-mono text-[11px]">
                Showing {displayedProducts.length} of {totalProducts} listings
              </span>
              <div className="flex items-center gap-1.5">
                <ArrowUpDown size={13} className="text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => onSortChange(e.target.value)}
                  className="text-xs p-1.5 rounded border border-gray-300 focus:outline-none focus:border-[#ff9900] bg-white cursor-pointer"
                >
                  <option value="rating_desc">Highest Rating</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="reviews_desc">Most Reviews</option>
                  <option value="discount_desc">Deepest Discount</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cards Grid View (Exact Stitch Product Card Design) */}
          {isLoading ? (
            <div className="bg-white p-12 text-center rounded-xl border border-[#e2e8f0] text-xs text-gray-500">
              Loading verified listings for active niche...
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-[#e2e8f0] space-y-2">
              <ShoppingBag size={32} className="mx-auto text-gray-300" />
              <p className="text-sm font-bold text-gray-800">No products match this niche filter.</p>
              <p className="text-xs text-gray-500">Try broadening your price or fabric criteria in "Define Niche".</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayedProducts.map((p) => {
                const isSelected = selectedAsin === p.asin;

                return (
                  <div
                    key={p.asin}
                    className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition flex flex-col overflow-hidden relative group ${
                      isSelected ? 'border-[#ff9900] ring-2 ring-[#ff9900]' : 'border-[#e2e8f0]'
                    }`}
                  >
                    {/* Top photo / banner container */}
                    <div className="relative w-full h-56 overflow-hidden bg-[#eaedff]">
                      {/* Product image with studio look */}
                      <img
                        src={`https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80`}
                        alt={p.product_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {p.rating && p.rating >= 4.4 ? (
                          <span className="px-2 py-0.5 rounded-full bg-[#131921] text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm">
                            <Star size={11} className="fill-[#febd69] text-[#febd69]" />
                            Top Rated
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-[#fe9800] text-[#2c1600] font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm">
                            Trending
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                      <div className="space-y-1.5">
                        {/* Brand & ASIN */}
                        <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono">
                          <span className="font-bold text-[#8a5100] truncate max-w-[130px] font-sans">
                            {p.brand}
                          </span>
                          <span>ASIN: {p.asin}</span>
                        </div>

                        {/* Title */}
                        <h3
                          onClick={() => onSelectProduct(p)}
                          className="font-bold text-sm text-[#131b2e] line-clamp-2 hover:text-[#8a5100] cursor-pointer"
                          title={p.product_name}
                        >
                          {p.product_name}
                        </h3>

                        {/* Rating Row */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <div className="flex items-center text-[#ff9900]">
                            <Star size={13} className="fill-[#ff9900]" />
                          </div>
                          <span className="font-mono text-xs font-bold text-[#131b2e]">
                            {p.rating ? `${p.rating}★` : 'Unrated'}
                          </span>
                          <span className="font-mono text-[11px] text-gray-500">
                            ({p.review_count.toLocaleString()} ratings)
                          </span>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 pt-1">
                          {p.material && (
                            <span className="px-1.5 py-0.5 rounded bg-[#f2f3ff] text-[10px] text-gray-700 font-medium">
                              {p.material}
                            </span>
                          )}
                          {p.colour && (
                            <span className="px-1.5 py-0.5 rounded bg-[#f2f3ff] text-[10px] text-gray-700 font-medium">
                              {p.colour}
                            </span>
                          )}
                          {p.sizes && p.sizes.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-[#f2f3ff] text-[10px] text-gray-700 font-medium">
                              {p.sizes.slice(0, 3).join(', ')}
                            </span>
                          )}
                        </div>

                        {/* Price */}
                        <div className="pt-1 flex items-baseline gap-2">
                          <span className="font-mono text-xl font-bold text-[#131b2e]">
                            {p.price ? `₹${p.price}` : '—'}
                          </span>
                          {p.mrp && (
                            <span className="font-mono text-xs text-gray-400 line-through">
                              ₹{p.mrp}
                            </span>
                          )}
                          {p.discount_pct !== null && p.discount_pct !== undefined && (
                            <span className="font-mono text-xs font-bold text-emerald-700">
                              {p.discount_pct}% off
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons (Exact Stitch) */}
                      <div className="pt-2 space-y-1.5 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => onSelectProduct(p)}
                          className="w-full py-1.5 px-3 rounded bg-[#fe9800] hover:bg-[#ffad33] text-[#2c1600] font-bold text-xs transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                        >
                          <span>View Product Analysis</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Dense Data Table View */
            <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#faf8ff] border-b border-[#e2e8f0] text-gray-600 font-bold uppercase text-[10px] tracking-wider font-mono">
                    <tr>
                      <th className="py-2.5 px-3">ASIN</th>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">Brand</th>
                      <th className="py-2.5 px-3">Price</th>
                      <th className="py-2.5 px-3">MRP</th>
                      <th className="py-2.5 px-3">Discount</th>
                      <th className="py-2.5 px-3">Rating</th>
                      <th className="py-2.5 px-3">Reviews</th>
                      <th className="py-2.5 px-3">Fabric</th>
                      <th className="py-2.5 px-3">Availability</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-sans">
                    {displayedProducts.map((p) => (
                      <tr
                        key={p.asin}
                        onClick={() => onSelectProduct(p)}
                        className="hover:bg-[#f2f3ff] cursor-pointer transition"
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-[#131b2e]">{p.asin}</td>
                        <td className="py-2.5 px-3 max-w-xs truncate text-[#131b2e]" title={p.product_name}>
                          {p.product_name}
                        </td>
                        <td className="py-2.5 px-3 text-gray-700 font-medium">{p.brand}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-gray-900">
                          {p.price ? `₹${p.price}` : '—'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-gray-400 line-through">
                          {p.mrp ? `₹${p.mrp}` : '—'}
                        </td>
                        <td className="py-2.5 px-3">
                          {p.discount_pct ? (
                            <span className="font-bold text-emerald-700">{p.discount_pct}%</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-amber-700 font-bold">
                          {p.rating ? `${p.rating}★` : '—'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-gray-600">
                          {p.review_count.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">{p.material || '—'}</td>
                        <td className="py-2.5 px-3 uppercase text-[10px] font-semibold text-emerald-700">
                          {p.availability || 'in_stock'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectProduct(p);
                            }}
                            className="px-2 py-0.5 text-[11px] font-bold text-[#2c1600] bg-[#fe9800] rounded hover:bg-[#ffad33]"
                          >
                            Analysis
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination Bar */}
          <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-sm flex items-center justify-between text-xs text-gray-600">
            <div>
              Showing <span className="font-bold text-[#131b2e] font-mono">{displayedProducts.length}</span> of{' '}
              <span className="font-bold text-[#131b2e] font-mono">{totalProducts}</span> listings
            </div>
            <div className="flex items-center gap-1 font-mono">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-3 py-1 font-bold bg-[#131921] text-white rounded">
                {currentPage}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
