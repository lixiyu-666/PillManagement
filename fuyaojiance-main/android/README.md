# Android 项目使用说明

## 项目概述

本项目将 `服药监测系统` 前端改造为 Android 原生应用，通过 WebView 加载 PWA 应用，实现近似原生体验。

## 功能特性

- ✅ WebView 加载前端页面
- ✅ 原生服药提醒通知
- ✅ 定时闹钟功能
- ✅ 开机自启支持
- ✅ Android 13+ 通知权限适配
- ✅ 离线缓存支持

## 项目结构

```
android/
├── app/
│   ├── src/main/
│   │   ├── java/com/medication/tracker/
│   │   │   ├── MainActivity.kt              # 主界面 (WebView)
│   │   │   ├── MedicationReminderReceiver.kt # 服药提醒广播
│   │   │   └── BootReceiver.kt              # 开机自启广播
│   │   ├── res/
│   │   │   ├── layout/activity_main.xml     # 主界面布局
│   │   │   ├── values/                      # 资源文件
│   │   │   └── drawable/                    # 图标资源
│   │   └── AndroidManifest.xml
│   └── build.gradle
├── build.gradle                              # 根构建配置
├── settings.gradle
├── gradle.properties
└── gradlew.bat                              # Windows 构建脚本
```

## 配置说明

### 1. 修改服务器地址

编辑 `app/build.gradle` 文件，修改 `BASE_URL` 为你的后端服务器地址：

```groovy
buildConfigField "String", "BASE_URL", "\"http://你的服务器IP:8080/\""
```

### 2. 本地开发测试

如需使用本地开发服务器测试（模拟器），可以使用：

```kotlin
// 在 MainActivity.kt 中
webView.loadUrl("http://10.0.2.2:5173/")  // 模拟器访问宿主机
```

## 构建 APK

### 前置条件

1. 安装 JDK 17+
2. 安装 Android SDK
3. 配置环境变量 `ANDROID_HOME`

### 构建步骤

**Windows:**
```bash
cd android
gradlew.bat assembleDebug
```

**macOS/Linux:**
```bash
cd android
chmod +x gradlew
./gradlew assembleDebug
```

### APK 输出位置

```
android/app/build/outputs/apk/debug/app-debug.apk
```

## 功能接口

Android 应用通过 JavaScript 接口暴露以下功能给前端：

### `window.MedicationAndroid.showNotification(title, message, notificationId)`
显示系统通知

### `window.MedicationAndroid.scheduleAlarm(medicationId, timeInMillis)`
设置服药提醒闹钟

### `window.MedicationAndroid.cancelAlarm(medicationId)`
取消指定的服药提醒

### 前端调用示例

```javascript
// 显示通知
if (window.MedicationAndroid) {
    window.MedicationAndroid.showNotification(
        '服药提醒',
        '该服药了：阿司匹林',
        1001
    );
}

// 设置闹钟 (timeInMillis 为毫秒时间戳)
if (window.MedicationAndroid) {
    window.MedicationAndroid.scheduleAlarm(
        medicationId,
        Date.now() + 30 * 60 * 1000 // 30分钟后
    );
}
```

## 权限说明

| 权限 | 用途 |
|------|------|
| INTERNET | 网络访问 |
| POST_NOTIFICATIONS | 发送通知 (Android 13+) |
| SCHEDULE_EXACT_ALARM | 精确闹钟 |
| RECEIVE_BOOT_COMPLETED | 开机自启 |
| VIBRATE | 震动提醒 |

## 注意事项

1. **HTTPS 要求**: Android 9+ 默认禁止明文流量，确保服务器配置 HTTPS
2. **服务器地址**: 部署后务必修改 `BASE_URL`
3. **签名配置**: 发布时需配置 release 签名
4. **混淆规则**: ProGuard 规则已配置，但可根据需要调整
