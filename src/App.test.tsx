import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the dashboard heading and introduction", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Weather Explorer" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Your weather dashboard is coming together."),
    ).toBeInTheDocument();
  });
});
