"use client";

import { useEffect, useState } from "react";
import { Download, FileJson, Table2, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { verifyReportSignature, isValidDigest } from "@/lib/reports/signature";

export type IntegrityState = "pending" | "verified" | "rejected" | "loading" | "error";

interface ReportData {
  digest: string;
  signer?: string;
}

export function ReportExports({
  reportId,
  integrityState = "verified",
}: {
  reportId: string;
  integrityState?: IntegrityState;
}) {
  const [verificationState, setVerificationState] = useState<IntegrityState>(integrityState);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // Verify digest on mount if not already verified
  useEffect(() => {
    if (integrityState === "verified") {
      return;
    }

    let isMounted = true;
    const verifyDigest = async () => {
      if (!reportId) {
        setVerificationState("pending");
        return;
      }

      setVerificationState("loading");
      setError(null);

      try {
        const response = await fetch(`/api/reports/${reportId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!isMounted) return;

        if (response.status === 401) {
          setVerificationState("rejected");
          setError("You do not have permission to access this report.");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch report data");
        }

        const data: ReportData = await response.json();

        if (!isMounted) return;

        if (!isValidDigest(data.digest)) {
          setVerificationState("rejected");
          setError("Report digest is invalid.");
          return;
        }

        const verificationResult = verifyReportSignature(
          data.digest,
          data.digest,
          data.signer || "RampSpec"
        );

        if (!isMounted) return;

        if (verificationResult.valid) {
          setReportData(data);
          setVerificationState("verified");
          setError(null);
        } else {
          setVerificationState("rejected");
          setError(verificationResult.reason || "Digest verification failed.");
        }
      } catch (err) {
        if (!isMounted) return;
        setVerificationState("error");
        setError("Unable to verify report digest. Please try again.");
      }
    };

    verifyDigest();
    return () => {
      isMounted = false;
    };
  }, [reportId, integrityState]);

  const isDisabled = verificationState === "pending" || verificationState === "loading";
  const isRejected = verificationState === "rejected" || verificationState === "error";

  const baseButtonClasses =
    "inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold";
  const enabledClasses =
    "bg-surface hover:bg-canvas cursor-pointer transition-colors";
  const disabledClasses =
    "bg-surface opacity-50 cursor-not-allowed" +
    (isRejected ? " border-red-300" : "");

  const jsonButtonClasses = `${baseButtonClasses} ${isDisabled || isRejected ? disabledClasses : enabledClasses}`;
  const csvButtonClasses = `${baseButtonClasses} ${isDisabled || isRejected ? disabledClasses : enabledClasses}`;

  const bundleButtonClasses = `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white ${
    isDisabled || isRejected
      ? "bg-accent opacity-50 cursor-not-allowed"
      : "bg-accent hover:bg-accent/90 cursor-pointer transition-colors"
  }`;

  const disabledReason =
    verificationState === "pending" || verificationState === "loading"
      ? "Report verification is in progress. Exports are temporarily unavailable."
      : "Report integrity verification failed. Exports are not available.";

  const disabledAriaLabel =
    verificationState === "pending" || verificationState === "loading"
      ? "Export unavailable while verification is pending"
      : "Export unavailable due to verification failure";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          className={jsonButtonClasses}
          disabled={isDisabled || isRejected}
          aria-disabled={isDisabled || isRejected}
          title={isDisabled || isRejected ? disabledReason : undefined}
          aria-label={`Export as JSON${isDisabled || isRejected ? ` (${disabledAriaLabel})` : ""}`}
        >
          <FileJson size={15} aria-hidden="true" />
          JSON
        </button>

        <button
          className={csvButtonClasses}
          disabled={isDisabled || isRejected}
          aria-disabled={isDisabled || isRejected}
          title={isDisabled || isRejected ? disabledReason : undefined}
          aria-label={`Export as CSV${isDisabled || isRejected ? ` (${disabledAriaLabel})` : ""}`}
        >
          <Table2 size={15} aria-hidden="true" />
          CSV
        </button>

        <a
          href={
            isDisabled || isRejected
              ? undefined
              : `/api/reports/${reportId}/download`
          }
          onClick={
            isDisabled || isRejected
              ? (e) => {
                  e.preventDefault();
                }
              : undefined
          }
          className={bundleButtonClasses}
          role={isDisabled || isRejected ? "button" : undefined}
          tabIndex={isDisabled || isRejected ? 0 : undefined}
          aria-disabled={isDisabled || isRejected}
          title={isDisabled || isRejected ? disabledReason : undefined}
          aria-label={`Download signed bundle${isDisabled || isRejected ? ` (${disabledAriaLabel})` : ""}`}
        >
          <Download size={15} aria-hidden="true" />
          Download signed bundle
        </a>
      </div>

      {/* Verification status indicators */}
      {(verificationState === "loading") && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Clock size={16} className="animate-spin" />
          Verifying report digest...
        </div>
      )}

      {verificationState === "verified" && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle size={16} />
          Report digest verified
        </div>
      )}

      {(verificationState === "error" || verificationState === "rejected") && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle size={16} />
          <span>{error || "Verification failed"}</span>
        </div>
      )}
    </div>
  );
}
}
