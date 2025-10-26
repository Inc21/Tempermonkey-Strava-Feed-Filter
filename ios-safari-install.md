# Install the Strava Feed Filter Userscript on Safari (iOS)

A step-by-step guide to installing and enabling the Strava Feed Filter userscript on Safari for iPhone/iPad.

## Requirements

- iOS/iPadOS 15 or later.
- A userscript manager that supports Safari on iOS. Recommended: "Userscripts" app from the App Store (free).
- The userscript file: `sff-safari.user.js`.

## 1) Install the Userscripts manager

- Open the App Store and install the app named "Userscripts" by Quoid.
- After install, open the app at least once so it can create its folder.

## 2) Enable Userscripts in Safari

- Open iOS Settings → Safari → Extensions.
- Tap "Userscripts" and set "Allow" for Safari.
- Under "Websites", allow it for `strava.com` (Ask/Allow → Allow).

## 3) Prepare the Userscripts folder

- Open the Files app → Browse.
- Locate the Userscripts folder (On My iPhone → Userscripts). If you use iCloud Drive, it may be under iCloud Drive → Userscripts.

## 4) Install the Strava Feed Filter userscript

- Download the script directly into the Userscripts folder:
  - Raw link: https://raw.githubusercontent.com/Inc21/Tempermonkey-Strava-Feed-Filter/main/userscript/sff-safari.user.js
- Alternatively, download the file in Safari and then move it into the Userscripts folder using the Files app.
- Ensure the file name ends with `.user.js` (sff-safari.user.js).

## 5) Enable on Strava

- Open Safari and go to https://www.strava.com/
- Tap the "AA" button in the address bar → Manage Extensions → ensure Userscripts is On.
- If needed, tap Userscripts → Configure Websites → set strava.com to Allow.
- Reload the page. You should see the Filter button appear on the Strava dashboard.

## Updating the userscript

- Replace the existing `sff-safari.user.js` in the Userscripts folder with a newer version (overwrite the file), then reload Strava.

## Uninstalling

- Open the Files app and delete `sff-safari.user.js` from the Userscripts folder.
- In Safari → "AA" → Manage Extensions, you can also toggle Userscripts Off.

## Troubleshooting

- Filter button not visible:
  - Confirm Userscripts is enabled in Safari and allowed for strava.com.
  - Confirm the script file exists in the Userscripts folder and ends with `.user.js`.
  - Fully close Safari (swipe away) and relaunch.
- Script runs but features don’t seem active:
  - Ensure you are on the Strava dashboard (https://www.strava.com/dashboard).
  - Check the master toggle in the panel is enabled.
- Still stuck? Open a GitHub issue: https://github.com/Inc21/Tempermonkey-Strava-Feed-Filter/issues
