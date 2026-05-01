import { AppError } from "@/lib/errors";
import { MAX_CONTRACT_PDF_SIZE_BYTES, validateContractPdfFile } from "@/lib/validators/upload.validator";

function makeFile(name: string, type: string, size: number): File {
  const content = "x".repeat(Math.max(size, 1));
  return new File([content], name, { type });
}

describe("upload validator", () => {
  it("accepts valid pdf input", () => {
    const file = makeFile("contract.pdf", "application/pdf", 1000);
    expect(() => validateContractPdfFile(file)).not.toThrow();
  });

  it("rejects non-pdf file", () => {
    const file = makeFile("contract.txt", "text/plain", 1000);
    expect(() => validateContractPdfFile(file)).toThrow(AppError);
  });

  it("rejects oversized file", () => {
    const file = makeFile("contract.pdf", "application/pdf", MAX_CONTRACT_PDF_SIZE_BYTES + 1);
    expect(() => validateContractPdfFile(file)).toThrow("File too large");
  });
});
