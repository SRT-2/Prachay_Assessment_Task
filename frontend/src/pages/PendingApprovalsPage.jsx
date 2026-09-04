import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge.jsx";

export default function PendingApprovalsPage() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/vouchers/pending-approvals")
      .then((res) => setVouchers(res.data))
      .catch((err) =>
        setError(err.response?.data?.detail || "Failed to load pending approvals")
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading pending approvals...</p>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <h1>Pending Approvals</h1>
      {vouchers.length === 0 ? (
        <p className="muted">No vouchers waiting for approval.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Voucher #</th>
              <th>Employee</th>
              <th>Title</th>
              <th>Department</th>
              <th>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map((v) => (
              <tr key={v.id}>
                <td>{v.voucher_number}</td>
                <td>{v.employee_name}</td>
                <td>{v.expense_title}</td>
                <td>{v.department}</td>
                <td>{Number(v.amount).toFixed(2)}</td>
                <td>
                  <StatusBadge status={v.status} />
                </td>
                <td>
                  <Link to={`/vouchers/${v.id}`}>Review</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}