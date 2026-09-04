import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";
import VoucherTable from "../components/VoucherTable.jsx";

const endpoints = {
  employee: "/dashboard/employee",
  director: "/dashboard/director",
  accounts: "/dashboard/accounts",
};

function money(value) {
  return `\u20B9${Number(value).toFixed(2)}`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(endpoints[user.role])
      .then((res) => setData(res.data))
      .catch((err) =>
        setError(err.response?.data?.detail || "Failed to load dashboard")
      )
      .finally(() => setLoading(false));
  }, [user.role]);

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return null;

  // Which cards to show depends on the logged-in role
  const cards = {
    employee: [
      { label: "Total Vouchers", value: data.total_vouchers },
      { label: "Drafts", value: data.drafts },
      { label: "Pending", value: data.pending },
      { label: "Approved", value: data.approved },
      { label: "Rejected", value: data.rejected },
      { label: "Total Claimed", value: money(data.total_amount_claimed) },
    ],
    director: [
      { label: "Pending Approvals", value: data.pending_count },
      { label: "Approved Today", value: data.approved_today },
      { label: "Rejected Today", value: data.rejected_today },
      { label: "Total Pending Amount", value: money(data.total_pending_amount) },
    ],
    accounts: [
      { label: "Total Vouchers", value: data.total_vouchers },
      { label: "Pending", value: data.pending },
      { label: "Approved", value: data.approved },
      { label: "Rejected", value: data.rejected },
      { label: "Total Approved Amount", value: money(data.total_approved_amount) },
    ],
  }[user.role];

  // Recent activity list (director) / recent approved (accounts)
  const recent = data.recent_activity || data.recent_approved || [];

  return (
    <div>
      <h1>Dashboard</h1>

      <div className="stat-grid">
        {cards.map((card) => (
          <div className="stat-card" key={card.label}>
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {recent.length > 0 && (
        <>
          <h2 className="section-title">Recent Activity</h2>
          <VoucherTable vouchers={recent} showEmployee />
        </>
      )}
    </div>
  );
}
