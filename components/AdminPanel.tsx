
"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

const definitions = {
  schools: [
    ["name", "text"],
    ["type", "select:school,district"],
    ["discountPercentage", "number"],
  ],
  categories: [
    ["name", "text"],
    ["key", "text"],
    ["hourlyRate", "number"],
    ["billingRate", "number"],
    ["description", "text"],
  ],
  subcategories: [
    ["name", "text"],
    ["key", "text"],
  ],
  mileage: [
    ["ratePerMile", "number"],
    ["updatedNote", "text"],
  ],
  retainers: [
    ["contractorName", "text"],
    ["schoolOrDistrict", "text"],
    ["monthlyAmount", "number"],
    ["billingAmount", "number"],
    ["startDate", "date"],
  ],
  revenue: [
    ["contractName", "text"],
    ["schoolOrDistrict", "text"],
    ["monthlyRevenue", "number"],
    ["startDate", "date"],
  ],
} as const;

type Resource = keyof typeof definitions;
type Tab = Resource | "users";
type Role = "ADMIN" | "CONTRACTOR" | "SCHOOL";

type UserRecord = {
  id: string;
  displayName: string;
  email: string;
  role: Role;
  schoolName: string | null;
  jobTitle: string | null;
};

const tabs: Tab[] = [
  "schools",
  "categories",
  "subcategories",
  "mileage",
  "retainers",
  "revenue",
  "users",
];

const optionalFields = [
  "description",
  "updatedNote",
  "discountPercentage",
  "billingAmount",
];

function fieldLabel(name: string) {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());
}

async function requestJSON(
  url: string,
  options?: RequestInit
) {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Request failed"
    );
  }

  return data;
}

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("schools");

  const [rows, setRows] = useState<
    Record<string, unknown>[]
  >([]);

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  const [userRole, setUserRole] =
    useState<Role>("CONTRACTOR");

  useEffect(() => {
    let active = true;

    async function load() {
      setError("");
      setRows([]);
      setUsers([]);

      try {
        const data = await requestJSON(
          "/api/admin/" + tab
        );

        if (!active) return;

        if (tab === "users") {
          setUsers(Array.isArray(data) ? data : []);
        } else {
          setRows(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load records"
          );
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [tab]);

  async function refresh() {
    const data = await requestJSON(
      "/api/admin/" + tab
    );

    if (tab === "users") {
      setUsers(Array.isArray(data) ? data : []);
    } else {
      setRows(Array.isArray(data) ? data : []);
    }
  }

  async function submitRecord(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (tab === "users") return;

    const form = event.currentTarget;
    const raw = Object.fromEntries(new FormData(form));

    const body: Record<string, unknown> = {
      ...raw,
    };

    for (const [name, type] of definitions[tab]) {
      if (type === "number") {
        body[name] = Number(raw[name] || 0);
      }
    }

    if (
      tab === "categories" ||
      tab === "subcategories"
    ) {
      body.key = String(raw.key || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");
    }

    setBusy(true);
    setError("");
    setOk("");

    try {
      await requestJSON("/api/admin/" + tab, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      setOk("Record created successfully.");
      form.reset();

      await refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create record"
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitUser(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const form = event.currentTarget;
    const raw = Object.fromEntries(new FormData(form));

    const body = {
      displayName: String(raw.displayName || ""),
      email: String(raw.email || ""),
      password: String(raw.password || ""),
      role: userRole,
      schoolName:
        String(raw.schoolName || "").trim() || null,
      jobTitle: String(raw.jobTitle || ""),
    };

    setBusy(true);
    setError("");
    setOk("");

    try {
      await requestJSON("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      setOk("User account created successfully.");
      form.reset();
      setUserRole("CONTRACTOR");

      await refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create user"
      );
    } finally {
      setBusy(false);
    }
  }

  async function updateUser(
    user: UserRecord,
    role: Role
  ) {
    setBusy(true);
    setError("");
    setOk("");

    try {
      await requestJSON("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: user.id,
          role,
          schoolName: user.schoolName,
          jobTitle: user.jobTitle || "",
        }),
      });

      setOk("User role updated.");
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update user"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div
        className="row"
        style={{
          justifyContent: "flex-start",
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            className={
              "btn " + (tab === item ? "" : "alt")
            }
            onClick={() => {
              setTab(item);
              setError("");
              setOk("");
            }}
          >
            {fieldLabel(item)}
          </button>
        ))}
      </div>

      {tab === "users" ? (
        <>
          <div className="card">
            <h2>Add user account</h2>

            <p className="muted">
              Create accounts for contractors, school
              reviewers, and administrators.
            </p>

            <form
              className="stack"
              onSubmit={submitUser}
            >
              <div className="formgrid">
                <label className="field">
                  Full name
                  <input
                    name="displayName"
                    type="text"
                    required
                    minLength={2}
                  />
                </label>

                <label className="field">
                  Email
                  <input
                    name="email"
                    type="email"
                    required
                  />
                </label>

                <label className="field">
                  Temporary password
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={10}
                    maxLength={128}
                    autoComplete="new-password"
                  />
                </label>

                <label className="field">
                  Role
                  <select
                    name="role"
                    value={userRole}
                    onChange={(event) =>
                      setUserRole(
                        event.target.value as Role
                      )
                    }
                  >
                    <option value="CONTRACTOR">
                      Contractor
                    </option>
                    <option value="SCHOOL">
                      School reviewer
                    </option>
                    <option value="ADMIN">
                      Administrator
                    </option>
                  </select>
                </label>

                <label className="field">
                  School assignment
                  <input
                    name="schoolName"
                    type="text"
                    required={userRole === "SCHOOL"}
                    placeholder="Exact school name"
                  />
                </label>

                <label className="field">
                  Job title
                  <input
                    name="jobTitle"
                    type="text"
                    placeholder="e.g. Substitute Teacher"
                  />
                </label>
              </div>

              <p className="muted">
                Contractor accounts can submit their
                own time entries. School reviewers
                require an assigned school.
              </p>

              <div>
                <button
                  className="btn"
                  type="submit"
                  disabled={busy}
                >
                  {busy
                    ? "Creating..."
                    : "Create user"}
                </button>
              </div>
            </form>
          </div>

          <div className="section card tablewrap">
            <h2>Existing users</h2>

            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>School</th>
                  <th>Job title</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.displayName}</td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        value={user.role}
                        disabled={busy}
                        aria-label={
                          "Role for " + user.displayName
                        }
                        onChange={(event) =>
                          updateUser(
                            user,
                            event.target.value as Role
                          )
                        }
                      >
                        <option value="ADMIN">
                          Administrator
                        </option>
                        <option value="CONTRACTOR">
                          Contractor
                        </option>
                        <option value="SCHOOL">
                          School
                        </option>
                      </select>
                    </td>
                    <td>
                      {user.schoolName || "—"}
                    </td>
                    <td>
                      {user.jobTitle || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <p className="muted">
                No users found.
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="card">
            <h2>
              Add {tab.slice(0, -1)} record
            </h2>

            <form
              onSubmit={submitRecord}
              className="stack"
            >
              <div className="formgrid">
                {definitions[tab].map(
                  ([name, type]) => (
                    <label
                      key={name}
                      className="field"
                    >
                      {fieldLabel(name)}

                      {type.startsWith("select:") ? (
                        <select name={name}>
                          {type
                            .slice(7)
                            .split(",")
                            .map((value) => (
                              <option
                                key={value}
                                value={value}
                              >
                                {value}
                              </option>
                            ))}
                        </select>
                      ) : (
                        <input
                          name={name}
                          type={type}
                          step={
                            type === "number"
                              ? "any"
                              : undefined
                          }
                          required={
                            !optionalFields.includes(
                              name
                            )
                          }
                        />
                      )}
                    </label>
                  )
                )}
              </div>

              <div>
                <button
                  className="btn"
                  disabled={busy}
                  type="submit"
                >
                  {busy
                    ? "Saving..."
                    : "Add record"}
                </button>
              </div>
            </form>
          </div>

          <div className="section card tablewrap">
            <h2>Existing {tab}</h2>

            <table className="table">
              <thead>
                <tr>
                  {definitions[tab].map(
                    ([name]) => (
                      <th key={name}>
                        {fieldLabel(name)}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={String(
                      row.id || index
                    )}
                  >
                    {definitions[tab].map(
                      ([name]) => (
                        <td key={name}>
                          {String(
                            row[name] ?? "—"
                          )}
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {error && (
        <div className="notice error">
          {error}
        </div>
      )}

      {ok && (
        <div className="notice">
          {ok}
        </div>
      )}
    </>
  );
}
