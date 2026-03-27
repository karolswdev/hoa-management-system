# Glossary

| Term | Definition |
|------|-----------|
| **ARC** | Architectural Review Committee. The first committee type in the system, responsible for reviewing exterior modification requests. |
| **Committee** | A generic organizational entity consisting of appointed members who review and make decisions on requests assigned to them. |
| **Committee Chair** | A committee member with a leadership designation. In MVP, functionally identical to a regular committee member for authorization purposes. |
| **Committee Member** | A user who has been appointed to a committee by an admin. Can review and make decisions on requests assigned to their committee. |
| **Workflow Instance** | A single run of the approval workflow engine, tracking the lifecycle of one request from submission to resolution. |
| **Workflow Transition** | A recorded state change within a workflow instance (e.g., from `submitted` to `under_review`). Immutable once created. |
| **Polymorphic Reference** | A design pattern where a table references different entity types via a discriminator column (`request_type`) and a foreign key (`request_id`). |
| **Domain-Specific Request Type** | A concrete request entity (e.g., ARC Request) that uses the generic workflow engine. Each type has its own table with domain-specific fields. |
| **Expiration** | The optional automatic transition of an approved request to `expired` status after a configured time period. |
| **Appeal** | A single opportunity for a submitter to contest a denied request, reopening it for committee review. |
| **Internal Comment** | A comment on a workflow instance that is visible only to committee members and admins, hidden from the submitter. |
| **Quorum** | (Mid-Maturity) The minimum number of committee member votes required before a decision can be finalized. |
| **Lazy Evaluation** | (MVP) Checking for expired approvals at read time rather than via a scheduled background process. |
