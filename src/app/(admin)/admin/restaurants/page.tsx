import React from 'react';
import Link from 'next/link';
import { getAdminRestaurants } from '@/lib/admin/data';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Search, ExternalLink, ChevronLeft, ChevronRight, Store, Eye } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function AdminRestaurantsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 1;
  const search = resolvedParams.search || '';
  const statusFilter = resolvedParams.status || 'all';

  const { restaurants, totalCount, currentPage, totalPages } = await getAdminRestaurants({
    page,
    limit: 15,
    search,
    statusFilter,
  });

  const filterOptions = [
    { value: 'all', label: 'All Restaurants' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' },
    { value: 'trial', label: 'Trial' },
    { value: 'paid', label: 'Paid' },
    { value: 'expiring_soon', label: 'Expiring Soon' },
    { value: 'expired', label: 'Expired' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <span className="text-xs uppercase font-semibold text-stone-500 tracking-wider">
            Tenants
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-0.5">
            Registered Restaurants
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Authoritative registry of onboarded dining establishments, menu states, and subscription dates.
          </p>
        </div>

        <div className="text-sm font-semibold text-stone-700 bg-white border border-stone-200/80 px-4 py-2 rounded-2xl shadow-xs">
          Total: <span className="text-[#8B4A27]">{totalCount}</span> Establishments
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input Form */}
        <form method="GET" className="w-full md:max-w-md relative flex items-center">
          <input type="hidden" name="status" value={statusFilter} />
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search by restaurant name or slug..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B4A27]/20 focus:border-[#8B4A27]"
          />
        </form>

        {/* Filter Pills */}
        <div className="w-full md:w-auto flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {filterOptions.map((opt) => {
            const isSelected = statusFilter === opt.value;
            const queryUrl = `/admin/restaurants?status=${opt.value}${
              search ? `&search=${encodeURIComponent(search)}` : ''
            }`;
            return (
              <Link
                key={opt.value}
                href={queryUrl}
                className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#4338CA] text-white font-semibold shadow-xs'
                    : 'text-stone-600 bg-stone-100 hover:bg-stone-200/80'
                }`}
              >
                {opt.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Paginated Table Card */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-stone-700">
            <thead className="bg-stone-50 border-b border-stone-200/80 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Restaurant</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Lifecycle</th>
                <th className="py-3 px-4">Onboarding</th>
                <th className="py-3 px-4">Dishes</th>
                <th className="py-3 px-4">Subscription</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {restaurants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-500">
                    <Store className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    No restaurants match the selected criteria.
                  </td>
                </tr>
              ) : (
                restaurants.map((rest) => (
                  <tr key={rest.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-stone-900">
                      <div>
                        <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                          {rest.name}
                          {rest.publishedAt && (
                            <a
                              href={`/r/${rest.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-stone-400 hover:text-[#8B4A27]"
                              title="Open live public QR menu"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-stone-400">/{rest.slug}</div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={rest.publishedAt ? 'published' : 'draft'} />
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={rest.siteStatus} />
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-xs text-stone-600">
                        Step {rest.onboardingStep}/5 ({rest.onboardingStatus})
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs">{rest.itemCount} items</td>

                    <td className="py-3.5 px-4">
                      {rest.subscriptionEndDate ? (
                        <div className="text-xs">
                          <span className="font-medium text-stone-800">
                            {new Date(rest.subscriptionEndDate).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      ) : rest.trialEndsAt ? (
                        <div className="text-[11px] text-amber-700">
                          Trial ends {new Date(rest.trialEndsAt).toLocaleDateString('en-IN')}
                        </div>
                      ) : (
                        <span className="text-[11px] text-stone-400">Unpublished draft</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/restaurants/${rest.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-stone-500" /> Inspect
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
            <div>
              Page <span className="font-semibold text-stone-900">{currentPage}</span> of{' '}
              <span className="font-semibold text-stone-900">{totalPages}</span>
            </div>

            <div className="flex items-center gap-2">
              {currentPage > 1 && (
                <Link
                  href={`/admin/restaurants?page=${currentPage - 1}&status=${statusFilter}${
                    search ? `&search=${encodeURIComponent(search)}` : ''
                  }`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Link>
              )}

              {currentPage < totalPages && (
                <Link
                  href={`/admin/restaurants?page=${currentPage + 1}&status=${statusFilter}${
                    search ? `&search=${encodeURIComponent(search)}` : ''
                  }`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
