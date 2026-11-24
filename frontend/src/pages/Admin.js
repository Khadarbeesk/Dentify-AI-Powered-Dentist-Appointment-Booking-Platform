
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminCharts from "../components/AdminCharts";
import API from "../config";

const emptyDoctor = {
  name: "",
  qualification: "",
  experience: "",
  clinicName: "",
  address: "",
  location: "Hyderabad",
  image: "",
  email: "",
  password: "",
  workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  startTime: "09:00",
  endTime: "18:00",
  slotDuration: 30
};

const menu = [
  { id: "overview", icon: "▦", label: "Overview" },
  { id: "appointments", icon: "▣", label: "Appointments" },
  { id: "doctors", icon: "✚", label: "Doctors" },
  { id: "patients", icon: "♙", label: "Patients" }
];

export default function Admin() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [doctorForm, setDoctorForm] = useState(emptyDoctor);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  
const token = localStorage.getItem("token");



const loadData = useCallback(async () => {
  try {
    setLoading(true);
    setError("");
    const headers = {
  Authorization: `Bearer ${token}`
};

    const [appointmentResponse, doctorResponse] = await Promise.all([
      fetch(`${API}/api/appointments`, { headers }),
      fetch(`${API}/api/dentists`)
    ]);

    if (!appointmentResponse.ok || !doctorResponse.ok) {
      throw new Error("Unable to load dashboard information.");
    }

    const appointmentData = await appointmentResponse.json();
    const doctorData = await doctorResponse.json();

    setAppointments(Array.isArray(appointmentData) ? appointmentData : []);
    setDoctors(Array.isArray(doctorData) ? doctorData : []);

  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}, [token]);

useEffect(() => {
  if (
    localStorage.getItem("role") !== "admin" ||
    !token
  ) {
    navigate("/login", { replace: true });
    return;
  }

  loadData();
}, [navigate, token, loadData]);

 

   
    

  const stats = useMemo(() => ({
    total: appointments.length,
    booked: appointments.filter(a => a.status === "Booked").length,
    confirmed: appointments.filter(a => a.status === "Confirmed").length,
    completed: appointments.filter(a => a.status === "Completed").length,
    cancelled: appointments.filter(a =>
      ["Cancelled By User", "Cancelled By Doctor"].includes(a.status)
    ).length
  }), [appointments]);

  const patients = useMemo(() => {
    const unique = new Map();

    appointments.forEach(a => {
      const key = `${a.patientName || ""}-${a.userId || ""}`;
      if (!unique.has(key)) unique.set(key, a);
    });

    return [...unique.values()];
  }, [appointments]);

  const filteredAppointments = appointments.filter(a => {
    const term = search.toLowerCase();

    const matchesSearch = [
      a.patientName, a.dentistName, a.clinicName
    ].some(value => (value || "").toLowerCase().includes(term));

    const matchesStatus =
      statusFilter === "All" || a.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredDoctors = doctors.filter(d =>
    [d.name, d.clinicName, d.qualification]
      .some(value => (value || "").toLowerCase().includes(search.toLowerCase()))
  );

  const openAddDoctor = () => {
    setEditingDoctor(null);
    setDoctorForm(emptyDoctor);
    setShowDoctorForm(true);
    setError("");
    setSuccess("");
  };

  const openEditDoctor = doctor => {
    setEditingDoctor(doctor);
    setDoctorForm({
      ...emptyDoctor,
      ...doctor,
      email: "",
      password: "",
      experience: doctor.experience ?? "",
      slotDuration: doctor.slotDuration ?? 30
    });
    setShowDoctorForm(true);
    setError("");
    setSuccess("");
  };

  const handleFormChange = e => {
    const { name, value } = e.target;
    setDoctorForm(prev => ({ ...prev, [name]: value }));
  };

  const toggleWorkingDay = day => {
    setDoctorForm(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day]
    }));
  };

  const saveDoctor = async e => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        ...doctorForm,
        experience: Number(doctorForm.experience),
        slotDuration: Number(doctorForm.slotDuration)
      };

      if (editingDoctor) {
        delete payload.email;
        delete payload.password;

        const response = await fetch(
          `${API}/api/dentists/${editingDoctor._id}`,
          {
            method: "PUT",
            headers: {
              ...headers,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to update doctor.");
        }

        setSuccess("Doctor details updated successfully.");
      } else {
        const response = await fetch(`${API}/api/dentists/admin/add`, {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to add doctor.");
        }

        setSuccess("Doctor and login account created successfully.");
      }

      setShowDoctorForm(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const formatDate = date =>
    date ? new Date(date).toLocaleDateString("en-IN") : "N/A";

  const statCards = [
    { label: "Total Appointments", value: stats.total, icon: "▣", color: "blue" },
    { label: "Pending Bookings", value: stats.booked, icon: "◷", color: "amber" },
    { label: "Confirmed", value: stats.confirmed, icon: "✓", color: "green" },
    { label: "Completed", value: stats.completed, icon: "✔", color: "violet" },
    { label: "Total Doctors", value: doctors.length, icon: "✚", color: "cyan" }
  ];

  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-green-50 text-green-600",
    violet: "bg-violet-50 text-violet-600",
    cyan: "bg-cyan-50 text-cyan-600"
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-20">

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed top-20 left-0 z-40 h-[calc(100vh-80px)] w-72 bg-[#101B36] text-white flex flex-col transition-transform duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>

        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl">
              🦷
            </div>
            <div>
              <h2 className="font-bold text-xl">Dentify</h2>
              <p className="text-xs text-blue-200">Administration Portal</p>
            </div>
          </div>
        </div>

        <div className="px-4 mt-8">
          <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold px-3 mb-4">
            Workspace
          </p>

          <nav className="space-y-2">
            {menu.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSearch("");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  activeTab === item.id
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-white/10"
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
            <p className="font-semibold text-sm">Admin workspace</p>
            <p className="text-xs text-slate-400 mt-1">
              Manage your doctors, patients and appointments.
            </p>
          </div>

          <button
            onClick={logout}
            className="mt-5 w-full text-left text-red-300 hover:text-red-200 px-3 py-2 text-sm"
          >
            ↪ Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="lg:ml-72 min-w-0">

        {/* HEADER */}
        <header className="bg-white border-b border-slate-200 px-5 md:px-8 py-5 flex items-center justify-between sticky top-20 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-2xl"
            >
              ☰
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                {menu.find(item => item.id === activeTab)?.label}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Manage and monitor your Dentify platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm hover:bg-slate-50"
            >
              ↻ <span className="hidden sm:inline">Refresh</span>
            </button>
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              A
            </div>
            <span className="hidden md:block text-sm font-semibold text-slate-700">
              Administrator
            </span>
          </div>
        </header>

        <div className="p-5 md:p-8 max-w-[1600px] mx-auto">

          {error && (
            <div className="mb-5 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
              {error}
              <button onClick={() => setError("")} className="float-right">✕</button>
            </div>
          )}

          {success && (
            <div className="mb-5 p-4 bg-green-50 text-green-700 rounded-xl border border-green-200">
              {success}
              <button onClick={() => setSuccess("")} className="float-right">✕</button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center min-h-[350px]">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-7">

                  <div className="rounded-3xl bg-gradient-to-r from-[#14264D] via-blue-700 to-indigo-700 p-7 md:p-9 text-white">
                    <p className="text-blue-100 text-sm">Administration overview</p>
                    <h2 className="text-2xl md:text-3xl font-bold mt-2">
                      Welcome to Dentify Admin
                    </h2>
                    <p className="text-blue-100 mt-2">
                      Your central workspace for managing dental appointments and doctors.
                    </p>
                    <button
                      onClick={openAddDoctor}
                      className="mt-5 bg-white text-blue-700 px-5 py-3 rounded-xl font-semibold text-sm hover:bg-blue-50"
                    >
                      + Add New Doctor
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                    {statCards.map(card => (
                      <div key={card.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-slate-500">{card.label}</p>
                          <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${colorClasses[card.color]}`}>
                            {card.icon}
                          </span>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-800 mt-4">
                          {card.value}
                        </h3>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <h2 className="font-bold text-slate-800 mb-5">
                        Appointment Analytics
                      </h2>
                      {appointments.length > 0 ? (
                        <AdminCharts appointments={appointments} />
                      ) : (
                        <p className="text-slate-500 text-sm py-10 text-center">
                          No appointment data available yet.
                        </p>
                      )}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <h2 className="font-bold text-slate-800 mb-5">
                        Appointment Status
                      </h2>
                      {[
                        ["Pending", stats.booked, "bg-amber-500"],
                        ["Confirmed", stats.confirmed, "bg-green-500"],
                        ["Completed", stats.completed, "bg-blue-500"],
                        ["Cancelled", stats.cancelled, "bg-red-500"]
                      ].map(([label, value, color]) => (
                        <div key={label} className="mb-5">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-600">{label}</span>
                            <strong>{value}</strong>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${color} rounded-full`}
                              style={{
                                width: `${stats.total ? (value / stats.total) * 100 : 0}%`
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-5 border-b flex justify-between items-center">
                      <div>
                        <h2 className="font-bold text-slate-800">Recent Appointments</h2>
                        <p className="text-xs text-slate-500 mt-1">Latest patient bookings</p>
                      </div>
                      <button
                        onClick={() => setActiveTab("appointments")}
                        className="text-sm text-blue-600 font-semibold"
                      >
                        View all →
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[700px] text-left">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                          <tr>
                            <th className="p-4">Patient</th>
                            <th className="p-4">Doctor</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Clinic</th>
                            <th className="p-4">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {appointments.slice(0, 5).map(a => (
                            <tr key={a._id} className="border-t">
                              <td className="p-4 font-semibold">{a.patientName}</td>
                              <td className="p-4">{a.dentistName}</td>
                              <td className="p-4">{formatDate(a.date)}</td>
                              <td className="p-4">{a.clinicName}</td>
                              <td className="p-4">{a.status || "Booked"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {appointments.length === 0 && (
                        <p className="p-8 text-center text-slate-500">No appointments found.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* APPOINTMENTS */}
              {activeTab === "appointments" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">All Appointments</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      View all patient bookings across your clinics.
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border p-4 flex flex-col md:flex-row gap-3">
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search patient, doctor or clinic..."
                      className="flex-1 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="border rounded-xl px-4 py-3"
                    >
                      {["All", "Booked", "Confirmed", "Completed", "Cancelled By User", "Cancelled By Doctor"].map(s => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                    <div className="p-5 border-b flex justify-between">
                      <h3 className="font-bold">Appointment Records</h3>
                      <span className="text-sm text-slate-500">{filteredAppointments.length} records</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[950px] text-left">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                          <tr>
                            {["Patient", "Age", "Gender", "Date", "Time", "Doctor", "Clinic", "Status"].map(h => (
                              <th className="p-4" key={h}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAppointments.map(a => (
                            <tr key={a._id} className="border-t hover:bg-slate-50">
                              <td className="p-4 font-semibold">{a.patientName}</td>
                              <td className="p-4">{a.age}</td>
                              <td className="p-4">{a.gender}</td>
                              <td className="p-4">{formatDate(a.date)}</td>
                              <td className="p-4">{a.time || "N/A"}</td>
                              <td className="p-4">{a.dentistName}</td>
                              <td className="p-4">{a.clinicName}</td>
                              <td className="p-4">
                                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                                  {a.status || "Booked"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filteredAppointments.length === 0 && (
                        <p className="p-8 text-center text-slate-500">No matching appointments.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* DOCTORS */}
              {activeTab === "doctors" && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">Doctor Management</h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Create doctor accounts and maintain professional profiles.
                      </p>
                    </div>
                    <button
                      onClick={openAddDoctor}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold"
                    >
                      + Add Doctor
                    </button>
                  </div>

                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search doctors..."
                    className="w-full bg-white border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredDoctors.map(d => (
                      <div key={d._id} className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                        <div className="flex items-center gap-4">
                          {d.image ? (
                            <img src={d.image} alt={d.name} className="w-16 h-16 rounded-2xl object-cover" />
                          ) : (
                            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl">🩺</div>
                          )}
                          <div className="min-w-0">
                            <h3 className="font-bold text-slate-800">{d.name}</h3>
                            <p className="text-sm text-slate-500">{d.qualification}</p>
                            <p className="text-xs text-slate-400">{d.experience} years experience</p>
                          </div>
                        </div>
                        <div className="border-t mt-5 pt-4 space-y-2 text-sm text-slate-600">
                          <p>🏥 {d.clinicName || "Clinic not specified"}</p>
                          <p>📍 {d.address || d.location || "Location not specified"}</p>
                          <p>🕒 {d.startTime || "09:00"} – {d.endTime || "18:00"}</p>
                        </div>
                        <button
                          onClick={() => openEditDoctor(d)}
                          className="mt-5 w-full border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl py-2.5 font-semibold text-sm"
                        >
                          Edit Doctor Details
                        </button>
                      </div>
                    ))}
                  </div>

                  {filteredDoctors.length === 0 && (
                    <div className="bg-white border rounded-2xl p-10 text-center text-slate-500">
                      No doctors found.
                    </div>
                  )}
                </div>
              )}

              {/* PATIENTS */}
              {activeTab === "patients" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Patient Records</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Patients represented in appointment records.
                    </p>
                  </div>

                  <div className="bg-white border rounded-2xl overflow-hidden">
                    <div className="p-5 border-b font-bold">
                      Patients with appointments ({patients.length})
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[650px] text-left">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                          <tr>
                            <th className="p-4">Patient</th>
                            <th className="p-4">Age</th>
                            <th className="p-4">Gender</th>
                            <th className="p-4">Last Appointment</th>
                            <th className="p-4">Doctor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patients.map((p, i) => (
                            <tr key={`${p._id}-${i}`} className="border-t">
                              <td className="p-4 font-semibold">{p.patientName}</td>
                              <td className="p-4">{p.age}</td>
                              <td className="p-4">{p.gender}</td>
                              <td className="p-4">{formatDate(p.date)}</td>
                              <td className="p-4">{p.dentistName}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {patients.length === 0 && (
                        <p className="p-8 text-center text-slate-500">No patient records found.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ADD / EDIT DOCTOR MODAL */}
      {showDoctorForm && (
        <div className="fixed inset-0 z-[60] bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">

            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white flex justify-between items-center sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold">
                  {editingDoctor ? "Edit Doctor Profile" : "Add New Doctor"}
                </h2>
                <p className="text-sm text-blue-100 mt-1">
                  {editingDoctor ? "Update professional information" : "Create a doctor profile and login account"}
                </p>
              </div>
              <button onClick={() => setShowDoctorForm(false)} className="text-2xl">×</button>
            </div>

            <form onSubmit={saveDoctor} className="p-6 space-y-6">

              <div>
                <h3 className="font-bold text-slate-800 mb-4">Personal & Professional Details</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    ["name", "Doctor Name", "text"],
                    ["qualification", "Qualification", "text"],
                    ["experience", "Experience (years)", "number"],
                    ["clinicName", "Clinic Name", "text"],
                    ["address", "Clinic Address", "text"],
                    ["location", "City", "text"],
                    ["image", "Profile Image URL", "url"]
                  ].map(([name, label, type]) => (
                    <div key={name}>
                      <label className="text-sm font-medium text-slate-600">{label}</label>
                      <input
                        required={name === "name"}
                        type={type}
                        name={name}
                        min={type === "number" ? "0" : undefined}
                        value={doctorForm[name] ?? ""}
                        onChange={handleFormChange}
                        className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {!editingDoctor && (
                <div>
                  <h3 className="font-bold text-slate-800 mb-4">Doctor Login Account</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-600">Email</label>
                      <input
                        required
                        type="email"
                        name="email"
                        value={doctorForm.email}
                        onChange={handleFormChange}
                        className="mt-1 w-full border rounded-xl px-4 py-3"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">Temporary Password</label>
                      <input
                        required
                        minLength={6}
                        type="password"
                        name="password"
                        value={doctorForm.password}
                        onChange={handleFormChange}
                        className="mt-1 w-full border rounded-xl px-4 py-3"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-bold text-slate-800 mb-4">Working Schedule</h3>
                <p className="text-sm text-slate-500 mb-3">Select working days</p>
                <div className="flex flex-wrap gap-2">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleWorkingDay(day)}
                      className={`px-3 py-2 rounded-lg text-sm border ${
                        doctorForm.workingDays.includes(day)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-600 border-slate-200"
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>

                <div className="grid sm:grid-cols-3 gap-4 mt-5">
                  {[
                    ["startTime", "Start Time", "time"],
                    ["endTime", "End Time", "time"],
                    ["slotDuration", "Slot Duration (minutes)", "number"]
                  ].map(([name, label, type]) => (
                    <div key={name}>
                      <label className="text-sm font-medium text-slate-600">{label}</label>
                      <input
                        required
                        type={type}
                        name={name}
                        min={type === "number" ? "5" : undefined}
                        value={doctorForm[name]}
                        onChange={handleFormChange}
                        className="mt-1 w-full border rounded-xl px-4 py-3"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 border-t pt-5">
                <button
                  type="button"
                  onClick={() => setShowDoctorForm(false)}
                  className="px-5 py-3 border rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingDoctor ? "Save Changes" : "Create Doctor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
