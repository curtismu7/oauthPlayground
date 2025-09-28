import type React from "react";
import { FiAlertTriangle } from "react-icons/fi";

const cardStyle: React.CSSProperties = {
  background: "#fff7ed",
  border: "1px solid #fcd34d",
  borderRadius: "16px",
  padding: "24px 28px",
  marginBottom: "24px",
  boxShadow: "0 20px 40px rgba(15, 23, 42, 0.08)",
};

const headingStyle: React.CSSProperties = {
  margin: "0 0 12px 0",
  fontSize: "1.45rem",
  fontWeight: 700,
  color: "#0f172a",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gap: "20px",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
};

const blockStyle: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: "12px",
  padding: "18px",
  boxShadow: "0 12px 24px rgba(15, 23, 42, 0.06)",
};

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: "18px",
  color: "#334155",
  lineHeight: 1.6,
  fontSize: "0.96rem",
};

const securityStyle: React.CSSProperties = {
  marginTop: "24px",
  background: "#fefce8",
  border: "1px solid #facc15",
  borderRadius: "12px",
  padding: "18px",
  color: "#92400e",
};

const ImplicitSafetySummary: React.FC = () => (
  <section style={cardStyle}>
    <h2 style={headingStyle}>What is OIDC Implicit Flow?</h2>
    <div style={gridStyle}>
      <div style={blockStyle}>
        <h3 style={{ margin: "0 0 10px", fontSize: "1.1rem", color: "#111827" }}>
          How It Works
        </h3>
        <ul style={listStyle}>
          <li>Client redirects user to authorization server</li>
          <li>User authenticates and authorizes the application</li>
          <li>Authorization server redirects back with tokens in URL fragment</li>
          <li>Client extracts tokens directly from the URL</li>
          <li>No secure server-side token exchange required</li>
        </ul>
      </div>
      <div style={blockStyle}>
        <h3 style={{ margin: "0 0 10px", fontSize: "1.1rem", color: "#111827" }}>
          When to Use
        </h3>
        <ul style={listStyle}>
          <li><strong>Single Page Applications (SPAs)</strong> – React, Vue, Angular</li>
          <li><strong>Mobile Apps</strong> – Native iOS/Android applications</li>
          <li><strong>Desktop Apps</strong> – Electron, native desktop apps</li>
          <li><strong>Public Clients</strong> – Apps that can&apos;t securely store secrets</li>
          <li><strong>Legacy Systems</strong> – Older applications that can&apos;t support PKCE</li>
        </ul>
      </div>
    </div>

    <div style={securityStyle}>
      <h3 style={{ margin: "0 0 10px", display: "flex", alignItems: "center", gap: "8px" }}>
        <FiAlertTriangle aria-hidden="true" /> Security Considerations
      </h3>
      <p style={{ margin: "0 0 6px" }}>
        <strong>Deprecated:</strong> OAuth 2.0 Security Best Practices recommends against Implicit Flow for new applications.
      </p>
      <p style={{ margin: "0 0 6px" }}>
        <strong>Token Exposure:</strong> Tokens are exposed in the URL fragment, making them visible in browser history, server logs, and referrer headers.
      </p>
      <p style={{ margin: 0 }}>
        <strong>Modern Alternative:</strong> Use Authorization Code Flow with PKCE for better security.
      </p>
    </div>
  </section>
);

export default ImplicitSafetySummary;
