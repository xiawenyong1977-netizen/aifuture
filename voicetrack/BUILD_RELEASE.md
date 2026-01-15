# 构建 Release 版本指南

## 前置步骤

### 1. 构建前端代码

```bash
cd d:\voicetrack
npm run build
```

这会生成优化后的前端代码到 `dist` 目录。

### 2. 同步 Capacitor

```bash
npx cap sync android
```

这会将前端代码同步到 Android 项目中。

## 构建 Release APK

### 方法 1: 使用 Gradle 命令（推荐）

```bash
cd d:\voicetrack\android
.\gradlew assembleRelease
```

生成的 APK 位置：
- `android/app/build/outputs/apk/release/app-release-unsigned.apk`

### 方法 2: 使用 Gradle 命令生成 AAB（用于 Google Play）

```bash
cd d:\voicetrack\android
.\gradlew bundleRelease
```

生成的 AAB 位置：
- `android/app/build/outputs/bundle/release/app-release.aab`

## 签名 APK（可选，用于发布）

### 方法 1: 使用 keytool 命令行（需要找到 keytool）

#### 1.1 查找 keytool 位置

**Windows PowerShell:**
```powershell
# 方法 1: 查找 Java JDK 中的 keytool
Get-ChildItem "C:\Program Files\Java" -Recurse -Filter "keytool.exe" -ErrorAction SilentlyContinue

# 方法 2: 查找 Android Studio 的 JDK 中的 keytool
Get-ChildItem "$env:LOCALAPPDATA\Android\Sdk" -Recurse -Filter "keytool.exe" -ErrorAction SilentlyContinue

# 方法 3: 如果安装了 Android Studio，通常在：
# C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe
```

**找到 keytool 后，使用完整路径运行：**
```bash
# 示例（根据实际路径修改）：
"C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -genkey -v -keystore voicetrack-release.keystore -alias voicetrack -keyalg RSA -keysize 2048 -validity 10000
```

#### 1.2 生成签名密钥

**在 PowerShell 中运行以下命令（需要手动输入密码）：**

```powershell
cd d:\voicetrack\android

# 使用找到的 keytool（根据实际情况选择）
& "C:\Program Files\Java\jdk-17\bin\keytool.exe" -genkey -v -keystore voicetrack-release.keystore -alias voicetrack -keyalg RSA -keysize 2048 -validity 10000

# 或者使用 Android Studio 的 keytool
# & "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -genkey -v -keystore voicetrack-release.keystore -alias voicetrack -keyalg RSA -keysize 2048 -validity 10000
```

**交互式输入提示：**
- 输入密钥库口令：设置密钥库密码（至少6个字符，请记住这个密码！）
- 再次输入：确认密码
- 您的名字与姓氏：可以填写公司名或应用名
- 组织单位：部门名称
- 组织：公司名称
- 城市：城市名
- 省/市/自治区：省份
- 国家代码：CN（中国）

**重要提示：**
- 密钥库密码和密钥密码可以相同，也可以不同
- **请妥善保管密钥库文件和密码**，丢失后无法找回，也无法更新应用
- 建议将密钥库文件备份到安全位置

### 方法 2: 使用 Android Studio 图形界面（推荐，最简单）

1. 打开 Android Studio
2. 打开项目：`File` -> `Open` -> 选择 `d:\voicetrack\android` 目录
3. 生成签名密钥：
   - `Build` -> `Generate Signed Bundle / APK`
   - 选择 `APK` 或 `Android App Bundle`
   - 点击 `Create new...` 创建新的密钥库
   - 填写密钥库信息：
     - Key store path: 选择保存位置（如 `android/voicetrack-release.keystore`）
     - Password: 设置密钥库密码
     - Key alias: `voicetrack`
     - Key password: 设置密钥密码
     - Validity: `10000` (年)
     - Certificate: 填写证书信息
   - 点击 `OK` 生成密钥库
4. 完成后，密钥库文件会保存在指定位置

### 方法 3: 使用在线工具（不推荐，安全性较低）

可以使用在线密钥生成工具，但**不推荐**用于生产环境。

### 2. 创建 keystore.properties 文件

在 `android` 目录下创建 `keystore.properties` 文件：

```properties
storeFile=voicetrack-release.keystore
storePassword=你的密钥库密码
keyAlias=voicetrack
keyPassword=你的密钥密码
```

### 3. 配置 build.gradle

取消 `android/app/build.gradle` 中签名配置的注释。

### 4. 重新构建

```bash
cd d:\voicetrack\android
.\gradlew assembleRelease
```

现在生成的 APK 将是已签名的：
- `android/app/build/outputs/apk/release/app-release.apk`

## 完整构建流程

```bash
# 1. 构建前端
cd d:\voicetrack
npm run build

# 2. 同步到 Android
npx cap sync android

# 3. 构建 Release APK
cd android
.\gradlew clean
.\gradlew assembleRelease

# 4. 查找生成的 APK
# 位置: android/app/build/outputs/apk/release/app-release-unsigned.apk
```

## 注意事项

1. **未签名 APK**：可以直接安装测试，但无法发布到应用商店
2. **签名 APK**：需要签名后才能发布到 Google Play 或其他应用商店
3. **AAB 格式**：Google Play 推荐使用 AAB 格式，文件更小，Google Play 会自动优化
4. **版本号**：发布前记得在 `android/app/build.gradle` 中更新 `versionCode` 和 `versionName`

## 验证 APK

安装到设备测试：

```bash
adb install android/app/build/outputs/apk/release/app-release-unsigned.apk
```

或者使用已签名的 APK：

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```
