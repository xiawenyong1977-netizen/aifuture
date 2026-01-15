package com.company.voicetrack;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Color;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;
import android.widget.RemoteViews;

import androidx.core.app.NotificationCompat;

/**
 * 前台服务：确保应用在后台运行时不被系统杀死
 */
public class MonitoringForegroundService extends Service {
    private static final String TAG = "MonitoringForegroundService";
    private static final String CHANNEL_ID = "voice_track_monitoring_channel";
    private static final int NOTIFICATION_ID = 1;
    private static final int KEEP_ALIVE_INTERVAL = 60000; // 1分钟检查一次
    
    private PowerManager.WakeLock wakeLock;
    private Handler handler;
    private Runnable keepAliveRunnable;
    private BroadcastReceiver screenReceiver;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        
        // 获取 WakeLock，防止 CPU 休眠（无限期）
        ensureWakeLock();
        
        // 创建 Handler 用于定期保活检查
        handler = new Handler();
        keepAliveRunnable = new Runnable() {
            @Override
            public void run() {
                // 确保 WakeLock 一直持有
                ensureWakeLock();
                // 定期更新通知，保持服务活跃
                updateNotification();
                Log.d(TAG, "前台服务保活检查 - 服务运行正常，WakeLock 已续期，通知已更新");
                // 继续下一次检查
                handler.postDelayed(this, KEEP_ALIVE_INTERVAL);
            }
        };
        
        // 注册屏幕状态监听，屏幕解锁时确保服务运行
        registerScreenReceiver();
        
        Log.d(TAG, "前台服务已创建，保活机制已启动");
    }

    /**
     * 确保 WakeLock 一直持有（无限期）
     */
    private void ensureWakeLock() {
        if (wakeLock == null) {
            PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (powerManager != null) {
                wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, TAG + ":WakeLock");
                wakeLock.setReferenceCounted(false); // 不计数，避免重复释放
            }
        }
        if (wakeLock != null && !wakeLock.isHeld()) {
            wakeLock.acquire(); // 无限期持有
            Log.d(TAG, "WakeLock 已获取（无限期）");
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // 确保 WakeLock 持有
        ensureWakeLock();
        
        // 检查是否是更新通知的请求
        if (intent != null && "UPDATE_NOTIFICATION".equals(intent.getAction())) {
            boolean isMicActive = intent.getBooleanExtra("isMicActive", false);
            updateNotificationContent(isMicActive);
            return START_STICKY | START_REDELIVER_INTENT;
        }
        
        // Android 14+ (API 34) 需要指定前台服务类型
        if (Build.VERSION.SDK_INT >= 34) {
            try {
                startForeground(NOTIFICATION_ID, createNotification(), 
                    android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
            } catch (Exception e) {
                // 如果失败，使用普通方式启动
                Log.w(TAG, "使用 Android 14+ 方式启动前台服务失败，使用普通方式", e);
                startForeground(NOTIFICATION_ID, createNotification());
            }
        } else {
            startForeground(NOTIFICATION_ID, createNotification());
        }
        
        // 启动保活检查
        handler.postDelayed(keepAliveRunnable, KEEP_ALIVE_INTERVAL);
        
        Log.d(TAG, "前台服务已启动，保活机制运行中");
        return START_STICKY | START_REDELIVER_INTENT; // 服务被杀死后自动重启，并重新传递 Intent
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        // 停止保活检查
        if (handler != null && keepAliveRunnable != null) {
            handler.removeCallbacks(keepAliveRunnable);
        }
        
        // 释放 WakeLock
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            Log.d(TAG, "WakeLock 已释放");
        }
        
        // 注销广播接收器
        unregisterScreenReceiver();
        
        // 尝试重启服务（保活机制）
        try {
            Intent restartIntent = new Intent(this, MonitoringForegroundService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(restartIntent);
            } else {
                startService(restartIntent);
            }
            Log.d(TAG, "前台服务被销毁，已尝试重启");
        } catch (Exception e) {
            Log.e(TAG, "重启前台服务失败", e);
        }
        
        super.onDestroy();
        Log.d(TAG, "前台服务已停止");
    }
    
    private void registerScreenReceiver() {
        screenReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String action = intent.getAction();
                if (Intent.ACTION_SCREEN_ON.equals(action) || Intent.ACTION_USER_PRESENT.equals(action)) {
                    Log.d(TAG, "屏幕解锁，确保服务运行");
                    // 屏幕解锁时，确保服务正在运行
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        startForegroundService(new Intent(context, MonitoringForegroundService.class));
                    } else {
                        startService(new Intent(context, MonitoringForegroundService.class));
                    }
                }
            }
        };
        
        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_SCREEN_ON);
        filter.addAction(Intent.ACTION_USER_PRESENT);
        registerReceiver(screenReceiver, filter);
    }
    
    private void unregisterScreenReceiver() {
        if (screenReceiver != null) {
            try {
                unregisterReceiver(screenReceiver);
            } catch (Exception e) {
                Log.e(TAG, "注销屏幕接收器失败", e);
            }
        }
    }
    
    private void updateNotification() {
        try {
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.notify(NOTIFICATION_ID, createNotification());
            }
        } catch (Exception e) {
            Log.e(TAG, "更新通知失败", e);
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "语音审计监测服务",
                NotificationManager.IMPORTANCE_LOW // 低优先级，不打扰用户
            );
            channel.setDescription("确保语音审计服务在后台正常运行");
            channel.setShowBadge(false);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification createNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            0,
            notificationIntent,
            PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setOngoing(true) // 持续通知，用户无法滑动清除
            .setPriority(NotificationCompat.PRIORITY_LOW) // 低优先级
            .setCategory(NotificationCompat.CATEGORY_SERVICE);

        // 尝试使用自定义布局，如果失败则使用标准通知
        try {
            int layoutId = R.layout.notification_foreground;
            Log.d(TAG, "尝试加载自定义布局，layoutId: " + layoutId);
            
            RemoteViews customView = new RemoteViews(getPackageName(), layoutId);
            Log.d(TAG, "RemoteViews 创建成功");
            
            // 设置状态文本
            customView.setTextViewText(R.id.status_title, "FOREGROUND AUDIT ACTIVE");
            customView.setTextViewText(R.id.status_text, "监测中（麦克风可用）");
            Log.d(TAG, "文本设置完成");
            
            // 设置状态指示点颜色（绿色表示监测中）
            customView.setInt(R.id.status_dot, "setBackgroundColor", Color.parseColor("#10b981")); // green-500
            
            // 设置状态图标容器背景色（indigo-600）
            customView.setInt(R.id.status_icon_container, "setBackgroundColor", Color.parseColor("#4f46e5")); // indigo-600
            
            // 设置波形颜色（indigo-300，表示监测中但未使用）
            int waveColor = Color.parseColor("#a5b4fc"); // indigo-300
            customView.setInt(R.id.wave1, "setBackgroundColor", waveColor);
            customView.setInt(R.id.wave2, "setBackgroundColor", waveColor);
            customView.setInt(R.id.wave3, "setBackgroundColor", waveColor);
            customView.setInt(R.id.wave4, "setBackgroundColor", waveColor);
            customView.setInt(R.id.wave5, "setBackgroundColor", waveColor);
            Log.d(TAG, "颜色设置完成");
            
            // 点击整个通知区域打开应用
            customView.setOnClickPendingIntent(R.id.status_icon_container, pendingIntent);
            
            builder.setCustomContentView(customView); // 使用自定义布局
            builder.setStyle(new NotificationCompat.DecoratedCustomViewStyle()); // 使用装饰样式
            Log.d(TAG, "自定义通知布局设置成功");
        } catch (Exception e) {
            // 如果自定义布局失败，使用标准通知
            Log.e(TAG, "自定义通知布局失败，使用标准通知", e);
            e.printStackTrace();
            builder.setContentTitle("语音审计服务运行中")
                   .setContentText("正在监测麦克风使用状态");
        }

        return builder.build();
    }
    
    /**
     * 更新通知内容（当检测到麦克风状态变化时调用）
     */
    public void updateNotificationContent(boolean isMicActive) {
        try {
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager == null) {
                Log.e(TAG, "NotificationManager 为空");
                return;
            }
            
            Intent notificationIntent = new Intent(this, MainActivity.class);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                notificationIntent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
            );
            
            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_SERVICE);
            
            // 尝试使用自定义布局更新
            try {
                RemoteViews customView = new RemoteViews(getPackageName(), R.layout.notification_foreground);
                
                // 更新状态文本
                String statusText = isMicActive ? "检测到麦克风使用中" : "监测中（麦克风可用）";
                customView.setTextViewText(R.id.status_text, statusText);
                
                // 更新状态指示点颜色
                int dotColor = isMicActive ? Color.parseColor("#ef4444") : Color.parseColor("#10b981"); // red-500 : green-500
                customView.setInt(R.id.status_dot, "setBackgroundColor", dotColor);
                
                // 更新图标容器背景色（模拟底部栏的 indigo-600 背景）
                int containerBgColor = Color.parseColor("#4f46e5"); // indigo-600
                customView.setInt(R.id.status_icon_container, "setBackgroundColor", containerBgColor);
                
                // 更新波形颜色（如果麦克风在使用中，波形为白色；否则为 indigo-300）
                int waveColor = isMicActive ? Color.parseColor("#ffffff") : Color.parseColor("#a5b4fc"); // white : indigo-300
                customView.setInt(R.id.wave1, "setBackgroundColor", waveColor);
                customView.setInt(R.id.wave2, "setBackgroundColor", waveColor);
                customView.setInt(R.id.wave3, "setBackgroundColor", waveColor);
                customView.setInt(R.id.wave4, "setBackgroundColor", waveColor);
                customView.setInt(R.id.wave5, "setBackgroundColor", waveColor);
                
                customView.setOnClickPendingIntent(R.id.status_icon_container, pendingIntent);
                
                builder.setCustomContentView(customView);
                builder.setStyle(new NotificationCompat.DecoratedCustomViewStyle());
                Log.d(TAG, "使用自定义通知布局更新成功");
            } catch (Exception e) {
                // 如果自定义布局失败，使用标准通知
                Log.e(TAG, "自定义通知布局更新失败，使用标准通知", e);
                e.printStackTrace();
                String statusText = isMicActive ? "检测到麦克风使用中" : "监测中（麦克风可用）";
                builder.setContentTitle("语音审计服务运行中")
                       .setContentText(statusText);
            }
            
            manager.notify(NOTIFICATION_ID, builder.build());
        } catch (Exception e) {
            Log.e(TAG, "更新通知内容失败", e);
        }
    }
}
