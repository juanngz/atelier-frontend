/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image: string;
  description?: string;
}

export interface Order {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  status: 'SHIPPED' | 'PROCESSING' | 'CANCELLED';
  customer: string;
  amount: number;
  date: string;
}

export interface Transaction {
  id: string;
  productName: string;
  productImage: string;
  customer: string;
  amount: number;
  status: 'PAID' | 'REFUNDED' | 'PENDING';
  date: string;
}

export interface DailyMetric {
  day: string;
  revenue: number;
}
