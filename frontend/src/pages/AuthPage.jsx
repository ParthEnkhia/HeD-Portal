import { Building2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const initialForm = {
  name: "",
  email: "",
  password: "",
  role: "employee",
  adminSignupKey: ""
};

const AuthPage = () => {
  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { authenticate } = useAuth();

  const updateForm = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setNotice("");
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);

    try {
      const result = await authenticate(mode, form);

      if (result?.pendingApproval) {
        setNotice(result.message || "Ask admin for approval of your account before signing in.");
        setMode("signin");
        setForm(initialForm);
      }
    } catch (requestError) {
      const response = requestError.response?.data;
      if (response?.pendingApproval) {
        setNotice(response.message || "Ask admin for approval of your account before signing in.");
      } else {
        setError(response?.message || "Authentication failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-brand-wash text-brand-ink">
      <header className="border-b border-brand-line bg-brand-paper">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-5 py-4 sm:px-8">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-brand-coral text-white">
            <Building2 size={21} />
          </div>
          <div>
            <p className="text-sm font-bold text-brand-ink">HeD Leave Portal</p>
            <p className="text-xs text-brand-muted">Employee management</p>
          </div>
        </div>
      </header>

      <section className="flex flex-1 items-center justify-center px-5 py-10 sm:py-14">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-brand-ink">
              {mode === "signin" ? "Sign in to your account" : "Create an account"}
            </h1>
          </div>

          <div className="rounded border border-brand-line bg-brand-paper p-6 shadow-soft sm:p-8">
            <div className="mb-7 grid grid-cols-2 border-b border-brand-line">
              <button
                aria-pressed={mode === "signin"}
                className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  mode === "signin"
                    ? "border-brand-coral text-brand-ink"
                    : "border-transparent text-brand-muted hover:text-brand-ink"
                }`}
                onClick={() => changeMode("signin")}
                type="button"
              >
                Sign in
              </button>
              <button
                aria-pressed={mode === "signup"}
                className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  mode === "signup"
                    ? "border-brand-coral text-brand-ink"
                    : "border-transparent text-brand-muted hover:text-brand-ink"
                }`}
                onClick={() => changeMode("signup")}
                type="button"
              >
                Sign up
              </button>
            </div>

            <form className="space-y-5" onSubmit={submitForm}>
              {mode === "signup" && (
                <label className="block">
                  <span className="text-sm font-medium text-brand-ink">Full name</span>
                  <input
                    autoComplete="name"
                    className="mt-1.5 w-full rounded border border-brand-line bg-brand-input px-3.5 py-3 text-sm outline-none transition focus:border-brand-coral focus:ring-2 focus:ring-brand-blush"
                    name="name"
                    onChange={updateForm}
                    required
                    value={form.name}
                  />
                </label>
              )}

              <label className="block">
                <span className="text-sm font-medium text-brand-ink">Email</span>
                <input
                  autoComplete="email"
                  className="mt-1.5 w-full rounded border border-brand-line bg-brand-input px-3.5 py-3 text-sm outline-none transition focus:border-brand-coral focus:ring-2 focus:ring-brand-blush"
                  name="email"
                  onChange={updateForm}
                  required
                  type="email"
                  value={form.email}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-brand-ink">Password</span>
                <input
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  className="mt-1.5 w-full rounded border border-brand-line bg-brand-input px-3.5 py-3 text-sm outline-none transition focus:border-brand-coral focus:ring-2 focus:ring-brand-blush"
                  minLength={6}
                  name="password"
                  onChange={updateForm}
                  required
                  type="password"
                  value={form.password}
                />
              </label>

              {mode === "signup" && (
                <div>
                  <span className="text-sm font-medium text-brand-ink">Account role</span>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    {["employee", "admin"].map((role) => (
                      <label
                        className={`cursor-pointer rounded border px-3 py-3 text-center text-sm font-semibold capitalize transition ${
                          form.role === role
                            ? "border-brand-coral bg-brand-blush text-brand-coralDark"
                            : "border-brand-line text-brand-muted"
                        }`}
                        key={role}
                      >
                        <input
                          checked={form.role === role}
                          className="sr-only"
                          name="role"
                          onChange={updateForm}
                          type="radio"
                          value={role}
                        />
                        {role}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {mode === "signup" && form.role === "admin" && (
                <label className="block">
                  <span className="text-sm font-medium text-brand-ink">Admin signup key</span>
                  <input
                    autoComplete="off"
                    className="mt-1.5 w-full rounded border border-brand-line bg-brand-input px-3.5 py-3 text-sm outline-none transition focus:border-brand-coral focus:ring-2 focus:ring-brand-blush"
                    name="adminSignupKey"
                    onChange={updateForm}
                    required
                    type="password"
                    value={form.adminSignupKey}
                  />
                </label>
              )}

              {error && (
                <div className="rounded border border-red-900/70 bg-red-950/40 px-3 py-2 text-sm text-red-300">
                  {error}
                </div>
              )}

              {notice && (
                <div className="rounded border border-brand-line bg-brand-blush px-3 py-2 text-sm text-brand-coralDark">
                  {notice}
                </div>
              )}

              <button
                className="w-full rounded bg-brand-coral px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-coralDark focus:outline-none focus:ring-2 focus:ring-brand-coral focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-700"
                disabled={submitting}
                type="submit"
              >
                {submitting ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AuthPage;
