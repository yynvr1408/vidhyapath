Add-Type -AssemblyName System.Drawing

$projectRoot = (Resolve-Path ".").Path
$srcPath = Join-Path $projectRoot "public\icons\icon-512.png"

if (-not (Test-Path $srcPath)) {
    $srcPath = Join-Path $projectRoot "public\icons\icon-192.png"
}

Write-Host "Using source icon: $srcPath"
$bytes = [System.IO.File]::ReadAllBytes($srcPath)
$ms = New-Object System.IO.MemoryStream(,$bytes)
$srcImage = [System.Drawing.Image]::FromStream($ms)

function Resize-And-Save($img, $width, $height, $targetPath) {
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($img, 0, 0, $width, $height)
    $g.Dispose()
    
    $dir = [System.IO.Path]::GetDirectoryName($targetPath)
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    
    $bmp.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created: $targetPath ($width x $height)"
}

function Create-Maskable-Icon($img, $canvasSize, $targetPath) {
    $bmp = New-Object System.Drawing.Bitmap($canvasSize, $canvasSize)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    # Fill with white background
    $g.Clear([System.Drawing.Color]::White)
    
    # Safe area is 80% of canvas
    $innerSize = [int]($canvasSize * 0.8)
    $offset = [int](($canvasSize - $innerSize) / 2)
    
    $g.DrawImage($img, $offset, $offset, $innerSize, $innerSize)
    $g.Dispose()
    
    $dir = [System.IO.Path]::GetDirectoryName($targetPath)
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    
    $bmp.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created Maskable: $targetPath ($canvasSize x $canvasSize)"
}

function Create-Adaptive-Foreground($img, $canvasSize, $targetPath) {
    $bmp = New-Object System.Drawing.Bitmap($canvasSize, $canvasSize)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    
    # Android Adaptive foreground safe zone is 66% (72/108) of canvas
    $innerSize = [int]($canvasSize * 0.66)
    $offset = [int](($canvasSize - $innerSize) / 2)
    
    $g.DrawImage($img, $offset, $offset, $innerSize, $innerSize)
    $g.Dispose()
    
    $dir = [System.IO.Path]::GetDirectoryName($targetPath)
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    
    $bmp.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created Adaptive Foreground: $targetPath ($canvasSize x $canvasSize)"
}

function Create-Ico-File($img, $targetPath) {
    $bmp = New-Object System.Drawing.Bitmap(48, 48)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($img, 0, 0, 48, 48)
    $g.Dispose()
    
    $hIcon = $bmp.GetHicon()
    $icon = [System.Drawing.Icon]::FromHandle($hIcon)
    
    $dir = [System.IO.Path]::GetDirectoryName($targetPath)
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    
    $fs = New-Object System.IO.FileStream($targetPath, [System.IO.FileMode]::Create)
    $icon.Save($fs)
    $fs.Close()
    $icon.Dispose()
    $bmp.Dispose()
    Write-Host "Created Favicon: $targetPath"
}

# 1. Web Icons in public/
Resize-And-Save $srcImage 512 512 "public\icons\icon-512.png"
Resize-And-Save $srcImage 192 192 "public\icons\icon-192.png"
Resize-And-Save $srcImage 180 180 "public\icons\apple-touch-icon.png"
Resize-And-Save $srcImage 32 32 "public\icons\favicon-32x32.png"
Resize-And-Save $srcImage 16 16 "public\icons\favicon-16x16.png"
Create-Maskable-Icon $srcImage 192 "public\icons\icon-maskable-192.png"
Create-Maskable-Icon $srcImage 512 "public\icons\icon-maskable-512.png"
Create-Ico-File $srcImage "public\favicon.ico"

# 2. Duplicate to root icons/ directory
Resize-And-Save $srcImage 512 512 "icons\icon-512.png"
Resize-And-Save $srcImage 192 192 "icons\icon-192.png"
Resize-And-Save $srcImage 180 180 "icons\apple-touch-icon.png"
Resize-And-Save $srcImage 32 32 "icons\favicon-32x32.png"
Create-Ico-File $srcImage "icons\favicon.ico"

# 3. Android Mipmap densities
$androidDensities = @{
    "mdpi" = @{ launcher = 48; foreground = 108 }
    "hdpi" = @{ launcher = 72; foreground = 162 }
    "xhdpi" = @{ launcher = 96; foreground = 216 }
    "xxhdpi" = @{ launcher = 144; foreground = 324 }
    "xxxhdpi" = @{ launcher = 192; foreground = 432 }
}

foreach ($d in $androidDensities.Keys) {
    $lDim = $androidDensities[$d].launcher
    $fDim = $androidDensities[$d].foreground
    
    # Legacy Full Launcher Icons
    Resize-And-Save $srcImage $lDim $lDim "android\app\src\main\res\mipmap-$d\ic_launcher.png"
    Resize-And-Save $srcImage $lDim $lDim "android\app\src\main\res\mipmap-$d\ic_launcher_round.png"
    
    # Modern Adaptive Foreground Icons
    Create-Adaptive-Foreground $srcImage $fDim "android\app\src\main\res\mipmap-$d\ic_launcher_foreground.png"
}

# 4. Remove default capacitor vector if present that interferes with adaptive foreground
$defaultVector = "android\app\src\main\res\drawable-v24\ic_launcher_foreground.xml"
if (Test-Path $defaultVector) {
    Remove-Item $defaultVector -Force
    Write-Host "Removed obsolete vector override: $defaultVector"
}

# 5. Sync to android public web assets
Copy-Item "public\icons\*" "android\app\src\main\assets\public\icons\" -Recurse -Force
Copy-Item "public\favicon.ico" "android\app\src\main\assets\public\favicon.ico" -Force

$srcImage.Dispose()
$ms.Dispose()
Write-Host "All website and Android app icons successfully generated and deployed!"
