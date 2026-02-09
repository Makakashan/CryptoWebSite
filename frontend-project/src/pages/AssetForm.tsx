import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  createAsset,
  updateAsset,
  fetchAssets,
} from "../store/slices/assetsSlice";
import type { CreateAssetDto } from "../store/types";

const AssetForm = () => {
  const { t } = useTranslation();
  const { symbol } = useParams<{ symbol?: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [successMessage, setSuccessMessage] = useState("");

  const { assets, isLoading, error } = useAppSelector((state) => state.assets);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const isEditMode = !!symbol;
  const existingAsset = assets.find((a) => a.symbol === symbol);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (assets.length === 0) {
      dispatch(fetchAssets());
    }
  }, [isAuthenticated, navigate, dispatch, assets.length]);

  const assetValidationSchema = Yup.object({
    symbol: Yup.string()
      .required(t("symbolRequired"))
      .matches(/^[A-Z]+USDT$/, t("symbolFormat"))
      .max(20, "Symbol must be less than 20 characters"),
    name: Yup.string()
      .required(t("nameRequired"))
      .max(100, "Name must be less than 100 characters"),
    image_url: Yup.string().url("Must be a valid URL").nullable().notRequired(),
    category: Yup.string().max(50, "Category must be less than 50 characters"),
    description: Yup.string()
      .max(1000, "Description must be less than 1000 characters")
      .nullable()
      .notRequired(),
    is_active: Yup.boolean(),
  });

  const formik = useFormik<CreateAssetDto>({
    initialValues: {
      symbol: existingAsset?.symbol || "",
      name: existingAsset?.name || "",
      image_url: existingAsset?.image_url || "",
      category: existingAsset?.category || "other",
      description: existingAsset?.description || "",
      is_active: existingAsset?.is_active ?? true,
    },
    validationSchema: assetValidationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        if (isEditMode && symbol) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { symbol: _, ...updateData } = values;
          const result = await dispatch(
            updateAsset({ symbol, data: updateData }),
          );

          if (result.meta.requestStatus === "fulfilled") {
            setSuccessMessage(t("assetUpdatedSuccessfully"));
            setTimeout(() => {
              navigate(`/markets/${symbol}`);
            }, 1500);
          }
        } else {
          const result = await dispatch(createAsset(values));

          if (result.meta.requestStatus === "fulfilled") {
            setSuccessMessage(t("assetCreatedSuccessfully"));
            setTimeout(() => {
              navigate("/markets");
            }, 1500);
          }
        }
      } catch (err) {
        console.error("Error saving asset:", err);
      }
    },
  });

  const categories = [
    "Layer 1",
    "DeFi",
    "Smart Contract Platform",
    "Exchange Token",
    "Meme",
    "Gaming",
    "other",
  ];

  return (
    <div>
      <button
        className="btn-secondary btn-small mb-6"
        onClick={() => navigate("/markets")}
      >
        ← {t("back")}
      </button>

      <div className="max-w-2xl mx-auto card p-8">
        <h1 className="text-2xl font-bold text-text-primary mb-6">
          {isEditMode ? t("editAsset") : t("addNewAsset")}
        </h1>

        {successMessage && (
          <div className="alert-success">{successMessage}</div>
        )}

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={formik.handleSubmit}>
          <div className="mb-6">
            <label
              htmlFor="symbol"
              className="block mb-2 text-text-primary font-semibold text-sm"
            >
              {t("assetSymbol")} <span className="text-red">*</span>
            </label>
            <input
              id="symbol"
              name="symbol"
              type="text"
              placeholder="e.g., BTCUSDT"
              value={formik.values.symbol}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              disabled={isEditMode}
              className="input-disabled"
            />
            {formik.touched.symbol && formik.errors.symbol && (
              <div className="text-red text-xs mt-1">
                {formik.errors.symbol}
              </div>
            )}
          </div>

          <div className="mb-6">
            <label
              htmlFor="name"
              className="block mb-2 text-text-primary font-semibold text-sm"
            >
              {t("assetName")} <span className="text-red">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="e.g., Bitcoin"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="input"
            />
            {formik.touched.symbol && formik.errors.symbol && (
              <div className="form-error">{formik.errors.symbol}</div>
            )}
          </div>

          <div className="mb-6">
            <label
              htmlFor="category"
              className="block mb-2 text-text-primary font-semibold text-sm"
            >
              {t("category")}
            </label>
            <select
              id="category"
              name="category"
              value={formik.values.category}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="select"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {formik.touched.category && formik.errors.category && (
              <div className="text-red text-xs mt-1">
                {formik.errors.category}
              </div>
            )}
          </div>

          <div className="mb-6">
            <label
              htmlFor="image_url"
              className="block mb-2 text-text-primary font-semibold text-sm"
            >
              {t("imageUrl")}
            </label>
            <input
              id="image_url"
              name="image_url"
              type="text"
              placeholder="https://example.com/image.png"
              value={formik.values.image_url || ""}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="input"
            />
            {formik.touched.image_url && formik.errors.image_url && (
              <div className="text-red text-xs mt-1">
                {formik.errors.image_url}
              </div>
            )}
          </div>

          <div className="mb-6">
            <label
              htmlFor="description"
              className="block mb-2 text-text-primary font-semibold text-sm"
            >
              {t("description")}
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder={t("description")}
              value={formik.values.description || ""}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="textarea"
            />
            {formik.touched.description && formik.errors.description && (
              <div className="text-red text-xs mt-1">
                {formik.errors.description}
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={formik.values.is_active}
                onChange={formik.handleChange}
                className="checkbox"
              />
              <span className="text-text-primary font-medium text-sm">
                {t("isActive")}
              </span>
            </label>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              className="btn-outline"
              onClick={() => navigate("/markets")}
              disabled={isLoading}
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading || !formik.isValid || !formik.dirty}
            >
              {isLoading
                ? t("loading")
                : isEditMode
                  ? t("updateAsset")
                  : t("createAsset")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetForm;
