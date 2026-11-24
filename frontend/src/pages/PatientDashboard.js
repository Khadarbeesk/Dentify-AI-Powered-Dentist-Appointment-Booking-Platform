
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../config";

export default function PatientDashboard() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [appointmentError, setAppointmentError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  // Fetch profile and appointments
  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      // Fetch patient profile
      try {
        const response = await fetch(`${API}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || data.msg || "Unable to fetch profile"
          );
        }

        setUser(data);
      } catch (err) {
        console.error("Profile error:", err);
        setError(err.message);
        setLoading(false);
        return;
      }

      // Fetch patient appointments
      try {
        const response = await fetch(`${API}/api/appointments/my`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.msg || data.message || "Unable to fetch appointments"
          );
        }

        setAppointments(data);
      } catch (err) {
        console.error("Appointments error:", err);
        setAppointmentError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const menu = [
    { id: "overview", label: "Overview", icon: "▦" },
    { id: "profile", label: "My Profile", icon: "♙" },
    { id: "upcoming", label: "Upcoming Appointments", icon: "▣" },
    { id: "history", label: "Appointment History", icon: "◷" }
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isCancelled = (status) =>
    ["Cancelled By User", "Cancelled By Doctor"].includes(status);

  const upcomingAppointments = appointments.filter((a) => {
    const appointmentDate = new Date(a.date);
    appointmentDate.setHours(0, 0, 0, 0);

    return (
      !["Completed", "Cancelled By User", "Cancelled By Doctor"].includes(
        a.status
      ) &&
      appointmentDate >= today
    );
  });

  const appointmentHistory = appointments.filter((a) => {
    const appointmentDate = new Date(a.date);
    appointmentDate.setHours(0, 0, 0, 0);

    return (
      ["Completed", "Cancelled By User", "Cancelled By Doctor"].includes(
        a.status
      ) ||
      appointmentDate < today
    );
  });

  const completedAppointments = appointments.filter(
    (a) => a.status === "Completed"
  );

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Cancel appointment
  const cancelAppointment = async (id) => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this appointment?"
    );

    if (!confirmCancel) return;

    try {
      setCancellingId(id);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API}/api/appointments/cancel/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "Unable to cancel appointment");
      }

      setAppointments((prev) =>
        prev.map((a) =>
          a._id === id
            ? { ...a, status: "Cancelled By User" }
            : a
        )
      );

      alert("Appointment cancelled successfully");
    } catch (err) {
      alert(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading your dashboard...</p>
      </div>
    );
  }

  // Profile error
  if (error || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-600">
          {error || "Unable to load your profile"}
        </p>

        <button
          onClick={logout}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg"
        >
          Login Again
        </button>
      </div>
    );
  }

  // Appointment card
  const AppointmentCard = ({ appointment, showCancel = false }) => (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-800">
            Dr. {appointment.dentistName}
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            {appointment.clinicName}
          </p>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold w-fit ${
            appointment.status === "Completed"
              ? "bg-green-100 text-green-700"
              : isCancelled(appointment.status)
              ? "bg-red-100 text-red-700"
              : appointment.status === "Confirmed"
              ? "bg-blue-100 text-blue-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {appointment.status || "Booked"}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mt-5 text-sm text-slate-600">
        <p>
          <span className="font-semibold">Date:</span>{" "}
          {new Date(appointment.date).toLocaleDateString("en-IN")}
        </p>

        <p>
          <span className="font-semibold">Time:</span>{" "}
          {appointment.time}
        </p>

        <p>
          <span className="font-semibold">Patient:</span>{" "}
          {appointment.patientName}
        </p>

        <p>
          <span className="font-semibold">Age:</span>{" "}
          {appointment.age}
        </p>
      </div>

      {showCancel && (
        <div className="mt-5 pt-4 border-t">
          <button
            disabled={cancellingId === appointment._id}
            onClick={() => cancelAppointment(appointment._id)}
            className="text-red-600 hover:text-red-700 font-semibold text-sm disabled:opacity-50"
          >
            {cancellingId === appointment._id
              ? "Cancelling..."
              : "Cancel Appointment"}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-20">

      {/* SIDEBAR */}
      <aside className="fixed top-20 left-0 h-[calc(100vh-80px)] w-64 bg-[#101B36] text-white hidden md:flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold">My Dashboard</h2>
          <p className="text-xs text-slate-400 mt-1">
            Patient Portal
          </p>
        </div>

        <nav className="p-4 space-y-2">
          {menu.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition ${
                activeTab === item.id
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-white/10"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto p-5 border-t border-white/10">
          <button
            onClick={logout}
            className="text-red-300 hover:text-red-200"
          >
            ↪ Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="md:ml-64 p-5 md:p-8">

        {/* HEADER */}
        <header className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {menu.find((item) => item.id === activeTab)?.label}
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Manage your dental care and appointments
            </p>
          </div>

          <button
            onClick={() => navigate("/")}
            className="bg-white border border-slate-200 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-100"
          >
            + Book Appointment
          </button>
        </header>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-7">

            <div className="bg-gradient-to-r from-blue-800 to-indigo-700 rounded-3xl p-8 text-white">
              <p className="text-blue-100 text-sm">
                Patient Dashboard
              </p>

              <h2 className="text-3xl font-bold mt-3">
                Welcome back, {user.name}!
              </h2>

              <p className="text-blue-100 mt-2">
                Your smile deserves the best care. Manage your appointments here.
              </p>

              <button
                onClick={() => navigate("/")}
                className="mt-6 bg-white text-blue-700 px-5 py-3 rounded-xl font-semibold hover:bg-blue-50"
              >
                Find a Dentist →
              </button>
            </div>

            {appointmentError && (
              <p className="text-red-600">{appointmentError}</p>
            )}

            {/* APPOINTMENT STATS */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  title: "Upcoming Appointments",
                  value: upcomingAppointments.length,
                  icon: "📅",
                  color: "bg-blue-50 text-blue-600"
                },
                {
                  title: "Completed Appointments",
                  value: completedAppointments.length,
                  icon: "✓",
                  color: "bg-green-50 text-green-600"
                },
                {
                  title: "Total Appointments",
                  value: appointments.length,
                  icon: "▣",
                  color: "bg-violet-50 text-violet-600"
                }
              ].map((card) => (
                <div
                  key={card.title}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${card.color}`}
                  >
                    {card.icon}
                  </div>

                  <p className="text-sm text-slate-500 mt-5">
                    {card.title}
                  </p>

                  <h3 className="text-3xl font-bold text-slate-800 mt-2">
                    {card.value}
                  </h3>
                </div>
              ))}
            </div>

            {/* RECENT ACTIVITY */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="font-bold text-lg text-slate-800">
                Recent Activity
              </h3>

              {appointmentError ? (
                <p className="text-red-500 mt-5">{appointmentError}</p>
              ) : appointments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🦷</div>
                  <p className="text-slate-600 font-medium">
                    No appointment activity yet.
                  </p>
                  <button
                    onClick={() => navigate("/")}
                    className="mt-4 text-blue-600 font-semibold"
                  >
                    Book your first appointment →
                  </button>
                </div>
              ) : (
                <div className="space-y-3 mt-5">
                  {[...appointments]
                    .sort(
                      (a, b) => new Date(b.date) - new Date(a.date)
                    )
                    .slice(0, 3)
                    .map((appointment) => (
                      <AppointmentCard
                        key={appointment._id}
                        appointment={appointment}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PROFILE */}
        {activeTab === "profile" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 max-w-3xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold">
                {user.name?.charAt(0).toUpperCase() || "P"}
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {user.name}
                </h2>
                <p className="text-sm text-slate-500">
                  Patient Account
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-sm text-slate-500">
                  Full Name
                </label>
                <p className="mt-2 p-4 bg-slate-50 rounded-xl font-medium">
                  {user.name}
                </p>
              </div>

              <div>
                <label className="text-sm text-slate-500">
                  Email Address
                </label>
                <p className="mt-2 p-4 bg-slate-50 rounded-xl font-medium">
                  {user.email}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-6">
              Profile editing will be enabled after connecting the profile update API.
            </p>
          </div>
        )}

        {/* UPCOMING APPOINTMENTS */}
        {activeTab === "upcoming" && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-slate-800">
              Upcoming Appointments
            </h2>

            {appointmentError ? (
              <p className="text-red-500">{appointmentError}</p>
            ) : upcomingAppointments.length === 0 ? (
              <div className="bg-white border rounded-2xl p-10 text-center">
                <div className="text-5xl mb-4">📅</div>
                <h3 className="font-bold text-slate-800">
                  No Upcoming Appointments
                </h3>
                <p className="text-slate-500 mt-2">
                  Your upcoming bookings will appear here.
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="mt-5 bg-blue-600 text-white px-5 py-2.5 rounded-xl"
                >
                  Book Appointment
                </button>
              </div>
            ) : (
              upcomingAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment._id}
                  appointment={appointment}
                  showCancel={
                    new Date(appointment.date).setHours(0, 0, 0, 0) >
                    today.getTime()
                  }
                />
              ))
            )}
          </div>
        )}

        {/* APPOINTMENT HISTORY */}
        {activeTab === "history" && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-slate-800">
              Appointment History
            </h2>

            {appointmentError ? (
              <p className="text-red-500">{appointmentError}</p>
            ) : appointmentHistory.length === 0 ? (
              <div className="bg-white border rounded-2xl p-10 text-center">
                <div className="text-5xl mb-4">📋</div>
                <h3 className="font-bold text-slate-800">
                  No Appointment History
                </h3>
                <p className="text-slate-500 mt-2">
                  Your completed and cancelled appointments will appear here.
                </p>
              </div>
            ) : (
              appointmentHistory.map((appointment) => (
                <AppointmentCard
                  key={appointment._id}
                  appointment={appointment}
                />
              ))
            )}
          </div>
        )}

      </main>
    </div>
  );
}
