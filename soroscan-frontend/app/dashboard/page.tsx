import { EventExplorerDashboard } from "./components/EventExplorerDashboard";

export const metadata = {
  title: "Event Explorer | SoroScan",
  description: "Browse, filter, and analyze indexed contract events.",
};

export default function DashboardPage() {
  return <EventExplorerDashboard />;
}
