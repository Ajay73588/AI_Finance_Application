import { Prisma, type Asset } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/prisma";

export const assetTypes = [
  "stock",
  "crypto",
  "mutual_fund",
  "real_estate",
  "cash",
] as const;

const assetIdSchema = z
  .string({ required_error: "Asset id is required" })
  .trim()
  .min(1, "Asset id is required");

const assetPriceSchema = z.coerce
  .number({ invalid_type_error: "Current price must be a valid number" })
  .nonnegative("Current price must be greater than or equal to 0");

const addAssetSchema = z.object({
  type: z.enum(assetTypes, {
    required_error: "Asset type is required",
    invalid_type_error: "Asset type is invalid",
  }),
  name: z
    .string({ required_error: "Asset name is required" })
    .trim()
    .min(1, "Asset name is required"),
  symbol: z.string().trim().optional().nullable(),
  quantity: z.coerce
    .number({ invalid_type_error: "Quantity must be a valid number" })
    .positive("Quantity must be greater than 0"),
  buyPrice: z.coerce
    .number({ invalid_type_error: "Buy price must be a valid number" })
    .nonnegative("Buy price must be greater than or equal to 0"),
  currentPrice: z.coerce
    .number({ invalid_type_error: "Current price must be a valid number" })
    .nonnegative("Current price must be greater than or equal to 0")
    .optional(),
});

export type AssetType = (typeof assetTypes)[number];
export type AddAssetInput = z.infer<typeof addAssetSchema>;

export class AssetServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "AssetServiceError";
    this.statusCode = statusCode;
  }
}

async function getAppUser(clerkUserId: string) {
  const normalizedUserId = clerkUserId?.trim();

  if (!normalizedUserId) {
    throw new AssetServiceError("Unauthorized", 401);
  }

  const user = await db.user.findUnique({
    where: {
      clerkUserId: normalizedUserId,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    throw new AssetServiceError("User not found", 404);
  }

  return user;
}

function normalizeAssetInput(data: AddAssetInput) {
  const symbol = data.symbol?.trim().toUpperCase();

  return {
    type: data.type,
    name: data.name.trim(),
    symbol: symbol || null,
    quantity: data.quantity,
    buyPrice: data.buyPrice,
    currentPrice: data.currentPrice ?? data.buyPrice,
  };
}

function parseAssetId(id: string) {
  return assetIdSchema.parse(id);
}

function handleAssetMutationError(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    throw new AssetServiceError("Asset not found", 404);
  }

  throw error;
}

export async function addAsset(
  userId: string,
  data: unknown
): Promise<Asset> {
  const user = await getAppUser(userId);
  const parsedData = addAssetSchema.parse(data);

  return db.asset.create({
    data: {
      userId: user.id,
      ...normalizeAssetInput(parsedData),
    },
  });
}

export async function getUserAssets(userId: string): Promise<Asset[]> {
  const user = await getAppUser(userId);

  return db.asset.findMany({
    where: {
      userId: user.id,
    },
    orderBy: [
      {
        createdAt: "desc",
      },
      {
        name: "asc",
      },
    ],
  });
}

export async function getUserAssetById(
  userId: string,
  id: string
): Promise<Asset | null> {
  const normalizedId = parseAssetId(id);
  const user = await getAppUser(userId);

  return db.asset.findFirst({
    where: {
      id: normalizedId,
      userId: user.id,
    },
  });
}

export async function updateAssetPrice(
  id: string,
  price: number
): Promise<Asset> {
  const normalizedId = parseAssetId(id);
  const normalizedPrice = assetPriceSchema.parse(price);

  try {
    return await db.asset.update({
      where: {
        id: normalizedId,
      },
      data: {
        currentPrice: normalizedPrice,
      },
    });
  } catch (error) {
    handleAssetMutationError(error);
  }
}

const updateAssetSchema = z.object({
  type: z.enum(assetTypes).optional(),
  name: z.string().trim().min(1).optional(),
  symbol: z.string().trim().optional().nullable(),
  quantity: z.coerce.number().positive().optional(),
  buyPrice: z.coerce.number().nonnegative().optional(),
  currentPrice: z.coerce.number().nonnegative().optional(),
});

export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;

export async function updateAsset(
  id: string,
  data: unknown
): Promise<Asset> {
  const normalizedId = parseAssetId(id);
  const parsedData = updateAssetSchema.parse(data);

  if (Object.keys(parsedData).length === 0) {
    throw new AssetServiceError("No fields to update", 400);
  }

  try {
    return await db.asset.update({
      where: {
        id: normalizedId,
      },
      data: parsedData,
    });
  } catch (error) {
    handleAssetMutationError(error);
  }
}

export async function deleteAsset(id: string): Promise<Asset> {
  const normalizedId = parseAssetId(id);

  try {
    return await db.asset.delete({
      where: {
        id: normalizedId,
      },
    });
  } catch (error) {
    handleAssetMutationError(error);
  }
}
