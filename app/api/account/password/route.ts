
import { NextRequest, NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { z } from "zod";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { fail, unexpected } from "@/lib/http";

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12).max(128),
});

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return fail("Unauthorized", 401);
    }

    const parsed = passwordSchema.safeParse(
      await req.json()
    );

    if (!parsed.success) {
      return fail(
        "Current password and a new password of at least 12 characters are required."
      );
    }

    const { currentPassword, newPassword } =
      parsed.data;

    if (currentPassword === newPassword) {
      return fail(
        "Your new password must be different from your current password."
      );
    }

    const account = await db.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        passwordHash: true,
      },
    });

    if (!account) {
      return fail("Account not found", 404);
    }

    const validPassword = await compare(
      currentPassword,
      account.passwordHash
    );

    if (!validPassword) {
      return fail(
        "Current password is incorrect.",
        401
      );
    }

    const passwordHash = await hash(
      newPassword,
      12
    );

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          passwordHash,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorId: user.id,
          action: "CHANGE_PASSWORD",
          entity: "User",
          entityId: user.id,
        },
      });
    });

    return NextResponse.json({
      ok: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    return unexpected(error);
  }
}
