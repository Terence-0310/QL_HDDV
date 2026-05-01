import { AppError } from "@/lib/errors";

export const MAX_CONTRACT_PDF_SIZE_BYTES = 10 * 1024 * 1024;

const PDF_MIME_TYPES = new Set(["application/pdf"]);

export function validateContractPdfFile(file: File | null | undefined) {
  if (!file) {
    throw new AppError("PDF file is required", 400, "VALIDATION_ERROR");
  }

  const lowerName = file.name.toLowerCase();
  const hasPdfExtension = lowerName.endsWith(".pdf");
  const hasPdfMime = PDF_MIME_TYPES.has(file.type);

  if (!hasPdfExtension || !hasPdfMime) {
    throw new AppError("Only PDF files are supported", 415, "UNSUPPORTED_MEDIA_TYPE");
  }

  if (file.size <= 0) {
    throw new AppError("File is empty", 400, "VALIDATION_ERROR");
  }

  if (file.size > MAX_CONTRACT_PDF_SIZE_BYTES) {
    throw new AppError("File too large. Maximum allowed size is 10MB", 413, "PAYLOAD_TOO_LARGE");
  }
}
