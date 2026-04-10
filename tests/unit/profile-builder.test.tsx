import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock the server action
jest.mock("@/app/profiles/actions", () => ({
  processFileForCV: jest.fn(),
}));

import ProfileBuilderPage from "@/app/profiles/page";
import { processFileForCV } from "@/app/profiles/actions";

const mockProcessFile = processFileForCV as jest.MockedFunction<
  typeof processFileForCV
>;

describe("ProfileBuilderPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock fetch for agent-service calls
    global.fetch = jest.fn();
  });

  it("renders step 1 with upload zone as primary input", () => {
    render(<ProfileBuilderPage />);
    expect(
      screen.getByText("Arrastrá un archivo o hacé click para seleccionar"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("PDF, DOCX o TXT — máximo 10 MB"),
    ).toBeInTheDocument();
  });

  it("does not show text input by default", () => {
    render(<ProfileBuilderPage />);
    expect(
      screen.queryByPlaceholderText("Pegá el texto completo de tu CV aquí..."),
    ).not.toBeInTheDocument();
  });

  it("shows text input when toggle is clicked", () => {
    render(<ProfileBuilderPage />);
    fireEvent.click(screen.getByText("O pegá el texto de tu CV directamente"));
    expect(
      screen.getByPlaceholderText("Pegá el texto completo de tu CV aquí..."),
    ).toBeInTheDocument();
  });

  it("shows step indicator on step 1", () => {
    render(<ProfileBuilderPage />);
    expect(screen.getByText("Subir o pegar CV")).toBeInTheDocument();
  });

  it("disables Analizar button when no file and no text", () => {
    render(<ProfileBuilderPage />);
    const btn = screen.getByText("Analizar CV");
    expect(btn).toBeDisabled();
  });

  it("shows file name after successful PDF upload", async () => {
    mockProcessFile.mockResolvedValue({
      mode: "file",
      file_base64: "dGVzdA==",
      mime: "application/pdf",
    });

    render(<ProfileBuilderPage />);

    const file = new File(["test"], "resume.pdf", {
      type: "application/pdf",
    });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText("resume.pdf")).toBeInTheDocument();
    expect(
      await screen.findByText("PDF listo — se enviará directo al modelo AI"),
    ).toBeInTheDocument();
  });

  it("shows remove button after file upload", async () => {
    mockProcessFile.mockResolvedValue({
      mode: "file",
      file_base64: "dGVzdA==",
      mime: "application/pdf",
    });

    render(<ProfileBuilderPage />);

    const file = new File(["test"], "cv.pdf", {
      type: "application/pdf",
    });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(
      await screen.findByText("Eliminar y subir otro"),
    ).toBeInTheDocument();
  });

  it("enables Analizar button after PDF upload", async () => {
    mockProcessFile.mockResolvedValue({
      mode: "file",
      file_base64: "dGVzdA==",
      mime: "application/pdf",
    });

    render(<ProfileBuilderPage />);

    const file = new File(["test"], "cv.pdf", {
      type: "application/pdf",
    });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await screen.findByText("cv.pdf");
    const btn = screen.getByText("Analizar CV");
    expect(btn).not.toBeDisabled();
  });

  it("hides text toggle when file is uploaded", async () => {
    mockProcessFile.mockResolvedValue({
      mode: "file",
      file_base64: "dGVzdA==",
      mime: "application/pdf",
    });

    render(<ProfileBuilderPage />);

    const file = new File(["test"], "cv.pdf", {
      type: "application/pdf",
    });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await screen.findByText("cv.pdf");
    expect(
      screen.queryByText("O pegá el texto de tu CV directamente"),
    ).not.toBeInTheDocument();
  });

  it("shows error when file processing fails", async () => {
    mockProcessFile.mockResolvedValue({
      error: "Formato no soportado. Usá PDF, DOCX o TXT.",
    });

    render(<ProfileBuilderPage />);

    const file = new File(["test"], "bad.exe", {
      type: "application/octet-stream",
    });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(
      await screen.findByText("Formato no soportado. Usá PDF, DOCX o TXT."),
    ).toBeInTheDocument();
  });

  it("shows language selector", () => {
    render(<ProfileBuilderPage />);
    expect(screen.getByDisplayValue("English")).toBeInTheDocument();
  });
});
