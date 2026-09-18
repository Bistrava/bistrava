export type AnalyticsEventName =
  | "view_item_list"
  | "select_item"
  | "view_item"
  | "add_to_cart"
  | "view_cart"
  | "begin_checkout"
  | "purchase"
  | "search"
  | "generate_lead"
  | "configurator_start"
  | "configurator_complete"
  | "request_quote"
  | "installation_request"
  | "contact_submit";

export type AnalyticsItem = {
  itemId: string;
  itemName: string;
  itemCategory?: string;
  priceCents?: number;
  quantity?: number;
};

export type AnalyticsEvent = {
  name: AnalyticsEventName;
  eventId: string;
  timestamp: string;
  consent: "granted" | "denied" | "unknown";
  currency?: "EUR";
  valueCents?: number;
  searchTerm?: string;
  items?: AnalyticsItem[];
};

export interface AnalyticsAdapter {
  track(event: AnalyticsEvent): void | Promise<void>;
}
