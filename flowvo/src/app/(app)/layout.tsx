import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  const user = {
    email: session.user.email,
    name: session.user.name,
    business: session.user.business
      ? {
          name: session.user.business.name,
          slug: session.user.business.slug,
        }
      : null,
  };

  return <AppShell user={user}>{children}</AppShell>;
}
