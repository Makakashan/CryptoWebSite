import { useState, type FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { login, clearError } from "../store/slices/authSlice";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(login({ username, password }));
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>MakakaTrade</h1>
        <h2>Welcome Back</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !username || !password}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-muted">
          Don't have an account?{" "}
          <button
            type="button"
            className="link-button"
            onClick={() => navigate("/register")}
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
