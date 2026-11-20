import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import SubmitRunPage from "./page";
import * as referenceModule from "@/lib/runs/reference";
import type { ReferenceRunResult } from "@/lib/runs/reference";
import { submitReferenceRunWithMetadata } from "@/lib/runs/reference";

// Mock the API client
vi.mock("@/lib/api", () => ({
  ApiClient: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "ApiError";
    }
  },
}));

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Business logic tests for duplicate detection
describe("SubmitRunPage - Duplicate Detection Logic", () => {
  it("correctly identifies duplicate submissions via idempotency headers", async () => {
    const existingRunResult = {
      probe: {
        checkedAt: "2026-01-01T00:00:00Z",
        reachable: true,
        status: 200,
        supportedSeps: ["sep-1"],
      },
      report: {
        evidenceManifestHash: "hash123",
        reportId: "report_123",
        summary: { failed: 0, passed: 15, skipped: 0, warnings: 2 },
      },
      run: { id: "run_existing", state: "completed" as const },
      targetOrigin: "https://example.com",
    };

    const postWithMetadata = vi.fn().mockResolvedValue({
      data: existingRunResult,
      headers: { idempotencyReplayKey: "existing-run-key", status: 200 },
    });

    const input = {
      projectId: "project_1",
      suiteId: "suite_1",
      suiteVersion: "1.0.0",
      targetId: "target_1",
      targetOrigin: "https://example.com",
    };

    const result = await submitReferenceRunWithMetadata(
      { postWithMetadata } as never,
      input,
      "reviewer-request-1",
    );

    expect(result.isDuplicate).toBe(true);
    expect(result.result.run.id).toBe("run_existing");
  });

  it("correctly identifies new submissions without replay headers", async () => {
    const newRunResult = {
      probe: {
        checkedAt: "2026-01-01T00:00:00Z",
        reachable: true,
        status: 200,
        supportedSeps: ["sep-1"],
      },
      report: {
        evidenceManifestHash: "hash456",
        reportId: "report_456",
        summary: { failed: 0, passed: 18, skipped: 0, warnings: 1 },
      },
      run: { id: "run_new", state: "completed" as const },
      targetOrigin: "https://example.com",
    };

    const postWithMetadata = vi.fn().mockResolvedValue({
      data: newRunResult,
      headers: { status: 201 },
    });

    const input = {
      projectId: "project_1",
      suiteId: "suite_1",
      suiteVersion: "1.0.0",
      targetId: "target_1",
      targetOrigin: "https://example.com",
    };

    const result = await submitReferenceRunWithMetadata(
      { postWithMetadata } as never,
      input,
      "reviewer-request-2",
    );

    expect(result.isDuplicate).toBe(false);
    expect(result.result.run.id).toBe("run_new");
  });
});

// Component integration and UI tests
describe("SubmitRunPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the form with target origin input", () => {
      render(<SubmitRunPage />);
      expect(
        screen.getByLabelText("Target origin"),
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText("https://approved-anchor.example"))
        .toBeInTheDocument();
    });

    it("renders the evidence summary section initially empty", () => {
      render(<SubmitRunPage />);
      expect(screen.getByText("Evidence summary")).toBeInTheDocument();
      expect(
        screen.getByText(/Results appear here only after/),
      ).toBeInTheDocument();
    });

    it("displays a retry key in code format", () => {
      render(<SubmitRunPage />);
      expect(screen.getByText(/Retry key/i)).toBeInTheDocument();
    });
  });

  describe("successful completion state", () => {
    it("displays completed run state with success indicators", async () => {
      const completedResult: ReferenceRunResult = {
        probe: {
          checkedAt: "2024-01-01T00:00:00Z",
          reachable: true,
          status: 200,
          supportedSeps: ["1"],
        },
        report: {
          evidenceManifestHash:
            "sha256_0000000000000000000000000000000000000000000000000000000000000000",
          reportId: "report_completed_12345",
          summary: {
            failed: 0,
            passed: 16,
            skipped: 2,
            warnings: 0,
          },
        },
        run: {
          id: "run_completed_12345",
          state: "completed",
        },
        targetOrigin: "https://example.com",
      };

      vi.spyOn(referenceModule, "submitReferenceRun").mockResolvedValue(
        completedResult,
      );

      render(<SubmitRunPage />);

      const targetInput = screen.getByLabelText("Target origin");
      await userEvent.type(targetInput, "https://example.com");

      const submitButton = screen.getByRole("button", {
        name: /Run reference check/i,
      });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("completed")).toBeInTheDocument();
      });

      expect(screen.getByText("16")).toBeInTheDocument(); // passed count
      expect(screen.getByText("0")).toBeInTheDocument(); // warnings count
      expect(screen.getByText("Yes")).toBeInTheDocument(); // reachable
      expect(screen.getByText("200")).toBeInTheDocument(); // HTTP status
    });

    it("displays report link only when run is completed with valid reportId", async () => {
      const completedResult: ReferenceRunResult = {
        probe: {
          checkedAt: "2024-01-01T00:00:00Z",
          reachable: true,
          status: 200,
          supportedSeps: ["1"],
        },
        report: {
          evidenceManifestHash:
            "sha256_0000000000000000000000000000000000000000000000000000000000000000",
          reportId: "report_test_abc123",
          summary: {
            failed: 0,
            passed: 16,
            skipped: 2,
            warnings: 0,
          },
        },
        run: {
          id: "run_test_12345",
          state: "completed",
        },
        targetOrigin: "https://example.com",
      };

      vi.spyOn(referenceModule, "submitReferenceRun").mockResolvedValue(
        completedResult,
      );

      render(<SubmitRunPage />);

      const targetInput = screen.getByLabelText("Target origin");
      await userEvent.type(targetInput, "https://example.com");

      const submitButton = screen.getByRole("button", {
        name: /Run reference check/i,
      });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("link", { name: /View report/i }))
          .toBeInTheDocument();
      });

      const reportLink = screen.getByRole("link", { name: /View report/i });
      expect(reportLink).toHaveAttribute(
        "href",
        "/reports/report_test_abc123",
      );
    });

    it("properly encodes special characters in reportId in URL", async () => {
      const completedResult: ReferenceRunResult = {
        probe: {
          checkedAt: "2024-01-01T00:00:00Z",
          reachable: true,
          status: 200,
          supportedSeps: ["1"],
        },
        report: {
          evidenceManifestHash:
            "sha256_0000000000000000000000000000000000000000000000000000000000000000",
          reportId: "report_test_123#special&chars=value",
          summary: {
            failed: 0,
            passed: 16,
            skipped: 2,
            warnings: 0,
          },
        },
        run: {
          id: "run_test_12345",
          state: "completed",
        },
        targetOrigin: "https://example.com",
      };

      vi.spyOn(referenceModule, "submitReferenceRun").mockResolvedValue(
        completedResult,
      );

      render(<SubmitRunPage />);

      const targetInput = screen.getByLabelText("Target origin");
      await userEvent.type(targetInput, "https://example.com");

      const submitButton = screen.getByRole("button", {
        name: /Run reference check/i,
      });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("link", { name: /View report/i }))
          .toBeInTheDocument();
      });

      const reportLink = screen.getByRole("link", { name: /View report/i });
      const expectedUrl = `/reports/${encodeURIComponent(
        "report_test_123#special&chars=value",
      )}`;
      expect(reportLink).toHaveAttribute("href", expectedUrl);
    });

    it("does not display report link when reportId is missing", async () => {
      const resultWithoutReportId: ReferenceRunResult = {
        probe: {
          checkedAt: "2024-01-01T00:00:00Z",
          reachable: true,
          status: 200,
          supportedSeps: ["1"],
        },
        report: {
          evidenceManifestHash:
            "sha256_0000000000000000000000000000000000000000000000000000000000000000",
          reportId: "",
          summary: {
            failed: 0,
            passed: 16,
            skipped: 2,
            warnings: 0,
          },
        },
        run: {
          id: "run_test_12345",
          state: "completed",
        },
        targetOrigin: "https://example.com",
      };

      vi.spyOn(referenceModule, "submitReferenceRun").mockResolvedValue(
        resultWithoutReportId,
      );

      render(<SubmitRunPage />);

      const targetInput = screen.getByLabelText("Target origin");
      await userEvent.type(targetInput, "https://example.com");

      const submitButton = screen.getByRole("button", {
        name: /Run reference check/i,
      });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("completed")).toBeInTheDocument();
      });

      expect(screen.queryByRole("link", { name: /View report/i }))
        .not.toBeInTheDocument();
    });
  });

  describe("failed state", () => {
    it("displays failed run state without report link", async () => {
      const failedResult: ReferenceRunResult = {
        probe: {
          checkedAt: "2024-01-01T00:00:00Z",
          reachable: false,
          status: null,
          supportedSeps: [],
        },
        report: {
          evidenceManifestHash: "",
          reportId: "report_failed_12345",
          summary: {
            failed: 5,
            passed: 11,
            skipped: 2,
            warnings: 0,
          },
        },
        run: {
          id: "run_failed_12345",
          state: "failed",
        },
        targetOrigin: "https://example.com",
      };

      vi.spyOn(referenceModule, "submitReferenceRun").mockResolvedValue(
        failedResult,
      );

      render(<SubmitRunPage />);

      const targetInput = screen.getByLabelText("Target origin");
      await userEvent.type(targetInput, "https://example.com");

      const submitButton = screen.getByRole("button", {
        name: /Run reference check/i,
      });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("failed")).toBeInTheDocument();
      });

      expect(screen.queryByRole("link", { name: /View report/i }))
        .not.toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("displays error message when API call fails", async () => {
      vi.spyOn(referenceModule, "submitReferenceRun").mockRejectedValue(
        new Error("Network error"),
      );

      render(<SubmitRunPage />);

      const targetInput = screen.getByLabelText("Target origin");
      await userEvent.type(targetInput, "https://example.com");

      const submitButton = screen.getByRole("button", {
        name: /Run reference check/i,
      });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(
            "The API could not complete the reference run.",
          ),
        ).toBeInTheDocument();
      });

      expect(screen.queryByRole("link", { name: /View report/i }))
        .not.toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("disables submit button while request is in progress", async () => {
      const slowResult: ReferenceRunResult = {
        probe: {
          checkedAt: "2024-01-01T00:00:00Z",
          reachable: true,
          status: 200,
          supportedSeps: ["1"],
        },
        report: {
          evidenceManifestHash:
            "sha256_0000000000000000000000000000000000000000000000000000000000000000",
          reportId: "report_slow_12345",
          summary: {
            failed: 0,
            passed: 16,
            skipped: 2,
            warnings: 0,
          },
        },
        run: {
          id: "run_slow_12345",
          state: "completed",
        },
        targetOrigin: "https://example.com",
      };

      vi.spyOn(referenceModule, "submitReferenceRun").mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(slowResult), 100);
          }),
      );

      render(<SubmitRunPage />);

      const targetInput = screen.getByLabelText("Target origin");
      await userEvent.type(targetInput, "https://example.com");

      const submitButton = screen.getByRole("button", {
        name: /Run reference check/i,
      });
      await userEvent.click(submitButton);

      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/Running check/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe("accessibility", () => {
    it("renders error alert with proper ARIA role", async () => {
      vi.spyOn(referenceModule, "submitReferenceRun").mockRejectedValue(
        new Error("Test error"),
      );

      render(<SubmitRunPage />);

      const targetInput = screen.getByLabelText("Target origin");
      await userEvent.type(targetInput, "https://example.com");

      const submitButton = screen.getByRole("button", {
        name: /Run reference check/i,
      });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
    });

    it("renders report link with semantic HTML", async () => {
      const completedResult: ReferenceRunResult = {
        probe: {
          checkedAt: "2024-01-01T00:00:00Z",
          reachable: true,
          status: 200,
          supportedSeps: ["1"],
        },
        report: {
          evidenceManifestHash:
            "sha256_0000000000000000000000000000000000000000000000000000000000000000",
          reportId: "report_a11y_12345",
          summary: {
            failed: 0,
            passed: 16,
            skipped: 2,
            warnings: 0,
          },
        },
        run: {
          id: "run_a11y_12345",
          state: "completed",
        },
        targetOrigin: "https://example.com",
      };

      vi.spyOn(referenceModule, "submitReferenceRun").mockResolvedValue(
        completedResult,
      );

      render(<SubmitRunPage />);

      const targetInput = screen.getByLabelText("Target origin");
      await userEvent.type(targetInput, "https://example.com");

      const submitButton = screen.getByRole("button", {
        name: /Run reference check/i,
      });
      await userEvent.click(submitButton);

      await waitFor(() => {
        const reportLink = screen.getByRole("link", {
          name: /View report/i,
        });
        expect(reportLink).toBeInTheDocument();
        expect(reportLink.tagName).toBe("A");
      });
    });
  });

  describe("regression tests", () => {
    it("preserves existing form submission behavior", async () => {
      const completedResult: ReferenceRunResult = {
        probe: {
          checkedAt: "2024-01-01T00:00:00Z",
          reachable: true,
          status: 200,
          supportedSeps: ["1"],
        },
        report: {
          evidenceManifestHash:
            "sha256_0000000000000000000000000000000000000000000000000000000000000000",
          reportId: "report_regression_12345",
          summary: {
            failed: 0,
            passed: 16,
            skipped: 2,
            warnings: 0,
          },
        },
        run: {
          id: "run_regression_12345",
          state: "completed",
        },
        targetOrigin: "https://example.com",
      };

      vi.spyOn(referenceModule, "submitReferenceRun").mockResolvedValue(
        completedResult,
      );

      render(<SubmitRunPage />);

      const targetInput = screen.getByLabelText("Target origin");
      await userEvent.type(targetInput, "https://example.com");

      const submitButton = screen.getByRole("button", {
        name: /Run reference check/i,
      });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("16")).toBeInTheDocument();
        expect(screen.getByText("0")).toBeInTheDocument();
      });
    });

    it("clears previous results when submitting again", async () => {
      const firstResult: ReferenceRunResult = {
        probe: {
          checkedAt: "2024-01-01T00:00:00Z",
          reachable: true,
          status: 200,
          supportedSeps: ["1"],
        },
        report: {
          evidenceManifestHash:
            "sha256_0000000000000000000000000000000000000000000000000000000000000000",
          reportId: "report_first_12345",
          summary: {
            failed: 0,
            passed: 16,
            skipped: 2,
            warnings: 0,
          },
        },
        run: {
          id: "run_first_12345",
          state: "completed",
        },
        targetOrigin: "https://example.com",
      };

      const secondResult: ReferenceRunResult = {
        ...firstResult,
        report: { ...firstResult.report, reportId: "report_second_12345" },
        run: { ...firstResult.run, id: "run_second_12345" },
      };

      const mock = vi.spyOn(referenceModule, "submitReferenceRun");

      render(<SubmitRunPage />);

      const targetInput = screen.getByLabelText("Target origin");
      const submitButton = screen.getByRole("button", {
        name: /Run reference check/i,
      });

      // First submission
      mock.mockResolvedValueOnce(firstResult);
      await userEvent.type(targetInput, "https://example.com");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("run_first_12345")).toBeInTheDocument();
      });

      // Second submission
      mock.mockResolvedValueOnce(secondResult);
      await userEvent.clear(targetInput);
      await userEvent.type(targetInput, "https://example.com");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("run_second_12345")).toBeInTheDocument();
      });

      // First result should no longer be visible
      expect(screen.queryByText("run_first_12345")).not.toBeInTheDocument();
    });
  });
});
