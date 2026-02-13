import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/vehicles" element={<div>Vehicles Page (TODO)</div>} />
          <Route path="/leads" element={<div>Leads Page (TODO)</div>} />
          <Route path="/sales" element={<div>Sales Page (TODO)</div>} />
          <Route path="/sellers" element={<div>Sellers Page (TODO)</div>} />
          <Route path="/financial" element={<div>Financial Page (TODO)</div>} />
          <Route path="/integrations" element={<div>Integrations Page (TODO)</div>} />
          <Route path="/landing-page" element={<div>Landing Page Settings (TODO)</div>} />
          <Route path="/settings" element={<div>Settings Page (TODO)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
