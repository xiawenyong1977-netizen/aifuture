# 生成签名密钥库的 PowerShell 脚本

Write-Host "=== VoiceTrack 签名密钥库生成工具 ===" -ForegroundColor Green
Write-Host ""

# 查找 keytool
$keytoolPath = $null

$possiblePaths = @(
    "C:\Program Files\Java\jdk-17\bin\keytool.exe",
    "C:\Program Files\Java\jdk-21\bin\keytool.exe",
    "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe",
    "$env:LOCALAPPDATA\Android\Android Studio\jbr\bin\keytool.exe"
)

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $keytoolPath = $path
        break
    }
}

if (-not $keytoolPath) {
    Write-Host "未找到 keytool！" -ForegroundColor Red
    Write-Host "请先运行 find-keytool.ps1 查找 keytool 位置" -ForegroundColor Yellow
    exit 1
}

Write-Host "找到 keytool: $keytoolPath" -ForegroundColor Green
Write-Host ""
Write-Host "准备生成签名密钥库..." -ForegroundColor Cyan
Write-Host "密钥库文件将保存在: $PSScriptRoot\voicetrack-release.keystore" -ForegroundColor Yellow
Write-Host ""
Write-Host "提示：" -ForegroundColor Yellow
Write-Host "  - 密钥库密码至少需要 6 个字符" -ForegroundColor White
Write-Host "  - 请妥善保管密钥库文件和密码" -ForegroundColor White
Write-Host "  - 丢失密钥库将无法更新应用" -ForegroundColor White
Write-Host ""
Write-Host "按 Enter 继续，或 Ctrl+C 取消..." -ForegroundColor Cyan
Read-Host

# 执行 keytool 命令
Write-Host ""
Write-Host "正在生成密钥库..." -ForegroundColor Green
Write-Host ""

& $keytoolPath -genkey -v -keystore "$PSScriptRoot\voicetrack-release.keystore" -alias voicetrack -keyalg RSA -keysize 2048 -validity 10000

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ 密钥库生成成功！" -ForegroundColor Green
    Write-Host "密钥库位置: $PSScriptRoot\voicetrack-release.keystore" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "下一步：" -ForegroundColor Cyan
    Write-Host "1. 创建 keystore.properties 文件" -ForegroundColor White
    Write-Host "2. 取消 build.gradle 中签名配置的注释" -ForegroundColor White
    Write-Host "3. 重新构建 release APK" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "✗ 密钥库生成失败" -ForegroundColor Red
}
