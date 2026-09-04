import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";

export default function VoucherTable({ vouchers, showEmployee = false }) {
  if (!vouchers || vouchers.length === 0) {
    return <p className="muted">No vouchers found.</p>;
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Voucher #</th>
          {showEmployee && <th>Employee</th>}
          <th>Title</th>
          <th>Department</th>
          <th>Expense Date</th>
          <th>Amount</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {vouchers.map((v) => (
          <tr key={v.id}>
            <td>{v.voucher_number}</td>
            {showEmployee && <td>{v.employee_name || "-"}</td>}
            <td>{v.expense_title}</td>
            <td>{v.department}</td>
            <td>{v.expense_date}</td>
            <td>{Number(v.amount).toFixed(2)}</td>
            <td>
              <StatusBadge status={v.status} />
            </td>
            <td>
              <Link to={`/vouchers/${v.id}`}>View</Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}