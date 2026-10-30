
import Shell from "@/components/Shell";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { entryScope } from "@/lib/access";
import EntryActions from "@/components/EntryActions";
import { redirect } from "next/navigation";

// Prevent Next.js from prerendering this authenticated page.
export const dynamic = "force-dynamic";

export default async function Page() {
  // Get the currently authenticated user.
  const user = await currentUser();

  // Redirect visitors who are not logged in.
  if (!user) {
    redirect("/login");
  }

  // Retrieve the latest 300 entries the user is authorized to view.
  const entries = await db.timeEntry.findMany({
    where: entryScope(user),
    orderBy: {
      startTime: "desc",
    },
    take: 300,
  });

  const columns = [
    "Date",
    "Contractor",
    "School",
    "Category",
    "Hours",
    "Billing",
    "Approval",
    "Payment",
    "Actions",
  ];

  return (
    <Shell>
      {/* Page header */}
      <div className="hero">
        <div className="eyebrow">Work history</div>

        <h1>Time entries & approvals</h1>

        <p className="muted">
          Review time, approval status and payment progress.
        </p>
      </div>

      {/* Time entries table */}
      <div className="card tablewrap">
        <table className="table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {entries.map((entry) => {
              const hours = Number(entry.billableHours);

              const billing =
                hours * Number(entry.billingRate);

              return (
                <tr key={entry.id}>
                  <td>
                    {entry.startTime.toLocaleDateString(
                      "en-US"
                    )}
                  </td>

                  <td>{entry.contractorName}</td>

                  <td>{entry.schoolOrDistrict}</td>

                  <td>
                    {entry.category.replaceAll("_", " ")}
                  </td>

                  <td>{hours.toFixed(2)}</td>

                  <td>${billing.toFixed(2)}</td>

                  <td>
                    <span
                      className={
                        "pill " + entry.approvalStatus
                      }
                    >
                      {entry.approvalStatus}
                    </span>
                  </td>

                  <td>{entry.paymentStatus}</td>

                  <td>
                    <EntryActions
                      id={entry.id}
                      role={user.role}
                      schoolName={user.schoolName}
                      entrySchool={entry.schoolOrDistrict}
                      approval={entry.approvalStatus}
                      payment={entry.paymentStatus}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {entries.length === 0 && (
          <p className="muted">
            No time entries found.
          </p>
        )}
      </div>
    </Shell>
  );
}
