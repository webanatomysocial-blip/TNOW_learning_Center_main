import { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Send } from "lucide-react";
import { SectionHeader, StepNav } from "@/components/StepNav";
import { useExperience } from "@/lib/experience-store";
import { useApiGet } from "@/lib/use-api";
import { useDocumentHead } from "@/lib/use-document-head";
import { findBestQaMatch, rankQaMatches } from "@/lib/ai-qa-match";
import { Sparkle } from "@phosphor-icons/react";

const ClubIcon = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    fill="currentColor"
    className={className}
    {...props}
  >
    <path d="M184,88c-.78,0-1.56,0-2.33,0a56,56,0,1,0-107.34,0c-.78,0-1.55,0-2.33,0A56,56,0,1,0,96.54,194.35l-8.2,27.35A8,8,0,0,0,96,232h64a8,8,0,0,0,7.66-10.3l-8.2-27.35A56,56,0,1,0,184,88Zm0,96a40,40,0,0,1-33.4-18,8,8,0,0,0-14.33,6.71l13,43.26h-42.5l13-43.26A8,8,0,0,0,105.4,166a40,40,0,1,1-19.93-59.71,8,8,0,0,0,9.33-12,40,40,0,1,1,66.4,0,8,8,0,0,0,9.33,12A40,40,0,1,1,184,184Z" />
  </svg>
);

export function AiPage() {
  const { product, productSlug } = useOutletContext();
  useDocumentHead({ meta: [{ title: `AI Expert — ${product?.name ?? ""} Experience` }] });

  const { data: qaData, isLoading: qaLoading } = useApiGet(`/api/ai-qa?product=${productSlug}`);
  const { data: pageData, isLoading: pageLoading } = useApiGet(
    `/api/experience-pages?product=${productSlug}&page=ai`,
  );
  const QA = qaData ?? [];
  const headline = pageData?.headline || `Ask the ${product?.name ?? ""} expert anything`;
  const description = pageData?.description || "";
  const introMessage =
    pageData?.extra?.introMessage ||
    `Welcome — I'm your ${product?.name ?? ""} expert. Ask a question below, or choose one of the suggested questions to get started.`;

  const [messages, setMessages] = useState(null);
  const [input, setInput] = useState("");
  const liveMatches = useMemo(() => rankQaMatches(QA, input, 4), [QA, input]);
  const incAi = useExperience((s) => s.incAi);
  const addAchievement = useExperience((s) => s.addAchievement);
  const complete = useExperience((s) => s.complete);
  const messagesEndRef = useRef(null);

  if (messages === null && !pageLoading) {
    setMessages([{ role: "ai", text: introMessage }]);
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  function send(q) {
    if (!q.trim()) return;
    const match = QA.find((item) => item.question === q) ?? findBestQaMatch(QA, q);

    if (match) {
      // Prefer other questions under the same topic first (most relevant),
      // then fall back to fuzzy-ranking against the matched question itself.
      const sameTopic = QA.filter(
        (item) => item.topic && item.topic === match.topic && item.question !== match.question,
      );
      const related = (sameTopic.length ? sameTopic : rankQaMatches(QA, match.question, 4))
        .filter((item) => item.question !== q)
        .slice(0, 3);
      setMessages((m) => [
        ...(m ?? []),
        { role: "user", text: q },
        { role: "ai", text: match.answer, related },
      ]);
    } else {
      // No confident match — rather than guess at an answer, show what the
      // question bank actually has that's close to what was typed, so the
      // visitor can pick the one they meant instead of getting an answer to
      // a question they didn't ask.
      const candidates = rankQaMatches(QA, q, 5);
      const text = candidates.length
        ? "I want to make sure I answer the right question — did you mean one of these?"
        : `Great question — our ${product?.name ?? ""} consultant will cover this in your workshop, and I've flagged it for the agenda.`;
      setMessages((m) => [
        ...(m ?? []),
        { role: "user", text: q },
        { role: "ai", text, related: candidates },
      ]);
    }
    setInput("");
    incAi();
    addAchievement("firstAi");
    complete("ai");
  }

  return (
    <div className="h-full flex flex-col justify-between overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-6 scrollbar-none">
        <SectionHeader eyebrow="Step 5 · AI Expert" title={headline} description={description} />

        <div className="mt-4 grid gap-4 lg:grid-cols-[240px_1fr] items-start">
          {/* Left column */}
          <aside className="order-2 lg:order-1 w-full h-[340px] lg:h-[310px] xl:h-[340px]">
            <div className="glass-card p-4 h-full flex flex-col">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
                Suggested questions
              </p>
              <ul className="mt-2 space-y-1 overflow-y-auto flex-1 pr-1">
                {qaLoading ? (
                  <li className="text-xs text-muted-foreground px-2 py-1.5">Loading…</li>
                ) : QA.length === 0 ? (
                  <li className="text-xs text-muted-foreground px-2 py-1.5">
                    No suggested questions yet.
                  </li>
                ) : (
                  QA.map((s) => (
                    <li key={s.question}>
                      <button
                        onClick={() => send(s.question)}
                        className="w-full rounded-lg px-2 py-1.5 text-left text-xs text-foreground transition hover:bg-surface-alt hover:text-primary leading-tight"
                      >
                        {s.question}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </aside>

          {/* Chat */}
          <section className="flex h-[340px] lg:h-[310px] xl:h-[340px] flex-col overflow-hidden glass-card order-1 lg:order-2">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-card/40">
              <div className="relative inline-flex size-7 items-center justify-center shrink-0">
                <img src="/chatbot-icon.webp" alt="" className="absolute inset-0 size-full object-contain" />
                <img src="/sparkle.png" alt="" className="relative size-4.5 object-contain" />
              </div>
              <p className="font-display text-sm font-semibold">{product?.name ?? ""} Expert</p>
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                online
              </span>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {(messages ?? []).map((m, i) => (
                <div
                  key={i}
                  className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "user" ? (
                    <div className="max-w-[80%] rounded-2xl bg-primary text-primary-foreground px-4 py-2.5 text-sm leading-relaxed shadow-sm rounded-tr-none">
                      {m.text}
                    </div>
                  ) : (
                    <div className="flex gap-3 max-w-[85%] items-start">
                      <div className="relative inline-flex size-8 items-center justify-center shrink-0 shadow-sm mt-0.5">
                        <img src="/chatbot-icon.webp" alt="" className="absolute inset-0 size-full object-contain" />
                        <img src="/sparkle.png" alt="" className="relative size-5 object-contain" />
                      </div>
                      <div className="rounded-2xl bg-surface border border-border/50 text-foreground px-4 py-2.5 text-sm leading-relaxed shadow-sm rounded-tl-none">
                        <p className="whitespace-pre-line">{m.text}</p>
                        {m.related?.length > 0 && (
                          <div className="mt-2.5 pt-2.5 border-t border-border/50">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                              Related questions
                            </p>
                            <div className="flex flex-col items-start gap-1">
                              {m.related.map((r) => (
                                <button
                                  key={r.question}
                                  type="button"
                                  onClick={() => send(r.question)}
                                  className="text-left text-xs text-primary hover:underline"
                                >
                                  {r.question}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-border px-4 py-3 bg-card/20">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex items-center gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question…"
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-caption focus:border-primary focus:ring-2 focus:ring-primary/15"
                  style={{ borderRadius: 12 }}
                />
                <button
                  type="submit"
                  className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground hover:bg-primary-hover shrink-0 transition shadow-sm"
                  aria-label="Send"
                >
                  <Send className="size-4" />
                </button>
              </form>

              {input.trim() && liveMatches.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {liveMatches.map((m) => (
                    <button
                      key={m.question}
                      type="button"
                      onClick={() => send(m.question)}
                      className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary hover:text-primary transition"
                    >
                      {m.question}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <StepNav current="ai" className="mt-auto" />
    </div>
  );
}
