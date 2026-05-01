import { AppError } from "@/lib/errors";
import { deleteStoredFileByUrl, saveContractPdf } from "@/lib/storage";
import { validateContractPdfFile } from "@/lib/validators/upload.validator";
import type { AuthUser } from "@/types/auth";
import type { UploadContractFileResult } from "@/types/upload";
import { createAuditLog } from "@/services/audit.service";
import { assertContractAccessById, updateContractFileMetadata } from "@/services/contract.service";

export async function uploadContractPdf(contractId: string, file: File, authUser: AuthUser): Promise<UploadContractFileResult> {
  validateContractPdfFile(file);

  const existing = await assertContractAccessById(contractId, authUser);
  const stored = await saveContractPdf(file, { contractId });
  const hadExistingFile = Boolean(existing.fileUrl);

  let updated: Awaited<ReturnType<typeof updateContractFileMetadata>> | null = null;
  try {
    updated = await updateContractFileMetadata(contractId, {
      fileUrl: stored.publicUrl,
      fileName: stored.fileName,
      originalFileName: stored.originalFileName,
      fileMimeType: stored.mimeType,
      fileSize: stored.size,
      uploadedAt: new Date(),
    });
  } catch (error) {
    await deleteStoredFileByUrl(stored.publicUrl);
    throw error;
  }

  if (!updated) {
    await deleteStoredFileByUrl(stored.publicUrl);
    throw new AppError("Failed to update contract file metadata", 500, "INTERNAL_ERROR");
  }

  await deleteStoredFileByUrl(existing.fileUrl);

  await createAuditLog({
    userId: authUser.id,
    action: hadExistingFile ? "REPLACE_CONTRACT_FILE" : "UPLOAD_CONTRACT_FILE",
    entityType: "CONTRACT",
    entityId: contractId,
    metadata: {
      fileName: updated.fileName,
      fileSize: updated.fileSize,
      fileMimeType: updated.fileMimeType,
    },
  });

  return {
    id: updated.id,
    fileUrl: updated.fileUrl,
    fileName: updated.fileName,
    originalFileName: updated.originalFileName,
    fileMimeType: updated.fileMimeType,
    fileSize: updated.fileSize,
    uploadedAt: updated.uploadedAt,
  };
}
