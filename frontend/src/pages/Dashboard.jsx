import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Download,
  Edit3,
  BriefcaseBusiness,
  LogOut,
  Mail,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserRound,
  UserX,
  Users,
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
  name: "",
  email: "",
  employeeId: "",
  rating: ""
};

const statusStyles = {
  pending: "bg-brand-blush text-brand-coralDark border-brand-line",
  accepted: "bg-brand-input text-brand-ink border-brand-line",
  ignored: "bg-slate-800 text-brand-muted border-slate-700"
};

const formatDate = (date) => {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(date));
};

const getMonthValue = (date = new Date()) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const getMonthlyLeaveRequests = (requests, monthValue) => {
  const [year, month] = monthValue.split("-").map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  return requests.filter((request) => {
    const start = new Date(request.startDate);
    const end = new Date(request.endDate);
    return start <= monthEnd && end >= monthStart;
  });
};

const downloadExcelFile = (leaveRequests, monthValue) => {
  const rows = getMonthlyLeaveRequests(leaveRequests, monthValue);
  const [year, month] = monthValue.split("-");
  const monthName = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric"
  }).format(new Date(Number(year), Number(month) - 1, 1));

  const tableRows = rows
    .map((request, index) => {
      const employee = request.employee || {};
      const profile = employee.profile || {};

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(employee.name)}</td>
          <td>${escapeHtml(employee.email)}</td>
          <td>${escapeHtml(profile.employeeId)}</td>
          <td>${escapeHtml(request.leaveType)}</td>
          <td>${escapeHtml(formatDate(request.startDate))}</td>
          <td>${escapeHtml(formatDate(request.endDate))}</td>
          <td>${escapeHtml(request.status)}</td>
          <td>${escapeHtml(request.reason)}</td>
        </tr>`;
    })
    .join("");

  const worksheet = `
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          table { border-collapse: collapse; font-family: Arial, sans-serif; }
          th, td { border: 1px solid #999; padding: 8px; text-align: left; vertical-align: top; }
          th { background: #171514; color: #f4f0ec; }
          caption { font-size: 18px; font-weight: bold; margin-bottom: 12px; text-align: left; }
        </style>
      </head>
      <body>
        <table>
          <caption>HeD Leave Records - ${escapeHtml(monthName)}</caption>
          <thead>
            <tr>
              <th>No.</th>
              <th>Employee Name</th>
              <th>Email</th>
              <th>Employee ID</th>
              <th>Leave Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            ${
              rows.length > 0
                ? tableRows
                : "<tr><td colspan=\"9\">No leave records found for this month.</td></tr>"
            }
          </tbody>
        </table>
      </body>
    </html>`;

  const blob = new Blob([worksheet], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `hed-leave-records-${monthValue}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const countAcceptedLeaveDaysThisMonth = (requests, employeeId) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return requests.reduce((total, request) => {
    if (request.status !== "accepted") {
      return total;
    }

    const requestEmployeeId = request.employee?._id || request.employee?.id || request.employee;
    if (employeeId && String(requestEmployeeId) !== String(employeeId)) {
      return total;
    }

    const start = new Date(request.startDate);
    const end = new Date(request.endDate);
    const countedStart = start > monthStart ? start : monthStart;
    const countedEnd = end < monthEnd ? end : monthEnd;

    if (countedStart > countedEnd) {
      return total;
    }

    return total + Math.floor((countedEnd - countedStart) / 86400000) + 1;
  }, 0);
};

const Dashboard = () => {
  const { user, signOut, updateProfile } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [approvalRequests, setApprovalRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [exportMonth, setExportMonth] = useState(getMonthValue());
  const [leaveForm, setLeaveForm] = useState(emptyLeaveForm);
  const [profileForm, setProfileForm] = useState({
    ...emptyProfileForm,
    name: user.name,
    employeeId: user.profile?.employeeId || "",
    rating: user.profile?.rating || ""
  });
  const [editingOwnProfile, setEditingOwnProfile] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState("");
  const [employeeProfileForm, setEmployeeProfileForm] = useState(emptyProfileForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isAdmin = user.role === "admin";

  const currentUserLeavesThisMonth = useMemo(
    () => countAcceptedLeaveDaysThisMonth(leaveRequests, user.id || user._id),
    [leaveRequests, user.id, user._id]
  );

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

  const fetchEmployees = async () => {
    if (!isAdmin) {
      return;
    }

    setEmployeesLoading(true);
    try {
      const { data } = await api.get("/auth/employees");
      setEmployees(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load employees");
    } finally {
      setEmployeesLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
    fetchApprovalRequests();
    fetchEmployees();
  }, []);

  const updateLeaveForm = (event) => {
    setLeaveForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const downloadMonthlySheet = () => {
    downloadExcelFile(leaveRequests, exportMonth);
  };

  const updateProfileForm = (event) => {
    setProfileForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const updateEmployeeProfileForm = (event) => {
    setEmployeeProfileForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const startOwnProfileEdit = () => {
    setProfileForm({
      ...emptyProfileForm,
      name: user.name,
      employeeId: user.profile?.employeeId || "",
      rating: user.profile?.rating || ""
    });
    setEditingOwnProfile(true);
  };

  const startEmployeeProfileEdit = (employee) => {
    setEditingEmployeeId(employee._id);
    setEmployeeProfileForm({
      ...emptyProfileForm,
      name: employee.name,
      email: employee.email,
      employeeId: employee.profile?.employeeId || "",
      rating: employee.profile?.rating || ""
    });
  };

  const submitProfile = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSavingProfile(true);

    try {
      await updateProfile(profileForm);
      setMessage("Professional profile saved successfully.");
      setEditingOwnProfile(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const submitEmployeeProfile = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSavingProfile(true);

    try {
      const { data } = await api.put(`/auth/employees/${editingEmployeeId}/profile`, employeeProfileForm);
      setEmployees((current) =>
        current.map((employee) => (employee._id === editingEmployeeId ? data : employee))
      );
      setLeaveRequests((current) =>
        current.map((request) =>
          request.employee?._id === editingEmployeeId
            ? { ...request, employee: { ...request.employee, ...data } }
            : request
        )
      );
      setMessage("Employee profile updated successfully.");
      setEditingEmployeeId("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not save employee profile");
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
      if (accountStatus === "approved") {
        fetchEmployees();
      }
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
              className="flex items-center gap-3 rounded border border-brand-line bg-brand-wash px-3 py-2 text-left transition hover:border-brand-coral hover:bg-brand-blush"
              onClick={() => setProfileOpen(true)}
              type="button"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-brand-blush text-brand-coral">
                {isAdmin ? <ShieldCheck size={20} /> : <UserRound size={20} />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold">{user.name}</p>
                <p className="text-xs capitalize text-brand-muted">{user.role}</p>
              </div>
              <ChevronDown className="text-brand-muted" size={17} />
            </button>
            <button
              className="inline-flex h-11 w-11 items-center justify-center rounded border border-brand-line bg-brand-paper text-brand-muted transition hover:border-red-900/70 hover:text-red-300"
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
            className={`mt-5 rounded border px-4 py-3 text-sm ${
              error
                ? "border-red-900/70 bg-red-950/40 text-red-300"
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

        {isAdmin && (
          <EmployeeProfileAdminPanel
            editingEmployeeId={editingEmployeeId}
            employeeProfileForm={employeeProfileForm}
            employees={employees}
            getLeavesTaken={(employeeId) => countAcceptedLeaveDaysThisMonth(leaveRequests, employeeId)}
            loading={employeesLoading}
            onCancelEdit={() => setEditingEmployeeId("")}
            onEdit={startEmployeeProfileEdit}
            onFormChange={updateEmployeeProfileForm}
            onRefresh={fetchEmployees}
            onSubmit={submitEmployeeProfile}
            saving={savingProfile}
          />
        )}

        <div className={`mt-7 grid gap-6 ${isAdmin ? "" : "lg:grid-cols-[0.9fr_1.1fr]"}`}>
          {!isAdmin && (
            <div className="space-y-6">
              <section className="rounded border border-brand-line bg-brand-paper p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-brand-blush text-brand-coral">
                    <BriefcaseBusiness size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold">Professional profile</h2>
                    <p className="text-sm text-brand-muted">Open your profile to view or edit your details.</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  <ProfileValue label="Name" value={user.name} />
                  <ProfileValue label="Employee ID" value={user.profile?.employeeId || "Not added"} />
                  <ProfileValue label="Leaves taken this month" value={currentUserLeavesThisMonth} />
                  <ProfileValue label="Rating" value={user.profile?.rating || "Not rated"} />
                </div>

                <button
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded bg-brand-coral px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-coralDark"
                  onClick={() => setProfileOpen(true)}
                  type="button"
                >
                  <UserRound size={18} />
                  View profile
                </button>
              </section>

              <section className="rounded border border-brand-line bg-brand-paper p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-brand-blush text-brand-coral">
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
                      className="mt-1 w-full rounded border border-brand-line bg-brand-input px-3 py-2.5 text-sm outline-none focus:border-brand-coral"
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
                        className="mt-1 w-full rounded border border-brand-line bg-brand-input px-3 py-2.5 text-sm outline-none focus:border-brand-coral"
                        name="startDate"
                        onChange={updateLeaveForm}
                        type="date"
                        value={leaveForm.startDate}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-brand-ink">End date</span>
                      <input
                        className="mt-1 w-full rounded border border-brand-line bg-brand-input px-3 py-2.5 text-sm outline-none focus:border-brand-coral"
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
                      className="mt-1 min-h-28 w-full rounded border border-brand-line bg-brand-input px-3 py-2.5 text-sm outline-none focus:border-brand-coral"
                      name="reason"
                      onChange={updateLeaveForm}
                      placeholder="Explain why you need leave"
                      value={leaveForm.reason}
                    />
                  </label>

                  <button
                    className="inline-flex w-full items-center justify-center gap-2 rounded bg-brand-coral px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-coralDark disabled:cursor-not-allowed disabled:bg-slate-700"
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

          <section className="rounded border border-brand-line bg-brand-paper shadow-sm">
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
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {isAdmin && (
                  <>
                    <input
                      aria-label="Select export month"
                      className="rounded border border-brand-line bg-brand-input px-3 py-2 text-sm font-semibold text-brand-ink outline-none transition focus:border-brand-coral"
                      onChange={(event) => setExportMonth(event.target.value)}
                      type="month"
                      value={exportMonth}
                    />
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded bg-brand-coral px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-coralDark"
                      onClick={downloadMonthlySheet}
                      type="button"
                    >
                      <Download size={17} />
                      Download Excel
                    </button>
                  </>
                )}
                <button
                  className="inline-flex items-center justify-center gap-2 rounded border border-brand-line px-3 py-2 text-sm font-semibold text-brand-muted transition hover:border-brand-coral hover:text-brand-coral"
                  onClick={fetchLeaveRequests}
                  type="button"
                >
                  <CalendarDays size={17} />
                  Refresh
                </button>
              </div>
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
          editing={editingOwnProfile}
          isAdmin={isAdmin}
          leavesTakenThisMonth={currentUserLeavesThisMonth}
          onClose={() => setProfileOpen(false)}
          onEdit={startOwnProfileEdit}
          onFormChange={updateProfileForm}
          onSubmit={submitProfile}
          profileForm={profileForm}
          saving={savingProfile}
          setEditing={setEditingOwnProfile}
          user={user}
        />
      )}
    </main>
  );
};

const StatCard = ({ icon, label, value }) => (
  <div className="rounded border border-brand-line bg-brand-paper p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-brand-muted">{label}</p>
        <p className="mt-1 text-3xl font-extrabold">{value}</p>
      </div>
      <div className="flex h-11 w-11 items-center justify-center rounded bg-brand-blush text-brand-coral">
        {icon}
      </div>
    </div>
  </div>
);

const ProfileInput = ({ disabled = false, label, name, onChange, type = "text", value }) => (
  <label className="block">
    <span className="text-sm font-medium text-brand-ink">{label}</span>
    <input
      className="mt-1 w-full rounded border border-brand-line bg-brand-input px-3 py-2.5 text-sm outline-none focus:border-brand-coral disabled:bg-slate-800 disabled:text-brand-muted"
      disabled={disabled}
      name={name}
      onChange={onChange}
      type={type}
      value={value || ""}
    />
  </label>
);

const ProfileValue = ({ label, value }) => (
  <div className="rounded border border-brand-line bg-brand-wash px-3 py-3">
    <p className="text-xs font-semibold uppercase text-brand-muted">{label}</p>
    <p className="mt-1 break-words text-sm font-bold text-brand-ink">{value || "Not added"}</p>
  </div>
);

const AccountProfileDialog = ({
  editing,
  isAdmin,
  leavesTakenThisMonth,
  onClose,
  onEdit,
  onFormChange,
  onSubmit,
  profileForm,
  saving,
  setEditing,
  user
}) => {
  const profile = user.profile || {};

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
      <section className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded bg-brand-input shadow-xl">
        <div className="flex items-start justify-between border-b border-brand-line p-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-brand-blush text-brand-coral">
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
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded text-brand-muted transition hover:bg-brand-blush hover:text-brand-coralDark"
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

          {!isAdmin && !editing && (
            <>
              <div className="grid gap-3 border-t border-brand-line pt-5 sm:grid-cols-2">
                <ProfileValue label="Name" value={user.name} />
                <ProfileValue label="Employee ID" value={profile.employeeId || "Not added"} />
                <ProfileValue label="Leaves taken this month" value={leavesTakenThisMonth} />
                <ProfileValue label="Rating" value={profile.rating || "Not rated"} />
              </div>

              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded bg-brand-coral px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-coralDark"
                onClick={onEdit}
                type="button"
              >
                <Edit3 size={18} />
                Edit profile
              </button>
            </>
          )}

          {!isAdmin && editing && (
            <form className="space-y-4 border-t border-brand-line pt-5" onSubmit={onSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <ProfileInput label="Name" name="name" onChange={onFormChange} value={profileForm.name} />
                <ProfileInput label="Employee ID" name="employeeId" onChange={onFormChange} value={profileForm.employeeId} />
                <ProfileInput disabled label="Leaves taken this month" name="leavesTakenThisMonth" value={leavesTakenThisMonth} />
                <ProfileInput disabled label="Rating" name="rating" value={profile.rating || "Not rated"} />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded bg-brand-coral px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-coralDark disabled:cursor-not-allowed disabled:bg-slate-700"
                  disabled={saving}
                  type="submit"
                >
                  <Save size={18} />
                  {saving ? "Saving..." : "Save profile"}
                </button>
                <button
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded border border-brand-line px-4 py-3 text-sm font-bold text-brand-muted transition hover:border-brand-coral hover:text-brand-coral"
                  onClick={() => setEditing(false)}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

const EmployeeProfileAdminPanel = ({
  editingEmployeeId,
  employeeProfileForm,
  employees,
  getLeavesTaken,
  loading,
  onCancelEdit,
  onEdit,
  onFormChange,
  onRefresh,
  onSubmit,
  saving
}) => (
  <section className="mt-7 rounded border border-brand-line bg-brand-paper shadow-sm">
    <div className="flex flex-col gap-3 border-b border-brand-line p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-bold">Employee profiles</h2>
        <p className="text-sm text-brand-muted">
          View and edit employee name, employee ID, and rating.
        </p>
      </div>
      <button
        className="inline-flex items-center justify-center gap-2 rounded border border-brand-line px-3 py-2 text-sm font-semibold text-brand-muted transition hover:border-brand-coral hover:text-brand-coral"
        onClick={onRefresh}
        type="button"
      >
        <Users size={17} />
        Refresh
      </button>
    </div>

    <div className="divide-y divide-brand-line">
      {loading ? (
        <p className="p-5 text-sm text-brand-muted">Loading employees...</p>
      ) : employees.length === 0 ? (
        <p className="p-5 text-sm text-brand-muted">No employees found.</p>
      ) : (
        employees.map((employee) => {
          const isEditing = editingEmployeeId === employee._id;

          return (
            <article className="p-5" key={employee._id}>
              {isEditing ? (
                <form className="space-y-4" onSubmit={onSubmit}>
                  <div className="grid gap-4 md:grid-cols-4">
                    <ProfileInput label="Name" name="name" onChange={onFormChange} value={employeeProfileForm.name} />
                    <ProfileInput label="Employee ID" name="employeeId" onChange={onFormChange} value={employeeProfileForm.employeeId} />
                    <ProfileInput disabled label="Leaves taken this month" name="leavesTakenThisMonth" value={getLeavesTaken(employee._id)} />
                    <ProfileInput label="Rating" name="rating" onChange={onFormChange} value={employeeProfileForm.rating} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="inline-flex items-center gap-2 rounded bg-brand-coral px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-coralDark disabled:cursor-not-allowed disabled:bg-slate-700"
                      disabled={saving}
                      type="submit"
                    >
                      <Save size={17} />
                      {saving ? "Saving..." : "Save profile"}
                    </button>
                    <button
                      className="inline-flex items-center gap-2 rounded border border-brand-line px-3 py-2 text-sm font-semibold text-brand-muted transition hover:border-brand-coral hover:text-brand-coral"
                      onClick={onCancelEdit}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <ProfileValue label="Name" value={employee.name} />
                    <ProfileValue label="Employee ID" value={employee.profile?.employeeId || "Not added"} />
                    <ProfileValue label="Leaves taken this month" value={getLeavesTaken(employee._id)} />
                    <ProfileValue label="Rating" value={employee.profile?.rating || "Not rated"} />
                  </div>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded border border-brand-line px-3 py-2 text-sm font-semibold text-brand-muted transition hover:border-brand-coral hover:text-brand-coral"
                    onClick={() => onEdit(employee)}
                    type="button"
                  >
                    <Edit3 size={17} />
                    Edit
                  </button>
                </div>
              )}
            </article>
          );
        })
      )}
    </div>
  </section>
);

const EmployeeApprovalPanel = ({ employees, loading, onRefresh, onUpdate }) => (
  <section className="mt-7 rounded border border-brand-line bg-brand-paper shadow-sm">
    <div className="flex flex-col gap-3 border-b border-brand-line p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-bold">Employee account approvals</h2>
        <p className="text-sm text-brand-muted">
          Approve new employees before they can access the portal.
        </p>
      </div>
      <button
        className="inline-flex items-center justify-center gap-2 rounded border border-brand-line px-3 py-2 text-sm font-semibold text-brand-muted transition hover:border-brand-coral hover:text-brand-coral"
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
                  className={`rounded-sm border px-2.5 py-1 text-xs font-bold capitalize ${
                    employee.accountStatus === "rejected"
                      ? "border-red-900/70 bg-red-950/40 text-red-300"
                      : "border-amber-900/70 bg-amber-950/40 text-amber-300"
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
                className="inline-flex items-center gap-2 rounded bg-brand-coral px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-coralDark"
                onClick={() => onUpdate(employee._id, "approved")}
                type="button"
              >
                <UserCheck size={17} />
                Approve
              </button>
              <button
                className="inline-flex items-center gap-2 rounded border border-red-900/70 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
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
            className={`rounded-sm border px-2.5 py-1 text-xs font-bold capitalize ${
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
            className="inline-flex items-center gap-2 rounded bg-brand-coral px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-coralDark"
            onClick={() => onStatusChange(request._id, "accepted")}
            type="button"
          >
            <Check size={17} />
            Accept
          </button>
          <button
            className="inline-flex items-center gap-2 rounded border border-brand-line px-3 py-2 text-sm font-semibold text-brand-muted transition hover:border-brand-coral hover:bg-brand-blush"
            onClick={() => onStatusChange(request._id, "ignored")}
            type="button"
          >
            <X size={17} />
            Ignore
          </button>
          <button
            className="inline-flex items-center gap-2 rounded border border-red-900/70 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-950/40"
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
    profile.rating && `Rating: ${profile.rating}`
  ].filter(Boolean);

  return (
    <div className="mt-2 space-y-2">
      <p className="text-sm font-medium text-brand-ink">
        {employee?.name} <span className="font-normal text-brand-muted">({employee?.email})</span>
      </p>
      {details.length > 0 && (
        <p className="text-xs font-medium text-brand-muted">{details.join(" - ")}</p>
      )}
    </div>
  );
};

export default Dashboard;
