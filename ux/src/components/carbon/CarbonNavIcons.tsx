import {
  Dashboard,
  Product,
  Category,
  InventoryManagement,
  RecentlyViewed,
  UserMultiple,
  Receipt,
  Store,
} from "@carbon/icons-react";
import type { IconName } from "../dashboard/NavIcon.js";

const ICONS = {
  home: Dashboard,
  box: Product,
  grid: Category,
  layers: InventoryManagement,
  history: RecentlyViewed,
  users: UserMultiple,
  receipt: Receipt,
  pos: Store,
} as const;

export function carbonNavIcon(name: IconName) {
  const Icon = ICONS[name as keyof typeof ICONS];
  return Icon ?? Dashboard;
}
