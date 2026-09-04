import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import PendingApprovalsPage from "./pages/PendingApprovalsPage.jsx";
import VoucherDetailPage from "./pages/VoucherDetailPage.jsx";
import VoucherFormPage from "./pages/VoucherFormPage.jsx";
import VouchersPage from "./pages/VouchersPage.jsx";

// Blocks a page until the user is logged in
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

// Sends the user to the home page for their role
function RoleRedirect() {
  const { user } = useAuth();
  return <Navigate to={`/${user.role}`} replace />;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <RoleRedirect /> : <LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleRedirect />} />

        {/* employee */}
        <Route path="employee" element={<DashboardPage />} />
        <Route path="employee/vouchers" element={<VouchersPage />} />
        <Route path="employee/vouchers/new" element={<VoucherFormPage />} />
        <Route path="employee/vouchers/:id/edit" element={<VoucherFormPage />} />

        {/* director */}
        <Route path="director" element={<DashboardPage />} />
        <Route path="director/vouchers" element={<VouchersPage />} />
        <Route path="director/pending" element={<PendingApprovalsPage />} />

        {/* accounts */}
        <Route path="accounts" element={<DashboardPage />} />
        <Route path="accounts/vouchers" element={<VouchersPage />} />

        {/* voucher detail is shared by all roles */}
        <Route path="vouchers/:id" element={<VoucherDetailPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
