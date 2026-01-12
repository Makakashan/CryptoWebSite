import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { placeOrder } from "../store/slices/ordersSlice";
import { fetchPortfolio } from "../store/slices/portfolioSlice";
import { formatPrice } from "../utils/formatPrice";

const AssetDetail = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [successMessage, setSuccessMessage] = useState("");

  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { assets } = useAppSelector((state) => state.assets);
  const { portfolio } = useAppSelector((state) => state.portfolio);
  const { isLoading: orderLoading, error: orderError } = useAppSelector(
    (state) => state.orders,
  );

  const asset = assets.find((a) => a.symbol === symbol);
  const portfolioAsset = portfolio?.assets.find(
    (a) => a.asset_symbol === symbol,
  );

  // Calculate values for validation
  const currentPrice = asset?.price || asset?.current_price || 0;
  const ownedAmount = portfolioAsset?.amount || 0;
  const balance = portfolio?.balance || user?.balance || 0;
  const maxBuyAmount = currentPrice > 0 ? balance / currentPrice : 0;
  const maxSellAmount = ownedAmount;

  console.log("Debug AssetDetail:", {
    portfolio,
    balance,
    currentPrice,
    maxBuyAmount,
    user,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    dispatch(fetchPortfolio()).then((result) => {
      console.log("Portfolio fetched:", result);
    });
  }, [isAuthenticated, dispatch, navigate]);

  const orderValidationSchema = useMemo(
    () =>
      Yup.object({
        orderType: Yup.string()
          .oneOf(["BUY", "SELL"], "Invalid order type")
          .required("Order type is required"),
        amount: Yup.number()
          .positive("Amount must be positive")
          .required("Amount is required")
          .test("max-amount", "Insufficient balance", function (value) {
            const { orderType } = this.parent;
            if (!value) return false;
            if (orderType === "BUY") {
              return value <= maxBuyAmount;
            }
            return value <= maxSellAmount;
          }),
      }),
    [maxBuyAmount, maxSellAmount],
  );

  const formik = useFormik({
    initialValues: {
      orderType: "BUY" as "BUY" | "SELL",
      amount: "" as string | number,
    },
    validationSchema: orderValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      if (!asset || !symbol) return;

      const result = await dispatch(
        placeOrder({
          asset_symbol: symbol,
          order_type: values.orderType,
          amount: Number(values.amount),
        }),
      );

      if (result.meta.requestStatus === "fulfilled") {
        setSuccessMessage(`${values.orderType} order placed successfully!`);
        resetForm();
        await dispatch(fetchPortfolio());
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    },
  });

  if (!asset) {
    return (
      <div className="asset-detail-page">
        <div className="error-container">
          <p>Asset not found</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/markets")}
          >
            Back to Markets
          </button>
        </div>
      </div>
    );
  }

  const shortName = asset.symbol.replace("USDT", "");
  const defaultIcon = `https://ui-avatars.com/api/?name=${shortName}&background=random&size=80`;
  const priceChange = asset.price_change_24h || 0;
  const ownedValue = ownedAmount * currentPrice;
  const canSell = ownedAmount > 0;

  return (
    <div className="asset-detail-page">
      <button className="btn back-btn" onClick={() => navigate("/markets")}>
        ← Back to Markets
      </button>

      <div className="asset-detail-header">
        <div className="asset-header-info">
          <img
            src={asset.image_url || defaultIcon}
            alt={shortName}
            onError={(e) => {
              e.currentTarget.src = defaultIcon;
            }}
          />
          <div>
            <h1>{shortName}</h1>
            <p className="asset-full-name">{asset.name || asset.symbol}</p>
            {asset.category && (
              <span className="category-badge">{asset.category}</span>
            )}
          </div>
        </div>

        <div className="asset-price-info">
          <div className="current-price">{formatPrice(currentPrice)}</div>
          <div
            className={`price-change ${priceChange > 0 ? "positive" : priceChange < 0 ? "negative" : ""}`}
          >
            {priceChange > 0 ? "+" : ""}
            {priceChange.toFixed(2)}%
          </div>
        </div>
      </div>

      {asset.description && (
        <div className="asset-description">
          <h2>About {shortName}</h2>
          <p>{asset.description}</p>
        </div>
      )}

      <div className="asset-detail-grid">
        <div className="asset-stats">
          <h2>Your Holdings</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Amount Owned</span>
              <span className="stat-value">{ownedAmount.toFixed(6)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Value</span>
              <span className="stat-value">{formatPrice(ownedValue)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Available Balance</span>
              <span className="stat-value">{formatPrice(balance)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Max Buy Amount</span>
              <span className="stat-value">
                {maxBuyAmount > 0 ? maxBuyAmount.toFixed(6) : "0.000000"}
              </span>
            </div>
          </div>
        </div>

        <div className="trading-panel">
          <h2>Trade {shortName}</h2>

          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}

          {orderError && <div className="error-message">{orderError}</div>}

          <form onSubmit={formik.handleSubmit}>
            <div className="order-type-selector">
              <button
                type="button"
                className={`type-btn ${formik.values.orderType === "BUY" ? "active buy" : ""}`}
                onClick={() => {
                  formik.setFieldValue("orderType", "BUY");
                  formik.setFieldValue("amount", "");
                }}
              >
                Buy
              </button>
              <button
                type="button"
                className={`type-btn ${formik.values.orderType === "SELL" ? "active sell" : ""}`}
                onClick={() => {
                  formik.setFieldValue("orderType", "SELL");
                  formik.setFieldValue("amount", "");
                }}
                disabled={!canSell}
              >
                Sell
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="amount">Amount</label>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.000001"
                min="0"
                placeholder="Enter amount"
                value={formik.values.amount}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.amount && formik.errors.amount && (
                <div className="field-error">{formik.errors.amount}</div>
              )}
              <div className="amount-helper">
                {formik.values.orderType === "BUY" ? (
                  <span>Max: {maxBuyAmount.toFixed(6)}</span>
                ) : (
                  <span>Available: {ownedAmount.toFixed(6)}</span>
                )}
              </div>
            </div>

            {formik.values.amount && Number(formik.values.amount) > 0 && (
              <div className="order-summary">
                <div className="summary-row">
                  <span>Amount:</span>
                  <span>
                    {Number(formik.values.amount).toFixed(6)} {shortName}
                  </span>
                </div>
                <div className="summary-row">
                  <span>Price:</span>
                  <span>{formatPrice(currentPrice)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>
                    {formatPrice(Number(formik.values.amount) * currentPrice)}
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              className={`btn btn-primary ${formik.values.orderType === "BUY" ? "btn-buy" : "btn-sell"}`}
              disabled={
                orderLoading || !formik.isValid || !formik.values.amount
              }
            >
              {orderLoading
                ? "Processing..."
                : `${formik.values.orderType} ${shortName}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssetDetail;
