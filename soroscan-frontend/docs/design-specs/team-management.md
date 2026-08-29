# Team Management UI Specs
**Issue:** #998 

## Role Permission Matrix
| Role | Access Level | Data Export | API Key Generation | Invite Users |
| :--- | :--- | :--- | :--- | :--- |
| **Owner** | Full System Control | Yes | Yes | Yes (All roles) |
| **Admin** | Workspace Management | Yes | Yes | Yes (Devs, Viewers) |
| **Developer** | Integration & Setup | No | Yes | No |
| **Viewer** | Read-Only | No | No | No |

## Components
*   **Team Table:** Renders users with avatar, email, current role (Dropdown), and a 'Revoke Access' action.
*   **Invite Modal:** Uses the updated `<Modal>` component with a `Dark Backdrop`. Includes email input block and Role selection radio group.
*   **API Key Management Panel:** Includes masking (`****-****`) with a reveal toggle and click-to-copy functionality.