"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import BrandPanel from "./BrandPanel";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";

export default function AuthShell() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const toggleAuthMode = () => {
    setError(null);
    setSuccessMsg(null);
    setIsSignUp((prev) => !prev);
  };

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSignIn = async (email: string, pass: string) => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await api.login(email, pass);
      if (res.token) {
        const derivedName = email
          .split("@")[0]
          .replace(/[._-]/g, " ")
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        localStorage.setItem("ps26034_auth_token", res.token);
        localStorage.setItem("ps26034_user_email", email);
        localStorage.setItem("ps26034_user_name", derivedName);
        localStorage.setItem(
          "ps26034_user_role",
          email.includes("inspector") ? "Inspector" : "Supervisor"
        );

        setSuccessMsg("Authentication Successful! Redirecting to Dashboard...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 800);
      } else {
        setError("Invalid credentials received from server.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (fullName: string, email: string, pass: string) => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const token = `demo_officer_token_${Date.now()}`;
      localStorage.setItem("ps26034_auth_token", token);
      localStorage.setItem("ps26034_user_email", email);
      localStorage.setItem("ps26034_user_name", fullName);
      localStorage.setItem("ps26034_user_role", "Supervisor");

      setSuccessMsg("Account Provisioned Successfully! Redirecting to Workspace...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 900);
    } catch (err: any) {
      setError("Could not provision workspace account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .auth-container {
          position: relative;
          width: 100%;
          max-width: 1000px;
          min-height: 660px;
          background: #080912;
          border-radius: 24px;
          border: 1px solid rgba(39, 39, 42, 0.8);
          box-shadow: 0 35px 90px rgba(0, 0, 0, 0.95);
          overflow: hidden;
        }

        /* ── Physical Moving Curved Circular Curtain (:before) ── */
        .auth-container:before {
          content: "";
          position: absolute;
          height: 2500px;
          width: 2500px;
          top: -10%;
          right: 50%;
          transform: translateY(-50%);
          background: linear-gradient(-45deg, #0d0f22 0%, #161936 50%, #0d0f22 100%);
          transition: 1.8s ease-in-out;
          border-radius: 50%;
          z-index: 6;
          border: 1px solid rgba(245, 158, 11, 0.35);
          box-shadow: 0 0 50px rgba(245, 158, 11, 0.25);
        }

        .auth-container.sign-up-mode:before {
          transform: translate(100%, -50%);
          right: 56%;
          top: -10%;
          background: linear-gradient(-45deg, #0c1224 0%, #131c38 50%, #0c1224 100%);
          border: 1px solid rgba(6, 182, 212, 0.35);
          box-shadow: 0 0 50px rgba(6, 182, 212, 0.25);
        }

        /* Prevent browser autofill white box artifact */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: #ffffff !important;
          transition: background-color 5000s ease-in-out 0s;
          box-shadow: inset 0 0 20px 20px #0c0d18 !important;
        }

        .forms-container {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          z-index: 5;
        }

        .signin-signup {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          left: 75%;
          width: 50%;
          transition: 1s 0.7s ease-in-out;
          display: grid;
          grid-template-columns: 1fr;
          z-index: 5;
        }

        .auth-container.sign-up-mode .signin-signup {
          left: 25%;
        }

        .auth-form-step {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 2rem 3rem;
          transition: opacity 0.5s 0.7s, transform 0.5s 0.7s;
          overflow: hidden;
          grid-column: 1 / 2;
          grid-row: 1 / 2;
        }

        .sign-in-form-wrapper {
          z-index: 2;
          opacity: 1;
        }

        .sign-up-form-wrapper {
          opacity: 0;
          z-index: 1;
          pointer-events: none;
        }

        .auth-container.sign-up-mode .sign-in-form-wrapper {
          opacity: 0;
          z-index: 1;
          pointer-events: none;
        }

        .auth-container.sign-up-mode .sign-up-form-wrapper {
          opacity: 1;
          z-index: 2;
          pointer-events: all;
        }

        .panels-container {
          position: absolute;
          height: 100%;
          width: 100%;
          top: 0;
          left: 0;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          z-index: 6;
          pointer-events: none;
        }

        .panel {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: left;
          z-index: 6;
          padding: 2.2rem 5%;
        }

        .left-panel {
          pointer-events: all;
        }

        .right-panel {
          pointer-events: none;
        }

        .panel .content {
          color: #fff;
          transition: transform 0.9s ease-in-out;
          transition-delay: 0.6s;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .left-panel .content {
          transform: translateX(0%);
        }

        .right-panel .content {
          transform: translateX(800px);
        }

        .auth-container.sign-up-mode .left-panel .content {
          transform: translateX(-800px);
        }

        .auth-container.sign-up-mode .right-panel .content {
          transform: translateX(0%);
        }

        .auth-container.sign-up-mode .left-panel {
          pointer-events: none;
        }

        .auth-container.sign-up-mode .right-panel {
          pointer-events: all;
        }

        @media (max-width: 870px) {
          .auth-container {
            min-height: 820px;
            height: 100%;
          }
          .signin-signup {
            width: 100%;
            top: 95%;
            transform: translate(-50%, -100%);
            transition: 1s 0.8s ease-in-out;
          }
          .signin-signup,
          .auth-container.sign-up-mode .signin-signup {
            left: 50%;
          }
          .panels-container {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr 2fr 1fr;
          }
          .panel {
            flex-direction: row;
            justify-content: space-around;
            align-items: center;
            padding: 2rem 8%;
            grid-column: 1 / 2;
          }
          .right-panel {
            grid-row: 3 / 4;
          }
          .left-panel {
            grid-row: 1 / 2;
          }
          .panel .content {
            transition: transform 0.9s ease-in-out;
            transition-delay: 0.8s;
          }
          .auth-container:before {
            width: 1500px;
            height: 1500px;
            transform: translateX(-50%);
            left: 30%;
            bottom: 68%;
            right: initial;
            top: initial;
            transition: 1.8s ease-in-out;
          }
          .auth-container.sign-up-mode:before {
            transform: translate(-50%, 100%);
            bottom: 32%;
            right: initial;
          }
          .auth-container.sign-up-mode .left-panel .content {
            transform: translateY(-300px);
          }
          .auth-container.sign-up-mode .right-panel .content {
            transform: translateY(0px);
          }
          .right-panel .content {
            transform: translateY(300px);
          }
          .auth-container.sign-up-mode .signin-signup {
            top: 5%;
            transform: translate(-50%, 0);
          }
        }
      `}</style>

      <div className={`auth-container my-auto ${isSignUp ? "sign-up-mode" : ""}`}>
        <div className="forms-container">
          <div className="signin-signup">
            {/* Sign In Form */}
            <div className="auth-form-step sign-in-form-wrapper">
              <SignInForm
                onSignIn={handleSignIn}
                loading={loading}
                error={error}
                successMsg={successMsg}
                onSwitchToSignUp={toggleAuthMode}
              />
            </div>

            {/* Sign Up Form */}
            <div className="auth-form-step sign-up-form-wrapper">
              <SignUpForm
                onSignUp={handleSignUp}
                loading={loading}
                error={error}
                successMsg={successMsg}
                onSwitchToSignIn={toggleAuthMode}
              />
            </div>
          </div>
        </div>

        <div className="panels-container">
          {/* Left Panel (Active in Sign In mode) */}
          <div className="panel left-panel">
            <div className="content">
              <BrandPanel mode="signin" onToggleMode={toggleAuthMode} />
            </div>
          </div>

          {/* Right Panel (Active in Sign Up mode) */}
          <div className="panel right-panel">
            <div className="content">
              <BrandPanel mode="signup" onToggleMode={toggleAuthMode} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}




