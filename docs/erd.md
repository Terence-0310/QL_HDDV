# ERD Overview

```mermaid
erDiagram
  User ||--o{ Contract : owns
  User ||--o{ Contract : approves
  User ||--o{ AuditLog : writes
  User ||--o{ Notification : receives
  Contract ||--o{ ReminderLog : has
  Contract ||--o{ Contract : renews_to

  User {
    string id PK
    string name
    string email UK
    string passwordHash
    enum role
    enum status
    datetime createdAt
    datetime updatedAt
  }

  Contract {
    string id PK
    string code UK
    string title
    string partnerName
    string partnerEmail
    float value
    datetime startDate
    datetime endDate
    enum status
    enum approvalStatus
    string ownerId FK
    string approvedById FK
    string parentContractId FK
    int renewalVersion
    datetime renewedAt
    string fileUrl
    string fileName
    string fileMimeType
    int fileSize
    datetime uploadedAt
    datetime createdAt
    datetime updatedAt
  }

  ReminderLog {
    string id PK
    string contractId FK
    enum reminderType
    string sentTo
    datetime sentAt
    enum status
    string message
    datetime createdAt
  }

  Notification {
    string id PK
    string userId FK
    enum type
    string title
    string message
    bool isRead
    datetime readAt
    enum relatedEntityType
    string relatedEntityId
    datetime createdAt
  }

  AuditLog {
    string id PK
    string userId FK
    string action
    string entityType
    string entityId
    json metadata
    datetime createdAt
  }
```

## Notes

- Contract lifecycle and approval are intentionally split (`status` vs `approvalStatus`) to avoid state conflicts.
- Renewal uses a self-relation strategy for historical traceability (`parentContractId` + `renewalVersion`).
