import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Each role sees only its own navigation links
const linksByRole = {
  employee: [
    { to: "/employee", label: "Dashboard" },
    { to: "/employee/vouchers", label: "My Vouchers" },
  ],
  director: [
    { to: "/director", label: "Dashboard" },
    { to: "/director/pending", label: "Pending Approvals" },
    { to: "/director/vouchers", label: "All Vouchers" },
  ],
  accounts: [
    { to: "/accounts", label: "Dashboard" },
    { to: "/accounts/vouchers", label: "All Vouchers" },
  ],
};

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">Expense Vouchers</div>
        <nav>
          {(linksByRole[user.role] || []).map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          <span className="role-badge">{user.role}</span>
          <span className="topbar-name">{user.name}</span>
          <button className="btn btn-outline" onClick={handleLogout}>
            Logout
          </button>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
