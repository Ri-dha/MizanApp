# T-support-reports — Problem and feedback reports with images
- Status: done (2026-11-21, 1f563af on develop and main; phone screens on `feat/mobile-reports`)
- Context: user request 2026-11-21 ("a report system where people can attach images"); chose problem/feedback
  reports with two-way replies and status. Server and decision: ADR support-1 in Ri-dha/mizan.
- Notes: web `/support`, `/support/new`, `/support/:id` and the admin **Reports** tab. Images are shrunk and
  re-encoded on the device (`features/support/prepareImage.ts`) and fetched with the bearer token into blob
  URLs. The reply push opens `/support/<id>`.
- Phone (`feat/mobile-reports`): More → Report a problem, `mobile/src/screens/support/`. Images come from the
  system picker (no permission), shrunk to 1600 px JPEG 0.82 by `expo-image-manipulator` and sent as multipart
  file parts (`platform/support.ts`, through `authorisedSend`, not openapi-fetch). A reply push to
  `/support/<id>` opens that report; the manual page links to the list.
