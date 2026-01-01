import os
import zipfile

base = r"E:\Coding\Tempermonkey Strava Filter\Tempermonkey-Strava-Feed-Filter"
dist = os.path.join(base, "dist")
os.makedirs(dist, exist_ok=True)


def build_zip(src_dir, dest_zip):
    with zipfile.ZipFile(dest_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, _, files in os.walk(src_dir):
            for name in files:
                full = os.path.join(root, name)
                rel = os.path.relpath(full, src_dir).replace('\\', '/')
                zf.write(full, rel)
    print(f"Created: {dest_zip}")


print("Building Chrome extension zip...")
build_zip(
    os.path.join(base, "chrome-extension"),
    os.path.join(dist, "StravaFeedFilter-Chrome-v2.6.0.zip")
)

print("Building Firefox extension zip...")
build_zip(
    os.path.join(base, "firefox-extension"),
    os.path.join(dist, "StravaFeedFilter-Firefox-v2.6.0.zip")
)

print("Done!")
