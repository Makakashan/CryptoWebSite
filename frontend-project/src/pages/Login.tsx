import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { login } from "../store/slices/authSlice";

const Login = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const validationSchema = Yup.object({
    username: Yup.string()
      .min(3, t("usernameMin"))
      .required(t("usernameRequired")),
    password: Yup.string()
      .min(6, t("passwordMin"))
      .required(t("passwordRequired")),
  });

  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    validationSchema,
    onSubmit: (values) => {
      dispatch(login(values)).then((result) => {
        if (result.meta.requestStatus === "fulfilled") {
          navigate("/");
        }
      });
    },
  });

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>MakakaTrade</h1>
        <h2>{t("login")}</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={formik.handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">{t("username")}</label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder={t("enterUsername")}
              value={formik.values.username}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.username && formik.errors.username && (
              <div className="field-error">{formik.errors.username}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">{t("password")}</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder={t("enterPassword")}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.password && formik.errors.password && (
              <div className="field-error">{formik.errors.password}</div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !formik.isValid}
          >
            {isLoading ? t("loading") : t("login")}
          </button>
        </form>

        <p className="auth-link">
          {t("dontHaveAccount")} <a href="/register">{t("registerHere")}</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
