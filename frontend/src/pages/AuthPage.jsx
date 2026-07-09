import { Building2, Lock, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const initialForm = {
  name: "",
  email: "",
  password: "",
  role: "employee"
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
    <main className="min-h-screen bg-brand-wash text-brand-ink">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex items-center bg-brand-paper px-6 py-10 sm:px-10 lg:px-14">
          <div className="max-w-xl">
            <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-lg border border-brand-line bg-brand-blush text-brand-coral">
              <Building2 size={28} />
            </div>
            <p className="text-sm font-semibold uppercase text-brand-coral">
              HeD Leave Portal
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-brand-ink sm:text-5xl">
              Leave approvals with <span className="italic text-brand-coral">simplicity</span>.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-brand-muted">
              Employees can raise requests in seconds, while admins can review, accept,
              ignore, or delete requests from one focused workspace.
            </p>
            <div className="mt-10 h-1 w-24 bg-brand-coral" />
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-md rounded-lg border border-brand-line bg-brand-paper p-6 shadow-soft sm:p-8">
            <div className="mb-6 grid grid-cols-2 rounded-lg bg-brand-wash p-1">
              <button
                className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                  mode === "signin" ? "bg-brand-paper text-brand-ink shadow-sm" : "text-brand-muted"
                }`}
                onClick={() => setMode("signin")}
                type="button"
              >
                Sign in
              </button>
              <button
                className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                  mode === "signup" ? "bg-brand-paper text-brand-ink shadow-sm" : "text-brand-muted"
                }`}
                onClick={() => setMode("signup")}
                type="button"
              >
                Sign up
              </button>
            </div>

            <h2 className="text-2xl font-extrabold text-brand-ink">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-2 text-sm text-brand-muted">
              {mode === "signin"
                ? "Use your registered credentials to continue."
                : "Choose whether this account is for admin or employee access."}
            </p>

            <form className="mt-7 space-y-4" onSubmit={submitForm}>
              {mode === "signup" && (
                <label className="block">
                  <span className="text-sm font-medium text-brand-ink">Full name</span>
                  <div className="mt-1 flex items-center gap-3 rounded-lg border border-brand-line bg-white px-3 py-2.5 focus-within:border-brand-coral">
                    <UserRound className="text-brand-coral" size={18} />
                    <input
                      className="w-full border-0 bg-transparent text-sm outline-none"
                      name="name"
                      onChange={updateForm}
                      placeholder="Parth Sharma"
                      value={form.name}
                    />
                  </div>
                </label>
              )}

              <label className="block">
                <span className="text-sm font-medium text-brand-ink">Email</span>
                <div className="mt-1 flex items-center gap-3 rounded-lg border border-brand-line bg-white px-3 py-2.5 focus-within:border-brand-coral">
                  <Mail className="text-brand-coral" size={18} />
                  <input
                    className="w-full border-0 bg-transparent text-sm outline-none"
                    name="email"
                    onChange={updateForm}
                    placeholder="you@company.com"
                    type="email"
                    value={form.email}
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-brand-ink">Password</span>
                <div className="mt-1 flex items-center gap-3 rounded-lg border border-brand-line bg-white px-3 py-2.5 focus-within:border-brand-coral">
                  <Lock className="text-brand-coral" size={18} />
                  <input
                    className="w-full border-0 bg-transparent text-sm outline-none"
                    name="password"
                    onChange={updateForm}
                    placeholder="Minimum 6 characters"
                    type="password"
                    value={form.password}
                  />
                </div>
              </label>

              {mode === "signup" && (
                <div>
                  <span className="text-sm font-medium text-brand-ink">Account role</span>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {["employee", "admin"].map((role) => (
                      <label
                        className={`cursor-pointer rounded-lg border px-3 py-3 text-center text-sm font-semibold capitalize ${
                          form.role === role
                            ? "border-emerald-500 bg-emerald-50 text-emerald-800"
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

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              {notice && (
                <div className="rounded-lg border border-brand-line bg-brand-blush px-3 py-2 text-sm text-brand-coralDark">
                  {notice}
                </div>
              )}

              <button
                className="w-full rounded-lg bg-brand-coral px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-coralDark disabled:cursor-not-allowed disabled:bg-stone-300"
                disabled={submitting}
                type="submit"
              >
                {submitting ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AuthPage;
