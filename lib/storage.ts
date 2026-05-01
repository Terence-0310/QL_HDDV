import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { AppError } from "@/lib/errors";
import type { StoredFileResult } from "@/types/upload";

const PUBLIC_UPLOAD_BASE = path.join(process.cwd(), "public", "uploads", "contracts");
const PUBLIC_URL_BASE = "/uploads/contracts";

// Configure Cloudinary if env vars exist
const isCloudinaryConfigured = !!(process.env.CLOUDINARY_URL || process.env.CLOUDINARY_CLOUD_NAME);
if (isCloudinaryConfigured && process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Configure AWS S3 if env vars exist
const isS3Configured = !!(
  process.env.AWS_S3_BUCKET &&
  process.env.AWS_REGION &&
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY
);
const s3Client = isS3Configured
  ? new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      },
    })
  : null;

function sanitizeFileName(input: string): string {
  return input.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function sanitizePathSegment(input: string): string {
  const safe = input.replace(/[^a-zA-Z0-9_-]/g, "_");
  if (!safe) {
    throw new AppError("Invalid storage path segment", 400, "VALIDATION_ERROR");
  }
  return safe;
}

export function buildPublicFileUrl(relativePath: string): string {
  const normalized = relativePath.replaceAll("\\", "/");
  return `${PUBLIC_URL_BASE}/${normalized}`;
}

function getRelativeStoragePath(contractId: string, originalFileName: string): string {
  const safeContractId = sanitizePathSegment(contractId);
  const safeName = sanitizeFileName(originalFileName);
  const uniqueName = `${Date.now()}-${randomUUID()}-${safeName}`;
  return path.join(safeContractId, uniqueName);
}

function toAbsoluteStoragePath(relativePath: string): string {
  return path.join(PUBLIC_UPLOAD_BASE, relativePath);
}

async function uploadToCloudinary(buffer: Buffer, originalFileName: string, contractId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `contracts/${sanitizePathSegment(contractId)}`,
        resource_type: "raw", // use "raw" for non-image files like PDFs to ensure they are downloaded/viewed properly
        use_filename: true,
        unique_filename: true,
        filename_override: sanitizeFileName(originalFileName),
      },
      (error, result) => {
        if (error || !result) reject(error || new Error("Cloudinary upload failed"));
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

async function deleteFromCloudinary(fileUrl: string): Promise<void> {
  try {
    const match = fileUrl.match(/\/upload\/(?:v\d+\/)?(contracts\/.*)$/);
    if (match && match[1]) {
      const publicId = match[1];
      await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
    }
  } catch (err) {
    console.error("Cloudinary delete failed:", err);
  }
}

async function uploadToS3(buffer: Buffer, originalFileName: string, contractId: string, mimeType: string): Promise<string> {
  if (!s3Client || !process.env.AWS_S3_BUCKET) throw new Error("S3 is not configured");
  
  const safeContractId = sanitizePathSegment(contractId);
  const safeName = sanitizeFileName(originalFileName);
  const uniqueName = `${Date.now()}-${randomUUID()}-${safeName}`;
  const key = `contracts/${safeContractId}/${uniqueName}`;
  
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );
  
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

async function deleteFromS3(fileUrl: string): Promise<void> {
  if (!s3Client || !process.env.AWS_S3_BUCKET) return;
  try {
    const url = new URL(fileUrl);
    // Extract key from the URL pathname, e.g., /contracts/safeContractId/uniqueName.pdf -> contracts/safeContractId/uniqueName.pdf
    const key = url.pathname.substring(1); 
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
      })
    );
  } catch (err) {
    console.error("S3 delete failed:", err);
  }
}

export async function saveContractPdf(file: File, options: { contractId: string }): Promise<StoredFileResult> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let publicUrl: string;
  let relativePath = "";

  if (isS3Configured) {
    // Upload to S3
    publicUrl = await uploadToS3(buffer, file.name, options.contractId, file.type);
    relativePath = publicUrl; // Treat URL as path for S3
  } else if (isCloudinaryConfigured) {
    // Upload to Cloudinary
    publicUrl = await uploadToCloudinary(buffer, file.name, options.contractId);
    relativePath = publicUrl; // Treat URL as path for Cloudinary
  } else {
    // Upload to Local Disk
    relativePath = getRelativeStoragePath(options.contractId, file.name);
    const absolutePath = toAbsoluteStoragePath(relativePath);
    const normalizedBase = path.resolve(PUBLIC_UPLOAD_BASE);
    const normalizedTarget = path.resolve(absolutePath);

    if (!normalizedTarget.startsWith(normalizedBase)) {
      throw new AppError("Invalid file storage path", 400, "VALIDATION_ERROR");
    }

    const targetDir = path.dirname(absolutePath);
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(absolutePath, buffer);
    publicUrl = buildPublicFileUrl(relativePath);
  }

  return {
    publicUrl,
    relativePath,
    fileName: path.basename(relativePath),
    originalFileName: file.name,
    mimeType: file.type,
    size: file.size,
  };
}

export async function deleteStoredFileByUrl(fileUrl: string | null | undefined): Promise<void> {
  if (!fileUrl) return;

  if (isS3Configured && fileUrl.includes(process.env.AWS_S3_BUCKET!)) {
    await deleteFromS3(fileUrl);
    return;
  }

  if (fileUrl.includes("cloudinary.com")) {
    await deleteFromCloudinary(fileUrl);
    return;
  }

  if (!fileUrl.startsWith(PUBLIC_URL_BASE)) {
    return;
  }

  const relativePath = fileUrl.replace(`${PUBLIC_URL_BASE}/`, "");
  const absolutePath = toAbsoluteStoragePath(relativePath);
  const normalizedBase = path.resolve(PUBLIC_UPLOAD_BASE);
  const normalizedTarget = path.resolve(absolutePath);

  // Guard against path traversal in stored URLs.
  if (!normalizedTarget.startsWith(normalizedBase)) {
    return;
  }

  await fs.unlink(normalizedTarget).catch(() => undefined);
}
