import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Send, BookOpen, PlayCircle } from "lucide-react";
import { SectionHeader, StepNav } from "@/components/StepNav";
import { useExperience } from "@/lib/experience-store";
import { useApiGet } from "@/lib/use-api";
import { useDocumentHead } from "@/lib/use-document-head";

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
    `I'm the ${product?.name ?? ""} expert. Ask me anything, or pick a suggested question below.`;

  const [messages, setMessages] = useState(null);
  const [input, setInput] = useState("");
  const incAi = useExperience((s) => s.incAi);
  const addAchievement = useExperience((s) => s.addAchievement);
  const complete = useExperience((s) => s.complete);

  if (messages === null && !pageLoading) {
    setMessages([{ role: "ai", text: introMessage }]);
  }

  function send(q) {
    if (!q.trim()) return;
    const match = QA.find((item) => item.question === q);
    const answer =
      match?.answer ??
      `Great question — our ${product?.name ?? ""} consultant will cover this in your workshop, and I've flagged it for the agenda.`;
    setMessages((m) => [...(m ?? []), { role: "user", text: q }, { role: "ai", text: answer }]);
    setInput("");
    incAi();
    addAchievement("firstAi");
    complete("ai");
  }

  return (
    <div className="lg:h-full lg:flex lg:flex-col lg:justify-between">
      <div>
        <SectionHeader eyebrow="Step 5 · AI Expert" title={headline} description={description} />

        <div className="mt-4 grid gap-4 lg:grid-cols-[240px_1fr] items-start">
          {/* Left column */}
          <aside className="order-2 lg:order-1 w-full h-[340px] lg:h-[310px] xl:h-[340px]">
            <div
              className="rounded-2xl border border-border bg-card p-4 h-full flex flex-col"
              style={{ borderRadius: 16 }}
            >
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
          <section
            className="flex h-[340px] lg:h-[310px] xl:h-[340px] flex-col overflow-hidden rounded-2xl border border-border bg-background order-1 lg:order-2"
            style={{ borderRadius: 16 }}
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-card/40">
              <div className="grid size-7 place-items-center rounded-full bg-primary text-white">
                <ClubIcon className="size-4 text-white" />
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
                      <div className="grid size-8 place-items-center rounded-full bg-primary text-white shrink-0 shadow-sm mt-0.5">
                        <ClubIcon className="size-4 text-white" />
                      </div>
                      <div className="rounded-2xl bg-surface border border-border/50 text-foreground px-4 py-2.5 text-sm leading-relaxed shadow-sm rounded-tl-none">
                        <p className="whitespace-pre-line">{m.text}</p>
                        {m.role === "ai" && i > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:text-primary transition">
                              <PlayCircle className="size-3" /> Related video
                            </button>
                            <button className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:text-primary transition">
                              <BookOpen className="size-3" /> Documentation
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-border px-4 py-3 bg-card/20"
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
          </section>
        </div>
      </div>

      <StepNav current="ai" className="mt-auto pt-4 lg:pt-3" />
    </div>
  );
}
