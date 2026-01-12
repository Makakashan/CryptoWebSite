// Orders Domain Types

export interface Order {
  id: number;
  user_id: number;
  asset_symbol: string;
  order_type: "BUY" | "SELL";
  amount: number;
  price_at_transaction: number;
  timestamp: string;
}

export interface PlaceOrderRequest {
  asset_symbol: string;
  order_type: "BUY" | "SELL";
  amount: number;
}

export interface OrdersState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
}
