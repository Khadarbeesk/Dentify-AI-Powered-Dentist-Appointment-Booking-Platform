
import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import API from "../config";

export default function DoctorDashboard() {
  const role = localStorage.getItem("role");

  const [appointments, setAppointments] = useState([]);
  const [dentist, setDentist] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get logged-in user's basic account information from localStorage.
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  // Professional details come from the logged-in doctor's Dentist profile.
  const doctorName = dentist?.name || storedUser.name || "Doctor";
  const doctorQualification =
    dentist?.qualification || "Qualification not available";
  const doctorExperience = dentist?.experience ?? null;
  const doctorClinic =
    dentist?.clinicName || "Clinic information unavailable";
  const doctorLocation =
    dentist?.address || dentist?.location || "Location not available";
  const doctorImage =
    dentist?.image || storedUser.image || storedUser.profileImage || "";

  // Fetch the logged-in doctor's profile from the backend.
  const fetchDoctorProfile = async () => {
    try {
      setProfileLoading(true);
      setProfileError("");

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Login token not found. Please log in again.");
      }

      const response = await fetch(`${API}/api/dentists/me`, {
        headers: {
          Authorization: "Bearer " + token
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.msg || "Unable to load doctor profile."
        );
      }

      setDentist(data);
    } catch (err) {
      console.error("Doctor profile fetching error:", err);
      setProfileError(err.message || "Unable to load doctor profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  // Fetch doctor's appointments.
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API}/api/appointments/doctor`, {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token")
        }
      });

      if (!response.ok) {
        throw new Error("Unable to load appointments.");
      }

      const data = await response.json();

      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Appointment fetching error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchDoctorProfile();
  }, []);

  // Update appointment status.
  const updateStatus = async (id, status) => {
    try {
      setUpdatingId(id);

      const response = await fetch(
        `${API}/api/appointments/doctor/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token")
          },
          body: JSON.stringify({ status })
        }
      );

      if (!response.ok) {
        throw new Error("Unable to update appointment status.");
      }

      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment._id === id
            ? { ...appointment, status }
            : appointment
        )
      );
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Statistics.
  const stats = useMemo(() => {
    return {
      total: appointments.length,
      confirmed: appointments.filter(
        (a) => a.status === "Confirmed"
      ).length,
      completed: appointments.filter(
        (a) => a.status === "Completed"
      ).length,
      cancelled: appointments.filter(
        (a) =>
          a.status === "Cancelled By Doctor" ||
          a.status === "Cancelled By User"
      ).length
    };
  }, [appointments]);

  // Filter and search.
  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const matchesSearch =
        (a.patientName || "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (a.clinicName || "")
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        filterStatus === "All" || a.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [appointments, search, filterStatus]);

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const statusStyle = (status) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-50 text-green-700 border-green-200";
      case "Completed":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Cancelled By User":
      case "Cancelled By Doctor":
        return "bg-red-50 text-red-600 border-red-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const navItems = [
    { id: "overview", icon: "▦", label: "Overview" },
    { id: "appointments", icon: "▣", label: "Appointments" },
    { id: "availability", icon: "◷", label: "Availability" },
    { id: "account", icon: "◉", label: "My Account" }
  ];

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  if (role !== "doctor") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20">

      {/* MOBILE SIDEBAR BACKDROP */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-[calc(100vh-80px)]">

        {/* SIDEBAR */}
        <aside
          className={`fixed lg:sticky top-20 left-0 z-40 h-[calc(100vh-80px)] w-72 bg-[#101B36] text-white flex flex-col transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-2xl">
                🩺
              </div>
              <div>
                <h2 className="font-bold text-lg">Dentify</h2>
                <p className="text-xs text-blue-200">Doctor Portal</p>
              </div>
            </div>
          </div>

          {/* DOCTOR PROFILE */}
          <div className="mx-4 mt-6 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              {doctorImage ? (
                <img
                  src={doctorImage}
                  alt="Doctor"
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-xl">
                  👨‍⚕️
                </div>
              )}

              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">
                  {doctorName}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {doctorQualification}
                </p>
              </div>
            </div>
            <div className="mt-3 text-xs text-green-300">
              ● Doctor account
            </div>
          </div>

          {/* NAVIGATION */}
          <div className="px-4 mt-8">
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold px-3 mb-3">
              Workspace
            </p>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition ${
                    activeTab === item.id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  {item.label}
                  {item.id === "appointments" && (
                    <span className="ml-auto text-xs bg-white/10 px-2 py-1 rounded-full">
                      {appointments.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-5 border-t border-white/10">
            <div className="bg-blue-500/10 rounded-xl p-4">
              <p className="text-sm font-semibold">Need assistance?</p>
              <p className="text-xs text-slate-400 mt-1">
                Manage your appointments and profile from here.
              </p>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                localStorage.removeItem("user");
                window.location.href = "/";
              }}
              className="mt-5 w-full flex items-center gap-3 text-red-300 hover:text-red-200 px-3 py-2 text-sm"
            >
              ↪ Logout
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0">

          {/* TOP HEADER */}
          <header className="bg-white border-b border-slate-200 px-5 md:px-8 py-4 flex items-center justify-between sticky top-20 z-20">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-2xl text-slate-700"
              >
                ☰
              </button>
              <div>
                <h1 className="font-bold text-xl text-slate-800">
                  {navItems.find((item) => item.id === activeTab)?.label}
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  {today}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchAppointments}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm hover:bg-slate-50"
              >
                ↻ Refresh
              </button>

              <button
                onClick={() => setActiveTab("account")}
                className="flex items-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  {doctorName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:block text-sm font-semibold text-slate-700">
                  {doctorName}
                </span>
              </button>
            </div>
          </header>

          <div className="p-5 md:p-8 max-w-[1600px] mx-auto">

            {/* ERROR */}
            {error && (
              <div className="mb-5 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
                {error}
                <button
                  onClick={fetchAppointments}
                  className="ml-3 underline font-semibold"
                >
                  Retry
                </button>
              </div>
            )}

            {/* DOCTOR PROFILE ERROR */}
            {profileError && (
              <div className="mb-5 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
                Doctor profile: {profileError}
                <button
                  onClick={fetchDoctorProfile}
                  className="ml-3 underline font-semibold"
                >
                  Retry
                </button>
              </div>
            )}

            {/* LOADING */}
            {loading ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* OVERVIEW */}
                {activeTab === "overview" && (
                  <div className="space-y-7">

                    {/* WELCOME BANNER */}
                    <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-7 md:p-9 text-white relative overflow-hidden">
                      <div className="relative z-10">
                        <p className="text-blue-100 text-sm">
                          Doctor workspace
                        </p>
                        <h2 className="text-2xl md:text-3xl font-bold mt-2">
                          Welcome back, {doctorName}!
                        </h2>
                        <p className="text-blue-100 mt-2 max-w-xl">
                          Here's an overview of your appointments and practice activity.
                        </p>
                        <button
                          onClick={() => setActiveTab("appointments")}
                          className="mt-5 bg-white text-blue-700 px-5 py-3 rounded-xl font-semibold text-sm hover:bg-blue-50 transition"
                        >
                          Manage Appointments →
                        </button>
                      </div>
                      <div className="absolute right-8 top-2 text-[150px] opacity-10">
                        ✚
                      </div>
                    </div>

                    {/* STATISTICS */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-800">
                          Practice Overview
                        </h2>
                        <span className="text-xs text-slate-500">
                          Based on loaded appointments
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        {[
                          {
                            label: "Total Appointments",
                            value: stats.total,
                            icon: "▣",
                            iconClass: "bg-blue-50 text-blue-600"
                          },
                          {
                            label: "Confirmed",
                            value: stats.confirmed,
                            icon: "✓",
                            iconClass: "bg-green-50 text-green-600"
                          },
                          {
                            label: "Completed",
                            value: stats.completed,
                            icon: "✔",
                            iconClass: "bg-indigo-50 text-indigo-600"
                          },
                          {
                            label: "Cancelled",
                            value: stats.cancelled,
                            icon: "×",
                            iconClass: "bg-red-50 text-red-600"
                          }
                        ].map((stat) => (
                          <div
                            key={stat.label}
                            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
                          >
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-slate-500">
                                {stat.label}
                              </p>
                              <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${stat.iconClass}`}>
                                {stat.icon}
                              </span>
                            </div>
                            <h3 className="text-3xl font-bold text-slate-800 mt-4">
                              {stat.value}
                            </h3>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* RECENT APPOINTMENTS */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                      <div className="p-5 flex justify-between items-center border-b">
                        <div>
                          <h2 className="font-bold text-slate-800">
                            Recent Appointments
                          </h2>
                          <p className="text-xs text-slate-500 mt-1">
                            Latest patient bookings
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveTab("appointments")}
                          className="text-sm text-blue-600 font-semibold"
                        >
                          View all →
                        </button>
                      </div>

                      {appointments.length === 0 ? (
                        <div className="p-10 text-center text-slate-500">
                          No appointments available.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left min-w-[650px]">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                              <tr>
                                <th className="p-4">Patient</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Time</th>
                                <th className="p-4">Clinic</th>
                                <th className="p-4">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {appointments.slice(0, 5).map((a) => (
                                <tr key={a._id} className="border-t hover:bg-slate-50">
                                  <td className="p-4 font-semibold text-slate-700">
                                    {a.patientName}
                                  </td>
                                  <td className="p-4 text-sm text-slate-600">
                                    {formatDate(a.date)}
                                  </td>
                                  <td className="p-4 text-sm text-slate-600">
                                    {a.time}
                                  </td>
                                  <td className="p-4 text-sm text-slate-600">
                                    {a.clinicName}
                                  </td>
                                  <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${statusStyle(a.status)}`}>
                                      {a.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* APPOINTMENTS */}
                {activeTab === "appointments" && (
                  <div className="space-y-5">

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-slate-800">
                          Appointment Management
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                          View and manage your patient bookings.
                        </p>
                      </div>
                    </div>

                    {/* FILTERS */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-3">
                      <input
                        type="text"
                        placeholder="Search patient or clinic..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="All">All statuses</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled By Doctor">Cancelled By Doctor</option>
                        <option value="Cancelled By User">Cancelled By User</option>
                      </select>
                    </div>

                    {/* TABLE */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-5 border-b flex justify-between">
                        <h3 className="font-bold text-slate-800">
                          All Appointments
                        </h3>
                        <span className="text-sm text-slate-500">
                          {filteredAppointments.length} records
                        </span>
                      </div>

                      {filteredAppointments.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                          No matching appointments found.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[950px] text-left">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                              <tr>
                                <th className="p-4">Patient</th>
                                <th className="p-4">Age</th>
                                <th className="p-4">Gender</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Time</th>
                                <th className="p-4">Clinic</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredAppointments.map((a) => (
                                <tr key={a._id} className="border-t hover:bg-slate-50">
                                  <td className="p-4 font-semibold text-slate-700">
                                    {a.patientName}
                                  </td>
                                  <td className="p-4">{a.age}</td>
                                  <td className="p-4">{a.gender}</td>
                                  <td className="p-4">{formatDate(a.date)}</td>
                                  <td className="p-4">{a.time}</td>
                                  <td className="p-4">{a.clinicName}</td>
                                  <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${statusStyle(a.status)}`}>
                                      {a.status}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <div className="flex gap-2 items-center">
                                      <button
                                        onClick={() => setSelectedAppointment(a)}
                                        className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100"
                                      >
                                        View
                                      </button>

                                      {![
                                        "Cancelled By User",
                                        "Cancelled By Doctor",
                                        "Completed"
                                      ].includes(a.status) && (
                                        <select
                                          value={a.status}
                                          disabled={updatingId === a._id}
                                          onChange={(e) =>
                                            updateStatus(a._id, e.target.value)
                                          }
                                          className="border rounded-lg px-2 py-2 text-xs disabled:opacity-50"
                                        >
                                          {a.status === "Booked" && (
                                            <option value="Booked" disabled>
                                              Legacy: Booked (needs review)
                                            </option>
                                          )}
                                          <option value="Confirmed">Confirmed</option>
                                          <option value="Completed">Completed</option>
                                          <option value="Cancelled By Doctor">
                                            Cancelled By Doctor
                                          </option>
                                        </select>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* AVAILABILITY */}
                {activeTab === "availability" && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">
                        Availability & Schedule
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Your currently saved working schedule.
                      </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                      <h3 className="font-bold text-slate-800 mb-5">
                        Working Schedule
                      </h3>

                      <div className="grid sm:grid-cols-2 gap-5">
                        <div className="bg-slate-50 rounded-xl p-5">
                          <p className="text-sm text-slate-500">Working days</p>
                          <p className="font-semibold text-slate-800 mt-2">
                            {Array.isArray(dentist?.workingDays)
                              ? dentist.workingDays.join(", ")
                              : "Not available"}
                          </p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-5">
                          <p className="text-sm text-slate-500">Working hours</p>
                          <p className="font-semibold text-slate-800 mt-2">
                            {dentist?.startTime && dentist?.endTime
                              ? `${dentist.startTime} - ${dentist.endTime}`
                              : "Not available"}
                          </p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-5">
                          <p className="text-sm text-slate-500">Slot duration</p>
                          <p className="font-semibold text-slate-800 mt-2">
                            {dentist?.slotDuration
                              ? `${dentist.slotDuration} minutes`
                              : "Not available"}
                          </p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-5">
                          <p className="text-sm text-slate-500">Clinic</p>
                          <p className="font-semibold text-slate-800 mt-2">
                            {doctorClinic}
                          </p>
                        </div>
                      </div>

                      
                    </div>
                  </div>
                )}

                {/* ACCOUNT */}
                {activeTab === "account" && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">
                        My Account
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Your professional profile information.
                      </p>
                      {profileLoading && (
                        <p className="text-sm text-slate-500 mt-2">
                          Loading doctor profile...
                        </p>
                      )}
                    </div>

                    <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-3xl p-8 text-white">
                      <div className="flex flex-col sm:flex-row items-center gap-5">
                        {doctorImage ? (
                          <img
                            src={doctorImage}
                            alt="Doctor profile"
                            className="w-24 h-24 rounded-full object-cover border-4 border-white/30"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-5xl">
                            👨‍⚕️
                          </div>
                        )}

                        <div className="text-center sm:text-left">
                          <h2 className="text-2xl font-bold">
                            {doctorName}
                          </h2>
                          <p className="text-blue-100 mt-1">
                            {doctorQualification}
                          </p>
                          <span className="inline-block mt-3 px-3 py-1 bg-white/20 rounded-full text-xs">
                            Verified doctor account
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                      <h3 className="font-bold text-slate-800 mb-6">
                        Professional Information
                      </h3>

                      <div className="grid sm:grid-cols-2 gap-6">
                        {[
                          ["Full Name", doctorName],
                          ["Qualification", doctorQualification],
                          [
                            "Experience",
                            doctorExperience !== null
                              ? `${doctorExperience} years`
                              : "Not available"
                          ],
                          ["Clinic Name", doctorClinic],
                          ["Clinic Location", doctorLocation],
                        
                        
                          ["Account Role", "Doctor"]
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="border-b border-slate-100 pb-4"
                          >
                            <p className="text-xs uppercase tracking-wide text-slate-400">
                              {label}
                            </p>
                            <p className="font-semibold text-slate-700 mt-2">
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* APPOINTMENT DETAILS MODAL */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between">
              <div>
                <h2 className="font-bold text-xl">Patient Details</h2>
                <p className="text-sm text-blue-100 mt-1">
                  Appointment information
                </p>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              {[
                ["Patient Name", selectedAppointment.patientName],
                ["Age", selectedAppointment.age],
                ["Gender", selectedAppointment.gender],
                ["Date", formatDate(selectedAppointment.date)],
                ["Time", selectedAppointment.time],
                ["Clinic", selectedAppointment.clinicName],
                ["Status", selectedAppointment.status]
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b pb-3">
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="text-sm font-semibold text-slate-800 text-right">
                    {value || "N/A"}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-5 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedAppointment(null)}
                className="bg-blue-600 text-white px-5 py-2 rounded-xl font-semibold hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
