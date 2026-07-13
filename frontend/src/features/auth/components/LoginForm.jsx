import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { loginUser } from "../api/auth.api";
import useAuth from "../hooks/useAuth";

function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = await loginUser(formData);

      login(data);

      navigate("/dashboard", { replace: true });
      
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Login Failed");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md"
    >
      <h2 className="text-3xl font-bold text-center mb-6">Login</h2>

      <div className="mb-4">
        <label className="block mb-2 font-medium">Email</label>

        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full border rounded-lg p-3"
          placeholder="Enter Email"
          required
        />
      </div>

      <div className="mb-6">
        <label className="block mb-2 font-medium">Password</label>

        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="w-full border rounded-lg p-3"
          placeholder="Enter Password"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
      >
        Login
      </button>
    </form>
  );
}

export default LoginForm;
