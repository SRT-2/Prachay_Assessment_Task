import { useState } from "react";

const statusOptions = ["draft", "submitted", "approved", "rejected"];

// Search / filter / sort controls. onApply receives the current filters.
export default function VoucherFilters({ onApply }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [department, setDepartment] = useState("");
  const [category, setCategory] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [order, setOrder] = useState("desc");

  function handleSubmit(e) {
    e.preventDefault();
    onApply({
      search: search || undefined,
      status: status || undefined,
      department: department || undefined,
      category: category || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      min_amount: minAmount ? Number(minAmount) : undefined,
      max_amount: maxAmount ? Number(maxAmount) : undefined,
      sort_by: sortBy,
      order,
    });
  }

  return (
    <form className="card filter-form" onSubmit={handleSubmit}>
      <input
        placeholder="Search number / title / employee"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">All statuses</option>
        {statusOptions.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <input
        placeholder="Department"
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
      />
      <input
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />
      <input
        type="date"
        title="Expense date from"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
      />
      <input
        type="date"
        title="Expense date to"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
      />
      <input
        type="number"
        placeholder="Min amount"
        min="0"
        value={minAmount}
        onChange={(e) => setMinAmount(e.target.value)}
      />
      <input
        type="number"
        placeholder="Max amount"
        min="0"
        value={maxAmount}
        onChange={(e) => setMaxAmount(e.target.value)}
      />
      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
        <option value="created_at">Sort: Date created</option>
        <option value="expense_date">Sort: Expense date</option>
        <option value="amount">Sort: Amount</option>
        <option value="status">Sort: Status</option>
        <option value="voucher_number">Sort: Voucher #</option>
      </select>
      <select value={order} onChange={(e) => setOrder(e.target.value)}>
        <option value="desc">Newest first</option>
        <option value="asc">Oldest first</option>
      </select>
      <button className="btn btn-primary" type="submit">
        Apply
      </button>
    </form>
  );
}