import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";
import VoucherFilters from "../components/VoucherFilters.jsx";
import VoucherTable from "../components/VoucherTable.jsx";

export default function VouchersPage() {
  const { user } = useAuth();
  const isEmployee = user.role === "employee";
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({});

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .get("/vouchers", { params: filters })
      .then((res) => setVouchers(res.data))
      .catch((err) =>
        setError(err.response?.data?.detail || "Failed to load vouchers")
      )
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <div>
      <div className="page-header">
        <h1>{isEmployee ? "My Vouchers" : "All Vouchers"}</h1>
        {isEmployee && (
          <Link className="btn btn-primary" to="/employee/vouchers/new">
            + New Voucher
          </Link>
        )}
      </div>

      <VoucherFilters onApply={setFilters} />

      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <p>Loading vouchers...</p>
      ) : (
        <VoucherTable vouchers={vouchers} showEmployee={!isEmployee} />
      )}
    </div>
  );
}