
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import Logout from "./Logout";

export default async function Shell({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <header className="top">
        <div className="topin">
          <Link className="brand" href="/dashboard">
            ◈ 1099 Time Track
          </Link>

          <nav className="nav">
            <Link href="/dashboard">Overview</Link>

            {user.role !== "SCHOOL" && (
              <Link href="/time">Log time</Link>
            )}

            <Link href="/entries">Entries</Link>

            <Link href="/reports">Reports</Link>

            {user.role === "ADMIN" && (
              <Link href="/admin">Administration</Link>
            )}

            <Link href="/account">Account Settings</Link>
          </nav>

          <div className="row">
            <small style={{ color: "#c7d4e8" }}>
              {user.displayName} · {user.role.toLowerCase()}
            </small>
            <Logout />
          </div>
        </div>
      </header>

      <main className="shell">{children}</main>
    </>
  );
}
