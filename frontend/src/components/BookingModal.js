
import { useState } from "react";
import API from "../config";

export default function BookingModal({ dentist, close }) {
  const [form, setForm] = useState({
    patientName: "",
    age: "",
    gender: "",
    date: "",
    time: ""
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const timeSlots = [
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM"
  ];

  const validate = () => {
    let newErrors = {};

    if (!form.patientName.trim()) {
      newErrors.patientName = "Name required";
    }

    if (!form.age || Number(form.age) <= 0 || Number(form.age) > 120) {
      newErrors.age = "Enter valid age (1-120)";
    }

    if (!form.gender) {
      newErrors.gender = "Select gender";
    }

    if (!form.date || form.date < today) {
      newErrors.date = "Select valid date";
    }

    if (!form.time) {
      newErrors.time = "Select time slot";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // Load Razorpay Checkout script
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");

      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  };

  const submit = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login to book an appointment.");
        setLoading(false);
        return;
      }

      // STEP 1: Load Razorpay
      const isLoaded = await loadRazorpay();

      if (!isLoaded) {
        alert("Unable to load payment gateway. Please try again.");
        setLoading(false);
        return;
      }

      // STEP 2: Create Razorpay order from backend
      const orderRes = await fetch(`${API}/api/payment/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        }
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.msg || "Unable to create payment order");
      }

      const order = orderData.order;

      // STEP 3: Configure Razorpay Checkout
      const options = {
        key: orderData.key,
        amount: order.amount,
        currency: order.currency,
        name: "Dentify",
        description: "Dental Appointment Booking",
        order_id: order.id,

        prefill: {
          name: form.patientName
        },

        theme: {
          color: "#2563eb"
        },

        // STEP 4: After successful payment
        handler: async function (response) {
          try {
            const appointmentRes = await fetch(
              `${API}/api/appointments`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + token
                },
                body: JSON.stringify({
                  ...form,
                  dentistName: dentist.name,
                  clinicName: dentist.clinicName,

                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
              }
            );

            const appointmentData = await appointmentRes.json();

            if (!appointmentRes.ok) {
              throw new Error(
                appointmentData.msg || "Appointment booking failed"
              );
            }

            alert("Payment successful! Appointment booked successfully.");
            close();

          } catch (error) {
            console.error("Appointment error:", error);
            alert(
              error.message ||
              "Payment was received, but appointment confirmation failed. Please contact support."
            );
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        }
      };

      // STEP 5: Open Razorpay Checkout
      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function (response) {
        console.error("Payment failed:", response.error);
        alert(response.error.description || "Payment failed. Please try again.");
        setLoading(false);
      });

      razorpay.open();

    } catch (error) {
      console.error("Payment error:", error);
      alert(error.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 px-4">

      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 md:p-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            Book{" "}
            <span className="text-blue-600">
              {dentist.name}
            </span>
          </h2>

          <button
            onClick={close}
            disabled={loading}
            className="text-gray-500 hover:text-red-500 text-xl disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Patient Name */}
          <div>
            <input
              placeholder="Full Name"
              className="w-full p-3 border rounded-lg"
              value={form.patientName}
              onChange={(e) =>
                setForm({
                  ...form,
                  patientName: e.target.value
                })
              }
            />

            {errors.patientName && (
              <p className="text-red-500 text-sm mt-1">
                {errors.patientName}
              </p>
            )}
          </div>

          {/* Age */}
          <div>
            <input
              type="number"
              min="1"
              max="120"
              placeholder="Age"
              className="w-full p-3 border rounded-lg"
              value={form.age}
              onChange={(e) =>
                setForm({
                  ...form,
                  age: e.target.value
                })
              }
            />

            {errors.age && (
              <p className="text-red-500 text-sm mt-1">
                {errors.age}
              </p>
            )}
          </div>

          {/* Gender */}
          <div>
            <select
              className="w-full p-3 border rounded-lg"
              value={form.gender}
              onChange={(e) =>
                setForm({
                  ...form,
                  gender: e.target.value
                })
              }
            >
              <option value="">Select Gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>

            {errors.gender && (
              <p className="text-red-500 text-sm mt-1">
                {errors.gender}
              </p>
            )}
          </div>

          {/* Date */}
          <div>
            <input
              type="date"
              min={today}
              className="w-full p-3 border rounded-lg"
              value={form.date}
              onChange={(e) =>
                setForm({
                  ...form,
                  date: e.target.value
                })
              }
            />

            {errors.date && (
              <p className="text-red-500 text-sm mt-1">
                {errors.date}
              </p>
            )}
          </div>

        </div>

        {/* Time Slots */}
        <div className="mt-5">
          <p className="mb-2 font-medium">
            Select Time Slot
          </p>

          <div className="grid grid-cols-3 gap-2">
            {timeSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                disabled={loading}
                onClick={() =>
                  setForm({
                    ...form,
                    time: slot
                  })
                }
                className={`p-2 rounded-lg border transition ${
                  form.time === slot
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>

          {errors.time && (
            <p className="text-red-500 text-sm mt-2">
              {errors.time}
            </p>
          )}
        </div>

        {/* Appointment Fee */}
        <div className="mt-5 flex justify-between items-center bg-blue-50 p-4 rounded-lg">
          <span className="font-medium text-gray-700">
            Appointment Fee
          </span>

          <span className="text-xl font-bold text-blue-600">
            ₹500
          </span>
        </div>

        {/* Payment Button */}
        <button
          onClick={submit}
          disabled={loading}
          className="w-full mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition disabled:opacity-60"
        >
          {loading ? "Processing..." : "Pay ₹500 & Book Appointment"}
        </button>

      </div>
    </div>
  );
}
