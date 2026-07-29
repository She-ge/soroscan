# Requirements Document: Reusable Pagination Component

## Introduction

The Reusable Pagination Component provides a standardized, terminal-styled pagination UI for list-based views in the admin panel. This component supports both cursor-based pagination (for large datasets) and page-based pagination, eliminating duplication across Event Explorer, Contracts, and Webhooks modules. The component uses terminal-style symbols (< and >) for navigation with clear disabled states at boundaries.

## Glossary

- **Pagination_Component**: A React/TypeScript component that renders pagination controls with navigation buttons and page information
- **Cursor**: An opaque identifier used to fetch the next or previous page of results (used instead of offset for large datasets)
- **Page_Number**: The current page number in a paginated result set
- **Total_Items**: The total number of items available in the dataset
- **Items_Per_Page**: The number of items displayed per page
- **Terminal_Styling**: A monospace font styling with bracket symbols and uppercase text, consistent with admin panel terminal aesthetic
- **Disabled_State**: A UI state where navigation buttons are non-interactive and visually de-emphasized

## Requirements

### Requirement 1: Render Pagination Controls

**User Story:** As an admin, I want to see pagination controls on list views, so that I can navigate between pages of data.

#### Acceptance Criteria

1. THE Pagination_Component SHALL render a container with prev/next navigation buttons and page information
2. THE Pagination_Component SHALL display the current page number and total pages when using page-based pagination
3. THE Pagination_Component SHALL display item range (e.g., "Showing 1-20 of 1000") when using cursor-based pagination
4. THE Pagination_Component SHALL use terminal styling with monospace font, borders, and uppercase labels
5. THE Pagination_Component SHALL accept className prop for custom styling overrides

### Requirement 2: Support Cursor-Based Pagination

**User Story:** As a developer, I want to use cursor-based pagination in the component, so that I can efficiently paginate large datasets without offset-based queries.

#### Acceptance Criteria

1. WHEN a cursor value is provided, THE Pagination_Component SHALL render in cursor mode
2. WHEN a cursor is available for the next page, THE Pagination_Component SHALL enable the next button
3. WHEN a cursor is available for the previous page, THE Pagination_Component SHALL enable the previous button
4. WHEN no cursor is available for the next page, THE Pagination_Component SHALL disable and visually de-emphasize the next button
5. WHEN no cursor is available for the previous page, THE Pagination_Component SHALL disable and visually de-emphasize the previous button

### Requirement 3: Support Page-Based Pagination

**User Story:** As a developer, I want to use traditional page-based pagination in the component, so that I can work with APIs that use page numbers instead of cursors.

#### Acceptance Criteria

1. WHEN page number and total_pages are provided, THE Pagination_Component SHALL render in page mode
2. THE Pagination_Component SHALL display "Page X of Y" format
3. WHEN on the first page, THE Pagination_Component SHALL disable the previous button
4. WHEN on the last page, THE Pagination_Component SHALL disable the next button
5. WHEN on any intermediate page, THE Pagination_Component SHALL enable both previous and next buttons

### Requirement 4: Handle Navigation Events

**User Story:** As a developer, I want pagination buttons to trigger callbacks, so that I can handle page changes in my application logic.

#### Acceptance Criteria

1. WHEN the next button is clicked and enabled, THE Pagination_Component SHALL invoke the onNext callback
2. WHEN the previous button is clicked and enabled, THE Pagination_Component SHALL invoke the onPrevious callback
3. WHEN a button is clicked while disabled, THE Pagination_Component SHALL not invoke any callback
4. THE Pagination_Component SHALL not prevent default click behavior for enabled buttons

### Requirement 5: Apply Terminal Styling

**User Story:** As an admin, I want the pagination controls to match the terminal aesthetic, so that they fit seamlessly with the admin panel design.

#### Acceptance Criteria

1. THE Pagination_Component SHALL use zinc color palette (zinc-900 background, zinc-800 borders, zinc-100 text)
2. THE Pagination_Component SHALL render prev button with "< PREV" text using terminal-style formatting
3. THE Pagination_Component SHALL render next button with "NEXT >" text using terminal-style formatting
4. THE Pagination_Component SHALL use monospace font (font-mono) for all text
5. WHILE a button is enabled, THE Pagination_Component SHALL apply hover effects (lighter text and borders)
6. WHILE a button is disabled, THE Pagination_Component SHALL reduce text opacity to indicate non-interactivity

### Requirement 6: Manage Disabled Button States

**User Story:** As an admin, I want visual feedback for inactive pagination buttons, so that I know I cannot navigate further in that direction.

#### Acceptance Criteria

1. WHEN a button is disabled, THE Pagination_Component SHALL set cursor-not-allowed on hover
2. WHEN a button is disabled, THE Pagination_Component SHALL reduce text opacity to 50%
3. WHEN a button is disabled, THE Pagination_Component SHALL reduce border opacity to 50%
4. WHEN a button is disabled, THE Pagination_Component SHALL not respond to click events
5. WHEN a button is disabled, THE Pagination_Component SHALL not show hover styling

### Requirement 7: Accept Configuration Props

**User Story:** As a developer, I want to configure the pagination component, so that I can customize its behavior for different use cases.

#### Acceptance Criteria

1. THE Pagination_Component SHALL accept a currentPage prop for page-based mode
2. THE Pagination_Component SHALL accept a totalPages prop for page-based mode
3. THE Pagination_Component SHALL accept nextCursor and previousCursor props for cursor-based mode
4. THE Pagination_Component SHALL accept itemsPerPage prop to display in item range text
5. THE Pagination_Component SHALL accept totalItems prop to display in item range text
6. THE Pagination_Component SHALL accept onNext callback for next button clicks
7. THE Pagination_Component SHALL accept onPrevious callback for previous button clicks
8. THE Pagination_Component SHALL accept className prop for additional styling

### Requirement 8: Handle Edge Cases

**User Story:** As a developer, I want the component to handle edge cases gracefully, so that it doesn't break with unexpected data.

#### Acceptance Criteria

1. IF currentPage is less than 1 or greater than totalPages, THEN THE Pagination_Component SHALL log a console warning
2. IF both cursor-based and page-based props are provided simultaneously, THEN THE Pagination_Component SHALL prioritize cursor-based mode
3. WHEN no props are provided, THE Pagination_Component SHALL render a disabled state with no data displayed
4. WHEN itemsPerPage is 0, THE Pagination_Component SHALL display a warning state

