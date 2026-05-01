import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuizChapterUploader from "./QuizChapterUploader";
import * as supabaseModule from "../config/supabase";

// Mock Supabase module
vi.mock("../config/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

describe("QuizChapterUploader Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("renders all form elements", () => {
      render(<QuizChapterUploader />);

      expect(screen.getByText(/Create Chapter with Questions/i)).toBeInTheDocument();
      expect(screen.getByLabelText("Chapter Name *")).toBeInTheDocument();
      expect(screen.getByLabelText("Difficulty Level *")).toBeInTheDocument();
      expect(screen.getByLabelText("JSON File *")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Create Chapter with Questions/i })).toBeInTheDocument();
    });

    it("has difficulty selector with all options", () => {
      render(<QuizChapterUploader />);

      const selectElement = screen.getByLabelText("Difficulty Level *");
      const options = selectElement.querySelectorAll("option");

      expect(options.length).toBe(3);
      expect(options[0].value).toBe("easy");
      expect(options[1].value).toBe("medium");
      expect(options[2].value).toBe("hard");
    });
  });

  describe("File Upload Validation", () => {
    it("accepts JSON files", async () => {
      const user = userEvent.setup();
      render(<QuizChapterUploader />);

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
        "questions.json",
        { type: "application/json" }
      );

      const fileInput = screen.getByLabelText("JSON File *");
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/📄 Selected:/)).toBeInTheDocument();
      });
    });

    it("rejects non-JSON files", async () => {
      const user = userEvent.setup();
      render(<QuizChapterUploader />);

      const file = new File(["not json"], "questions.txt", { type: "text/plain" });
      const fileInput = screen.getByLabelText("JSON File *");

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/Please upload a valid JSON file/)).toBeInTheDocument();
      });
    });
  });

  describe("JSON Parsing", () => {
    it("parses valid JSON with questions array", async () => {
      const user = userEvent.setup();
      render(<QuizChapterUploader />);

      const validJson = {
        questions: [
          { text: "Q1?", options: ["A", "B"], correctAnswer: 0 },
          { text: "Q2?", options: ["X", "Y"], correctAnswer: 1 },
        ],
      };

      const file = new File(
        [JSON.stringify(validJson)],
        "questions.json",
        { type: "application/json" }
      );

      await userEvent.upload(screen.getByLabelText("JSON File *"), file);

      await waitFor(() => {
        expect(screen.getByText(/File parsed successfully! Found 2 question\(s\)/)).toBeInTheDocument();
      });
    });

    it("shows error for invalid JSON syntax", async () => {
      const user = userEvent.setup();
      render(<QuizChapterUploader />);

      const file = new File(
        ["{ invalid json }"],
        "questions.json",
        { type: "application/json" }
      );

      await userEvent.upload(screen.getByLabelText("JSON File *"), file);

      await waitFor(() => {
        expect(screen.getByText(/JSON parsing error/)).toBeInTheDocument();
      });
    });

    it("shows error when questions array is missing", async () => {
      const user = userEvent.setup();
      render(<QuizChapterUploader />);

      const invalidJson = { data: [] }; // No questions key

      const file = new File(
        [JSON.stringify(invalidJson)],
        "questions.json",
        { type: "application/json" }
      );

      await userEvent.upload(screen.getByLabelText("JSON File *"), file);

      await waitFor(() => {
        expect(
          screen.getByText(/Invalid JSON format. Missing 'questions' array./)
        ).toBeInTheDocument();
      });
    });

    it("shows error when questions array is empty", async () => {
      const user = userEvent.setup();
      render(<QuizChapterUploader />);

      const emptyJson = { questions: [] };

      const file = new File(
        [JSON.stringify(emptyJson)],
        "questions.json",
        { type: "application/json" }
      );

      await userEvent.upload(screen.getByLabelText("JSON File *"), file);

      await waitFor(() => {
        expect(
          screen.getByText(/Questions array is empty. Please add at least one question./)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Form Validation", () => {
    it("submit button is disabled when form is empty", () => {
      render(<QuizChapterUploader />);

      const submitButton = screen.getByRole("button", {
        name: /Create Chapter with Questions/i,
      });

      expect(submitButton).toBeDisabled();
    });

    it("requires chapter name", async () => {
      const user = userEvent.setup();
      render(<QuizChapterUploader />);

      const validJson = { questions: [{ text: "Q1?" }] };
      const file = new File(
        [JSON.stringify(validJson)],
        "questions.json",
        { type: "application/json" }
      );

      await userEvent.upload(screen.getByLabelText("JSON File *"), file);

      const submitButton = screen.getByRole("button", {
        name: /Create Chapter with Questions/i,
      });

      // Try to submit without chapter name
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a Chapter Name/)).toBeInTheDocument();
      });
    });

    it("enables submit button when all fields are valid", async () => {
      const user = userEvent.setup();
      render(<QuizChapterUploader />);

      // Upload file
      const validJson = { questions: [{ text: "Q1?" }] };
      const file = new File(
        [JSON.stringify(validJson)],
        "questions.json",
        { type: "application/json" }
      );

      await userEvent.upload(screen.getByLabelText("JSON File *"), file);

      // Enter chapter name
      const chapterInput = screen.getByPlaceholderText("e.g., Algebra Basics");
      await userEvent.type(chapterInput, "Test Chapter");

      await waitFor(() => {
        const submitButton = screen.getByRole("button", {
          name: /Create Chapter with Questions/i,
        });

        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe("Form Submission", () => {
    it("shows loading state during submission", async () => {
      const user = userEvent.setup();

      // Mock successful session
      vi.mocked(supabaseModule.supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: "mock-token" } },
        error: null,
      });

      // Mock fetch
      global.fetch = vi.fn(() =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ success: true }),
              }),
            500
          )
        )
      );

      render(<QuizChapterUploader />);

      // Setup form
      const validJson = { questions: [{ text: "Q1?" }] };
      const file = new File(
        [JSON.stringify(validJson)],
        "questions.json",
        { type: "application/json" }
      );

      await userEvent.upload(screen.getByLabelText("JSON File *"), file);
      await userEvent.type(
        screen.getByPlaceholderText("e.g., Algebra Basics"),
        "Test"
      );

      // Submit
      const submitButton = screen.getByRole("button", {
        name: /Create Chapter with Questions/i,
      });

      await userEvent.click(submitButton);

      // Should show loading
      expect(screen.getByText(/Creating Chapter.../)).toBeInTheDocument();
    });

    it("shows error when not authenticated", async () => {
      const user = userEvent.setup();

      vi.mocked(supabaseModule.supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: new Error("No session"),
      });

      render(<QuizChapterUploader />);

      // Setup form
      const validJson = { questions: [{ text: "Q1?" }] };
      const file = new File(
        [JSON.stringify(validJson)],
        "questions.json",
        { type: "application/json" }
      );

      await userEvent.upload(screen.getByLabelText("JSON File *"), file);
      await userEvent.type(
        screen.getByPlaceholderText("e.g., Algebra Basics"),
        "Test"
      );

      // Submit
      await userEvent.click(
        screen.getByRole("button", { name: /Create Chapter with Questions/i })
      );

      await waitFor(() => {
        expect(
          screen.getByText(/No authentication token found. Please log in first./)
        ).toBeInTheDocument();
      });
    });

    it("sends correct data to Edge Function", async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, count: 1 }),
      });

      global.fetch = mockFetch;

      vi.mocked(supabaseModule.supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: "mock-token" } },
        error: null,
      });

      render(<QuizChapterUploader />);

      // Setup form
      const validJson = {
        questions: [
          {
            text: "What is 2+2?",
            options: ["3", "4", "5"],
            correctAnswer: 1,
          },
        ],
      };

      const file = new File(
        [JSON.stringify(validJson)],
        "questions.json",
        { type: "application/json" }
      );

      await userEvent.upload(screen.getByLabelText("JSON File *"), file);

      const chapterInput = screen.getByPlaceholderText("e.g., Algebra Basics");
      await userEvent.type(chapterInput, "Math Basics");

      const difficultySelect = screen.getByLabelText("Difficulty Level *");
      await userEvent.selectOptions(difficultySelect, "hard");

      // Submit
      await userEvent.click(
        screen.getByRole("button", { name: /Create Chapter with Questions/i })
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/create_questions_from_file"),
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              Authorization: "Bearer mock-token",
            }),
            body: expect.stringContaining("Math Basics"),
          })
        );
      });
    });

    it("shows success message after successful upload", async () => {
      const user = userEvent.setup();

      vi.mocked(supabaseModule.supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: "mock-token" } },
        error: null,
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<QuizChapterUploader />);

      // Setup and submit
      const validJson = {
        questions: [{ text: "Q1?" }, { text: "Q2?" }],
      };

      const file = new File(
        [JSON.stringify(validJson)],
        "questions.json",
        { type: "application/json" }
      );

      await userEvent.upload(screen.getByLabelText("JSON File *"), file);
      await userEvent.type(
        screen.getByPlaceholderText("e.g., Algebra Basics"),
        "My Chapter"
      );

      await userEvent.click(
        screen.getByRole("button", { name: /Create Chapter with Questions/i })
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Successfully created chapter "My Chapter" with 2 question\(s\)!/)
        ).toBeInTheDocument();
      });
    });

    it("resets form after successful submission", async () => {
      const user = userEvent.setup();

      vi.mocked(supabaseModule.supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: "mock-token" } },
        error: null,
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<QuizChapterUploader />);

      // Setup and submit
      const validJson = { questions: [{ text: "Q1?" }] };
      const file = new File(
        [JSON.stringify(validJson)],
        "questions.json",
        { type: "application/json" }
      );

      await userEvent.upload(screen.getByLabelText("JSON File *"), file);

      const chapterInput = screen.getByPlaceholderText("e.g., Algebra Basics");
      await userEvent.type(chapterInput, "Test Chapter");

      await userEvent.click(
        screen.getByRole("button", { name: /Create Chapter with Questions/i })
      );

      await waitFor(() => {
        // Form should reset
        expect(chapterInput).toHaveValue("");
        expect(
          (screen.getByLabelText("Difficulty Level *") as HTMLSelectElement).value
        ).toBe("medium");
      });
    });

    it("shows error message on API failure", async () => {
      const user = userEvent.setup();

      vi.mocked(supabaseModule.supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: "mock-token" } },
        error: null,
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "Server error occurred" }),
      });

      render(<QuizChapterUploader />);

      // Setup and submit
      const validJson = { questions: [{ text: "Q1?" }] };
      const file = new File(
        [JSON.stringify(validJson)],
        "questions.json",
        { type: "application/json" }
      );

      await userEvent.upload(screen.getByLabelText("JSON File *"), file);
      await userEvent.type(
        screen.getByPlaceholderText("e.g., Algebra Basics"),
        "Test"
      );

      await userEvent.click(
        screen.getByRole("button", { name: /Create Chapter with Questions/i })
      );

      await waitFor(() => {
        expect(screen.getByText(/API Error: Server error occurred/)).toBeInTheDocument();
      });
    });
  });

  describe("Safe Property Access", () => {
    it("handles undefined chapter name safely", async () => {
      const user = userEvent.setup();
      render(<QuizChapterUploader />);

      const validJson = { questions: [{ text: "Q1?" }] };
      const file = new File(
        [JSON.stringify(validJson)],
        "questions.json",
        { type: "application/json" }
      );

      await userEvent.upload(screen.getByLabelText("JSON File *"), file);

      // Don't enter chapter name and submit
      const submitButton = screen.getByRole("button", {
        name: /Create Chapter with Questions/i,
      });

      // Should not crash
      expect(submitButton).toBeDisabled();
    });

    it("safely handles missing questions in JSON", async () => {
      const user = userEvent.setup();
      render(<QuizChapterUploader />);

      const invalidJson = { data: "test" }; // No questions property

      const file = new File(
        [JSON.stringify(invalidJson)],
        "questions.json",
        { type: "application/json" }
      );

      // Should not crash during parsing
      await userEvent.upload(screen.getByLabelText("JSON File *"), file);

      await waitFor(() => {
        expect(
          screen.getByText(/Invalid JSON format. Missing 'questions' array./)
        ).toBeInTheDocument();
      });
    });
  });
});
