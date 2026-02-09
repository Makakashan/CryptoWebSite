import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { register } from "../store/slices/authSlice";
import { AvatarUpload } from "../components/ui/AvatarUpload";

const Register = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const [avatar, setAvatar] = useState<string | null>(null);

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
        register({
          username: values.username,
          password: values.password,
          avatar: avatar,
        }),
      ).then((result) => {
        if (result.meta.requestStatus === "fulfilled") {
          navigate("/login");
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
          {t("register")}
        </h2>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={formik.handleSubmit}>
          {/* Avatar Upload */}
          <div className="mb-6 flex justify-center">
            <AvatarUpload
              currentAvatar={avatar}
              username={formik.values.username || "User"}
              onAvatarChange={setAvatar}
            />
          </div>

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

          <div className="mb-6">
            <label
              htmlFor="confirmPassword"
              className="form-label font-semibold"
            >
              {t("confirmPassword")}
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder={t("confirmPasswordPlaceholder")}
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="input"
            />
            {formik.touched.confirmPassword &&
              formik.errors.confirmPassword && (
                <div className="form-error">
                  {formik.errors.confirmPassword}
                </div>
              )}
          </div>

          <button
            type="submit"
            className="btn-primary w-full mt-2 hover:enabled:-translate-y-0.5"
            disabled={isLoading || !formik.isValid}
          >
            {isLoading ? t("loading") : t("register")}
          </button>
        </form>

        <p className="text-center mt-5 text-text-secondary text-sm">
          {t("alreadyHaveAccount")}{" "}
          <a
            href="/login"
            className="text-blue no-underline font-semibold ml-1 hover:underline"
          >
            {t("login")}
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
