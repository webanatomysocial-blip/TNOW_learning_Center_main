import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useExperience } from "@/lib/experience-store";
import { User, Mail, HelpCircle, LogOut, X } from "lucide-react";

export function UserProfileMenu() {
  const user = useExperience((s) => s.user);
  const reset = useExperience((s) => s.reset);
  const inviteId = useExperience((s) => s.inviteId);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Support ticket modal states
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/invites/${inviteId}/ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          name: user.name,
          subject,
          message,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
        setSubject("");
        setMessage("");
      } else {
        setError(data.message || "Failed to submit ticket. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex size-8 items-center justify-center rounded-full hover:bg-muted dark:hover:bg-surface border border-border transition-all active:scale-95 focus:outline-none cursor-pointer"
      >
        <div className="grid size-full place-items-center rounded-full bg-[#204CED]/10 text-[#204CED] font-display font-semibold text-xs border border-[#204CED]/20 hover:bg-[#204CED]/15 transition-colors">
          {initials || "U"}
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-[24px] border border-border bg-card p-2 shadow-float animate-in fade-in slide-in-from-top-1 duration-150 z-50">
          {/* User Info / Profile Item */}
          <div className="flex items-center gap-3 rounded-xl px-3.5 py-3 bg-muted/60 dark:bg-surface/60 border border-border/10 mb-1">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#204CED]/10 text-[#204CED] font-semibold text-sm border border-[#204CED]/20">
              <User className="size-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                <Mail className="size-3 text-muted-foreground/80 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
            </div>
          </div>

          {/* Menu Items List */}
          <div className="space-y-0.5">
            {/* Help Center */}
            <button
              onClick={() => {
                setShowTicketModal(true);
                setOpen(false);
                setSuccess(false);
                setError("");
              }}
              className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 hover:bg-muted/50 dark:hover:bg-surface/50 transition duration-150 text-left cursor-pointer group"
            >
              <HelpCircle className="size-4.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="text-[13px] font-medium text-foreground/90 group-hover:text-foreground transition-colors">
                Help Center
              </span>
            </button>

            {/* Sign Out */}
            <button
              onClick={() => {
                reset();
                navigate("/");
              }}
              className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 hover:bg-red-500/5 transition duration-150 text-left text-red-500 cursor-pointer group"
            >
              <LogOut className="size-4.5 text-red-500 group-hover:scale-105 transition-transform" />
              <span className="text-[13px] font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Support Ticket Modal */}
      {showTicketModal && createPortal(
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-card border border-border w-full max-w-md rounded-[28px] p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200 text-left">
              <button
                onClick={() => setShowTicketModal(false)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X className="size-4.5" />
              </button>

              {success ? (
                <div className="text-center py-8 space-y-4">
                  <div className="inline-flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    <User className="size-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Ticket Submitted!</h3>
                  <p className="text-sm text-muted-foreground px-4">
                    Your ticket has been raised successfully. We will be responding to you shortly.
                  </p>
                  <button
                    onClick={() => setShowTicketModal(false)}
                    className="mt-6 btn-primary w-full py-2.5"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRaiseTicket} className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground leading-tight">Help & Support</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Have questions? Submit a ticket below and we will get back to you.
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                        Subject
                      </label>
                      <input
                        type="text"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. Question about roi calculation"
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                        How can we help?
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Please describe your query in detail..."
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all resize-none"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-xs text-red-500 bg-red-500/5 border border-red-500/10 rounded-lg p-2">
                      {error}
                    </p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowTicketModal(false)}
                      className="flex-1 rounded-xl border border-border py-2.5 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 btn-primary py-2.5 text-xs font-semibold disabled:opacity-60"
                    >
                      {submitting ? "Submitting…" : "Raise Ticket"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
