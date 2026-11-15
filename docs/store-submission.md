# Garage Forge — App Store & Play Console answers

Use these as starting answers when filling store forms. Adjust if your API retains export payloads or you add analytics/accounts.

**Before submitting**

1. ~~Host the privacy policy at a stable HTTPS URL.~~ Done: https://garage-forge-web-production.up.railway.app/privacy-policy (served by `garage-forge-web`).
2. ~~Set `PRIVACY_POLICY_URL` in `src/config/index.ts`.~~ Done.
3. ~~Add a contact email to the hosted policy.~~ Done.
4. Confirm export retention with your backend (policy assumes no retention after PDF generation). The backend generates the PDF in memory and does not store it.
5. Before launch, consider a custom domain so the policy URL does not change if hosting moves.

Package / bundle ID: `com.garageforge.app`

---

## Apple App Store Connect

### Privacy Policy URL

https://garage-forge-web-production.up.railway.app/privacy-policy

### App Privacy (nutrition labels)

| Data type | Collected? | Linked to user? | Used for tracking? | Purposes |
|---|---|---|---|---|
| Other User Content (vehicles, parts, notes, optional VIN, budget-related settings sent on Export) | Yes | No (no accounts) | No | App Functionality |
| Product Interaction (e.g. region used for catalog requests) | Yes | No | No | App Functionality |
| Contact Info / Name / Email / Phone | No | — | — | — |
| Location | No | — | — | — |
| Diagnostics / Crash Data | No (unless you add a crash SDK later) | — | — | — |
| Identifiers (User ID / Device ID for tracking) | No | — | — | — |
| Advertising Data | No | — | — | — |

Tracking: **No** (matches `NSPrivacyTracking = false` in the privacy manifest).

### Age rating

Utility / lifestyle productivity style questionnaire — typically **4+** if you answer no to restricted content categories. Complete Apple’s questionnaire honestly.

### Export compliance (encryption)

Uses standard HTTPS only. Usually eligible for the common “exempt encryption” / HTTPS-only path. Follow the current App Store Connect questions; do not claim custom encryption you do not implement.

### Support / contact

Provide a working support URL or email. Same contact as the privacy policy is fine.

### Listing copy reminders

- Do not promise accounts, cloud sync, push notifications, or licenses screen until those ship.
- Do not imply OEM endorsement when using make/model names.

---

## Google Play Console

### Privacy Policy URL

Same hosted URL as Apple.

### Data safety form

| Question | Suggested answer |
|---|---|
| Does your app collect or share user data? | **Yes** |
| Is all user data encrypted in transit? | **Yes** (HTTPS) |
| Can users request deletion? | Users can clear local garage data in-app and uninstall. Server deletion only applies if you retain export/catalog-related data — say so accurately. |
| Data encrypted at rest on device by you? | **Do not claim** on-device encryption (AsyncStorage). |

### Data types to declare

- **User-generated content**: vehicles, parts, notes, costs, optional VIN (sent when user exports; stored on device otherwise)
- **App activity / product interaction**: region (and similar) for catalog requests
- **Personal info**: only if you treat VIN or similar as such in your answers — disclose if collected/exported

### Data sharing

- Declare sharing/processing by your hosting provider if personal/user content is processed on that infrastructure for PDF generation or API hosting.
- No advertising SDKs / no sale of data (current app).

### Permissions

Internet only for network features. No location, camera, microphone, or contacts in the current manifest.

### Content rating

Complete IARC questionnaire for a utility / vehicle maintenance tracker with no violence, gambling, etc.

---

## Manual smoke checklist (before upload)

- [ ] Uninstall any old build with `com.garageforge`, then install `com.garageforge.app`
- [ ] Add vehicle → add parts → set budget → Export → confirm alert → share PDF
- [ ] Clear garage
- [ ] Settings → About → Privacy Policy opens the live URL
- [ ] Confirm Licenses is not reachable from UI
- [ ] Confirm Account / API / Data & storage are not user-facing stubs

## Release notes

Welcome to Garage Forge — track vehicles, parts, and your monthly garage budget in one place.

Bug fixes and improvements to keep Garage Forge running smoothly.

- Release signing and store readiness updates
- Privacy Policy link in About
- Export confirmation before sending data to generate a PDF