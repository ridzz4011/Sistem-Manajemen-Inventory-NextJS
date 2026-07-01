import {
  Banknote,
  Boxes,
  Check,
  LayoutDashboard,
  type LucideIcon,
  ReceiptText,
  Store,
} from "lucide-react";

export type NavBadge = "new" | "soon";

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Menu",
    items: [
      {
        id: "default",
        title: "Dasbor",
        url: "/dashboard/default",
        icon: LayoutDashboard,
      },
      {
        id: "finance",
        title: "Keuangan",
        url: "/dashboard/finance",
        icon: Banknote,
      },
      {
        id: "products",
        title: "Produk",
        url: "/dashboard/products",
        icon: Boxes,
      },
      {
        id: "approvals",
        title: "Persetujuan",
        url: "/dashboard/approvals",
        icon: Check,
      },
      {
        id: "suppliers",
        title: "Supplier",
        url: "/dashboard/suppliers",
        icon: Store,
      },
      {
        id: "invoice",
        title: "Faktur",
        url: "/dashboard/invoice",
        icon: ReceiptText,
      },
    ],
  },
  // {
  //   id: 3,
  //   label: "Legacy",
  //   items: [
  //     {
  //       id: "legacy-dashboards",
  //       title: "Dashboards",
  //       subItems: [
  //         { id: "legacy-default", title: "Default V1", url: "/dashboard/default-v1" },
  //         { id: "legacy-crm", title: "CRM V1", url: "/dashboard/crm-v1" },
  //         { id: "legacy-finance", title: "Finance V1", url: "/dashboard/finance-v1" },
  //         { id: "legacy-analytics", title: "Analytics V1", url: "/dashboard/analytics-v1" },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   id: 4,
  //   label: "Misc",
  //   items: [
  //     {
  //       id: "others",
  //       title: "Others",
  //       url: "/dashboard/coming-soon",
  //       icon: SquareArrowUpRight,
  //       badge: "soon",
  //       disabled: true,
  //     },
  //   ],
  // },
];
