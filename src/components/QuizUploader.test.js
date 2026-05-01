import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuizUploader from "./QuizUploader";
import * as supabaseModule from "../config/supabase";

// Mock Supabase
vi.mock("../config/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

describe("QuizUploader Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the component with all elements", () => {
    render(<QuizUploader />);

    expect(screen.getByText("Upload Quiz")).toBeInTheDocument();
    expect(screen.getByLabelText("Sub-Module ID *")).toBeInTheDocument();
    expect(screen.getByLabelText("JSON File *")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Submit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Clear/i })).toBeInTheDocument();
  });

  describe("File Upload", () => {
    it("accepts JSON files", async () => {
      const user = userEvent.setup();
      render(<QuizUploader />);

      const validJson = {
        questions: [
          {
            text: "Test question?",
            options: ["A", "B"],
            correctAnswer: 0,
          },
        ],
      };

      const file = new File(
        [JSON.stringify(validJson)],
        "test.json",
        { type: "application/json" }
      );

      const fileInput = screen.getByLabelText("JSON File *");
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/📄 Selected:/)).toBeInTheDocument();
        expect(screen.getByText("test.json")).toBeInTheDocument();
      });
    });

    it("rejects non-JSON files", async () => {
      const user = userEvent.setup();
      render(<QuizUploader />);

      const file = new File(["not json"], "test.txt", { type: "text/plain" });
      const fileInput = screen.getByLabelText("JSON File *");

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText("Please upload a valid JSON file")).toBeInTheDocument();
      });
    });

    it("shows error for invalid JSON", async () => {
      const user = userEvent.setup();
      render(<QuizUploader />);

      const file = new File(["{ invalid json }"], "test.json", { type: "application/json" });
      const fileInput = screen.getByLabelText("JSON File *");

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/JSON parsing error/)).toBeInTheDocument();
      });
    });

    it("shows error when JSON missing questions array", async () => {
      const user = userEvent.setup();
      render(<QuizUploader />);

      const invalidJson = { data: [] }; // No "questions" key
      const file = new File(
        [JSON.stringify(invalidJson)],
        "test.json",
        { type: "application/json" }
      );

      const fileInput = screen.getByLabelText("JSON File *");
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(
          screen.getByText(/Invalid JSON format. Must contain a "questions" array./)
        ).toBeInTheDocument();
      });
    });

    it("shows warning for empty questions array", async () => {
      const user = userEvent.setup();
      render(<QuizUploader />);

      const emptyJson = { questions: [] };
      const file = new File(
        [JSON.stringify(emptyJson)],
        "test.json",
        { type: "application/json" }
      );

      const fileInput = screen.getByLabelText("JSON File *");
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(
          screen.getByText("JSON file contains an empty questions array.")
        ).toBeInTheDocument();
      });
    });

    it("successfully parses valid JSON with multiple questions", async () => {
      const user = userEvent.setup();
      render(<QuizUploader />);

      const validJson = {
        questions: [
          {
            text: "Question 1?",
            options: ["A", "B"],
            correctAnswer: 0,
          },
          {
            text: "Question 2?",
            options: ["X", "Y"],
            correctAnswer: 1,
          },
        ],
      };

      const file = new File(
        [JSON.stringify(validJson)],
        "questions.json",
        { type: "application/json" }
      );

      const fileInput = screen.getByLabelText("JSON File *");
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/Successfully parsed 2 question\(s\)/)).toBeInTheDocument();
        expect(screen.getByText("2 question(s) ready to upload")).toBeInTheDocument();
      });
    });
  });

  describe("Form Validation", () => {
    it("disables submit button when required fields are empty", () => {
      render(<QuizUploader />);

      const submitButton = screen.getByRole("button", { name: /Submit/i });
      expect(submitButton).toBeDisabled();
    });

    it("requires Sub-Module ID", async () => {
      const user = userEvent.setup();
      render(<QuizUploader />);

      const validJson = { questions: [{ text: "Q1?" }] };
      const file = new File(
        [JSON.stringify(validJson)],
        "test.json",
        { type: "application/json" }
      );

      const fileInput = screen.getByLabelText("JSON File *");
      await user.upload(fileInput, file);

      const form = screen.getByRole("button", { name: /Submit/i }).closest("form");
      await user.click(screen.getByRole("button", { name: /Submit/i }));

      await waitFor(() => {
        expect(screen.getByText("Please enter a Sub-Module ID")).toBeInTheDocument();
      });
    });

    it("enables submit button when all fields are valid", async () => {
      const user = userEvent.setup();
      render(<QuizUploader />);

      // Upload file
      const validJson = { questions: [{ text: "Q1?" }] };
      const file = new File(
        [JSON.stringify(validJson)],
        "test.json",
        { type: "application/json" }
      );

      const fileInput = screen.getByLabelText("JSON File *");
      await user.upload(fileInput, file);

      // Enter Sub-Module ID
      const subModuleInput = screen.getByPlaceholderText("Enter sub-module identifier");
      await user.type(subModuleInput, "module-123");

      await waitFor(() => {
        const submitButton = screen.getByRole("button", { name: /Submit/i });
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe("Form Submission", () => {
    it("shows error when no authentication token", async () => {
      const user = userEvent.setup();
      vi.mocked(supabaseModule.supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: new Error("No session"),
      });

      render(<QuizUploader />);

      // Setup valid form
      const validJson = { questions: [{ text: "Q1?" }] };
      const file = new File(
        [JSON.stringify(validJson)],
        "test.json",
        { type: "application/json" }
      );

      const fileInput = screen.getByLabelText("JSON File *");
      await user.upload(fileInput, file);

      const subModuleInput = screen.getByPlaceholderText("Enter sub-module identifier");
      await user.type(subModuleInput, "module-123");

      // Submit
      await user.click(screen.getByRole("button", { name: /Submit/i }));

      await waitFor(() => {
        expect(screen.getByText("No authentication token. Please log in first.")).toBeInTheDocument();
      });
    });

    it("sends correct data to Edge Function", async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, count: 2 }),
      });
      global.fetch = mockFetch;

      vi.mocked(supabaseModule.supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            access_token: "mock-token",
          },
        },
        error: null,
      });

      render(<QuizUploader />);

      // Setup form
      const validJson = {
        questions: [
          { text: "Q1?", correctAnswer: 0 },
          { text: "Q2?", correctAnswer: 1 },
        ],
      };

      const file = new File(
        [JSON.stringify(validJson)],
        "test.json",
        { type: "application/json" }
      );

      const fileInput = screen.getByLabelText("JSON File *");
      await user.upload(fileInput, file);

      const subModuleInput = screen.getByPlaceholderText("Enter sub-module identifier");
      await user.type(subModuleInput, "module-456");

      // Submit
      await user.click(screen.getByRole("button", { name: /Submit/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/upload-questions"),
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              Authorization: "Bearer mock-token",
            }),
            body: JSON.stringify({
              subModuleId: "module-456",
              questions: validJson.questions,
            }),
          })
        );
      });
    });

    it("shows success message after upload", async () => {
      const user = userEvent.setup();
      vi.mocked(supabaseModule.supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            access_token: "mock-token",
          },
        },
        error: null,
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, count: 2 }),
      });

      render(<QuizUploader />);

      // Setup and submit
      const validJson = { questions: [{ text: "Q1?" }, { text: "Q2?" }] };
      const file = new File(
        [JSON.stringify(validJson)],
        "test.json",
        { type: "application/json" }
      );

      await userEvent.upload(screen.getByLabelText("JSON File *"), file);
      await userEvent.type(screen.getByPlaceholderText("Enter sub-module identifier"), "mod-123");
      await userEvent.click(screen.getByRole("button", { name: /Submit/i }));

      await waitFor(() => {
        expect(
          screen.getByText("✓ Successfully uploaded 2 question(s)!")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Clear Button", () => {
    it("resets form when Clear is clicked", async () => {
      const user = userEvent.setup();
      render(<QuizUploader />);

      // Upload file
      const validJson = { questions: [{ text: "Q1?" }] };
      const file = new File(
        [JSON.stringify(validJson)],
        "test.json",
        { type: "application/json" }
      );

      const fileInput = screen.getByLabelText("JSON File *");
      await user.upload(fileInput, file);

      const subModuleInput = screen.getByPlaceholderText("Enter sub-module identifier");
      await user.type(subModuleInput, "module-123");

      // Clear
      await user.click(screen.getByRole("button", { name: /Clear/i }));

      // Verify reset
      expect(subModuleInput).toHaveValue("");
      expect(fileInput).toHaveValue("");
    });
  });
});
