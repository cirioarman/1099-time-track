
import { NextRequest, NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { z } from "zod";

import { db } from "@/lib/db";
import {
  currentUser,
  createSession,
  clearSession,
} from "@/lib/auth";
import { fail, unexpected } from "@/lib/http";

// Validate login and registration credentials.
const credentials = z.object({
  email: z.string().email(),
  password: z.string().min(10).max(128),
});

// Return the currently authenticated user.
export async function GET() {
  return NextResponse.json({
    user: await currentUser(),
  });
}

// Handle registration, login, and logout.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;

    // LOGOUT
    if (action === "logout") {
      await clearSession();

      return NextResponse.json({
        ok: true,
      });
    }

    // Validate credentials.
    const parsed = credentials.safeParse(body);

    if (!parsed.success) {
      return fail(
        "Valid email and password (minimum 10 characters) required"
      );
    }

    const email = parsed.data.email.toLowerCase().trim();

    // INITIAL ADMINISTRATOR REGISTRATION
    if (action === "register") {
      const count = await db.user.count();

      // Disable public registration after initial setup.
      if (count > 0) {
        return fail(
          "Public registration is disabled. Contact an administrator to create an account.",
          403
        );
      }

      // Validate administrator display name.
      const name = z
        .string()
        .min(2)
        .max(100)
        .safeParse(body.displayName);

      if (!name.success) {
        return fail("Display name required");
      }

      // Create the initial administrator account.
      const user = await db.user.create({
        data: {
          email,
          passwordHash: await hash(
            parsed.data.password,
            12
          ),
          displayName: name.data,
          role: "ADMIN",
        },
      });

      // Automatically sign in the administrator.
      await createSession(user.id);

      return NextResponse.json({
        ok: true,
      });
    }

    // LOGIN
    if (action === "login") {
      const user = await db.user.findUnique({
        where: {
          email,
        },
      });

      // Check email and password.
      if (
        !user ||
        !(await compare(
          parsed.data.password,
          user.passwordHash
        ))
      ) {
        return fail("Invalid credentials", 401);
      }

      // Create an authenticated session.
      await createSession(user.id);

      return NextResponse.json({
        ok: true,
      });
    }

    // UNKNOWN ACTION
    return fail("Unknown action");
  } catch (error) {
    return unexpected(error);
  }
}
