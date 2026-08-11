import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Buildings, EnvelopeSimple, User, Phone, CaretRight, Fingerprint, MapPin, IdentificationCard, SuitcaseSimple, FileText } from "@phosphor-icons/react";
import { useExperience } from "@/lib/experience-store";
import { useDocumentHead } from "@/lib/use-document-head";

export function LoginPage() {
  useDocumentHead({
    meta: [
      { title: "Start Your Free Trial — digitalscan.ai" },
      {
        name: "description",
        content: "Sign up for digitalscan.ai free trial",
      },
    ],
  });
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const setUser = useExperience((s) => s.setUser);
  const reset = useExperience((s) => s.reset);
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    if (!email || !name) return;
    setLoading(true);
    setTimeout(() => {
      reset(); 
      setUser({ email, name: name.trim() || "Guest User" });
      navigate("/experience");
    }, 800);
  }

  return (
    <main className="min-h-dvh flex bg-[#f8fafc] font-sans antialiased">
      <div className="grid min-h-dvh w-full lg:grid-cols-2">
        {/* Left — Showcase Panel matching the photo reference */}
        <aside
          className="relative hidden lg:flex flex-col items-center justify-between px-8 py-10 overflow-hidden select-none"
          style={{
            background: "linear-gradient(180deg, #020919 0%, #051842 30%, #0c3690 65%, #0570db 85%, #00e5bf 100%)"
          }}
        >
          {/* Background Radial Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-[#204ced] rounded-full blur-[140px] opacity-35 mix-blend-screen pointer-events-none" />
          
          {/* Top Logo & Tagline */}
          <div className="w-full flex flex-col items-center pt-2 z-10">
            <div className="flex items-center gap-3">
              <div className="relative p-2 rounded-lg border border-[#00f0c5]/40 bg-[#00f0c5]/10">
                <Fingerprint className="text-[#00f0c5] size-9" weight="bold" />
              </div>
              <div className="flex flex-col">
                <span className="text-white text-2xl font-bold tracking-tight leading-none">
                  digitalscan<span className="text-[#00f0c5]">.ai</span>
                </span>
                <span className="text-[#7c9ce0] text-[8.5px] uppercase tracking-[0.28em] font-semibold mt-1">
                  SCAN. VERIFY. TRUST.
                </span>
              </div>
            </div>
          </div>

          {/* Main Hero Header & Bullets */}
          <div className="text-center z-10 w-full max-w-lg my-auto py-2">
            <h1 className="text-white text-[38px] xl:text-[44px] leading-[1.18] font-semibold mb-5 tracking-tight">
              Get <span className="text-[#00f0c5] font-bold">₹1,000</span> Free<br />
              Verification Credits
            </h1>

            <div className="flex items-center justify-center gap-3 text-white/90 text-[14px] font-normal">
              <span>11 Verification APIs</span>
              <span className="size-1 rounded-full bg-[#00f0c5]" />
              <span>3-Tier Caching</span>
              <span className="size-1 rounded-full bg-[#00f0c5]" />
              <span>Multi-Tenant Billing</span>
            </div>
          </div>

          {/* Curved Cards Section & Bottom Glowing Dome */}
          <div className="relative w-full max-w-2xl h-64 mt-4 flex items-end justify-center z-10 overflow-visible">
            {/* The Curved Arc Cards Layout */}
            <div className="relative w-full h-full flex items-end justify-center pb-6">
              
              {/* Card 1: MCA */}
              <div className="absolute left-[2%] bottom-1 -rotate-12 transition-transform hover:scale-105 z-10">
                <div className="w-32 h-36 rounded-2xl border border-[#00f0c5]/30 bg-[#072459]/70 backdrop-blur-md p-3.5 flex flex-col justify-between shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
                  <FileText className="size-7 text-[#00f0c5]" weight="light" />
                  <span className="text-white text-[11px] font-medium leading-tight">MCA<br />Verification</span>
                </div>
              </div>

              {/* Card 2: Employment */}
              <div className="absolute left-[23%] bottom-6 -rotate-6 transition-transform hover:scale-105 z-15">
                <div className="w-34 h-38 rounded-2xl border border-[#00f0c5]/40 bg-[#082b68]/80 backdrop-blur-md p-3.5 flex flex-col justify-between shadow-[0_12px_35px_rgba(0,0,0,0.4)]">
                  <SuitcaseSimple className="size-8 text-[#00f0c5]" weight="light" />
                  <span className="text-white text-[11px] font-medium leading-tight">Employment<br />Verification</span>
                </div>
              </div>

              {/* Center Main Highlight Box */}
              <div className="relative z-30 mb-2 transition-transform hover:scale-105">
                <div className="w-64 h-40 rounded-2xl border-2 border-[#00f0c5] bg-gradient-to-b from-[#00f0c5]/25 via-[#00f0c5]/5 to-transparent backdrop-blur-lg shadow-[0_0_45px_rgba(0,240,197,0.5)] p-4 flex flex-col items-center justify-center text-center">
                  <div className="w-full h-full border border-[#00f0c5]/30 rounded-xl bg-white/5 flex items-center justify-center">
                    <span className="text-[#00f0c5] text-xs font-semibold tracking-wide">Live Scan Pipeline</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Address */}
              <div className="absolute right-[23%] bottom-6 rotate-6 transition-transform hover:scale-105 z-15">
                <div className="w-34 h-38 rounded-2xl border border-[#00f0c5]/40 bg-[#082b68]/80 backdrop-blur-md p-3.5 flex flex-col justify-between shadow-[0_12px_35px_rgba(0,0,0,0.4)]">
                  <MapPin className="size-8 text-[#00f0c5]" weight="light" />
                  <span className="text-white text-[11px] font-medium leading-tight">Address<br />Verification</span>
                </div>
              </div>

              {/* Card 5: PAN */}
              <div className="absolute right-[2%] bottom-1 rotate-12 transition-transform hover:scale-105 z-10">
                <div className="w-32 h-36 rounded-2xl border border-[#00f0c5]/30 bg-[#072459]/70 backdrop-blur-md p-3.5 flex flex-col justify-between shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
                  <IdentificationCard className="size-7 text-[#00f0c5]" weight="light" />
                  <span className="text-white text-[11px] font-medium leading-tight">PAN<br />Verification</span>
                </div>
              </div>

            </div>

            {/* Bottom Cyan Glowing Arch Curve */}
            <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[140%] h-48 rounded-[100%] bg-gradient-to-t from-[#00e5bf] via-[#00e5bf]/60 to-transparent blur-md opacity-80 pointer-events-none" />
          </div>

          {/* Bottom Tagline */}
          <div className="text-white font-medium text-[13px] z-20 pb-1 mt-4 tracking-wide">
            A fullscan AI-powered product
          </div>
        </aside>

        {/* Right — Login / Sign-up Form Section */}
        <section className="flex flex-col justify-center items-center px-6 py-10 lg:px-12 bg-[#f4f7fc]">
          <div className="w-full max-w-115 bg-white rounded-[28px] p-8 md:p-10 shadow-[0_16px_50px_rgba(0,0,0,0.06)] border border-slate-100">
            {/* Header Icon */}
            <div className="flex flex-col items-center mb-7 text-center">
              <div className="w-14 h-14 bg-linear-to-b from-[#204ced]/10 to-[#00f0c5]/10 rounded-2xl flex items-center justify-center mb-4 border border-[#204ced]/15 shadow-xs">
                <User className="size-6 text-[#204ced]" weight="bold" />
              </div>
              <h2 className="text-[26px] font-bold text-black tracking-tight mb-1">Start Your Free Trial</h2>
              <p className="text-[14px] text-slate-500 font-normal">Use your work email to get started instantly</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Company Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Company Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Buildings className="size-4.5 text-slate-400" />
                  </div>
                  <input 
                    type="text" 
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Corp" 
                    className="w-full pl-10 pr-4 py-2.5 text-[14px] rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-3 focus:ring-[#204ced]/20 outline-none transition-all placeholder:text-slate-400 font-medium" 
                  />
                </div>
              </div>
              
              {/* Work Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Work Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <EnvelopeSimple className="size-4.5 text-slate-400" />
                  </div>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@yourcompany.com" 
                    className="w-full pl-10 pr-4 py-2.5 text-[14px] rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-3 focus:ring-[#204ced]/20 outline-none transition-all placeholder:text-slate-400 font-medium" 
                  />
                </div>
                <p className="text-[11px] text-slate-400">Personal emails (Gmail, Yahoo, etc.) are not accepted</p>
              </div>

              {/* Your Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Your Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="size-4.5 text-slate-400" />
                  </div>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Smith" 
                    className="w-full pl-10 pr-4 py-2.5 text-[14px] rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-3 focus:ring-[#204ced]/20 outline-none transition-all placeholder:text-slate-400 font-medium" 
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Phone className="size-4.5 text-slate-400" />
                  </div>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210" 
                    className="w-full pl-10 pr-4 py-2.5 text-[14px] rounded-xl border border-slate-200 bg-slate-50/50 focus:ring-3 focus:ring-[#204ced]/20 outline-none transition-all placeholder:text-slate-400 font-medium" 
                  />
                </div>
              </div>

              {/* Consent Checkbox */}
              <div className="flex items-start gap-2.5 pt-2">
                <input 
                  type="checkbox" 
                  required
                  id="consent-checkbox"
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#204ced] focus:ring-[#204ced] cursor-pointer" 
                />
                <label htmlFor="consent-checkbox" className="text-[11px] text-slate-500 leading-normal cursor-pointer select-none">
                  I confirm that I have obtained <strong className="font-semibold text-slate-800">written consent</strong> from all candidates whose background verification will be conducted through this platform, in compliance with applicable data protection laws. I agree to the <a href="#" className="text-[#204ced] hover:underline font-medium">Terms of Service</a> and <a href="#" className="text-[#204ced] hover:underline font-medium">Privacy Policy</a>.
                </label>
              </div>

              {/* Submit Button with #204ced -> #00f0c5 Gradient */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 mt-4 rounded-xl text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-[#204ced]/25 hover:shadow-xl hover:shadow-[#204ced]/35 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-70" 
                style={{ 
                  background: 'linear-gradient(90deg, #204ced 0%, #00f0c5 100%)' 
                }}
              >
                {loading ? "Creating Account..." : "Create Free Account"} 
                {!loading && <CaretRight weight="bold" className="size-4" />}
              </button>

              {/* Sign in prompt */}
              <p className="text-center text-[13px] text-slate-500 pt-3 font-normal">
                Already have an account? <a href="#" className="text-[#204ced] font-bold hover:underline ml-1">Sign in</a>
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

function CardMockup({ icon: Icon, label, rotateY, opacity, scale }) {
  return (
    <div 
      className="flex flex-col items-center justify-center p-3 w-32 h-28 rounded-xl border border-white/20 bg-white/5 backdrop-blur-md shadow-xl transition-transform duration-300 hover:scale-105"
      style={{ 
        transform: `rotateY(${rotateY}) scale(${scale})`,
        opacity: opacity
      }}
    >
      <Icon className="size-7 text-[#00f0c5] mb-2" weight="duotone" />
      <span className="text-white text-[11px] text-center font-medium leading-tight">
        {label}
      </span>
    </div>
  );
}

