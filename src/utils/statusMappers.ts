// Unified status mappers for all entity types
// Backend enums: https://github.com/.../Backend/Aivora.Repositories/Enums/

// ============ JOB STATUS ============
// Backend: DRAFT(0), OPEN(1), IN_PROGRESS(2), COMPLETED(3), CANCELLED(4), CLOSED(5)
export type JobStatus = string | number;

export function getJobStatusBadge(status: JobStatus): string {
  const s = String(status).toUpperCase();
  switch (s) {
    case '0': case 'DRAFT': return 'badge-muted';
    case '1': case 'OPEN': return 'badge-primary';
    case '2': case 'IN_PROGRESS': return 'badge-warning';
    case '3': case 'COMPLETED': return 'badge-success';
    case '4': case 'CANCELLED': return 'badge-danger';
    case '5': case 'CLOSED': return 'badge-muted';
    default: return 'badge-muted';
  }
}

export function getJobStatusText(status: JobStatus): string {
  const s = String(status).toUpperCase();
  switch (s) {
    case '0': case 'DRAFT': return 'Draft';
    case '1': case 'OPEN': return 'Open';
    case '2': case 'IN_PROGRESS': return 'In Progress';
    case '3': case 'COMPLETED': return 'Completed';
    case '4': case 'CANCELLED': return 'Cancelled';
    case '5': case 'CLOSED': return 'Closed';
    default: return 'Unknown';
  }
}

// ============ PROJECT STATUS ============
// Backend: PENDING_PAYMENT(0), ACTIVE(1), IN_REVIEW(2), DISPUTED(3), COMPLETED(4), CANCELLED(5)
export type ProjectStatus = string | number;

export function getProjectStatusBadge(status: ProjectStatus): string {
  const s = String(status).toUpperCase();
  switch (s) {
    case '0': case 'PENDING_PAYMENT': return 'badge-muted';
    case '1': case 'ACTIVE': return 'badge-primary';
    case '2': case 'IN_REVIEW': return 'badge-warning';
    case '3': case 'DISPUTED': return 'badge-danger';
    case '4': case 'COMPLETED': return 'badge-success';
    case '5': case 'CANCELLED': return 'badge-danger';
    default: return 'badge-muted';
  }
}

export function getProjectStatusText(status: ProjectStatus): string {
  const s = String(status).toUpperCase();
  switch (s) {
    case '0': case 'PENDING_PAYMENT': return 'Pending Payment';
    case '1': case 'ACTIVE': return 'Active';
    case '2': case 'IN_REVIEW': return 'In Review';
    case '3': case 'DISPUTED': return 'Disputed';
    case '4': case 'COMPLETED': return 'Completed';
    case '5': case 'CANCELLED': return 'Cancelled';
    default: return 'Unknown';
  }
}

// ============ MILESTONE STATUS ============
// Backend: CREATED(0), FUNDED(1), IN_PROGRESS(2), SUBMITTED(3), REVISION_REQUESTED(4), APPROVED(5), DISPUTED(6), PAID(7), REFUNDED(8)
export type MilestoneStatus = string | number;

export function getMilestoneStatusBadge(status: MilestoneStatus): string {
  const s = String(status).toUpperCase();
  switch (s) {
    case '0': case 'CREATED': return 'badge-muted';
    case '1': case 'FUNDED': return 'badge-primary';
    case '2': case 'IN_PROGRESS': return 'badge-warning';
    case '3': case 'SUBMITTED': return 'badge-warning';
    case '4': case 'REVISION_REQUESTED': return 'badge-warning';
    case '5': case 'APPROVED': return 'badge-success';
    case '7': case 'PAID': return 'badge-success';
    case '6': case 'DISPUTED': return 'badge-danger';
    case '8': case 'REFUNDED': return 'badge-danger';
    default: return 'badge-muted';
  }
}

export function getMilestoneStatusText(status: MilestoneStatus): string {
  const s = String(status).toUpperCase();
  switch (s) {
    case '0': case 'CREATED': return 'Created';
    case '1': case 'FUNDED': return 'Funded';
    case '2': case 'IN_PROGRESS': return 'In Progress';
    case '3': case 'SUBMITTED': return 'Submitted';
    case '4': case 'REVISION_REQUESTED': return 'Revision Requested';
    case '5': case 'APPROVED': return 'Approved';
    case '6': case 'DISPUTED': return 'Disputed';
    case '7': case 'PAID': return 'Paid';
    case '8': case 'REFUNDED': return 'Refunded';
    default: return 'Unknown';
  }
}

// ============ PROPOSAL STATUS ============
// Backend: SUBMITTED(0), SHORTLISTED(1), ACCEPTED(2), REJECTED(3), WITHDRAWN(4)
export type ProposalStatus = string | number;

export function getProposalStatusBadge(status: ProposalStatus): string {
  const s = String(status).toUpperCase();
  switch (s) {
    case '0': case 'SUBMITTED': case 'PENDING': return 'badge-muted';
    case '1': case 'SHORTLISTED': return 'badge-primary';
    case '2': case 'ACCEPTED': return 'badge-success';
    case '3': case 'REJECTED': return 'badge-danger';
    case '4': case 'WITHDRAWN': return 'badge-danger';
    default: return 'badge-muted';
  }
}

export function getProposalStatusText(status: ProposalStatus): string {
  const s = String(status).toUpperCase();
  switch (s) {
    case '0': case 'SUBMITTED': case 'PENDING': return 'Submitted';
    case '1': case 'SHORTLISTED': return 'Shortlisted';
    case '2': case 'ACCEPTED': return 'Accepted';
    case '3': case 'REJECTED': return 'Rejected';
    case '4': case 'WITHDRAWN': return 'Withdrawn';
    default: return 'Unknown';
  }
}

// ============ DISPUTE STATUS ============
// Backend: OPEN(0), UNDER_REVIEW(1), RESOLVED(2), CLOSED(3)
export type DisputeStatus = string | number;

export function getDisputeStatusBadge(status: DisputeStatus): string {
  const s = String(status).toUpperCase();
  switch (s) {
    case '0': case 'OPEN': case 'ACTIVE': return 'badge-danger';
    case '1': case 'IN_REVIEW': case 'UNDER_REVIEW': return 'badge-warning';
    case '2': case 'RESOLVED': return 'badge-success';
    case '3': case 'CLOSED': return 'badge-muted';
    default: return 'badge-muted';
  }
}

export function getDisputeStatusText(status: DisputeStatus): string {
  const s = String(status).toUpperCase();
  switch (s) {
    case '0': case 'OPEN': return 'Open';
    case '1': case 'UNDER_REVIEW': return 'Under Review';
    case '2': case 'RESOLVED': return 'Resolved';
    case '3': case 'CLOSED': return 'Closed';
    default: return 'Unknown';
  }
}

// ============ PAYMENT / WALLET TRANSACTION TYPE ============
// Backend: DEMO_DEPOSIT(0), ESCROW_HOLD(1), PAYMENT_RELEASE(2), REFUND(3), WITHDRAWAL_REQUEST(4), WITHDRAWAL_COMPLETED(5)
export type TransactionType = string | number;

export function getTransactionTypeBadge(type: TransactionType): string {
  const t = mapTransactionType(type).toUpperCase();
  switch (t) {
    case 'DEMO_DEPOSIT': return 'badge-primary';
    case 'ESCROW_LOCK': case 'ESCROW_HOLD': return 'badge-warning';
    case 'ESCROW_RELEASE': case 'PAYMENT_RELEASE': return 'badge-success';
    case 'ESCROW_REFUND': case 'REFUND': return 'badge-danger';
    default: return 'badge-muted';
  }
}

export function mapTransactionType(type: TransactionType): string {
  if (typeof type === 'number') {
    switch (type) {
      case 0: return 'DEMO_DEPOSIT';
      case 1: return 'ESCROW_HOLD';
      case 2: return 'PAYMENT_RELEASE';
      case 3: return 'REFUND';
      case 4: return 'WITHDRAWAL_REQUEST';
      case 5: return 'WITHDRAWAL_COMPLETED';
      default: return 'UNKNOWN';
    }
  }
  return String(type || '');
}

export function mapTransactionDirection(direction: string | number): 'IN' | 'OUT' {
  if (typeof direction === 'number') {
    return direction === 0 ? 'IN' : 'OUT'; // CREDIT=0 → IN, DEBIT=1 → OUT
  }
  return direction === 'OUT' ? 'OUT' : 'IN';
}

// ============ HELPER: Is status resolved/closed? ============
export function isDisputeResolved(status: DisputeStatus): boolean {
  const s = String(status).toUpperCase();
  return s === 'RESOLVED' || s === '2' || s === 'CLOSED' || s === '3';
}

export function isMilestoneCompleted(status: MilestoneStatus): boolean {
  const s = String(status).toUpperCase();
  return s === 'APPROVED' || s === 'PAID' || s === '5' || s === '7';
}
