import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  AssetServiceError,
  addAsset,
  getUserAssets,
} from "@/lib/services/assetService";
import { resolveRequestUserId } from "@/lib/server/resolveRequestUser";

function handleRouteError(error, context) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid asset data",
        details: error.flatten(),
      },
      { status: 400 }
    );
  }

  if (error instanceof AssetServiceError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: error.statusCode }
    );
  }

  console.error(context, error);

  return NextResponse.json(
    {
      success: false,
      error: "Internal server error",
    },
    { status: 500 }
  );
}

export async function POST(request) {
  try {
    const userId = await resolveRequestUserId();
    const body = await request.json();
    const asset = await addAsset(userId, body);

    return NextResponse.json(
      {
        success: true,
        data: asset,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleRouteError(error, "[ASSETS_POST]");
  }
}

export async function GET() {
  try {
    const userId = await resolveRequestUserId();
    const assets = await getUserAssets(userId);

    return NextResponse.json({
      success: true,
      data: assets,
    });
  } catch (error) {
    return handleRouteError(error, "[ASSETS_GET]");
  }
}
