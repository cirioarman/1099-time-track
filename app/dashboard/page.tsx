
import Shell from "@/components/Shell";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { entryScope } from "@/lib/access";
import Link from "next/link";
import { redirect } from "next/navigation";

// Render the dashboard at request time.
export const dynamic = "force-dynamic";

export default async function Page() {
  // Get the authenticated user.
  const user = await currentUser();

  // Redirect visitors who are not logged in.
  if (!user) {
    redirect("/login");
  }

  // Retrieve only entries the user is authorized to see.
  const entries = await db.timeEntry.findMany({
    where: entryScope(user),
  });

  // Calculate financial and time totals.
  const sum = (
    fn: (entry: (typeof entries)[number]) => number
  ) => entries.reduce((total, entry) => total + fn(entry), 0);

  const totalHours = sum((entry) =>
    Number(entry.billableHours)
  );

  const totalCost = sum(
    (entry) =>
      Number(entry.billableHours) *
      Number(entry.hourlyRate)
  );

  const totalBilling = sum(
    (entry) =>
      Number(entry.billableHours) *
      Number(entry.billingRate)
  );

  const pendingEntries = entries.filter(
    (entry) => entry.approvalStatus === "PENDING"
  ).length;

  const approvedEntries = entries.filter(
    (entry) => entry.approvalStatus === "APPROVED"
  ).length;

  const stats = [
    {
      label: "Time entries",
      value: entries.length,
    },
    {
      label: "Billable hours",
      value: totalHours.toFixed(2),
    },
    {
      label: "Pending review",
      value: pendingEntries,
    },
    {
      label: "Approved",
      value: approvedEntries,
    },
    {
      label: "Contractor cost",
      value: "$" + totalCost.toFixed(2),
    },
    {
      label: "School billing",
      value: "$" + totalBilling.toFixed(2),
    },
  ];

  return (
    <Shell>
      {/* Dashboard header */}
      <div className="hero">
        <div className="eyebrow">
          Operations overview
        </div>

        <h1>Welcome back, {user.displayName}</h1>

        <p className="muted">
          Your contractor time and financial activity
          at a glance.
        </p>
      </div>

      {/* Dashboard statistics */}
      <div className="grid">
        {stats.map((stat) => (
          <div className="card" key={stat.label}>
            <div className="eyebrow">
              {stat.label}
            </div>

            <div className="stat">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="section card">
        <h2>Quick actions</h2>

        <div
          className="row"
          style={{ justifyContent: "flex-start" }}
        >
          {user.role !== "SCHOOL" && (
            <Link className="btn" href="/time">
              Log work session
            </Link>
          )}

          <Link className="btn alt" href="/entries">
            Review entries
          </Link>

          <Link className="btn alt" href="/reports">
            View reports
          </Link>
        </div>
      </div>
    </Shell>
  );
}
