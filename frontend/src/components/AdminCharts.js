
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

const STATUS_COLORS = {
  Booked: "#F59E0B",
  Confirmed: "#2563EB",
  Completed: "#10B981",
  Cancelled: "#EF4444"
};

const GENDER_COLORS = {
  Male: "#3B82F6",
  Female: "#A78BFA"
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700">
      <p className="text-xs text-slate-300 mb-1">{payload[0].name}</p>
      <p className="text-lg font-bold">
        {payload[0].value}
        <span className="text-xs font-normal text-slate-300 ml-1">
          appointments
        </span>
      </p>
    </div>
  );
};

const CustomBarTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl">
      <p className="text-sm text-slate-300">{payload[0].payload.name}</p>
      <p className="text-lg font-bold">{payload[0].value} patients</p>
    </div>
  );
};

export default function AdminCharts({ appointments = [] }) {
  const total = appointments.length;

  const statusData = [
    {
      name: "Booked",
      value: appointments.filter(a => a.status === "Booked").length
    },
    {
      name: "Confirmed",
      value: appointments.filter(a => a.status === "Confirmed").length
    },
    {
      name: "Completed",
      value: appointments.filter(a => a.status === "Completed").length
    },
    {
      name: "Cancelled",
      value: appointments.filter(a =>
        ["Cancelled By User", "Cancelled By Doctor"].includes(a.status)
      ).length
    }
  ];

  const genderData = [
    {
      name: "Male",
      value: appointments.filter(
        a => a.gender?.toLowerCase() === "male"
      ).length
    },
    {
      name: "Female",
      value: appointments.filter(
        a => a.gender?.toLowerCase() === "female"
      ).length
    }
  ];

  const genderTotal = genderData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

      {/* APPOINTMENT STATUS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">

        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Appointment Overview
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Breakdown by appointment status
            </p>
          </div>

          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
            ◉
          </div>
        </div>

        {total === 0 ? (
          <div className="h-[260px] flex flex-col items-center justify-center text-slate-400">
            <span className="text-4xl mb-3">📊</span>
            <p className="font-medium text-slate-600">No appointment data</p>
            <p className="text-sm mt-1">Data will appear when bookings arrive</p>
          </div>
        ) : (
          <>
            <div className="relative h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={100}
                    paddingAngle={4}
                    stroke="none"
                    cornerRadius={5}
                  >
                    {statusData.map(item => (
                      <Cell
                        key={item.name}
                        fill={STATUS_COLORS[item.name]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-slate-800">
                  {total}
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Total bookings
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-5 gap-y-4 mt-3">
              {statusData.map(item => (
                <div key={item.name} className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[item.name] }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-500">{item.name}</p>
                    <p className="text-base font-bold text-slate-800">
                      {item.value}
                      <span className="text-xs text-slate-400 font-normal ml-2">
                        {((item.value / total) * 100).toFixed(1)}%
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* GENDER DISTRIBUTION */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">

        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Patient Demographics
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Appointment distribution by gender
            </p>
          </div>

          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center text-xl">
            ♙
          </div>
        </div>

        {genderTotal === 0 ? (
          <div className="h-[280px] flex flex-col items-center justify-center text-slate-400">
            <span className="text-4xl mb-3">👥</span>
            <p className="font-medium text-slate-600">No demographic data</p>
            <p className="text-sm mt-1">Patient data will appear here</p>
          </div>
        ) : (
          <>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={genderData}
                  margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
                  barSize={55}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="#E2E8F0"
                  />

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748B", fontSize: 13 }}
                    dy={10}
                  />

                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94A3B8", fontSize: 12 }}
                  />

                  <Tooltip
                    content={<CustomBarTooltip />}
                    cursor={{ fill: "#F1F5F9" }}
                  />

                  <Bar
                    dataKey="value"
                    radius={[10, 10, 0, 0]}
                  >
                    {genderData.map(item => (
                      <Cell
                        key={item.name}
                        fill={GENDER_COLORS[item.name]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              {genderData.map(item => (
                <div
                  key={item.name}
                  className="rounded-xl bg-slate-50 border border-slate-100 p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: GENDER_COLORS[item.name] }}
                    />
                    <span className="text-sm text-slate-500">{item.name}</span>
                  </div>

                  <p className="text-2xl font-bold text-slate-800">
                    {item.value}
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    {((item.value / genderTotal) * 100).toFixed(1)}% of appointments
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
