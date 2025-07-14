import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const Home = lazy(() => import("./pages/Home"));

const Inventory = lazy(() => import("./pages/inventory/Inventory"));
const Settings = lazy(() => import("./pages/settings/Settings"));

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/inventory",
    element: <Inventory />,
  },
  {
    path: "/settings",
    element: <Settings />,
  },
];
