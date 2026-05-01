import crypto from "node:crypto";
import { exportContractsReportCsv } from "@/services/report.service";
import type { AuthUser } from "@/types/auth";
import type { ContractsReportQuery } from "@/types/report";

type ExportJobStatus = "PENDING" | "SUCCESS" | "FAILED";

type ExportJob = {
  id: string;
  status: ExportJobStatus;
  createdAt: string;
  finishedAt?: string;
  fileName?: string;
  csv?: string;
  error?: string;
};

const jobs = new Map<string, ExportJob>();

export async function createContractsExportJob(query: ContractsReportQuery, authUser: AuthUser): Promise<ExportJob> {
  const id = crypto.randomUUID();
  const job: ExportJob = {
    id,
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };
  jobs.set(id, job);

  void exportContractsReportCsv(query, authUser)
    .then((csv) => {
      jobs.set(id, {
        ...job,
        status: "SUCCESS",
        finishedAt: new Date().toISOString(),
        csv,
        fileName: `contracts-report-${new Date().toISOString().slice(0, 10)}.csv`,
      });
    })
    .catch((error) => {
      jobs.set(id, {
        ...job,
        status: "FAILED",
        finishedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Export failed",
      });
    });

  return job;
}

export function getContractsExportJob(jobId: string): ExportJob | null {
  return jobs.get(jobId) ?? null;
}
