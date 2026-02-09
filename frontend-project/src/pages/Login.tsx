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
    <div className="min-h-screen flex items-center justify-center bg-bg-dark p-5">
      <div className="bg-bg-card p-10 rounded-xl w-full max-w-md shadow-2xl">
        <h1 className="text-center text-3xl mb-2 text-text-primary">
          MakakaTrade
        </h1>
        <h2 className="text-center text-text-secondary mb-8 text-lg font-normal">
          {t("login")}
        </h2>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={formik.handleSubmit}>
          <div className="mb-6">
            <label htmlFor="username" className="form-label font-semibold">
              {t("username")}
            </label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder={t("enterUsername")}
              value={formik.values.username}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="input"
            />
            {formik.touched.username && formik.errors.username && (
              <div className="form-error">{formik.errors.username}</div>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="form-label font-semibold">
              {t("password")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder={t("enterPassword")}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="input"
            />
            {formik.touched.password && formik.errors.password && (
              <div className="form-error">{formik.errors.password}</div>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary w-full mt-2 hover:enabled:-translate-y-0.5"
            disabled={isLoading || !formik.isValid}
          >
            {isLoading ? t("loading") : t("login")}
          </button>
        </form>

        <p className="text-center mt-5 text-text-secondary text-sm">
          {t("dontHaveAccount")}{" "}
          <a
            href="/register"
            className="text-blue no-underline font-semibold ml-1 hover:underline"
          >
            {t("registerHere")}
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
