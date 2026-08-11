import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Index } from "@/pages/Index";
import { NotFound } from "@/pages/NotFound";
import { ProductSelection } from "@/pages/experience/ProductSelection";
import { ExperienceLayout } from "@/pages/experience/ExperienceLayout";
import { Welcome } from "@/pages/experience/Welcome";
import { WhyPage } from "@/pages/experience/Why";
import { TourGrid } from "@/pages/experience/Tour";
import { CapabilityPage } from "@/pages/experience/Capability";
import { StoriesPage } from "@/pages/experience/Stories";
import { AiPage } from "@/pages/experience/Ai";
import { BookPage } from "@/pages/experience/Book";
import { SuccessPage } from "@/pages/experience/Success";
import { AdminLoginPage } from "@/pages/admin/AdminLogin";
import { AdminLayout } from "@/pages/admin/AdminLayout";
import { AdminDashboardPage } from "@/pages/admin/Dashboard";
import { SentEmailsPage, InviteDetailsPage } from "@/pages/admin/SentEmails";
import { AdminProductsPage } from "@/pages/admin/Products";
import { ProductDetailPage } from "@/pages/admin/ProductDetail";
import { CookieConsentsPage, CookieConsentDetailsPage } from "@/pages/admin/CookieConsents";
import { MagicLoginPage } from "@/pages/MagicLogin";
import { RequireExperienceAuth } from "@/components/RequireExperienceAuth";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <CookieConsentBanner />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/login/:code" element={<MagicLoginPage />} />
        <Route
          path="/experience"
          element={
            <RequireExperienceAuth>
              <ProductSelection />
            </RequireExperienceAuth>
          }
        />

        <Route
          path="/experience/:productSlug"
          element={
            <RequireExperienceAuth>
              <ExperienceLayout />
            </RequireExperienceAuth>
          }
        >
          <Route index element={<Welcome />} />
          <Route path="why" element={<WhyPage />} />
          <Route path="tour" element={<TourGrid />} />
          <Route path="tour/:capability" element={<CapabilityPage />} />
          <Route path="stories" element={<StoriesPage />} />
          <Route path="ai" element={<AiPage />} />
          <Route path="book" element={<BookPage />} />
          <Route path="success" element={<SuccessPage />} />
        </Route>

        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="emails" element={<SentEmailsPage />} />
          <Route path="emails/:id" element={<InviteDetailsPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="cookies" element={<CookieConsentsPage />} />
          <Route path="cookies/:deviceId" element={<CookieConsentDetailsPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
