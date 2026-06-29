import { render, screen, fireEvent } from "@testing-library/react";
import { PaginationControls } from "@/app/dashboard/components/PaginationControls";
import { EventTable } from "@/app/dashboard/components/EventTable";

describe("Dashboard Components", () => {
  describe("EventTable", () => {
    it("renders default empty state when hasActiveFilters is false", () => {
      render(<EventTable events={[]} loading={false} onEventClick={jest.fn()} hasActiveFilters={false} />);
      expect(screen.getByText("No events found. Select a contract and adjust filters to view events.")).toBeInTheDocument();
    });

    it("renders friendly empty state with clear filters button when hasActiveFilters is true", () => {
      const mockOnClearFilters = jest.fn();
      render(
        <EventTable
          events={[]}
          loading={false}
          onEventClick={jest.fn()}
          hasActiveFilters={true}
          onClearFilters={mockOnClearFilters}
        />
      );

      expect(screen.getByText("No events match your criteria")).toBeInTheDocument();
      expect(screen.getByText(/We couldn't find any events matching your current search/)).toBeInTheDocument();

      const clearButton = screen.getByRole("button", { name: "Clear Filters" });
      expect(clearButton).toBeInTheDocument();
      
      fireEvent.click(clearButton);
      expect(mockOnClearFilters).toHaveBeenCalledTimes(1);
    });
  });

  describe("PaginationControls", () => {
    it("renders pagination controls with correct page info", () => {
      const mockOnPageChange = jest.fn();
      const mockOnPageSizeChange = jest.fn();
      
      render(
        <PaginationControls
          currentPage={2}
          hasNext={true}
          hasPrev={true}
          onPageChange={mockOnPageChange}
          startIndex={21}
          endIndex={40}
          totalCount={100}
          pageSize={25}
          onPageSizeChange={mockOnPageSizeChange}
        />
      );

      expect(screen.getByText("Page 2")).toBeInTheDocument();
      expect(screen.getByText(/Showing 21-40 of 100\+/)).toBeInTheDocument();
    });

    it("disables previous button on first page", () => {
      const mockOnPageChange = jest.fn();
      const mockOnPageSizeChange = jest.fn();
      
      render(
        <PaginationControls
          currentPage={1}
          hasNext={true}
          hasPrev={false}
          onPageChange={mockOnPageChange}
          startIndex={1}
          endIndex={25}
          totalCount={100}
          pageSize={25}
          onPageSizeChange={mockOnPageSizeChange}
        />
      );

      const prevButton = screen.getByTitle("Previous page");
      expect(prevButton).toBeDisabled();
    });

    it("disables next button when no more pages", () => {
      const mockOnPageChange = jest.fn();
      const mockOnPageSizeChange = jest.fn();
      
      render(
        <PaginationControls
          currentPage={5}
          hasNext={false}
          hasPrev={true}
          onPageChange={mockOnPageChange}
          startIndex={81}
          endIndex={100}
          totalCount={100}
          pageSize={25}
          onPageSizeChange={mockOnPageSizeChange}
        />
      );

      const nextButton = screen.getByTitle("Next page");
      expect(nextButton).toBeDisabled();
    });

    it("calls onPageChange when clicking next", () => {
      const mockOnPageChange = jest.fn();
      const mockOnPageSizeChange = jest.fn();
      
      render(
        <PaginationControls
          currentPage={2}
          hasNext={true}
          hasPrev={true}
          onPageChange={mockOnPageChange}
          startIndex={21}
          endIndex={40}
          totalCount={100}
          pageSize={25}
          onPageSizeChange={mockOnPageSizeChange}
        />
      );

      const nextButton = screen.getByTitle("Next page");
      fireEvent.click(nextButton);
      
      expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });

    it("calls onPageChange when clicking previous", () => {
      const mockOnPageChange = jest.fn();
      const mockOnPageSizeChange = jest.fn();
      
      render(
        <PaginationControls
          currentPage={2}
          hasNext={true}
          hasPrev={true}
          onPageChange={mockOnPageChange}
          startIndex={21}
          endIndex={40}
          totalCount={100}
          pageSize={25}
          onPageSizeChange={mockOnPageSizeChange}
        />
      );

      const prevButton = screen.getByTitle("Previous page");
      fireEvent.click(prevButton);
      
      expect(mockOnPageChange).toHaveBeenCalledWith(1);
    });

    it("calls onPageChange with page 1 when clicking first", () => {
      const mockOnPageChange = jest.fn();
      const mockOnPageSizeChange = jest.fn();
      
      render(
        <PaginationControls
          currentPage={5}
          hasNext={true}
          hasPrev={true}
          onPageChange={mockOnPageChange}
          startIndex={81}
          endIndex={100}
          totalCount={200}
          pageSize={25}
          onPageSizeChange={mockOnPageSizeChange}
        />
      );

      const firstButton = screen.getByTitle("First page");
      fireEvent.click(firstButton);
      
      expect(mockOnPageChange).toHaveBeenCalledWith(1);
    });

    it("renders page size selector dropdown with options", () => {
      const mockOnPageChange = jest.fn();
      const mockOnPageSizeChange = jest.fn();
      
      render(
        <PaginationControls
          currentPage={1}
          hasNext={true}
          hasPrev={false}
          onPageChange={mockOnPageChange}
          startIndex={1}
          endIndex={25}
          totalCount={100}
          pageSize={25}
          onPageSizeChange={mockOnPageSizeChange}
        />
      );

      const dropdown = screen.getByRole("combobox");
      expect(dropdown).toBeInTheDocument();
      
      fireEvent.click(dropdown);
      
      expect(screen.getByRole("option", { name: "10 per page" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "25 per page" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "50 per page" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "100 per page" })).toBeInTheDocument();
    });

    it("calls onPageSizeChange when selecting a new page size", () => {
      const mockOnPageChange = jest.fn();
      const mockOnPageSizeChange = jest.fn();
      
      render(
        <PaginationControls
          currentPage={1}
          hasNext={true}
          hasPrev={false}
          onPageChange={mockOnPageChange}
          startIndex={1}
          endIndex={25}
          totalCount={100}
          pageSize={25}
          onPageSizeChange={mockOnPageSizeChange}
        />
      );

      const dropdown = screen.getByRole("combobox");
      fireEvent.click(dropdown);
      
      const option50 = screen.getByRole("option", { name: "50 per page" });
      fireEvent.click(option50);
      
      expect(mockOnPageSizeChange).toHaveBeenCalledWith(50);
    });
  });
});
