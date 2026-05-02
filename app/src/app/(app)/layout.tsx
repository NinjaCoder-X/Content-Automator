import { redirect } from "next/navigation";
import { getCurrentUser, toSafeUser } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  const safe = toSafeUser(u);
  return (
    <div className="min-h-screen flex w-full">
      <Sidebar
        user={{ name: safe.name, email: safe.email, plan: safe.plan }}
      />
      <main className="flex-1 min-w-0">
        <div className="p-6 lg:p-10 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
