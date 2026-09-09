import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export const AuthPage = () => {
  const { token, login, register, isBooting, error, setError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "member",
  });

  if (token) {
    return <Navigate to="/" replace />;
  }

  if (isBooting) {
    return <div className="center-screen">Loading...</div>;
  }

  const submit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      if (isLogin) {
        await login({ email: form.email, password: form.password });
      } else {
        await register(form);
      }
    } catch (submitError) {
      setError(submitError.response?.data?.message || "We couldn't sign you in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (nextMode) => {
    setIsLogin(nextMode === "login");
    setError("");
  };

  return (
    <div className="auth-shell">
      <div className="auth-hero">
        <div className="auth-hero-copy">
          <p className="eyebrow">Kanban Pro workspace</p>
          <h1>Make your project board feel alive before the first task lands.</h1>
          <p className="auth-lead">
            Plan work across focused boards, surface priorities fast, and keep your whole team aligned from one clean
            command center.
          </p>
        </div>

        <div className="auth-hero-grid">
          <article className="panel auth-feature-card auth-feature-card-primary">
            <span className="auth-feature-kicker">Live visibility</span>
            <strong>Track delivery across every stage</strong>
            <p>Watch tasks move from backlog to done with a board built for ownership, status clarity, and momentum.</p>
          </article>

          <article className="panel auth-feature-card">
            <span className="auth-stat">12</span>
            <strong>Active sprints mapped</strong>
            <p>Keep milestones, deadlines, and owners organized without bouncing across tools.</p>
          </article>

          <article className="panel auth-feature-card auth-feature-wide">
            <div className="auth-mini-list">
              <span>Priority swimlanes</span>
              <span>Role-based access</span>
              <span>Team activity feed</span>
            </div>
          </article>
        </div>
      </div>

      <form className="panel auth-card" onSubmit={submit}>
        <div className="auth-card-head">
          <div>
            <p className="eyebrow">Secure access</p>
            <h2>{isLogin ? "Welcome back" : "Create your workspace"}</h2>
            <p className="muted auth-copy">
              {isLogin
                ? "Sign in to continue managing boards, cards, and team updates."
                : "Set up your account and start organizing your team in minutes."}
            </p>
          </div>

          <div className="auth-toggle" aria-label="Authentication mode">
            <button
              type="button"
              className={isLogin ? "auth-toggle-button active" : "auth-toggle-button"}
              onClick={() => switchMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={!isLogin ? "auth-toggle-button active" : "auth-toggle-button"}
              onClick={() => switchMode("register")}
            >
              Register
            </button>
          </div>
        </div>

        {!isLogin ? (
          <label className="field">
            <span>Full name</span>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Ariana Patel"
              required
            />
          </label>
        ) : null}
        <label className="field">
          <span>Email address</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="teamlead@kanbanpro.app"
            required
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            placeholder="Enter your password"
            required
          />
        </label>
        {!isLogin ? (
          <label className="field">
            <span>Workspace role</span>
            <select
              value={form.role}
              onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        ) : null}

        {error ? <div className="auth-message auth-error">{error}</div> : null}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Please wait..." : isLogin ? "Login to dashboard" : "Create account"}
        </button>

        <div className="auth-footer">
          <span>{isLogin ? "New to Kanban Pro?" : "Already set up?"}</span>
          <button type="button" className="ghost auth-link" onClick={() => switchMode(isLogin ? "register" : "login")}>
            {isLogin ? "Create an account" : "Sign in instead"}
          </button>
        </div>
      </form>
    </div>
  );
};
