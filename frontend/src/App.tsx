import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { VehicleFormPage } from '@/pages/VehicleFormPage';
import { VehicleListPage } from '@/pages/VehicleListPage';
import { VehicleDetailPage } from '@/pages/VehicleDetailPage';
import { PublicLandingPage } from '@/pages/PublicLandingPage';
import { PublicVehicleDetailPage } from '@/pages/PublicVehicleDetailPage';
import TemplateSettingsPage from '@/pages/TemplateSettingsPage';
import ColorCustomizationPage from '@/pages/ColorCustomizationPage';
import LogoUploadPage from '@/pages/LogoUploadPage';
import LeadListPage from '@/pages/LeadListPage';
import LeadDetailPage from '@/pages/LeadDetailPage';
import { UserListPage } from '@/pages/UserListPage';
import { UserFormPage } from '@/pages/UserFormPage';
import SaleFormPage from '@/pages/SaleFormPage';
import SaleListPage from '@/pages/SaleListPage';
import FinancialDashboardPage from '@/pages/FinancialDashboardPage';
import { ToastProvider } from '@/components/organisms/ToastContainer';
import { useRealtimeLeads } from '@/hooks/useRealtimeLeads';

function AppContent() {
  // Initialize real-time lead notifications
  useRealtimeLeads();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/:slug" element={<PublicLandingPage />} />
      <Route path="/:slug/vehicles/:vehicleId" element={<PublicVehicleDetailPage />} />

      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />

      {/* Admin Routes */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/vehicles" element={<VehicleListPage />} />
        <Route path="/vehicles/new" element={<VehicleFormPage />} />
        <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
        <Route path="/vehicles/:id/edit" element={<VehicleFormPage />} />
        <Route path="/leads" element={<LeadListPage />} />
        <Route path="/leads/:id" element={<LeadDetailPage />} />
        <Route path="/users" element={<UserListPage />} />
        <Route path="/users/new" element={<UserFormPage />} />
        <Route path="/users/:id/edit" element={<UserFormPage />} />
        <Route path="/sales" element={<SaleListPage />} />
        <Route path="/sales/new/:vehicleId" element={<SaleFormPage />} />
        <Route path="/financial" element={<FinancialDashboardPage />} />
        <Route path="/integrations" element={<div>Integrations Page (TODO)</div>} />
        <Route path="/landing-page/template" element={<TemplateSettingsPage />} />
        <Route path="/landing-page/colors" element={<ColorCustomizationPage />} />
        <Route path="/landing-page/logo" element={<LogoUploadPage />} />
        <Route path="/landing-page" element={<div>Landing Page Settings (TODO)</div>} />
        <Route path="/settings" element={<div>Settings Page (TODO)</div>} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
