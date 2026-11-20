# T-support-reports — Problem and feedback reports with images
- Status: done (2026-11-21, 1f563af on develop and main; phone screens not built)
- Context: user request 2026-11-21 ("a report system where people can attach images"); chose problem/feedback
  reports with two-way replies and status. Server and decision: ADR support-1 in Ri-dha/mizan.
- Notes: web `/support`, `/support/new`, `/support/:id` and the admin **Reports** tab. Images are shrunk and
  re-encoded on the device (`features/support/prepareImage.ts`) and fetched with the bearer token into blob
  URLs. The reply push opens `/support/<id>`. The phone app screens are not built yet.
