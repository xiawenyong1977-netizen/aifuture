package com.company.voicetrack;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 重要：必须在 super.onCreate() 之前注册插件
        registerPlugin(com.company.voicetrack.MicrophoneMonitorPlugin.class);
        
        super.onCreate(savedInstanceState);
        Log.d(TAG, "MainActivity onCreate - 应用已创建");
    }
    
    @Override
    public void onResume() {
        super.onResume();
        Log.d(TAG, "MainActivity onResume - 应用进入前台");
    }
    
    @Override
    public void onPause() {
        super.onPause();
        Log.d(TAG, "MainActivity onPause - 应用进入后台，前台服务应继续运行");
        // 前台服务应该继续运行，因为设置了 stopWithTask="false"
    }
    
    @Override
    public void onStop() {
        super.onStop();
        Log.d(TAG, "MainActivity onStop - 应用已停止，前台服务应继续运行");
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "MainActivity onDestroy - Activity 被销毁，但前台服务应继续运行");
    }
}
