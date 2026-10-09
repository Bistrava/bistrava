export type AdminOverview = {
  products: number; publishedProducts: number; stockUnits: number; lowStockCount: number;
  openOrders: number; orders30: number; revenue30: number; customers: number; promotions: number;
  recentOrders: Array<{ id: string; reference: string; status: string; total_cents: number; created_at: string }>;
  lowStock: Array<{ slug: string; name: string; sku: string; stock_quantity: number }>;
  monthlySales: Array<{ month: string; cents: number }>;
};
