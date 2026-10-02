# @qts/app-chrome

Shared application chrome for QTS business apps.

Use this package for the top application header across Portal, HRM, and future apps so search, app switching, notifications, and profile behavior stay consistent.

## Usage

```tsx
import { AppHeader } from "@qts/app-chrome";
import "@qts/app-chrome/styles.css";

<AppHeader
  searchPlaceholder="Tìm hồ sơ, nghiệp vụ"
  onSearch={openCommandPalette}
  applications={applications}
  user={{ name: "Super Admin", email: "superadmin@qts.com", role: "super-admin" }}
  onLogout={logout}
/>;
```

Apps should pass only data and callbacks. The package owns layout, dropdown behavior, keyboard closing, responsive treatment, and shared visual styling.
