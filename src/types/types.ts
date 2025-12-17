import { Request } from "express";
import { Database } from "sqlite";
import sqlite3 from "sqlite3";

export interface User {
  id: number;
  username: string;
  password: string;
  balance: number;
}

export interface PortfolioAsset {
  id: number;
  user_id: number;
  asset_symbol: string;
  amount: number;
}

export interface Order {
  id: number;
  user_id: number;
  asset_symbol: string;
  order_type: "buy" | "sell";
  amount: number;
  price_at_transaction: number;
  timestamp: Date;
}

export interface JWTPayload {
  id: number;
  username: string;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export interface PriceMap {
  [symbol: string]: number;
}

export interface PairMap {
  [binanceSymbol: string]: string;
}

export type PriceUpdateCallback = (symbol: string, price: number) => void;

export type DB = Database<sqlite3.Database, sqlite3.Statement>;
