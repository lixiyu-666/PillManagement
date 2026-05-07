package com.medication.tracker

import android.Manifest
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {
    
    private lateinit var webView: WebView
    private val channelId = "medication_reminder_channel"
    private val notificationId = 1001
    
    // 权限请求Launcher
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val allGranted = permissions.entries.all { it.value }
        if (!allGranted) {
            Toast.makeText(this, "部分权限被拒绝，可能影响部分功能", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        createNotificationChannel()
        requestNecessaryPermissions()
        initWebView()
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "服药提醒"
            val descriptionText = "服药时间提醒通知"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(channelId, name, importance).apply {
                description = descriptionText
                enableVibration(true)
            }
            val notificationManager: NotificationManagerCompat = NotificationManagerCompat.from(this)
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    private fun requestNecessaryPermissions() {
        val permissionsToRequest = mutableListOf<String>()
        
        // 通知权限（Android 13+）
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) 
                != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
        
        // 闹钟权限
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val alarmManager = getSystemService(Context.ALARM_SERVICE) as AlarmManager
            if (!alarmManager.canScheduleExactAlarms()) {
                permissionsToRequest.add(Manifest.permission.SCHEDULE_EXACT_ALARM)
            }
        }
        
        if (permissionsToRequest.isNotEmpty()) {
            requestPermissionLauncher.launch(permissionsToRequest.toTypedArray())
        }
    }
    
    private fun initWebView() {
        webView = findViewById(R.id.webView)
        
        val webSettings: WebSettings = webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            loadWithOverviewMode = true
            useWideViewPort = true
            builtInZoomControls = false
            displayZoomControls = false
            setSupportZoom(false)
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            allowFileAccess = true
            allowContentAccess = true
            // 支持 viewport
            setUseWideViewPort(true)
            loadWithOverviewMode = true
        }
        
        webView.webViewClient = WebViewClient()
        webView.webChromeClient = WebChromeClient()
        
        // 配置 JavaScript 接口
        webView.addJavascriptInterface(MedicationJSInterface(this), "MedicationAndroid")
        
        // 加载本地前端资源（嵌入式离线模式）
        loadLocalWebContent()
    }
    
    /**
     * 加载本地前端资源
     * 前端已改造为 sql.js + localStorage 纯离线架构，无需后端服务器
     */
    private fun loadLocalWebContent() {
        try {
            // 优先加载 assets/www/index.html
            val inputStream = assets.open("www/index.html")
            inputStream.close()
            
            // 如果本地资源存在，加载本地文件
            webView.loadUrl("file:///android_asset/www/index.html")
        } catch (e: Exception) {
            // 本地资源不存在，加载错误提示页面
            loadErrorPage()
        }
    }
    
    /**
     * 显示错误提示页面
     * 提示用户需要先打包前端
     */
    private fun loadErrorPage() {
        val errorHtml = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        padding: 20px;
                    }
                    .container {
                        background: white;
                        border-radius: 20px;
                        padding: 40px 30px;
                        max-width: 400px;
                        width: 100%;
                        text-align: center;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    }
                    .icon {
                        font-size: 64px;
                        margin-bottom: 20px;
                    }
                    h1 {
                        color: #333;
                        font-size: 22px;
                        margin-bottom: 15px;
                    }
                    p {
                        color: #666;
                        font-size: 14px;
                        line-height: 1.6;
                        margin-bottom: 20px;
                    }
                    .steps {
                        background: #f8f9fa;
                        border-radius: 12px;
                        padding: 20px;
                        text-align: left;
                        margin: 20px 0;
                    }
                    .step {
                        display: flex;
                        align-items: flex-start;
                        margin-bottom: 12px;
                    }
                    .step:last-child { margin-bottom: 0; }
                    .step-num {
                        background: #667eea;
                        color: white;
                        width: 24px;
                        height: 24px;
                        border-radius: 50%;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        font-size: 12px;
                        font-weight: bold;
                        margin-right: 12px;
                        flex-shrink: 0;
                    }
                    .step-text {
                        color: #444;
                        font-size: 13px;
                        line-height: 1.5;
                    }
                    code {
                        background: #e9ecef;
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-family: 'Courier New', monospace;
                        font-size: 12px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="icon">📦</div>
                    <h1>前端资源未打包</h1>
                    <p>本地前端资源不存在，请先执行以下步骤打包前端：</p>
                    <div class="steps">
                        <div class="step">
                            <div class="step-num">1</div>
                            <div class="step-text">进入前端目录：<br><code>cd frontend</code></div>
                        </div>
                        <div class="step">
                            <div class="step-num">2</div>
                            <div class="step-text">安装依赖：<br><code>npm install</code></div>
                        </div>
                        <div class="step">
                            <div class="step-num">3</div>
                            <div class="step-text">打包前端：<br><code>npm run build</code></div>
                        </div>
                        <div class="step">
                            <div class="step-num">4</div>
                            <div class="step-text">复制到 Android：<br><code>mkdir -p app/src/main/assets/www && cp -r dist/* app/src/main/assets/www/</code></div>
                        </div>
                    </div>
                    <p>打包完成后重新构建 APK 即可正常运行。</p>
                </div>
            </body>
            </html>
        """.trimIndent()
        
        webView.loadDataWithBaseURL(null, errorHtml, "text/html", "UTF-8", null)
    }
    
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
    
    override fun onResume() {
        super.onResume()
        webView.onResume()
    }
    
    override fun onPause() {
        super.onPause()
        webView.onPause()
    }
    
    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}

// JavaScript 接口类
class MedicationJSInterface(private val context: Context) {
    
    @android.webkit.JavascriptInterface
    fun showNotification(title: String, message: String, notificationId: Int) {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val notification = NotificationCompat.Builder(context, "medication_reminder_channel")
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setVibrate(longArrayOf(0, 500, 200, 500))
            .build()
        
        try {
            NotificationManagerCompat.from(context).notify(notificationId, notification)
        } catch (e: SecurityException) {
            e.printStackTrace()
        }
    }
    
    @android.webkit.JavascriptInterface
    fun scheduleAlarm(medicationId: Int, timeInMillis: Long) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, MedicationReminderReceiver::class.java).apply {
            putExtra("medication_id", medicationId)
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context, medicationId, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    timeInMillis,
                    pendingIntent
                )
            } else {
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    timeInMillis,
                    pendingIntent
                )
            }
        } catch (e: SecurityException) {
            e.printStackTrace()
        }
    }
    
    @android.webkit.JavascriptInterface
    fun cancelAlarm(medicationId: Int) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, MedicationReminderReceiver::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            context, medicationId, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        alarmManager.cancel(pendingIntent)
    }
}
