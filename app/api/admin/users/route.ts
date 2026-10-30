
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { fail, unexpected } from "@/lib/http";

const createUserSchema = z.object({
  displayName: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  password: z.string().min(10).max(128),
  role: z.enum(["ADMIN", "CONTRACTOR", "SCHOOL"]),
  schoolName: z.string().trim().nullable().optional(),
  jobTitle: z.string().trim().max(100).optional(),
});

const updateUserSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["ADMIN", "CONTRACTOR", "SCHOOL"]),
  schoolName: z.string().nullable().optional(),
  jobTitle: z.string().max(100).optional(),
});

const publicUserFields = {
  id: true,
  email: true,
  displayName: true,
  role: true,
  schoolName: true,
  jobTitle: true,
} as const;

export async function GET() {
  const admin = await currentUser();

  if (!admin || admin.role !== "ADMIN") {
    return fail("Forbidden", 403);
  }

  const users = await db.user.findMany({
    select: publicUserFields,
    orderBy: {
      displayName: "asc",
    },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  try {
    const admin = await currentUser();

    if (!admin || admin.role !== "ADMIN") {
      return fail("Forbidden", 403);
    }

    const parsed = createUserSchema.safeParse(
      await req.json()
    );

    if (!parsed.success) {
      return fail(
        parsed.error.issues
          .map((issue) => issue.message)
          .join("; ")
      );
    }

    const data = parsed.data;
    const email = data.email.toLowerCase();

    if (
      data.role === "SCHOOL" &&
      !data.schoolName?.trim()
    ) {
      return fail(
        "School users must have an assigned school."
      );
    }

    const existing = await db.user.findUnique({
      where: { email },
    });

    if (existing) {
      return fail("Email is already registered", 409);
    }

    const passwordHash = await hash(data.password, 12);

    const created = await db.$transaction(
      async (tx) => {
        const user = await tx.user.create({
          data: {
            displayName: data.displayName,
            email,
            passwordHash,
            role: data.role,
            schoolName: data.schoolName || null,
            jobTitle: data.jobTitle || "",
          },
          select: publicUserFields,
        });

        await tx.auditEvent.create({
          data: {
            actorId: admin.id,
            action: "CREATE_USER",
            entity: "User",
            entityId: user.id,
          },
        });

        return user;
      }
    );

    return NextResponse.json(created, {
      status: 201,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return fail("Email is already registered", 409);
    }

    return unexpected(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await currentUser();

    if (!admin || admin.role !== "ADMIN") {
      return fail("Forbidden", 403);
    }

    const parsed = updateUserSchema.safeParse(
      await req.json()
    );

    if (!parsed.success) {
      return fail("Invalid user update");
    }

    const data = parsed.data;

    if (
      data.id === admin.id &&
      data.role !== "ADMIN"
    ) {
      return fail(
        "Cannot remove your own admin role"
      );
    }

    if (data.role === "SCHOOL") {
      const existing = await db.user.findUnique({
        where: { id: data.id },
        select: { schoolName: true },
      });

      const assignedSchool =
        data.schoolName !== undefined
          ? data.schoolName
          : existing?.schoolName;

      if (!assignedSchool?.trim()) {
        return fail(
          "School users must have an assigned school."
        );
      }
    }

    const updated = await db.$transaction(
      async (tx) => {
        const user = await tx.user.update({
          where: { id: data.id },
          data: {
            role: data.role,
            ...(data.schoolName !== undefined
              ? { schoolName: data.schoolName }
              : {}),
            ...(data.jobTitle !== undefined
              ? { jobTitle: data.jobTitle }
              : {}),
          },
          select: publicUserFields,
        });

        await tx.auditEvent.create({
          data: {
            actorId: admin.id,
            action: "UPDATE_USER",
            entity: "User",
            entityId: user.id,
          },
        });

        return user;
      }
    );

    return NextResponse.json(updated);
  } catch (error) {
    return unexpected(error);
  }
}
