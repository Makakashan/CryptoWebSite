import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { register } from "../store/slices/authSlice";

const Register = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const validationSchema = Yup.object({
    username: Yup.string()
      .min(3, t("usernameMin"))
      .max(20, t("usernameMax"))
      .required(t("usernameRequired")),
    password: Yup.string()
      .min(6, t("passwordMin"))
      .required(t("passwordRequired")),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], t("passwordsMustMatch"))
      .required(t("pleaseConfirmPassword")),
  });

  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema,
    onSubmit: (values) => {
      dispatch(
        register({ username: values.username, password: values.password }),
      ).then((result) => {
        if (result.meta.requestStatus === "fulfilled") {
          navigate("/login");
        }
      });
    },
  });

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>MakakaTrade</h1>
        <h2>{t("register")}</h2>

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

          <div className="form-group">
            <label htmlFor="confirmPassword">{t("confirmPassword")}</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder={t("confirmPasswordPlaceholder")}
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.confirmPassword &&
              formik.errors.confirmPassword && (
                <div className="field-error">
                  {formik.errors.confirmPassword}
                </div>
              )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !formik.isValid}
          >
            {isLoading ? t("loading") : t("register")}
          </button>
        </form>

        <p className="auth-link">
          {t("alreadyHaveAccount")} <a href="/login">{t("login")}</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
