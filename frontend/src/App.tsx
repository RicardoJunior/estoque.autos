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

function App() {
  return (
    <BrowserRouter>
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
          <Route path="/leads" element={<div>Leads Page (TODO)</div>} />
          <Route path="/sales" element={<div>Sales Page (TODO)</div>} />
          <Route path="/sellers" element={<div>Sellers Page (TODO)</div>} />
          <Route path="/financial" element={<div>Financial Page (TODO)</div>} />
          <Route path="/integrations" element={<div>Integrations Page (TODO)</div>} />
          <Route path="/landing-page/template" element={<TemplateSettingsPage />} />
          <Route path="/landing-page/colors" element={<ColorCustomizationPage />} />
          <Route path="/landing-page" element={<div>Landing Page Settings (TODO)</div>} />
          <Route path="/settings" element={<div>Settings Page (TODO)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
