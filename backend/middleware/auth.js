const register = async (e) => {
  e.preventDefault();

  if (!validate()) return;

  try {
    const res = await fetch(`${API}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || data.msg || "Registration failed");
      return;
    }

    alert(
      data.message ||
      data.msg ||
      "Registration successful! Please log in."
    );

    navigate("/login");

  } catch (error) {
    console.error("Registration error:", error);
    alert("Unable to connect to the server. Please try again.");
  }
};