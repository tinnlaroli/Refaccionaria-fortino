import {
  LayoutDashboard,
  Package,
  LayoutGrid,
  Layers,
  History,
  Users,
  Receipt,
  Store,
  Truck,
  Inbox,
  Image,
  Tag,
  type LucideIcon,
} from "lucide-react";
import type { IconName } from "../dashboard/NavIcon.js";

const ICONS: Record<IconName, LucideIcon> = {
  home: LayoutDashboard,
  box: Package,
  grid: LayoutGrid,
  layers: Layers,
  history: History,
  users: Users,
  receipt: Receipt,
  pos: Store,
  truck: Truck,
  inbox: Inbox,
  image: Image,
  tag: Tag,
};

export function navIcon(name: IconName): LucideIcon {
  return ICONS[name] ?? LayoutDashboard;
}

/** @deprecated Use navIcon */
export const carbonNavIcon = navIcon;
