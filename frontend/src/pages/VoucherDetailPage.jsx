import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import SignatureImage from "../components/SignatureImage.jsx";

export default function VoucherDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const signatureInput = useRef(null);

  function load() {
    setLoading(true);
    api
      .get(`/vouchers/${id}`)
      .then((res) => setVoucher(res.data))
      .catch((err) =>
        setError(err.response?.data?.detail || "Could not load the voucher")
      )
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function run(action) {
    setBusy(true);
    setNotice("");
    try {
      await action();
      load();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setNotice(typeof detail === "string" ? detail : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  function handleSignatureUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("signature", file);
    run(() => api.post(`/vouchers/${id}/employee-signature`, formData));
  }

  function handleSubmit() {
    run(() => api.post(`/vouchers/${id}/submit`));
  }

  function handleDelete() {
    if (!confirm("Delete this draft voucher?")) return;
    run(async () => {
      await api.delete(`/vouchers/${id}`);
      navigate("/employee/vouchers");
    });
  }

  function handleApprove() {
    run(() => api.post(`/vouchers/${id}/approve`));
  }

  function handleDirectorSignature(event) {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("signature", file);
    run(() => api.post(`/vouchers/${id}/director-signature`, formData));
  }

  async function handleRejectConfirm() {
    if (!rejectReason.trim()) {
      setNotice("Please enter a rejection reason");
      return;
    }
    setRejecting(false);
    await run(() =>
      api.post(`/vouchers/${id}/reject`, { rejection_reason: rejectReason })
    );
  }

  if (loading) return <p>Loading voucher...</p>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!voucher) return null;

  const isEmployee = user.role === "employee";
  const isDirector = user.role === "director";
  const isOwner = voucher.employee_id === user.id;

  const canEditDraft = isEmployee && isOwner && voucher.status === "draft";
  const canSignEmployee = isEmployee && isOwner && voucher.status === "draft";
  const canSignDirector = isDirector && voucher.status === "submitted";
  const canDecide = isDirector && voucher.status === "submitted";

  return (
    <div>
      <div className="page-header">
        <h1>Voucher {voucher.voucher_number}</h1>
        <StatusBadge status={voucher.status} />
      </div>

      {notice && <div className="alert alert-error">{notice}</div>}

      <div className="card detail-grid">
        <div>
          <span className="detail-label">Employee</span>
          <span>{voucher.employee_name}</span>
        </div>
        <div>
          <span className="detail-label">Department</span>
          <span>{voucher.department}</span>
        </div>
        <div>
          <span className="detail-label">Expense Title</span>
          <span>{voucher.expense_title}</span>
        </div>
        <div>
          <span className="detail-label">Category</span>
          <span>{voucher.expense_category || "-"}</span>
        </div>
        <div>
          <span className="detail-label">Expense Date</span>
          <span>{voucher.expense_date}</span>
        </div>
        <div>
          <span className="detail-label">Amount</span>
          <span className="detail-amount">
            {"\u20B9"}
            {Number(voucher.amount).toFixed(2)}
          </span>
        </div>
        <div className="detail-full">
          <span className="detail-label">Description</span>
          <span>{voucher.expense_description || "-"}</span>
        </div>
        <div className="detail-full">
          <span className="detail-label">Employee Signature</span>
          <SignatureImage voucherId={voucher.id} which="employee" alt="Employee signature" />
        </div>
        <div className="detail-full">
          <span className="detail-label">Director Signature</span>
          <SignatureImage voucherId={voucher.id} which="director" alt="Director signature" />
        </div>
        {voucher.approval_date && (
          <div className="detail-full">
            <span className="detail-label">Approval Date</span>
            <span>{new Date(voucher.approval_date).toLocaleString()}</span>
          </div>
        )}
        {voucher.rejection_reason && (
          <div className="detail-full">
            <span className="detail-label">Rejection Reason</span>
            <span className="rejection-text">{voucher.rejection_reason}</span>
          </div>
        )}
      </div>

      {/* ------- action buttons (role-aware) ------- */}
      <div className="detail-actions">
        {isEmployee && isOwner && (
          <>
            {canSignEmployee && (
              <>
                <input
                  ref={signatureInput}
                  type="file"
                  accept="image/png,image/jpeg"
                  style={{ display: "none" }}
                  onChange={handleSignatureUpload}
                />
                <button
                  className="btn btn-outline"
                  disabled={busy}
                  onClick={() => signatureInput.current?.click()}
                >
                  Upload Signature
                </button>
              </>
            )}
            {canEditDraft && (
              <Link className="btn btn-outline" to={`/employee/vouchers/${id}/edit`}>
                Edit
              </Link>
            )}
            {canEditDraft && (
              <button className="btn btn-primary" disabled={busy} onClick={handleSubmit}>
                Submit
              </button>
            )}
            {canEditDraft && (
              <button className="btn btn-danger" disabled={busy} onClick={handleDelete}>
                Delete
              </button>
            )}
          </>
        )}

        {isDirector && (
          <>
            {canSignDirector && (
              <>
                <input
                  ref={signatureInput}
                  type="file"
                  accept="image/png,image/jpeg"
                  style={{ display: "none" }}
                  onChange={handleDirectorSignature}
                />
                <button
                  className="btn btn-outline"
                  disabled={busy}
                  onClick={() => signatureInput.current?.click()}
                >
                  Upload Director Signature
                </button>
              </>
            )}
            {canDecide && (
              <button className="btn btn-success" disabled={busy} onClick={handleApprove}>
                Approve
              </button>
            )}
            {canDecide && (
              <button
                className="btn btn-danger"
                disabled={busy}
                onClick={() => setRejecting(true)}
              >
                Reject
              </button>
            )}
          </>
        )}

        {/* accounts role: view only, no action buttons */}
      </div>

      {rejecting && (
        <div className="card reject-box">
          <label className="field">
            <span>Rejection reason *</span>
            <textarea
              rows="3"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this voucher is rejected"
            />
          </label>
          <button className="btn btn-danger" disabled={busy} onClick={handleRejectConfirm}>
            Confirm Rejection
          </button>{" "}
          <button className="btn btn-outline" onClick={() => setRejecting(false)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}