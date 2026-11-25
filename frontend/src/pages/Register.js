
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../config";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [errors, setErrors] = useState({});

  // ================= VALIDATION =================
  const validate = () => {
    let newErrors = {};

    if (!form.name || form.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = "Enter a valid email";
    }

    if (
      !form.password ||
      form.password.length < 6 ||
      !/[A-Z]/.test(form.password) ||
      !/[0-9]/.test(form.password)
    ) {
      newErrors.password =
        "Password must be 6+ chars, include 1 uppercase & 1 number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ================= REGISTER =================
  const register = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      const getMessage = (...messages) =>
        messages.find(
          (msg) =>
            typeof msg === "string" &&
            msg.trim() !== "" &&
            msg.trim().toLowerCase() !== "undefined"
        );

      if (!res.ok) {
        alert(
          getMessage(data.message, data.msg) ||
          "Registration failed. Please try again."
        );
        return;
      }

      alert(
        getMessage(data.message, data.msg) ||
        "Registration successful! Please log in."
      );

      navigate("/login");

    } catch (error) {
      console.error("Registration error:", error);
      alert("Unable to connect to the server. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-500 to-indigo-600">

      <form
        onSubmit={register}
        className="bg-white p-10 rounded-2xl shadow-xl w-96"
      >

        <h2 className="text-2xl font-bold text-center mb-6">
          Register
        </h2>

        {/* NAME */}
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          className="w-full p-3 border rounded-lg mb-2"
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        {errors.name && (
          <p className="text-red-500 text-xs mb-2">
            {errors.name}
          </p>
        )}

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          className="w-full p-3 border rounded-lg mb-2"
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        {errors.email && (
          <p className="text-red-500 text-xs mb-2">
            {errors.email}
          </p>
        )}

        {/* PASSWORD */}
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          className="w-full p-3 border rounded-lg mb-2"
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
        />

        {errors.password && (
          <p className="text-red-500 text-xs mb-2">
            {errors.password}
          </p>
        )}

        <button
          type="submit"
          className="w-full bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 transition mt-2"
        >
          Register
        </button>

        <p className="text-center mt-4">
          Already have account?{" "}
          <Link to="/login" className="text-blue-500">
            Login
          </Link>
        </p>

      </form>
    </div>
  );
}
