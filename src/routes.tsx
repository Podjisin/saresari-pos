import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const HomePage = lazy(() => import("@/pages/home"));
const InventoryPage = lazy(() => import("@/pages/inventory"));

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/inventory",
    element: <InventoryPage />,
  },
];
