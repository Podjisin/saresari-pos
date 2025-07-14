import { FiHome, FiSettings, FiBox } from "react-icons/fi";
import { IconType } from "react-icons";

export type NavItem = {
  name: string;
  icon: IconType;
  path: string;
};

export const navItems: NavItem[] = [
  { name: "Home", icon: FiHome, path: "/" },
  { name: "Inventory", icon: FiBox, path: "/inventory" },
  { name: "Settings", icon: FiSettings, path: "/settings" },
];
