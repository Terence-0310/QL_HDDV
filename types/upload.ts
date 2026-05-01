export type StoredFileResult = {
  publicUrl: string;
  relativePath: string;
  fileName: string;
  originalFileName: string;
  mimeType: string;
  size: number;
};

export type UploadContractFileResult = {
  id: string;
  fileUrl: string | null;
  fileName: string | null;
  originalFileName: string | null;
  fileMimeType: string | null;
  fileSize: number | null;
  uploadedAt: Date | null;
};
