import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/prisma";

const DEV_FALLBACK_USER_ID = "test-user";
const DEV_FALLBACK_EMAIL = "test-user@dev.local";

export async function resolveRequestUserId() {
  const { userId } = await auth();

  if (userId) {
    return userId;
  }

  // TODO: Re-enable Clerk auth in production
  const existingUser = await db.user.findUnique({
    where: {
      clerkUserId: DEV_FALLBACK_USER_ID,
    },
    select: {
      clerkUserId: true,
    },
  });

  if (!existingUser) {
    await db.user.create({
      data: {
        clerkUserId: DEV_FALLBACK_USER_ID,
        email: DEV_FALLBACK_EMAIL,
        name: "Development Test User",
      },
    });
  }

  return DEV_FALLBACK_USER_ID;
}
