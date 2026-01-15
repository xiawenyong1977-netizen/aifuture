
# VoiceTrack Android 核心工程配置指南

如果您在 Logcat 中看到 `Package com.company.voicetrack has no requested permissions`，这说明您的 `AndroidManifest.xml` 配置不正确。请严格按照以下结构检查文件。

## 1. 完善 AndroidManifest.xml
文件位置：`android/app/src/main/AndroidManifest.xml`

**必须确保权限标签在 `<application>` 标签之外，而在 `<manifest>` 标签之内。**

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.company.voicetrack">

    <!-- 1. 声明必要的权限 (必须在此处，不能写在 application 内部) -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
    
    <!-- Android 14+ 额外需要的权限 -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">

        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:exported="true"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- 2. 注册前台服务 (用于饱和机制) -->
        <service
            android:name="com.capacitorjs.plugins.foregroundservice.ForegroundService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="microphone" />

    </application>
</manifest>
```

## 2. 权限申请排查
如果您已经配置了上述文件但仍然报错：
1. **清理项目**：在 Android Studio 中点击 `Build -> Clean Project`。
2. **重新同步**：执行 `npx cap sync android`。
3. **卸载重装**：在手机上彻底卸载旧版本 App 后再重新运行，因为 Android 偶尔会缓存旧的 Manifest 信息。

## 3. 饱和机制实现建议
为了让前台服务生效，建议在打包时安装官方前台服务插件：
`npm install @capacitor-community/foreground-service`
并在 `MainActivity.java` 中初始化（如果使用的是较旧版本的 Capacitor）。
