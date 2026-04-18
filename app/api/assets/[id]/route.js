import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { z } from "zod";

import {
  AssetServiceError,
  deleteAsset,
  getUserAssetById,
  updateAsset,
} from "@/lib/services/assetService";
import { resolveRequestUserId } from "@/lib/server/resolveRequestUser";

function handleRouteError(error, context) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid request",
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

export async function PATCH(request, { params }) {
  try {
    const userId = await resolveRequestUserId();
    const assetId = decodeURIComponent(params.id);

    // Verify asset belongs to user
    const asset = await getUserAssetById(userId, assetId);
    if (!asset) {
      return NextResponse.json(
        {
          success: false,
          error: "Asset not found",
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Remove any undefined fields
    const updateData = Object.fromEntries(
      Object.entries(body).filter(([_, v]) => v !== undefined)
    );

    const updatedAsset = await updateAsset(assetId, updateData);

    return NextResponse.json({
      success: true,
      data: updatedAsset,
    });
  } catch (error) {
    return handleRouteError(error, "[ASSETS_PATCH]");
  }
}

export async function DELETE(_request, { params }) {
  try {
    const userId = await resolveRequestUserId();
    const assetId = decodeURIComponent(params.id);
    const asset = await getUserAssetById(userId, assetId);

    if (!asset) {
      return NextResponse.json(
        {
          success: false,
          error: "Asset not found",
        },
        { status: 404 }
      );
    }

    await deleteAsset(asset.id);

    return NextResponse.json({
      success: true,
      message: "Asset deleted successfully",
    });
  } catch (error) {
    return handleRouteError(error, "[ASSETS_DELETE]");
  }
}
