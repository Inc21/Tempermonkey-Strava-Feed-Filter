# Install Strava Feed Filter on iOS & iPadOS (Orion Browser)

Strava Feed Filter (SFF) no longer ships a dedicated Safari-only userscript. Instead, you get the **full Chrome/Firefox extension experience** on iPhone and iPad by using the [Orion browser](https://orionbrowser.com/), which supports desktop-class extensions. This guide walks through the new flow for both devices.

> ⚠️ **Legacy notice**: `userscript/sff-safari.user.js` is deprecated and will be removed in a future release. Please migrate to Orion as soon as possible for continued updates, dark mode, notification bell, and new filtering features.

## TL;DR

1. Install Orion from the App Store/TestFlight.
2. Enable extensions inside Orion and set Strava to “Always Request Desktop Site”.
3. Visit the Chrome Web Store (recommended) or Firefox Add-ons and install Strava Feed Filter.
4. Open Strava inside Orion, ensure the extension is enabled, and start filtering.

## Requirements

- iOS/iPadOS 16 or later (latest version recommended).
- Orion Browser by Kagi:
  - Website: [https://orionbrowser.com/](https://orionbrowser.com/)
  - App Store (stable): [https://apps.apple.com/app/orion-browser-by-kagi/id1484498200](https://apps.apple.com/app/orion-browser-by-kagi/id1484498200)
  - TestFlight (beta): follow the link on the Orion site if you prefer beta builds.
- Network access to the Chrome Web Store *or* Firefox Add-ons (desktop versions).

> These steps are identical for iPhone and iPad. Screenshots may differ slightly but every toggle lives under **Orion → Settings → Extensions**.

## Step 1 – Install Orion

1. Open the App Store on your iPhone/iPad and search for “Orion Browser by Kagi”.
2. Install the app and launch it once so iOS registers it as an available browser.
3. (Optional) If you are on TestFlight, accept the invite from orionbrowser.com and install the beta build the same way.

## Step 2 – Enable extensions & desktop mode

1. Inside Orion, tap the **⋯** (ellipses) button → **Settings** → **Extensions**.
2. Toggle **Allow Extensions** ON.
3. Under “Extension Stores”, enable the stores you plan to use (Chrome Web Store and/or Firefox Add-ons).
4. Back on any tab, tap the **aA / website menu** → **Request Desktop Site** → **On for strava.com**. (Desktop mode is required because both extension stores only load their install buttons on desktop.)

## Step 3 – Install via Chrome Web Store (recommended)

1. In Orion, open a new tab and visit the Strava Feed Filter listing:
   - [https://chromewebstore.google.com/detail/geihkfcdimdmlckcgkebcdajdlmeppff](https://chromewebstore.google.com/detail/geihkfcdimdmlckcgkebcdajdlmeppff)
2. If prompted, switch to Desktop Site (tap the **aA** icon → **Request Desktop Site**).
3. Tap **Add to Orion** → confirm when iOS asks for permission.
4. Orion downloads the extension and displays a confirmation toast.
5. Go to **⋯ → Extensions** and verify “Strava Feed Filter” is toggled ON.

## Step 4 – Alternative: Firefox Add-ons

If the Chrome Web Store is blocked for you, install the Firefox build instead:

1. Open [https://addons.mozilla.org/en-US/firefox/addon/strava-feed-filter/](https://addons.mozilla.org/en-US/firefox/addon/strava-feed-filter/) inside Orion.
2. Request the Desktop Site if necessary.
3. Tap **Add to Firefox** (Orion treats it the same way) and follow the prompts.
4. Check **⋯ → Extensions** to ensure the add-on is enabled.

## Step 5 – Use SFF on Strava (iPhone & iPad)

1. Navigate to [https://www.strava.com/dashboard](https://www.strava.com/dashboard) in Orion.
2. Log in and wait for the Strava UI to load. You should see the familiar **Filter** button and notification bell from the desktop extension.
3. Tap the Filter button to open the panel. All settings sync locally inside Orion just like on desktop.
4. Optional: Pin the extension from **⋯ → Extensions → Pin** for quicker access.

## Updating the extension

- Orion automatically updates installed extensions when you relaunch the browser.
- To force an update, open **⋯ → Settings → Extensions → Update All**.
- You can always re-install from the store links above; Orion will replace the existing copy.

## Uninstalling / rolling back

1. Open **⋯ → Settings → Extensions**.
2. Toggle Strava Feed Filter OFF or tap **Remove** to uninstall it entirely.
3. If you absolutely need the legacy userscript again (not recommended), download it from `userscript/sff-safari.user.js` and load it through a userscript manager, but future bug fixes and UI updates will not land there.

## Troubleshooting tips

- **Can’t open the Web Store**: Make sure “Request Desktop Site” is enabled for the store domain and that Orion’s **Extension Stores** toggle for that store is ON.
- **Install button missing**: Scroll to the bottom of the Web Store page—the button sometimes renders off-screen on iPhone in portrait mode.
- **Filter button not showing on Strava**:
  1. Confirm the extension is enabled in **⋯ → Extensions**.
  2. Refresh Strava (pull to refresh) or fully close Orion and reopen it.
  3. Verify you are on the Dashboard (`/dashboard`).
- **Performance issues**: Try disabling other extensions or switching Orion to the latest stable/TestFlight build.
- Still need help? Open an issue: [GitHub Issues](https://github.com/Inc21/Tempermonkey-Strava-Feed-Filter/issues)
