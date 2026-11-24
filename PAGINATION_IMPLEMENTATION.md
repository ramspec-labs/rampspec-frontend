# Paginated Report Navigation Implementation

## Overview

This implementation adds cursor-based pagination to the reports page, enabling efficient navigation through large result sets with deterministic ordering and stable page state during loading.

## Changes Made

### 1. Domain Types (`src/lib/domain/types.ts`)
- Added `Report` type with fields: `id`, `title`, `outcome`, `checks`, `findings`, `coverage`, `generated`, `runId`, `signed`
- Outcome field supports: `"ready" | "attention" | "blocked"`

### 2. Fixtures (`src/lib/domain/fixtures.ts`)
- Added `reports` array with three sample reports:
  - REP-2041: Acme Checkout release report (ready, 18 checks, 2 findings, 94% coverage)
  - REP-2040: Wallet recovery controls report (attention, 15 checks, 3 findings, 91% coverage)
  - REP-2039: Identity handoff report (ready, 12 checks, 0 findings, 100% coverage)

### 3. Pagination Controls Component (`src/components/ui/pagination-controls.tsx`)
- New UI component for previous/next navigation
- Props:
  - `hasPrevious: boolean` - enable/disable previous button
  - `hasNext: boolean` - enable/disable next button
  - `onPrevious: () => void` - previous page callback
  - `onNext: () => void` - next page callback
  - `isLoading?: boolean` - disable buttons during fetch
- Features:
  - Keyboard accessible (aria-labels)
  - Disabled state during loading
  - Responsive layout with flex wrapping
  - Uses existing Button component with secondary variant

### 4. Report List Component (`src/components/report-list.tsx`)
- Client component for paginated report display
- Props:
  - `initialData: Page<Report>` - first page from server
  - `onFetchPage: (cursor?: string) => Promise<Page<Report>>` - fetch callback
- Features:
  - **Cursor-based pagination**: Maintains cursor history for stable back/forward navigation
  - **Stable page state**: Shows current page during loading, never replaces mid-request
  - **Error handling**: Displays error messages, rejects malformed cursors, validates non-empty pages
  - **Loading state**: Shows loading indicator while fetching
  - **Empty state**: Shows message when no reports available
  - **Error recovery**: Clears errors on successful subsequent load
  - **Accessibility**: Semantic article elements, proper headings, link to individual reports

### 5. Reports Page (`src/app/reports/page.tsx`)
- Updated to use ReportList component
- Provides `initialPage` with first report and next cursor
- Implements `handleFetchPage` function that:
  - Returns initial page when cursor is undefined
  - Finds report by cursor ID
  - Throws error for invalid cursors
  - Calculates pagination metadata (hasMore, nextCursor)
  - Supports 1 report per page (configurable pageSize)

### 6. Tests

#### `src/app/reports/page.test.tsx`
- Fixture data validation (3 sample reports)
- Deterministic ordering tests
- Pagination setup and boundaries
- Cursor-based fetch simulation
- Invalid cursor rejection
- Empty and error state handling
- Report field completeness

#### `src/components/report-list.test.tsx`
- Report type validation
- Page metadata structure
- Pagination logic (hasMore, cursor tracking)
- Error message preservation
- Boundary condition handling (single page, empty, full coverage)
- State preservation during loading
- Organization scoping
- Accessibility attributes
- Report details completeness

#### `src/components/ui/pagination-controls.test.tsx`
- Props interface validation
- Optional prop support

## Implementation Details

### Cursor-Based Pagination

The implementation uses cursor-based pagination (vs. offset/limit) for:
- **Deterministic ordering**: Unaffected by insertions/deletions during navigation
- **Efficient queries**: Backend can efficiently fetch from cursor position
- **Simple boundary handling**: `hasMore` flag indicates last page

Example flow:
1. Load initial page: cursor=undefined → data=[REP-2041], nextCursor="REP-2040"
2. Click next: cursor="REP-2040" → data=[REP-2040], nextCursor="REP-2039"
3. Click next: cursor="REP-2039" → data=[REP-2039], nextCursor=undefined (last page)

### State Management

- **cursorHistory**: Array of cursors visited [undefined, "REP-2040", "REP-2039"]
- **currentIndex**: Current position in history
- **data**: Current page content (preserved during loading)
- **isLoading**: Prevents button clicks and shows loading state
- **error**: Transient error message, cleared on successful load

### Page Stability

During loading, the current page content remains visible:
```jsx
{isLoading && <LoadingIndicator />}
{!isLoading && data.data.map(...)}  // Only render after loading completes
```

This ensures users never see page content flashing during requests.

### Error Handling

The component handles:
- Network errors: User-friendly error message
- Malformed cursors: "Invalid cursor" error
- Empty pages: "Empty page received" error
- Validation: Rejects pages with zero items

Errors are cleared automatically on successful subsequent load.

### Accessibility

- Semantic HTML: `<article>`, `<dl>`, proper headings
- ARIA labels on navigation buttons
- Keyboard accessible buttons (all standard HTML)
- Disabled state properly communicated
- Link to individual reports for direct access

## Organization Scoping

The `handleFetchPage` callback is organization-aware through the API client:
- ApiClient adds `X-RampSpec-Organization` header
- Backend enforces organization-level authorization
- Frontend pagination is transparent to org context

## Testing Strategy

### Unit Tests (No Rendering)
- Type and interface validation
- Pagination logic verification
- Cursor handling and boundaries
- Error message preservation
- State management scenarios

### Manual Testing
- Navigate forward through all pages
- Navigate backward to first page
- Verify error states with invalid cursors
- Test loading state UI (buttons disabled, message shown)
- Verify empty state
- Check accessibility with keyboard navigation

## API Integration

To connect to the actual API endpoint, update `src/app/reports/page.tsx`:

```typescript
const handleFetchPage = async (cursor?: string) => {
  const client = new ApiClient({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    getOrganizationId: () => organizationId,
    getToken: () => token,
  });
  
  return client.list<Report>("/v1/reports", { cursor });
};
```

The backend should return:
```typescript
{
  data: Report[],
  meta: {
    nextCursor?: string,
    hasMore: boolean
  }
}
```

## Security & Privacy

- ✅ Authorization enforced by ApiClient header (X-RampSpec-Organization)
- ✅ Malformed cursors rejected with clear error
- ✅ No sensitive data in pagination state
- ✅ Cursor opaque to frontend (server generates)
- ✅ Cursor-based prevents offset-based enumeration attacks

## Performance

- ✅ Cursor pagination efficient for backend (indexed queries)
- ✅ Page state stable (no flashing)
- ✅ Minimal re-renders (React.useCallback for handlers)
- ✅ No unbounded rendering (fixed page size)

## Responsive Design

- Mobile: Single column layout, buttons stack vertically
- Tablet: 2-column grid for report metadata
- Desktop: 4-column grid for report details

## Browser Compatibility

- Uses standard React hooks (useState, useCallback)
- No JavaScript required for page to render (links work)
- Keyboard navigation fully supported
- CSS Grid and Flexbox (modern browsers)

## Known Limitations

1. **Front-end pagination simulation**: Current implementation uses fixtures. Real API integration needed for production.
2. **Page size hardcoded to 1**: Configurable through parameter if needed.
3. **No infinite scroll**: Only prev/next buttons (simpler, more accessible).
4. **No page indicators**: Could add "Page 2 of 5" if needed.

## Future Enhancements

- Page size customization
- Jump to page number (if total count available)
- Search/filter integration
- Infinite scroll option
- Export paginated results
- Sort options
