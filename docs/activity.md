# Activity Flow: Contract Approval Lifecycle

```mermaid
flowchart TD
  A[Contract Draft] --> B{Submit for approval?}
  B -- No --> A
  B -- Yes --> C[approvalStatus = PENDING]
  C --> D{Approver action}
  D -- Approve --> E[approvalStatus = APPROVED]
  D -- Reject with reason --> F[approvalStatus = REJECTED]
  E --> G{Contract status is DRAFT?}
  G -- Yes --> H[status becomes ACTIVE]
  G -- No --> I[keep existing lifecycle status]
  F --> J[Owner updates and may resubmit]
  J --> B
```

## Business Guardrails

- Already `PENDING` contracts cannot be resubmitted.
- Already `APPROVED` contracts cannot be resubmitted.
- Only `PENDING` contracts can be approved or rejected.
- Rejection requires a reason.
