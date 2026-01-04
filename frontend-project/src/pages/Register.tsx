import { useState, type FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { register, clearError } from "../store/slices/authSlice";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState("");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useAppSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const validateForm = (): boolean => {
    setValidationError("");

    if (username.length < 3) {
      setValidationError("Username must be at least 3 characters");
      return false;
    }

    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters");
      return false;
    }

    if (password !== confirmPassword) {
      setValidationError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    dispatch(clearError());

    if (validateForm()) {
      dispatch(register({ username, password }));
    }
  };

  const displayError = validationError || error;
  const isFormValid =
    username.length >= 3 &&
    password.length >= 6 &&
    password === confirmPassword;

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>MakakaTrade</h1>
        <h2>Create Account</h2>

        {displayError && <div className="error-message">{displayError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Choose a username (min 3 characters)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
              minLength={3}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Choose a password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="text-muted">
          Already have an account?{" "}
          <button
            type="button"
            className="link-button"
            onClick={() => navigate("/login")}
          >
            Login here
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;
