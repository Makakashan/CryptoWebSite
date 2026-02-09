import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { login } from "../store/slices/authSlice";
import Button from "@/components/ui/button";
import Card, {
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Input from "@/components/ui/input";
import Label from "@/components/ui/label";

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
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("loginToYourAccount")}</CardTitle>
          <CardDescription>
            {t("enterYourEmailBelowToLoginToYourAccount")}
          </CardDescription>
          <CardAction>
            <Button variant="link" onClick={() => navigate("/register")}>
              {t("signUp")}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {error && <div className="alert-error mb-4">{error}</div>}

          <form onSubmit={formik.handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="username">{t("username")}</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder={t("enterUsername")}
                  value={formik.values.username}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.username && formik.errors.username && (
                  <div className="form-error">{formik.errors.username}</div>
                )}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">{t("password")}</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm text-text-secondary underline-offset-4 hover:underline"
                  >
                    {t("forgotYourPassword")}
                  </a>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.password && formik.errors.password && (
                  <div className="form-error">{formik.errors.password}</div>
                )}
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !formik.isValid}
            onClick={() => formik.handleSubmit()}
          >
            {isLoading ? t("loading") : t("login")}
          </Button>
          <Button variant="outline" className="w-full">
            {t("loginWithGoogle")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
