import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "KDMP Inventory",
  version: packageJson.version,
  copyright: `© ${currentYear}, KDMP Inventory.`,
  meta: {
    title: "KDMP Inventory",
    description:
      "KDMP Inventory is an inventory management dashboard for products, suppliers, approvals, and stock transactions.",
  },
};
