import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  PlayCircle,
  MessageSquare,
  CalendarCheck,
  CheckCircle2,
  Users,
  TrendingUp,
  Video,
  Award,
  ChevronRight,
  Eye,
} from "lucide-react";
import { useApiGet } from "@/lib/use-api";
import { useAdminStore } from "@/lib/admin-store";
import { useDocumentHead } from "@/lib/use-document-head";
import { formatDate } from "@/lib/utils";
import { ProgressCell, StatusBadge } from "@/pages/admin/SentEmails";

// Map steps to visual indicators
const STEPS = [
  { id: "welcome", label: "Welcome", icon: Eye },
  { id: "why", label: "Why", icon: PlayCircle },
  { id: "tour", label: "Tour", icon: Video },
  { id: "stories", label: "Stories", icon: Award },
  { id: "ai", label: "AI", icon: MessageSquare },
  { id: "book", label: "Book", icon: CalendarCheck },
];

export function ProgressTrackingPage() {
  useDocumentHead({ meta: [{ title: "Progress Tracking — Admin" }] });
  const token = useAdminStore((s) => s.token);
  const navigate = useNavigate();
  const { data, isLoading, isError } = useApiGet("/api/admin/email-invites", { token });
  const invites = data ?? [];

  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("all");

  // Get unique products in the invites list
  const uniqueProducts = useMemo(() => {
    const slugs = invites.map((i) => i.product_slug).filter(Boolean);
    return ["all", ...Array.from(new Set(slugs))];
  }, [invites]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = invites.length;
    const started = invites.filter((i) => i.progress_percent > 0).length;
    const completedBookings = invites.filter((i) => {
      return i.product_progress?.some((p) => p.progress_steps?.includes("book"));
    }).length;

    let totalVideos = 0;
    let watchedVideos = 0;
    let totalProgressSum = 0;
    let activeProgressCount = 0;

    invites.forEach((i) => {
      watchedVideos += i.videos_watched || 0;
      totalVideos += i.videos_total || 0;
      if (i.progress_percent > 0) {
        totalProgressSum += i.progress_percent;
        activeProgressCount++;
      }
    });

    const avgProgress = activeProgressCount > 0 ? Math.round(totalProgressSum / activeProgressCount) : 0;

    return {
      total,
      started,
      completedBookings,
      watchedVideos,
      totalVideos,
      avgProgress,
    };
  }, [invites]);

  // Filtered invites
  const filteredInvites = useMemo(() => {
    return invites.filter((i) => {
      const matchesSearch =
        (i.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (i.filled_name || "").toLowerCase().includes(search.toLowerCase());
      const matchesProduct = productFilter === "all" || i.product_slug === productFilter;
      return matchesSearch && matchesProduct;
    });
  }, [invites, search, productFilter]);

  return (
    <div className="admin-page-wrapper space-y-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold text-gray-900">User Progress Tracking</h1>
        <p className="text-sm text-gray-500">
          Monitor customer engagement, completed milestones, and workshop scheduling status.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Invites */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="size-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 border border-gray-100">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Invites</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{stats.started} started ({stats.total > 0 ? Math.round((stats.started / stats.total) * 100) : 0}%)</p>
          </div>
        </div>

        {/* Avg Progress */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="size-12 rounded-xl bg-[#EEF3FF] flex items-center justify-center text-primary border border-primary/10">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg. Engagement</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.avgProgress}%</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Average of active users</p>
          </div>
        </div>

        {/* Video Views */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="size-12 rounded-xl bg-[#F3EFFF] flex items-center justify-center text-[#6C3BFF] border border-[#6C3BFF]/10">
            <PlayCircle size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Videos Watched</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.watchedVideos}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Across all product tours</p>
          </div>
        </div>

        {/* Workshops Booked */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="size-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)" }}>
            <CalendarCheck size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Workshops Booked</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completedBookings}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Successfully scheduled</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filters and Search */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 size-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <Filter size={16} className="text-gray-400" />
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="pl-4 pr-8 py-2 border border-gray-200 rounded-full text-xs font-bold bg-white focus:outline-none focus:border-primary transition uppercase text-gray-700 appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23475569' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='m19.5 8.25-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E")`,
                backgroundPosition: "right 0.65rem center",
                backgroundSize: "0.75em 0.75em",
                backgroundRepeat: "no-repeat",
                minWidth: "130px"
              }}
            >
              {uniqueProducts.map((slug) => (
                <option key={slug} value={slug}>
                  {slug === "all" ? "All Products" : slug}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading / Error States */}
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-4 text-gray-400">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
            <span className="text-sm font-medium">Loading progress data…</span>
          </div>
        ) : isError ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-red-500">
            <span className="text-sm font-medium">Failed to load progress details.</span>
          </div>
        ) : filteredInvites.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <span className="text-sm font-medium">No results matching your filters.</span>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">User Info</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Progress</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Step Milestones</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Last Active</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvites.map((invite) => {
                  // Get progress steps of the active product or default to empty array
                  const activeProdProg = invite.product_progress?.find(
                    (p) => p.product_slug === invite.product_slug
                  );
                  const completedSteps = activeProdProg?.progress_steps || [];

                  return (
                    <tr
                      key={invite.id}
                      className="hover:bg-blue-50/10 transition-colors group cursor-pointer"
                      onClick={() => navigate(`/admin/emails/${invite.id}`, { state: { from: "/admin/progress" } })}
                    >
                      {/* User Info */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">
                            {invite.email}
                          </span>
                          <span className="text-xs text-gray-400 mt-0.5">
                            {invite.filled_name || "Not opened yet"}
                          </span>
                        </div>
                      </td>

                      {/* Active Product */}
                      <td className="px-6 py-4">
                        {invite.product_slug ? (
                          <span className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {invite.product_slug}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      {/* Progress bar */}
                      <td className="px-6 py-4">
                        <ProgressCell pct={invite.progress_percent} />
                        {invite.videos_total > 0 && (
                          <p className="mt-1 text-[10px] text-gray-400 font-medium">
                            {invite.videos_watched} / {invite.videos_total} videos watched
                          </p>
                        )}
                      </td>

                      {/* Step milestones checkmark sequence */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {STEPS.map((step) => {
                            const isCompleted = completedSteps.includes(step.id);
                            const StepIcon = step.icon;
                            return (
                              <div
                                key={step.id}
                                className={`flex flex-col items-center justify-center size-8 rounded-lg border transition-all ${
                                  isCompleted
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                    : "bg-gray-50 text-gray-300 border-gray-100"
                                }`}
                                title={`${step.label}: ${isCompleted ? "Completed" : "Not started"}`}
                              >
                                <StepIcon size={14} className={isCompleted ? "stroke-[2.5]" : ""} />
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Last Active */}
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {invite.last_access_at ? (
                          <div className="flex flex-col">
                            <span>{formatDate(invite.last_access_at)}</span>
                            {invite.status === "active" && (
                              <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 uppercase tracking-wider">
                                Currently Active
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">Never</span>
                        )}
                      </td>

                      {/* Details icon link */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/emails/${invite.id}`, { state: { from: "/admin/progress" } });
                          }}
                          className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-lg transition"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
