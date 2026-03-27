# ADR-0007: Workflow Attachments Stored Separately from Documents Table

- **Status:** Proposed
- **Date:** 2026-03-26
- **Scope:** System
- **Domain:** DATA / SEC
- **Tier:** MVP
- **Linked Requirements:** SYS-FUNC-014, SYS-FUNC-027, SYS-SEC-005, SYS-SEC-007*

## Context

The existing system has a `Documents` feature with its own model, service, controller, and routes. Documents are community-level files (meeting minutes, CC&Rs, bylaws) uploaded by admins, with optional public visibility and discussion threads attached. The `Document` model stores `title`, `description`, `file_name`, `original_file_name`, `file_path`, `mime_type`, `file_size`, `category`, `uploaded_by`, and `is_public`.

The new workflow engine needs file attachments for requests -- residents upload plans, photos, and PDFs supporting their ARC requests, and committee members may upload reference materials. These workflow attachments have fundamentally different access control, lifecycle, and semantics from community Documents.

The upload middleware (`upload.middleware.js`) uses multer with disk storage to `backend/uploads/documents/`. It validates MIME types (PDF, Word, JPEG, PNG, GIF) and enforces a 10MB limit.

## Decision Drivers (Ranked)

1. **Access control model** -- Documents are community-wide (public or authenticated). Workflow attachments are scoped to the request: only the submitter, committee members, and admins can access them (SYS-SEC-007*).
2. **Lifecycle coupling** -- Documents exist independently. Workflow attachments are meaningless outside their workflow instance.
3. **Schema differences** -- Documents have `title`, `description`, `category`, `is_public`, and a discussion association. Workflow attachments need `workflow_id`, `uploaded_by`, and file metadata only.
4. **Query patterns** -- Documents are browsed/searched community-wide. Workflow attachments are fetched as part of a workflow detail view.
5. **Reuse of upload infrastructure** -- The multer middleware, MIME validation, and size limits should be reused regardless of storage table.

## Options Considered

### Option A -- Separate workflow_attachments Table (Chosen)

A new `workflow_attachments` table stores files associated with workflow instances. Files are stored on disk in a separate directory (`backend/uploads/workflow-attachments/`). The existing multer middleware is reused for upload handling with a different destination path.

- **Pros:**
  - Access control is straightforward: the workflow attachment routes enforce workflow-level authorization. No risk of Documents authorization leaking into workflow files or vice versa.
  - Schema is clean and purpose-built. No nullable columns or type discriminators.
  - Workflow attachments can be queried efficiently by `workflow_id` without filtering out unrelated document types.
  - Deletion/archival of workflow data does not affect community Documents.
  - File storage is organized: `uploads/documents/` for community files, `uploads/workflow-attachments/` for workflow files.
- **Cons:**
  - Two tables store file metadata with overlapping column patterns (`file_name`, `original_file_name`, `file_path`, `mime_type`, `file_size`). This is acceptable duplication -- the schemas serve different purposes.
  - Upload middleware configuration is duplicated (same MIME types, same size limit, different destination). This can be factored into a shared config if it becomes a maintenance issue.

### Option B -- Reuse the Documents Table with a Type Discriminator

Add a `document_type` column to the existing `Documents` table (e.g., `'community'` or `'workflow_attachment'`) and a nullable `workflow_id` FK.

- **Pros:**
  - Single table for all files. DRY in terms of schema.
- **Cons:**
  - Access control becomes complex: the Documents service must check whether a document is a community document or a workflow attachment and apply different authorization rules.
  - The Documents model gains nullable columns (`workflow_id`, unused `title`/`description` for workflow attachments, unused `category`).
  - Existing Document queries (community file listing, search) must filter out workflow attachments.
  - The `Document` model's associations (discussions) do not apply to workflow attachments.
  - Couples two independent features at the data layer.

### Option C -- Polymorphic Attachments Table (Shared by Documents and Workflows)

A single `attachments` table with a polymorphic `attachable_type` + `attachable_id` pattern.

- **Pros:**
  - Maximally generic. Could serve Documents, Workflows, and future features.
- **Cons:**
  - Over-engineered for the current needs. Documents and workflow attachments have different schemas, access models, and lifecycles.
  - Same polymorphic FK integrity issues as described in ADR-0002, but applied to a domain where the two types have divergent requirements.
  - Existing Document features would need migration to the new table.

## Decision

Adopt **Option A: Separate workflow_attachments Table**.

Workflow attachments are stored in a dedicated `workflow_attachments` table (as specified in SRS Section 8.1) with files on disk at `backend/uploads/workflow-attachments/`. The existing `upload.middleware.js` multer configuration is reused for MIME validation and size limits, with a configurable destination path for workflow uploads.

## Consequences

### Positive
- Clean separation of concerns. Documents and workflow attachments are independent features with independent access control.
- No migration or modification of the existing Documents feature.
- The `workflow_attachments` table is optimized for its access pattern (lookup by `workflow_id`).

### Negative
- Some schema overlap between `documents` and `workflow_attachments` tables. This is intentional and acceptable.
- Disk storage is split across two directories. Monitoring and cleanup must account for both.
- File storage on a 1GB Linode is a shared concern (see ADR-0008).

## Rollback / Exit Strategy

Merging the tables later (Option B or C) is possible via migration, but there is no clear benefit. The separate-table approach is stable and does not create a refactoring debt.

## Links

- SRS: SYS-FUNC-014, SYS-FUNC-027, Section 8.1 (workflow_attachments schema), Section 12 (Documents integration note)
- ICD: Section 2.2 (Workflow Attachment endpoints)
- Existing code: `backend/models/document.model.js`, `backend/src/middlewares/upload.middleware.js`
- Related ADRs: ADR-0008 (SQLite Constraints)
