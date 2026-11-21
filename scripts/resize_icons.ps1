Add-Type -AssemblyName System.Drawing

$srcPath = (Resolve-Path "public\icons\icon-192.png").Path
$bytes = [System.IO.File]::ReadAllBytes($srcPath)
$ms = New-Object System.IO.MemoryStream(,$bytes)
$srcImage = [System.Drawing.Image]::FromStream($ms)

function Resize-And-Save($img, $width, $height, $targetPath) {
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
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

# 1. Web icons
Resize-And-Save $srcImage 512 512 "public\icons\icon-512.png"
Resize-And-Save $srcImage 192 192 "public\icons\icon-192.png"

# 2. Android Mipmaps
$densities = @{
    "mdpi" = 48
    "hdpi" = 72
    "xhdpi" = 96
    "xxhdpi" = 144
    "xxxhdpi" = 192
}

foreach ($d in $densities.Keys) {
    $dim = $densities[$d]
    Resize-And-Save $srcImage $dim $dim "android\app\src\main\res\mipmap-$d\ic_launcher.png"
    Resize-And-Save $srcImage $dim $dim "android\app\src\main\res\mipmap-$d\ic_launcher_round.png"
}

$srcImage.Dispose()
$ms.Dispose()
Write-Host "All icons resized and deployed successfully!"
