import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

// Frontend validation mirrors the backend Pydantic rules
const voucherSchema = z.object({
  department: z.string().min(1, "Department is required").max(100),
  expense_title: z.string().min(1, "Expense title is required").max(150),
  expense_category: z.string().max(100).optional().or(z.literal("")),
  expense_description: z.string().optional().or(z.literal("")),
  expense_date: z.string().min(1, "Expense date is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
});

const categories = [
  "Travel",
  "Food & Dining",
  "Accommodation",
  "Office Supplies",
  "Transport",
  "Training",
  "Other",
];

export default function VoucherFormPage() {
  const { id } = useParams(); // present only when editing a draft
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(voucherSchema) });

  // When editing, prefill the form with the current draft values
  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/vouchers/${id}`)
      .then((res) => {
        const v = res.data;
        reset({
          department: v.department,
          expense_title: v.expense_title,
          expense_category: v.expense_category || "",
          expense_description: v.expense_description || "",
          expense_date: v.expense_date,
          amount: v.amount,
        });
        setLoading(false);
      })
      .catch(() => {
        setServerError("Could not load the voucher");
        setLoading(false);
      });
  }, [id, isEdit, reset]);

  async function onSubmit(values) {
    setServerError("");
    const body = {
      department: values.department,
      expense_title: values.expense_title,
      expense_category: values.expense_category || null,
      expense_description: values.expense_description || null,
      expense_date: values.expense_date,
      amount: values.amount,
    };
    try {
      if (isEdit) {
        await api.put(`/vouchers/${id}`, body);
        navigate(`/vouchers/${id}`);
      } else {
        const res = await api.post("/vouchers", body);
        navigate(`/vouchers/${res.data.id}`);
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      setServerError(typeof detail === "string" ? detail : "Could not save the voucher");
    }
  }

  if (loading) return <p>Loading voucher...</p>;

  return (
    <div className="card form-page">
      <h1>{isEdit ? "Edit Voucher" : "Create Voucher"}</h1>

      {serverError && <div className="alert alert-error">{serverError}</div>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className="field">
          <span>Department *</span>
          <input {...register("department")} placeholder="e.g. IT" />
          {errors.department && (
            <span className="field-error">{errors.department.message}</span>
          )}
        </label>

        <label className="field">
          <span>Expense Title *</span>
          <input {...register("expense_title")} placeholder="e.g. Taxi to client site" />
          {errors.expense_title && (
            <span className="field-error">{errors.expense_title.message}</span>
          )}
        </label>

        <label className="field">
          <span>Expense Category</span>
          <select {...register("expense_category")}>
            <option value="">-- Select --</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Expense Date *</span>
          <input type="date" {...register("expense_date")} />
          {errors.expense_date && (
            <span className="field-error">{errors.expense_date.message}</span>
          )}
        </label>

        <label className="field">
          <span>Amount *</span>
          <input type="number" step="0.01" min="0" {...register("amount")} placeholder="0.00" />
          {errors.amount && <span className="field-error">{errors.amount.message}</span>}
        </label>

        <label className="field">
          <span>Description</span>
          <textarea rows="3" {...register("expense_description")} placeholder="Optional details..." />
        </label>

        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Save Draft"}
        </button>
      </form>
    </div>
  );
}