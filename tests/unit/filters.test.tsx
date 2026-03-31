import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Filters } from "@/app/components/filters";

const mockPush = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

describe("Filters", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders status select with default value", () => {
    render(<Filters />);
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBe(2);
  });

  it("renders platform select", () => {
    render(<Filters />);
    expect(screen.getByText("Upwork")).toBeInTheDocument();
    expect(screen.getByText("LinkedIn")).toBeInTheDocument();
    expect(screen.getByText("Workana")).toBeInTheDocument();
  });

  it("renders search input", () => {
    render(<Filters />);
    expect(
      screen.getByPlaceholderText("Buscar por título..."),
    ).toBeInTheDocument();
  });

  it("shows all status options", () => {
    render(<Filters />);
    expect(screen.getByText("Todos")).toBeInTheDocument();
    expect(screen.getByText("Para revisar")).toBeInTheDocument();
    expect(screen.getByText("Puntuados")).toBeInTheDocument();
    expect(screen.getByText("Aprobados")).toBeInTheDocument();
    expect(screen.getByText("Baja prioridad")).toBeInTheDocument();
  });

  it("updates URL when status changes", () => {
    render(<Filters />);
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "needs_review" } });
    expect(mockPush).toHaveBeenCalledWith("?status=needs_review");
  });

  it("updates URL when platform changes", () => {
    render(<Filters />);
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[1], { target: { value: "upwork" } });
    expect(mockPush).toHaveBeenCalledWith("?platform=upwork");
  });

  it("clears filter when empty value selected", () => {
    render(<Filters currentStatus="scored" />);
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "" } });
    expect(mockPush).toHaveBeenCalledWith("?");
  });

  it("updates URL on search Enter key", () => {
    render(<Filters />);
    const input = screen.getByPlaceholderText("Buscar por título...");
    fireEvent.keyDown(input, {
      key: "Enter",
      currentTarget: { value: "react" },
    });
    // The handler reads e.currentTarget.value — in jsdom with fireEvent this
    // will use the input's current value (defaultValue or "")
    expect(mockPush).toHaveBeenCalled();
  });

  it("sets current values from props", () => {
    render(
      <Filters
        currentStatus="needs_review"
        currentPlatform="upwork"
        currentSearch="react"
      />,
    );
    const selects = screen.getAllByRole("combobox");
    expect(selects[0]).toHaveValue("needs_review");
    expect(selects[1]).toHaveValue("upwork");
    expect(screen.getByPlaceholderText("Buscar por título...")).toHaveValue(
      "react",
    );
  });
});
