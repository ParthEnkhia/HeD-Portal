import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  BriefcaseBusiness,
  Link,
  LogOut,
  Mail,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserRound,
  UserX,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const emptyLeaveForm = {
  leaveType: "Casual Leave",
  startDate: "",
  endDate: "",
  reason: ""
};

const emptyProfileForm = {
  employeeId: "",
  department: "",
  designation: "",
  phone: "",
  workLocation: "",
  joiningDate: "",
  managerName: "",
  skills: "",
  linkedIn: "",
  portfolio: "",
  bio: ""
};

const statusStyles = {
  pending: "bg-brand-blush text-brand-coralDark border-brand-line",
  accepted: "bg-white text-brand-ink border-brand-line",
  ignored: "bg-stone-100 text-brand-muted border-stone-200"
};

const formatDate = (date) => {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(date));
};

const formatInputDate = (date) => {
  if (!date) {
    return "";
  }

  return new Date(date).toISOString().slice(0, 10);
};

const Dashboard = () => {
  const { user, signOut, updateProfile } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [approvalRequests, setApprovalRequests] = useState([]);
  const [leaveForm, setLeaveForm] = useState(emptyLeaveForm);
  const [profileForm, setProfileForm] = useState({
    ...emptyProfileForm,
    ...user.profile,
    joiningDate: formatInputDate(user.profile?.joiningDate)
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isAdmin = user.role === "admin";

  const stats = useMemo(() => {
    return leaveRequests.reduce(
      (total, request) => ({
        ...total,
        [request.status]: total[request.status] + 1
      }),
      { pending: 0, accepted: 0, ignored: 0 }
    );
  }, [leaveRequests]);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/leaves");
      setLeaveRequests(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovalRequests = async () => {
    if (!isAdmin) {
      return;
    }

    setApprovalsLoading(true);
    try {
      const { data } = await api.get("/auth/employee-approvals");
      setApprovalRequests(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load employee approvals");
    } finally {
      setApprovalsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
    fetchApprovalRequests();
  }, []);

  const updateLeaveForm = (event) => {
    setLeaveForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const updateProfileForm = (event) => {
    setProfileForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const submitProfile = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSavingProfile(true);

    try {
      await updateProfile(profileForm);
      setMessage("Professional profile saved successfully.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const submitLeaveRequest = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSubmitting(true);

    try {
      const { data } = await api.post("/leaves", leaveForm);
      setLeaveRequests((current) => [data, ...current]);
      setLeaveForm(emptyLeaveForm);
      setMessage("Leave request submitted successfully.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    setMessage("");
    setError("");

    try {
      const { data } = await api.patch(`/leaves/${id}/status`, { status });
      setLeaveRequests((current) =>
        current.map((request) => (request._id === id ? data : request))
      );
      setMessage(`Request marked as ${status}.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not update request");
    }
  };

  const deleteRequest = async (id) => {
    setMessage("");
    setError("");

    try {
      await api.delete(`/leaves/${id}`);
      setLeaveRequests((current) => current.filter((request) => request._id !== id));
      setMessage("Request deleted from database.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not delete request");
    }
  };

  const updateEmployeeApproval = async (id, accountStatus) => {
    setMessage("");
    setError("");

    try {
      const { data } = await api.patch(`/auth/employee-approvals/${id}`, { accountStatus });
      setApprovalRequests((current) =>
        accountStatus === "approved"
          ? current.filter((employee) => employee._id !== id)
          : current.map((employee) => (employee._id === id ? data : employee))
      );
      setMessage(
        accountStatus === "approved"
          ? "Employee account approved. They can now sign in."
          : "Employee account request rejected."
      );
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not update employee approval");
    }
  };

  return (
    <main className="min-h-screen bg-brand-wash text-brand-ink">
      <header className="border-b border-brand-line bg-brand-paper">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase text-brand-coral">
              HeD Leave Portal
            </p>
            <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
              {isAdmin ? "Admin Review Desk" : "Employee Leave Desk"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              aria-expanded={profileOpen}
              className="flex items-center gap-3 rounded-lg border border-brand-line bg-brand-wash px-3 py-2 text-left transition hover:border-brand-coral hover:bg-brand-blush"
              onClick={() => setProfileOpen(true)}
              type="button"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-blush text-brand-coral">
                {isAdmin ? <ShieldCheck size={20} /> : <UserRound size={20} />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold">{user.name}</p>
                <p className="text-xs capitalize text-brand-muted">{user.role}</p>
              </div>
              <ChevronDown className="text-brand-muted" size={17} />
            </button>
            <button
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-brand-line bg-brand-paper text-brand-muted transition hover:border-red-200 hover:text-red-600"
              onClick={signOut}
              title="Sign out"
              type="button"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-7 lg:px-8">
        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={<Clock3 size={22} />} label="Pending" value={stats.pending} />
          <StatCard icon={<Check size={22} />} label="Accepted" value={stats.accepted} />
          <StatCard icon={<X size={22} />} label="Ignored" value={stats.ignored} />
        </section>

        {(message || error) && (
          <div
            className={`mt-5 rounded-lg border px-4 py-3 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-brand-line bg-brand-blush text-brand-coralDark"
            }`}
          >
            {error || message}
          </div>
        )}

        {isAdmin && (
          <EmployeeApprovalPanel
            employees={approvalRequests}
            loading={approvalsLoading}
            onRefresh={fetchApprovalRequests}
            onUpdate={updateEmployeeApproval}
          />
        )}

        <div className={`mt-7 grid gap-6 ${isAdmin ? "" : "lg:grid-cols-[0.9fr_1.1fr]"}`}>
          {!isAdmin && (
            <div className="space-y-6">
              <section className="rounded-lg border border-brand-line bg-brand-paper p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blush text-brand-coral">
                    <BriefcaseBusiness size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold">Professional profile</h2>
                    <p className="text-sm text-brand-muted">Store your employee and career details.</p>
                  </div>
                </div>

                <form className="mt-5 space-y-4" onSubmit={submitProfile}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ProfileInput label="Employee ID" name="employeeId" onChange={updateProfileForm} value={profileForm.employeeId} />
                    <ProfileInput label="Department" name="department" onChange={updateProfileForm} value={profileForm.department} />
                    <ProfileInput label="Designation" name="designation" onChange={updateProfileForm} value={profileForm.designation} />
                    <ProfileInput label="Phone" name="phone" onChange={updateProfileForm} value={profileForm.phone} />
                    <ProfileInput label="Work location" name="workLocation" onChange={updateProfileForm} value={profileForm.workLocation} />
                    <ProfileInput label="Joining date" name="joiningDate" onChange={updateProfileForm} type="date" value={profileForm.joiningDate} />
                    <ProfileInput label="Manager" name="managerName" onChange={updateProfileForm} value={profileForm.managerName} />
                    <ProfileInput label="Skills" name="skills" onChange={updateProfileForm} placeholder="React, Node, MongoDB" value={profileForm.skills} />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <ProfileInput label="LinkedIn" name="linkedIn" onChange={updateProfileForm} placeholder="https://linkedin.com/in/..." value={profileForm.linkedIn} />
                    <ProfileInput label="Portfolio" name="portfolio" onChange={updateProfileForm} placeholder="https://..." value={profileForm.portfolio} />
                  </div>

                  <label className="block">
                    <span className="text-sm font-medium text-brand-ink">Professional bio</span>
                    <textarea
                      className="mt-1 min-h-24 w-full rounded-lg border border-brand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-coral"
                      name="bio"
                      onChange={updateProfileForm}
                      placeholder="Short summary of your role, strengths, and work experience"
                      value={profileForm.bio}
                    />
                  </label>

                  <button
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-coral px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-coralDark disabled:cursor-not-allowed disabled:bg-stone-300"
                    disabled={savingProfile}
                    type="submit"
                  >
                    <Save size={18} />
                    {savingProfile ? "Saving..." : "Save profile"}
                  </button>
                </form>
              </section>

              <section className="rounded-lg border border-brand-line bg-brand-paper p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blush text-brand-coral">
                    <Send size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold">Raise leave request</h2>
                    <p className="text-sm text-brand-muted">Submit dates, type, and reason.</p>
                  </div>
                </div>

                <form className="mt-5 space-y-4" onSubmit={submitLeaveRequest}>
                  <label className="block">
                    <span className="text-sm font-medium text-brand-ink">Leave type</span>
                    <select
                      className="mt-1 w-full rounded-lg border border-brand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-coral"
                      name="leaveType"
                      onChange={updateLeaveForm}
                      value={leaveForm.leaveType}
                    >
                      <option>Casual Leave</option>
                      <option>Sick Leave</option>
                      <option>Paid Leave</option>
                      <option>Emergency Leave</option>
                    </select>
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium text-brand-ink">Start date</span>
                      <input
                        className="mt-1 w-full rounded-lg border border-brand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-coral"
                        name="startDate"
                        onChange={updateLeaveForm}
                        type="date"
                        value={leaveForm.startDate}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-brand-ink">End date</span>
                      <input
                        className="mt-1 w-full rounded-lg border border-brand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-coral"
                        name="endDate"
                        onChange={updateLeaveForm}
                        type="date"
                        value={leaveForm.endDate}
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-sm font-medium text-brand-ink">Reason</span>
                    <textarea
                      className="mt-1 min-h-28 w-full rounded-lg border border-brand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-coral"
                      name="reason"
                      onChange={updateLeaveForm}
                      placeholder="Explain why you need leave"
                      value={leaveForm.reason}
                    />
                  </label>

                  <button
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-coral px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-coralDark disabled:cursor-not-allowed disabled:bg-stone-300"
                    disabled={submitting}
                    type="submit"
                  >
                    <Send size={18} />
                    {submitting ? "Submitting..." : "Submit request"}
                  </button>
                </form>
              </section>
            </div>
          )}

          <section className="rounded-lg border border-brand-line bg-brand-paper shadow-sm">
            <div className="flex flex-col gap-2 border-b border-brand-line p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-extrabold">
                  {isAdmin ? "All leave requests" : "My leave requests"}
                </h2>
                <p className="text-sm text-brand-muted">
                  {isAdmin
                    ? "Review requests and keep the database tidy."
                    : "Track status updates from your admin."}
                </p>
              </div>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-line px-3 py-2 text-sm font-semibold text-brand-muted transition hover:border-brand-coral hover:text-brand-coral"
                onClick={fetchLeaveRequests}
                type="button"
              >
                <CalendarDays size={17} />
                Refresh
              </button>
            </div>

            <div className="divide-y divide-brand-line">
              {loading ? (
                <p className="p-5 text-sm text-brand-muted">Loading requests...</p>
              ) : leaveRequests.length === 0 ? (
                <p className="p-5 text-sm text-brand-muted">No leave requests found.</p>
              ) : (
                leaveRequests.map((request) => (
                  <LeaveRequestRow
                    isAdmin={isAdmin}
                    key={request._id}
                    onDelete={deleteRequest}
                    onStatusChange={updateStatus}
                    request={request}
                  />
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {profileOpen && (
        <AccountProfileDialog
          isAdmin={isAdmin}
          onClose={() => setProfileOpen(false)}
          user={user}
        />
      )}
    </main>
  );
};

const StatCard = ({ icon, label, value }) => (
  <div className="rounded-lg border border-brand-line bg-brand-paper p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-brand-muted">{label}</p>
        <p className="mt-1 text-3xl font-extrabold">{value}</p>
      </div>
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-blush text-brand-coral">
        {icon}
      </div>
    </div>
  </div>
);

const ProfileInput = ({ label, name, onChange, placeholder = "", type = "text", value }) => (
  <label className="block">
    <span className="text-sm font-medium text-brand-ink">{label}</span>
    <input
      className="mt-1 w-full rounded-lg border border-brand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-coral"
      name={name}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
      value={value || ""}
    />
  </label>
);

const AccountProfileDialog = ({ isAdmin, onClose, user }) => {
  const profile = user.profile || {};
  const professionalDetails = [
    ["Employee ID", profile.employeeId],
    ["Department", profile.department],
    ["Designation", profile.designation],
    ["Phone", profile.phone],
    ["Work location", profile.workLocation],
    ["Joining date", profile.joiningDate && formatDate(profile.joiningDate)],
    ["Manager", profile.managerName],
    ["Skills", profile.skills]
  ].filter(([, value]) => value);

  return (
    <div
      aria-labelledby="account-profile-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/60 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
    >
      <section className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-brand-line p-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-blush text-brand-coral">
              {isAdmin ? <ShieldCheck size={23} /> : <UserRound size={23} />}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold" id="account-profile-title">
                {user.name}
              </h2>
              <p className="text-sm capitalize text-brand-muted">{user.role} account</p>
            </div>
          </div>
          <button
            aria-label="Close profile"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-brand-muted transition hover:bg-brand-blush hover:text-brand-coralDark"
            onClick={onClose}
            title="Close profile"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <p className="text-xs font-semibold uppercase text-brand-muted">Signed in as</p>
            <p className="mt-2 flex items-center gap-2 break-all text-sm font-medium text-brand-ink">
              <Mail className="shrink-0 text-brand-coral" size={17} />
              {user.email}
            </p>
          </div>

          {!isAdmin && professionalDetails.length > 0 && (
            <div className="border-t border-brand-line pt-5">
              <h3 className="text-sm font-bold text-brand-ink">Professional information</h3>
              <dl className="mt-3 grid gap-4 sm:grid-cols-2">
                {professionalDetails.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-medium text-brand-muted">{label}</dt>
                    <dd className="mt-1 break-words text-sm font-semibold text-brand-ink">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {!isAdmin && professionalDetails.length === 0 && (
            <p className="border-t border-brand-line pt-5 text-sm text-brand-muted">
              Add your professional information from the profile form on the dashboard.
            </p>
          )}

          {!isAdmin && (profile.linkedIn || profile.portfolio) && (
            <div className="flex flex-wrap gap-2 border-t border-brand-line pt-5">
              {profile.linkedIn && <ProfileLink href={profile.linkedIn} label="LinkedIn" />}
              {profile.portfolio && <ProfileLink href={profile.portfolio} label="Portfolio" />}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const EmployeeApprovalPanel = ({ employees, loading, onRefresh, onUpdate }) => (
  <section className="mt-7 rounded-lg border border-brand-line bg-brand-paper shadow-sm">
    <div className="flex flex-col gap-3 border-b border-brand-line p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-bold">Employee account approvals</h2>
        <p className="text-sm text-brand-muted">
          Approve new employees before they can access the portal.
        </p>
      </div>
      <button
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-line px-3 py-2 text-sm font-semibold text-brand-muted transition hover:border-brand-coral hover:text-brand-coral"
        onClick={onRefresh}
        type="button"
      >
        <UserCheck size={17} />
        Refresh
      </button>
    </div>

    <div className="divide-y divide-brand-line">
      {loading ? (
        <p className="p-5 text-sm text-brand-muted">Loading account requests...</p>
      ) : employees.length === 0 ? (
        <p className="p-5 text-sm text-brand-muted">No employee accounts need review.</p>
      ) : (
        employees.map((employee) => (
          <article
            className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
            key={employee._id}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-brand-ink">{employee.name}</h3>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${
                    employee.accountStatus === "rejected"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {employee.accountStatus}
                </span>
              </div>
              <p className="mt-1 break-all text-sm text-brand-muted">{employee.email}</p>
              <p className="mt-1 text-xs text-brand-muted">
                Requested {formatDate(employee.createdAt)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-brand-coral px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-coralDark"
                onClick={() => onUpdate(employee._id, "approved")}
                type="button"
              >
                <UserCheck size={17} />
                Approve
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={employee.accountStatus === "rejected"}
                onClick={() => onUpdate(employee._id, "rejected")}
                type="button"
              >
                <UserX size={17} />
                Reject
              </button>
            </div>
          </article>
        ))
      )}
    </div>
  </section>
);

const LeaveRequestRow = ({ request, isAdmin, onStatusChange, onDelete }) => (
  <article className="p-5">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-brand-ink">{request.leaveType}</h3>
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${
              statusStyles[request.status]
            }`}
          >
            {request.status}
          </span>
        </div>
        <p className="mt-1 text-sm text-brand-muted">
          {formatDate(request.startDate)} to {formatDate(request.endDate)}
        </p>
        {isAdmin && (
          <EmployeeProfileSummary employee={request.employee} />
        )}
        <p className="mt-3 max-w-3xl break-words text-sm leading-6 text-brand-muted">
          {request.reason}
        </p>
      </div>

      {isAdmin && (
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-brand-coral px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-coralDark"
            onClick={() => onStatusChange(request._id, "accepted")}
            type="button"
          >
            <Check size={17} />
            Accept
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-brand-line px-3 py-2 text-sm font-semibold text-brand-muted transition hover:border-brand-coral hover:bg-brand-blush"
            onClick={() => onStatusChange(request._id, "ignored")}
            type="button"
          >
            <X size={17} />
            Ignore
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            onClick={() => onDelete(request._id)}
            type="button"
          >
            <Trash2 size={17} />
            Delete
          </button>
        </div>
      )}
    </div>
  </article>
);

const EmployeeProfileSummary = ({ employee }) => {
  const profile = employee?.profile || {};
  const details = [
    profile.employeeId && `ID: ${profile.employeeId}`,
    profile.department,
    profile.designation,
    profile.workLocation
  ].filter(Boolean);

  return (
    <div className="mt-2 space-y-2">
      <p className="text-sm font-medium text-brand-ink">
        {employee?.name} <span className="font-normal text-brand-muted">({employee?.email})</span>
      </p>
      {details.length > 0 && (
        <p className="text-xs font-medium text-brand-muted">{details.join(" - ")}</p>
      )}
      {(profile.linkedIn || profile.portfolio) && (
        <div className="flex flex-wrap gap-2">
          {profile.linkedIn && <ProfileLink href={profile.linkedIn} label="LinkedIn" />}
          {profile.portfolio && <ProfileLink href={profile.portfolio} label="Portfolio" />}
        </div>
      )}
    </div>
  );
};

const ProfileLink = ({ href, label }) => (
  <a
    className="inline-flex items-center gap-1 rounded-full border border-brand-line px-2.5 py-1 text-xs font-semibold text-brand-coralDark transition hover:border-brand-coral hover:bg-brand-blush"
    href={href}
    rel="noreferrer"
    target="_blank"
  >
    <Link size={13} />
    {label}
  </a>
);

export default Dashboard;
