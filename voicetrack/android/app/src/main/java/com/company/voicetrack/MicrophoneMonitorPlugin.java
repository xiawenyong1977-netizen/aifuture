package com.company.voicetrack;

import android.app.AppOpsManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.media.AudioManager;
import android.media.AudioRecordingConfiguration;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;


import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;
import java.util.Map;
import java.util.SortedMap;
import java.util.TreeMap;

/**
 * 麦克风监测插件
 * 使用 AudioRecordingCallback API 监听录音状态，完全不占用麦克风
 */
@CapacitorPlugin(name = "MicrophoneMonitor")
public class MicrophoneMonitorPlugin extends Plugin {

    private static final String TAG = "MicrophoneMonitor";
    private AudioManager audioManager;
    private AudioManager.AudioRecordingCallback recordingCallback;
    private UsageStatsManager usageStatsManager;
    private PackageManager packageManager;
    private boolean isMonitoring = false;

    @Override
    public void load() {
        super.load();
        audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        usageStatsManager = (UsageStatsManager) getContext().getSystemService(Context.USAGE_STATS_SERVICE);
        packageManager = getContext().getPackageManager();
    }
    
    /**
     * 检查是否有使用统计权限
     */
    private boolean hasUsageStatsPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            AppOpsManager appOps = (AppOpsManager) getContext().getSystemService(Context.APP_OPS_SERVICE);
            int mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, 
                android.os.Process.myUid(), getContext().getPackageName());
            return mode == AppOpsManager.MODE_ALLOWED;
        }
        return true;
    }
    
    /**
     * 获取当前前台应用的包名
     */
    private String getCurrentForegroundPackage() {
        if (!hasUsageStatsPermission()) {
            Log.w(TAG, "没有使用统计权限，无法获取前台应用");
            return null;
        }
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP && usageStatsManager != null) {
            try {
                long time = System.currentTimeMillis();
                // 获取最近5秒内的使用统计
                List<UsageStats> stats = usageStatsManager.queryUsageStats(
                    UsageStatsManager.INTERVAL_BEST, time - 5000, time);
                
                if (stats != null && !stats.isEmpty()) {
                    // 按最后使用时间排序
                    SortedMap<Long, UsageStats> sortedStats = new TreeMap<>();
                    for (UsageStats usageStats : stats) {
                        sortedStats.put(usageStats.getLastTimeUsed(), usageStats);
                    }
                    
                    if (!sortedStats.isEmpty()) {
                        // 获取最近使用的应用
                        UsageStats mostRecent = sortedStats.get(sortedStats.lastKey());
                        String packageName = mostRecent.getPackageName();
                        Log.d(TAG, "当前前台应用包名: " + packageName);
                        return packageName;
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "获取前台应用失败", e);
            }
        }
        return null;
    }
    
    /**
     * 根据包名获取应用名称
     */
    private String getAppName(String packageName) {
        if (packageName == null || packageName.isEmpty()) {
            return "未知应用";
        }
        
        try {
            // 尝试获取应用信息（包括已禁用的应用）
            ApplicationInfo appInfo = packageManager.getApplicationInfo(packageName, 
                PackageManager.GET_META_DATA | PackageManager.MATCH_UNINSTALLED_PACKAGES);
            
            if (appInfo != null) {
                CharSequence label = packageManager.getApplicationLabel(appInfo);
                if (label != null && label.length() > 0) {
                    String appName = label.toString();
                    Log.d(TAG, "✓ 成功获取应用名称: " + appName + " (" + packageName + ")");
                    return appName;
                }
            }
            
            // 如果获取不到，返回包名
            Log.w(TAG, "无法获取应用名称，使用包名: " + packageName);
            return packageName;
        } catch (PackageManager.NameNotFoundException e) {
            Log.w(TAG, "应用不存在或无法访问，使用包名: " + packageName);
            return packageName; // 如果无法获取名称，使用包名
        } catch (SecurityException e) {
            Log.w(TAG, "权限不足无法获取应用信息，使用包名: " + packageName);
            return packageName;
        } catch (Exception e) {
            Log.e(TAG, "获取应用信息失败，使用包名: " + packageName, e);
            return packageName;
        }
    }
    
    @PluginMethod
    public void checkUsageStatsPermission(PluginCall call) {
        boolean hasPermission = hasUsageStatsPermission();
        JSObject ret = new JSObject();
        ret.put("hasPermission", hasPermission);
        if (!hasPermission) {
            // 返回设置页面的 Intent
            Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            ret.put("settingsIntent", "android.settings.USAGE_ACCESS_SETTINGS");
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void startMonitoring(PluginCall call) {
        if (isMonitoring) {
            call.resolve(new JSObject().put("success", true));
            return;
        }

        // registerAudioRecordingCallback 在 API 24 (Android 7.0) 引入
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
            call.reject("Android version too low, requires API 24+");
            return;
        }
        
        // 建议使用 Android 10 (API 29) 及以上版本以获得完整功能
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            Log.w(TAG, "Android 版本低于 10，检测功能可能受限");
        }

        recordingCallback = new AudioManager.AudioRecordingCallback() {
            @Override
            public void onRecordingConfigChanged(List<AudioRecordingConfiguration> configs) {
                super.onRecordingConfigChanged(configs);
                
                // 简单判断：如果有录音配置存在，说明有应用在使用麦克风
                // 因为我们自己不占用麦克风，所以任何配置都表示其他应用在使用
                boolean micInUse = (configs != null && !configs.isEmpty());
                
                // 获取使用麦克风的应用包名和名称
                String appPackageName = null;
                String appName = null;
                
                if (micInUse && configs != null && !configs.isEmpty()) {
                    Log.d(TAG, "检测到麦克风被占用，开始获取应用信息");
                    
                    // 使用 UsageStatsManager 获取当前前台应用
                    if (hasUsageStatsPermission()) {
                        appPackageName = getCurrentForegroundPackage();
                        if (appPackageName != null && !appPackageName.isEmpty()) {
                            appName = getAppName(appPackageName);
                            Log.d(TAG, "✓ 通过 UsageStatsManager 获取应用: " + appName + " (" + appPackageName + ")");
                        } else {
                            Log.w(TAG, "✗ UsageStatsManager 无法获取前台应用包名");
                            appPackageName = "unknown";
                            appName = "未知应用";
                        }
                    } else {
                        Log.w(TAG, "✗ 没有使用统计权限，无法获取应用信息");
                        Log.w(TAG, "请前往设置 -> 应用 -> 特殊应用访问 -> 使用情况访问权限，授权本应用");
                        appPackageName = "unknown";
                        appName = "未知应用（需要授权使用统计权限）";
                    }
                } else {
                    Log.d(TAG, "麦克风未被占用，无需获取应用信息");
                }
                
                // 通知前端
                JSObject ret = new JSObject();
                ret.put("isActive", micInUse);
                ret.put("timestamp", System.currentTimeMillis());
                if (appPackageName != null) {
                    ret.put("appPackageName", appPackageName);
                    Log.d(TAG, "发送到前端 - appPackageName: " + appPackageName);
                }
                if (appName != null) {
                    ret.put("appName", appName);
                    Log.d(TAG, "发送到前端 - appName: " + appName);
                }
                notifyListeners("microphoneStateChanged", ret);
                
                Log.d(TAG, "麦克风状态变化: " + (micInUse ? "被占用" : "可用") + 
                    (appName != null ? " - " + appName : "") + 
                    " (配置数量: " + (configs != null ? configs.size() : 0) + ")");
                
                // 详细日志，帮助调试
                if (configs != null && !configs.isEmpty()) {
                    Log.d(TAG, "当前有 " + configs.size() + " 个录音配置");
                } else {
                    Log.d(TAG, "没有录音配置，麦克风可用");
                }
                
                // 更新前台服务的通知内容
                try {
                    Intent updateIntent = new Intent(getContext(), MonitoringForegroundService.class);
                    updateIntent.setAction("UPDATE_NOTIFICATION");
                    updateIntent.putExtra("isMicActive", micInUse);
                    if (appName != null) {
                        updateIntent.putExtra("appName", appName);
                    }
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        getContext().startForegroundService(updateIntent);
                    } else {
                        getContext().startService(updateIntent);
                    }
                } catch (Exception e) {
                    Log.e(TAG, "更新通知失败", e);
                }
            }
        };
        
        // 注册回调（不需要占用麦克风）
        // registerAudioRecordingCallback 在 API 24 引入
        // 统一使用 Handler 版本（API 24+），避免 Executor 版本的兼容性问题
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            Handler handler = new Handler(Looper.getMainLooper());
            // Handler 版本在所有支持的 API 级别上都可用且稳定
            audioManager.registerAudioRecordingCallback(
                recordingCallback,
                handler
            );
            
            // 注册后立即触发一次检查，获取当前状态
            // 使用反射调用 getActiveRecordingConfigurations() 方法（API 24+）
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    java.lang.reflect.Method method = audioManager.getClass().getMethod("getActiveRecordingConfigurations");
                    @SuppressWarnings("unchecked")
                    List<AudioRecordingConfiguration> currentConfigs = (List<AudioRecordingConfiguration>) method.invoke(audioManager);
                    if (currentConfigs != null) {
                        Log.d(TAG, "初始状态检查: " + currentConfigs.size() + " 个录音配置");
                        // 手动触发一次回调，通知前端当前状态
                        recordingCallback.onRecordingConfigChanged(currentConfigs);
                    } else {
                        // 如果没有配置，也触发一次回调通知前端
                        recordingCallback.onRecordingConfigChanged(new java.util.ArrayList<AudioRecordingConfiguration>());
                    }
                }
            } catch (Exception e) {
                Log.d(TAG, "无法获取初始录音配置状态，将在回调中获取", e);
                // 如果无法获取，至少触发一次空列表的回调
                recordingCallback.onRecordingConfigChanged(new java.util.ArrayList<AudioRecordingConfiguration>());
            }
        }
        
        // 启动前台服务，确保应用在后台运行时不被杀死
        try {
            Intent serviceIntent = new Intent(getContext(), MonitoringForegroundService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(serviceIntent);
            } else {
                getContext().startService(serviceIntent);
            }
            Log.d(TAG, "前台服务已启动");
        } catch (Exception e) {
            Log.e(TAG, "启动前台服务失败", e);
        }
        
        isMonitoring = true;
        Log.d(TAG, "开始监听麦克风状态");
        call.resolve(new JSObject().put("success", true));
    }

    @PluginMethod
    public void stopMonitoring(PluginCall call) {
        if (!isMonitoring) {
            call.resolve(new JSObject().put("success", true));
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && recordingCallback != null) {
            audioManager.unregisterAudioRecordingCallback(recordingCallback);
            recordingCallback = null;
        }
        
        // 停止前台服务
        try {
            Intent serviceIntent = new Intent(getContext(), MonitoringForegroundService.class);
            getContext().stopService(serviceIntent);
            Log.d(TAG, "前台服务已停止");
        } catch (Exception e) {
            Log.e(TAG, "停止前台服务失败", e);
        }
        
        isMonitoring = false;
        Log.d(TAG, "停止监听麦克风状态");
        call.resolve(new JSObject().put("success", true));
    }
}
