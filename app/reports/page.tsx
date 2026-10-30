
import Shell from "@/components/Shell";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { entryScope } from "@/lib/access";
import { redirect } from "next/navigation";

// Prevent Next.js from prerendering this authenticated page.
export const dynamic = "force-dynamic";

type SchoolReport = {
  hours: number;
  cost: number;
  billing: number;
  count: number;
};

export default async function Page() {
  // Retrieve the authenticated user.
  const user = await currentUser();

  // Redirect unauthenticated visitors to login.
  if (!user) {
    redirect("/login");
  }

  // Retrieve only entries the user is authorized to view.
  const rows = await db.timeEntry.findMany({
    where: entryScope(user),
  });

  // Group financial information by school or district.
  const groups = new Map<string, SchoolReport>();

  for (const entry of rows) {
    const group = groups.get(entry.schoolOrDistrict) || {
      hours: 0,
      cost: 0,
      billing: 0,
      count: 0,
    };

    const hours = Number(entry.billableHours);
    const hourlyRate = Number(entry.hourlyRate);
    const billingRate = Number(entry.billingRate);
    const mileage = Number(entry.mileageReimbursement);

    group.hours += hours;
    group.cost += hours * hourlyRate + mileage;
    group.billing += hours * billingRate;
    group.count += 1;

    groups.set(entry.schoolOrDistrict, group);
  }

  // Calculate overall statistics.
  const totalHours = rows.reduce(
    (total, entry) => total + Number(entry.billableHours),
    0
  );

  const stats = [
    {
      label: "Total entries",
      value: rows.length,
    },
    {
      label: "Total hours",
      value: totalHours.toFixed(2),
    },
    {
      label: "Schools",
      value: groups.size,
    },
  ];

  return (
    <Shell>
      {/* Page header */}
      <div className="hero">
        <div className="eyebrow">
          Financial intelligence
        </div>

        <h1>School-level reporting</h1>

        <p className="muted">
          Time-derived cost and billing before discounts
          and contract allocations.
        </p>
      </div>

      {/* Overall statistics */}
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

      {/* School-level financial report */}
      <div className="section card tablewrap">
        <table className="table">
          <thead>
            <tr>
              <th>School</th>
              <th>Entries</th>
              <th>Hours</th>
              <th>Contractor cost + mileage</th>
              <th>Gross billing</th>
              <th>Gross difference</th>
            </tr>
          </thead>

          <tbody>
            {[...groups.entries()].map(([name, group]) => {
              const difference =
                group.billing - group.cost;

              return (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{group.count}</td>
                  <td>{group.hours.toFixed(2)}</td>
                  <td>${group.cost.toFixed(2)}</td>
                  <td>${group.billing.toFixed(2)}</td>
                  <td>${difference.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {groups.size === 0 && (
          <p className="muted">
            No financial data available.
          </p>
        )}
      </div>
    </Shell>
  );
}

