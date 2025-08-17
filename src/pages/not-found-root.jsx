import React from "react";
import { useNavigate } from "react-router-dom";

export default function NotFoundRoot() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#f8fafc" }}>
      <h1 style={{ fontSize: "3rem", fontWeight: "bold", color: "#1e293b", marginBottom: "1rem" }}>404 - Page Not Found</h1>
      <p style={{ color: "#64748b", marginBottom: "2rem", fontSize: "1.25rem" }}>
        The page you are looking for does not exist or an error occurred.
      </p>
      <button
        style={{
          padding: "0.75rem 2rem",
          fontSize: "1rem",
          background: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "0.5rem",
          cursor: "pointer",
          fontWeight: "bold"
        }}
        onClick={() => navigate("/")}
      >
        Back to Homepage
      </button>
    </div>
  );
}
