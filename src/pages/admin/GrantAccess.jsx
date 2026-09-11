import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { ShieldCheck, Smartphone, Package, CheckCircle2, Search, Filter } from "lucide-react";
import { useApiGet } from "@/lib/use-api";
import { apiSend } from "@/lib/api";
import { useAdminStore } from "@/lib/admin-store";
import { useDocumentHead } from "@/lib/use-document-head";
import { formatDate } from "@/lib/utils";

// Pulls both kinds of pending access request — device-lock (same product, new
// device) and product-access (a different product than the invite allows) —
// off the regular invites list into one flat, actionable queue instead of
// admins needing to open each invite individually to notice one.
export function buildAccessRequestQueue(invites) {
  const queue = [];
  for (const invite of invites) {
    if (invite.access_requested_at) {
      queue.push({
        key: `${invite.id}-device`,
        type: "device",
        invite,
        requestedAt: invite.access_requested_at,
        label: "Different device",
      });
    }
    for (const r of invite.pending_product_requests || []) {
      queue.push({
        key: `${invite.id}-product-${r.product_slug}`,
        type: "product",
        invite,
        productSlug: r.product_slug,
        requestedAt: r.requested_at,
        label: `Product: ${r.product_slug.toUpperCase()}`,
      });
    }
  }
  return queue.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
}

export function GrantAccessPage() {
  useDocumentHead({ meta: [{ title: "Grant Access — Admin" }] });
  const token = useAdminStore((s) => s.token);
  const { data, isLoading, isError, refetch } = useApiGet("/api/admin/email-invites", { token });
  const invites = data ?? [];
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("all");

  const queue = useMemo(() => buildAccessRequestQueue(invites), [invites]);

  const uniqueProducts = useMemo(() => {
    const slugs = queue.map((item) => item.productSlug || item.invite.product_slug).filter(Boolean);
    return ["all", ...Array.from(new Set(slugs))];
  }, [queue]);

  const filteredQueue = useMemo(() => {
    return queue.filter((item) => {
      const email = item.invite.email || "";
      const matchesSearch = email.toLowerCase().includes(search.toLowerCase());
      const itemProductSlug = item.productSlug || item.invite.product_slug;
      const matchesProduct = productFilter === "all" || itemProductSlug === productFilter;
      return matchesSearch && matchesProduct;
    });
  }, [queue, search, productFilter]);

  async function handleApprove(item) {
    try {
      if (item.type === "device") {
        await apiSend(`/api/admin/email-invites/${item.invite.id}/grant-access`, "POST", undefined, token);
      } else {
        await apiSend(
          `/api/admin/email-invites/${item.invite.id}/product-access/${item.productSlug}/approve`,
          "POST",
          undefined,
          token,
        );
      }
      refetch();
    } catch (err) {
      window.alert(err.message || "Failed to grant access.");
    }
  }

  return (
    <div className="admin-page-wrapper">
      <div className="admin-header-actions">
        <h1>Grant Access</h1>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden">
        {!isLoading && !isError && queue.length > 0 && (
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 size-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition bg-white"
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
        )}

        {isLoading ? (
          <div className="admin-state">
            <div className="admin-spinner" />
            <span>Loading requests…</span>
          </div>
        ) : isError ? (
          <div className="admin-state is-error">
            <span>Couldn't load access requests.</span>
          </div>
        ) : queue.length === 0 ? (
          <div className="admin-state">
            <div className="admin-state-icon">
              <CheckCircle2 size={20} />
            </div>
            <span>No pending access requests.</span>
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="admin-state">
            <div className="admin-state-icon">
              <CheckCircle2 size={20} />
            </div>
            <span>No matching access requests found.</span>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredQueue.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid size-9 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                    {item.type === "device" ? <Smartphone size={16} /> : <Package size={16} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.invite.email}</p>
                    <p className="text-[13px] text-gray-500">
                      {item.label} — requested {formatDate(item.requestedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/admin/emails/${item.invite.id}`}
                    className="px-3.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    View Invite
                  </Link>
                  <button
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:opacity-90 transition"
                    onClick={() => handleApprove(item)}
                  >
                    <ShieldCheck size={14} /> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
