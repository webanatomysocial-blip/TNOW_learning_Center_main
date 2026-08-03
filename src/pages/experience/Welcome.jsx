import { PlayCircle, Sparkles, CalendarCheck } from "lucide-react";
import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { SectionHeader, StepNav } from "@/components/StepNav";
import { useExperience } from "@/lib/experience-store";
import { useDocumentHead } from "@/lib/use-document-head";

export function Welcome() {
  const { product } = useOutletContext();
  useDocumentHead({ meta: [{ title: `Welcome — ${product?.name ?? "Experience"}` }] });
  const user = useExperience((s) => s.user);
  const complete = useExperience((s) => s.complete);
  useEffect(() => {
    complete("welcome");
  }, [complete]);

  return (
    <div className="flex flex-col justify-start gap-6 lg:gap-5">
      <div className="space-y-6 lg:space-y-4">
        <SectionHeader
          eyebrow="Step 1 · Welcome"
          title={`Welcome${user?.name ? `, ${user.name}` : ""}.`}
          description={`Here's your personalized ${product?.name ?? ""} Experience — a 10–15 minute guided briefing for you.`}
        />

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { kpi: "50%", label: "Reduction in helpdesk tickets", watermark: "50%" },
            { kpi: "Days → Mins", label: "Provisioning turnaround time", watermark: "24h" },
            { kpi: "100%", label: "Continuously audit ready and compliant", watermark: "100" },
          ].map((k) => (
            <div
              key={k.label}
              className="relative overflow-hidden rounded-[20px] border border-[#D8E5FF] bg-gradient-to-b from-white to-[#F4F8FF] p-6 lg:p-5.5 h-[185px] lg:h-[155px] xl:h-[165px] flex flex-col justify-end group transition-all duration-[180ms] ease-out hover:border-[#204CED]/40 hover:shadow-[0_12px_35px_rgba(32,76,237,0.08)] hover:-translate-y-[3px] hover:scale-[1.01]"
            >
              {/* Giant watermark in background with Stripe style */}
              <div className="absolute right-[-10px] top-[-10px] text-[85px] lg:text-[65px] xl:text-[70px] font-extrabold text-[#204CED]/[0.03] select-none pointer-events-none leading-none tracking-tighter">
                {k.watermark}
              </div>

              {/* Main KPI and Description grouped closely at the bottom */}
              <div className="z-10 flex flex-col gap-1.5 lg:gap-1">
                <p className="font-display text-[28px] lg:text-[24px] xl:text-[26px] font-medium text-[#204CED] tracking-tight leading-none">
                  {k.kpi}
                </p>
                <p className="text-xs lg:text-[11.5px] xl:text-[12.5px] text-muted-foreground leading-normal font-normal md:max-w-[200px]">
                  {k.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 lg:mt-3">
          <h2 className="font-display text-base lg:text-sm font-semibold">What you'll learn</h2>
          <div className="mt-2.5 lg:mt-2 grid gap-4 lg:gap-3 md:grid-cols-3">
            {[
              {
                icon: PlayCircle,
                title: "Video library",
                desc: "Six focused capability tours, ~2 minutes each.",
              },
              {
                icon: Sparkles,
                title: "AI assistance",
                desc: `Ask the ${product?.name ?? "product"} expert anything, anywhere in the flow.`,
              },
              {
                icon: CalendarCheck,
                title: "Workshop tailored to you",
                desc: "End with a working session shaped by what you explored.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="border border-[#E3EBFF] bg-gradient-to-b from-white to-[#F7FAFF] p-6 lg:p-5 h-auto lg:h-[135px] xl:h-[145px] flex flex-col justify-start transition-all duration-[180ms] ease-out hover:border-primary/30 hover:shadow-[0_12px_30px_rgba(32,76,237,0.05)] hover:-translate-y-[3px] hover:scale-[1.01]"
                style={{ borderRadius: 16 }}
              >
                <f.icon className="size-5 lg:size-5 text-primary shrink-0" />
                <p className="mt-3 lg:mt-2.5 font-display text-sm lg:text-[13px] xl:text-[13.5px] font-semibold">
                  {f.title}
                </p>
                <p className="mt-1.5 lg:mt-1 text-xs lg:text-[11.5px] xl:text-[12px] text-muted-foreground leading-snug">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <StepNav
        current="welcome"
        nextLabel="Start Journey"
        alignEnd
        className="mt-4 lg:mt-2 pt-4 lg:pt-3"
      />
    </div>
  );
}
