# AIVORA Frontend Completion Design

**Date**: 2026-06-01
**Scope**: Complete frontend overhaul — all 29 identified issues
**Backend**: Untouched (read-only reference)

## Architecture Decisions

### 1. Shared Utilities (NEW)
Create `src/utils/` for duplicated logic:
- `statusMappers.ts` — unified `getStatusBadge()` and `getStatusText()` for Job, Project, Milestone, Proposal, Dispute, Payment enums
- `formatters.ts` — currency, date formatting
- `validators.ts` — form validation helpers

### 2. Shared Components (NEW)
Create `src/components/ui/`:
- `ConfirmDialog.tsx` — reusable "Are you sure?" modal for destructive actions
- `Toast.tsx` + `ToastContext.tsx` — global notification system replacing `alert()` calls
- `ErrorBoundary.tsx` — React error boundary wrapper

### 3. Inline Style Migration
Migrate ALL inline `style={{...}}` to use the EXISTING CSS classes already defined in `index.css`:
- `.glass-panel`, `.glass-card`, `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-success`, `.btn-lg`
- `.badge`, `.badge-primary`, `.badge-success`, `.badge-danger`, `.badge-warning`, `.badge-muted`
- `.input-field`, `.input-label`
- `.section-title`, `.section-desc`
- `.skeleton`, `.skeleton-card`, `.skeleton-text`, `.skeleton-title`
- `.spinner`
- `.timeline-container`, `.timeline-node`, `.timeline-node.active`, `.timeline-node.completed`, `.timeline-node.disputed`
- `.chat-bubble`, `.chat-bubble.sent`, `.chat-bubble.received`
- `.glow-panel-indigo`, `.glow-panel-emerald`
- `.nav-link`, `.nav-link.active`
- `.dashboard-grid`, `.sidebar`, `.main-content`

### 4. Responsive Design
Add media queries to `index.css`:
- `< 1024px`: Dashboard grid → single column, sidebar collapses to top nav
- `< 768px`: All grids → single column, chat layout stacks vertically
- `< 480px`: Font sizes scale down, padding reduces

### 5. Route Guards (NEW)
Create `src/components/ProtectedRoute.tsx`:
- Checks `useAuth()` for authentication
- Checks role matches route prefix (`/client/*`, `/expert/*`, `/admin/*`)
- Redirects to `/login` or appropriate dashboard

## Issue-by-Issue Fix Plan

### 🔴 Critical (6)

| # | File | Fix |
|---|------|-----|
| 1 | JobCreateWizard.tsx | Fix `budgetType` to send string, fix `deadline` format, add `experienceLevel`/`visibility` controls |
| 2 | JobDetailView.tsx | Fix proposal acceptance response parsing |
| 3 | ClientProjectView.tsx | Fix review submission field names |
| 4 | FindJobs.tsx | Fix proposal submission field names to match backend DTO |
| 5 | ExpertProjectView.tsx | Fix deliverable submission field names |
| 6 | ChatPage.tsx | Fix `setWebstateLabel` → `setWebsocketLabel` typo |

### 🟡 Major (8)

| # | File | Fix |
|---|------|-----|
| 7 | ALL pages | Refactor inline styles → CSS classes |
| 8 | index.css + ALL pages | Add responsive media queries + mobile nav |
| 9 | PortalLayout.tsx | Add wallet balance caching, reduce API calls |
| 10 | AuthContext.tsx | Add error state to context |
| 11 | ClientDashboard.tsx | Unified error handling for parallel fetches |
| 12 | AdminDashboard.tsx | Robust status type handling |
| 13 | DisputeArbitration.tsx | Fix slider/type sync |
| 14 | Shared | Extract status mappers to shared utility |

### 🟠 Moderate (10)

| # | File | Fix |
|---|------|-----|
| 15 | LandingPage.tsx | Add retry mechanism + "data unavailable" state |
| 16 | LoginPage.tsx | Add password reset flow or remove dead link |
| 17 | RegisterPage.tsx | Add password confirmation field |
| 18 | ChatPage.tsx | Add date separators + typing indicator |
| 19 | ExpertWallet.tsx | Add deposit form (or note it's expert-only) |
| 20 | ExpertProfileEdit.tsx | Add file upload for avatar |
| 21 | JobCreateWizard.tsx | Add edit capability for AI suggestions |
| 22 | Global | Add Toast notification system |
| 23 | Global | Add ConfirmDialog for destructive actions |
| 24 | App.tsx | Add ProtectedRoute guards |

### 🔵 Minor (5)

| # | File | Fix |
|---|------|-----|
| 25 | index.css | Fix `.glow-panel-emerald` HSL values |
| 26 | index.css | Remove unused classes or use them |
| 27 | App.css | Delete empty file |
| 28 | main.tsx | Add ErrorBoundary wrapper |
| 29 | api.ts | Remove unused `PaginatedResult` or use it |

## File Changes Summary

### New Files (7)
- `src/utils/statusMappers.ts`
- `src/utils/formatters.ts`
- `src/utils/validators.ts`
- `src/components/ui/ConfirmDialog.tsx`
- `src/components/ui/Toast.tsx`
- `src/context/ToastContext.tsx`
- `src/components/ProtectedRoute.tsx`

### Modified Files (20)
- `src/index.css` — responsive queries, fix HSL, add mobile nav styles
- `src/main.tsx` — add ErrorBoundary
- `src/App.tsx` — add ProtectedRoute guards
- `src/App.css` — delete
- `src/components/PortalLayout.tsx` — wallet caching, mobile nav, use CSS classes
- `src/context/AuthContext.tsx` — add error state
- `src/pages/LandingPage.tsx` — retry logic, CSS classes
- `src/pages/LoginPage.tsx` — remove dead link, CSS classes
- `src/pages/RegisterPage.tsx` — confirm password, CSS classes
- `src/pages/ChatPage.tsx` — date separators, typing indicator, fix typo, CSS classes
- `src/pages/client/ClientDashboard.tsx` — unified errors, CSS classes
- `src/pages/client/ClientProjectView.tsx` — fix review fields, confirm dialogs, CSS classes
- `src/pages/client/JobCreateWizard.tsx` — fix form fields, AI edit, CSS classes
- `src/pages/client/JobDetailView.tsx` — fix proposal acceptance, CSS classes
- `src/pages/client/ClientWallet.tsx` — CSS classes
- `src/pages/expert/ExpertDashboard.tsx` — CSS classes
- `src/pages/expert/ExpertProfileEdit.tsx` — avatar upload, CSS classes
- `src/pages/expert/ExpertProjectView.tsx` — fix deliverable fields, CSS classes
- `src/pages/expert/ExpertWallet.tsx` — CSS classes
- `src/pages/expert/FindJobs.tsx` — fix proposal fields, CSS classes
- `src/pages/admin/AdminDashboard.tsx` — robust status handling, CSS classes
- `src/pages/admin/DisputeArbitration.tsx` — slider sync, CSS classes
