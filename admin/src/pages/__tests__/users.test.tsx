/// <reference types="@testing-library/jest-dom" />
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import UsersPage from "../users";

describe("UsersPage", () => {
  it("renders the user management page title", () => {
    render(<UsersPage />);
    expect(screen.getByText("User Management")).toBeInTheDocument();
  });

  it("truncates long user emails with max-w-[180px] and sets title attribute for tooltip", () => {
    render(<UsersPage />);
    
    const longEmail = "alexander.christopher.montgomery.jr@extremely-long-subdomain.enterprise-domain.com";
    const emailCell = screen.getByTestId("user-email-usr_1");

    expect(emailCell).toBeInTheDocument();
    expect(emailCell).toHaveTextContent(longEmail);
    expect(emailCell).toHaveAttribute("title", longEmail);
    expect(emailCell).toHaveClass("max-w-[180px]");
    expect(emailCell).toHaveClass("truncate");
  });
});
