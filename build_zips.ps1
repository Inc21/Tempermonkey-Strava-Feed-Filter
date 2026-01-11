# Build extension zips with forward-slash paths for store compatibility

$base = "E:\Coding\Tempermonkey Strava Filter\Tempermonkey-Strava-Feed-Filter"
$dist = Join-Path $base "dist"

# Ensure dist directory exists
New-Item -ItemType Directory -Path $dist -Force | Out-Null

function Build-ExtensionZip {
    param(
        [string]$SourceDir,
        [string]$ZipPath
    )
    
    # Remove old zip if exists
    if (Test-Path $ZipPath) {
        Remove-Item $ZipPath -Force
    }
    
    # Create zip using .NET to control path separators
    Add-Type -Assembly System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::Open($ZipPath, 'Create')
    
    Get-ChildItem -Path $SourceDir -Recurse -File | ForEach-Object {
        $relativePath = $_.FullName.Substring($SourceDir.Length + 1).Replace('\', '/')
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $relativePath) | Out-Null
    }
    
    $zip.Dispose()
    Write-Host "Created: $ZipPath"
}

Write-Host "Building Chrome extension zip..."
Build-ExtensionZip -SourceDir (Join-Path $base "chrome-extension") -ZipPath (Join-Path $dist "StravaFeedFilter-Chrome-v2.6.0.zip")

Write-Host "Building Firefox extension zip..."
Build-ExtensionZip -SourceDir (Join-Path $base "firefox-extension") -ZipPath (Join-Path $dist "StravaFeedFilter-Firefox-v2.6.0.zip")

Write-Host "Done!"
