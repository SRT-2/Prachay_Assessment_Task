import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Frontend validation with Zod (the backend validates again anyway)
const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data) {
    setServerError("");
    try {
      const user = await login(data.email, data.password);
      navigate(`/${user.role}`);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setServerError(
        typeof detail === "string" ? detail : "Login failed. Please try again."
      );
    }
  }

  return (
    <div className="login-page">
      <form className="card login-card" onSubmit={handleSubmit(onSubmit)} noValidate>
        <h1>Expense Voucher System</h1>
        <p className="muted">Sign in to continue</p>

        {serverError && <div className="alert alert-error">{serverError}</div>}

        <label className="field">
          <span>Email</span>
          <input type="email" placeholder="you@company.com" {...register("email")} />
          {errors.email && <span className="field-error">{errors.email.message}</span>}
        </label>

        <label className="field">
          <span>Password</span>
          <input type="password" placeholder="••••••••" {...register("password")} />
          {errors.password && <span className="field-error">{errors.password.message}</span>}
        </label>

        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
