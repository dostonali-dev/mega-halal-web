import type { Metadata } from "next";
import EdgeSwipeBack from "@/components/EdgeSwipeBack";

export const metadata: Metadata = {
  title: "Mega Halal Admin",
  manifest: "/admin-manifest.json",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <EdgeSwipeBack />
      {children}
    </>
  );
}