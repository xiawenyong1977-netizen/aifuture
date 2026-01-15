# 查找 keytool 的 PowerShell 脚本

Write-Host "正在查找 keytool..." -ForegroundColor Green

$keytoolPaths = @()

# 常见位置 1: Java JDK
$javaPaths = @(
    "C:\Program Files\Java",
    "C:\Program Files (x86)\Java",
    "$env:ProgramFiles\Java",
    "$env:ProgramFiles(x86)\Java"
)

foreach ($javaPath in $javaPaths) {
    if (Test-Path $javaPath) {
        $keytool = Get-ChildItem $javaPath -Recurse -Filter "keytool.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($keytool) {
            $keytoolPaths += $keytool.FullName
        }
    }
}

# 常见位置 2: Android Studio JDK
$androidStudioPaths = @(
    "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe",
    "$env:LOCALAPPDATA\Android\Android Studio\jbr\bin\keytool.exe",
    "$env:ProgramFiles\Android\Android Studio\jbr\bin\keytool.exe"
)

foreach ($path in $androidStudioPaths) {
    if (Test-Path $path) {
        $keytoolPaths += $path
    }
}

# 常见位置 3: Android SDK
if (Test-Path "$env:LOCALAPPDATA\Android\Sdk") {
    $sdkKeytool = Get-ChildItem "$env:LOCALAPPDATA\Android\Sdk" -Recurse -Filter "keytool.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($sdkKeytool) {
        $keytoolPaths += $sdkKeytool.FullName
    }
}

# 常见位置 4: 通过 java 命令查找
try {
    $javaCmd = Get-Command java -ErrorAction Stop
    $javaDir = Split-Path $javaCmd.Source -Parent
    $jdkRoot = Split-Path $javaDir -Parent
    $keytoolPath = Join-Path $jdkRoot "bin\keytool.exe"
    if (Test-Path $keytoolPath) {
        $keytoolPaths += $keytoolPath
    }
} catch {
    # Java 不在 PATH 中
}

# 显示结果
if ($keytoolPaths.Count -gt 0) {
    Write-Host "`n找到 keytool:" -ForegroundColor Green
    foreach ($path in $keytoolPaths) {
        Write-Host "  $path" -ForegroundColor Yellow
    }
    Write-Host "`n使用第一个找到的 keytool 生成密钥库的命令：" -ForegroundColor Cyan
    $firstKeytool = $keytoolPaths[0]
    Write-Host "`"$firstKeytool`" -genkey -v -keystore voicetrack-release.keystore -alias voicetrack -keyalg RSA -keysize 2048 -validity 10000" -ForegroundColor White
} else {
    Write-Host "`n未找到 keytool！" -ForegroundColor Red
    Write-Host "`n请尝试以下方法：" -ForegroundColor Yellow
    Write-Host "1. 安装 JDK (https://www.oracle.com/java/technologies/downloads/)" -ForegroundColor White
    Write-Host "2. 使用 Android Studio 图形界面生成签名密钥：" -ForegroundColor White
    Write-Host "   Build -> Generate Signed Bundle / APK -> Create new..." -ForegroundColor White
    Write-Host "3. 或者手动查找 keytool：" -ForegroundColor White
    Write-Host "   通常在 JDK 的 bin 目录下，如：C:\Program Files\Java\jdk-17\bin\keytool.exe" -ForegroundColor White
}
