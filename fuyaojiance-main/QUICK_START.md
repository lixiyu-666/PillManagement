# 服药监测系统 - Android 改造指南

## 改造概述

本项目已将原有的 Web 应用改造为支持 Android 平台的 PWA + 原生混合应用。

## 目录结构

```
fuyaojiance-main/
├── frontend/              # Vue 3 前端 (已配置 PWA)
│   ├── src/utils/android.js  # Android 桥接接口
│   ├── vite.config.js       # 已添加 PWA 配置
│   └── index.html           # 已添加 PWA meta 标签
├── backend/               # Spring Boot 后端 (无需改动)
└── android/                # Android Studio 项目 (新增)
    └── README.md            # Android 项目详细说明
```

## 快速开始

### 步骤 1: 安装依赖并构建前端

```bash
cd frontend
npm install
npm run build
```

### 步骤 2: 部署后端

将后端部署到服务器，确保：
- 服务器配置 HTTPS
- 后端 API 地址可访问

### 步骤 3: 修改 Android 配置

编辑 `android/app/build.gradle`，修改服务器地址：

```groovy
buildConfigField "String", "BASE_URL", "\"https://你的服务器域名/\""
```

### 步骤 4: 构建 Android APK

```bash
cd android
gradlew.bat assembleDebug
```

APK 输出位置：`android/app/build/outputs/apk/debug/app-debug.apk`

### 步骤 5: 安装测试

将 APK 传输到 Android 手机，安装并测试。

## 前端调用原生功能

在 Vue 组件中使用 Android 桥接：

```javascript
import AndroidBridge from '@/utils/android'

// 设置服药提醒
AndroidBridge.scheduleMedicationReminder({
  id: 1,
  name: '阿司匹林'
}, '08:00')

// 显示通知
AndroidBridge.showNotification('服药提醒', '该服药了', 1)
```

## 替代方案：使用 PWABuilder 打包

如果不使用 Android Studio 项目，可以：

1. 部署前端到 HTTPS 服务器
2. 访问 https://www.pwabuilder.com/
3. 输入网站 URL
4. 下载 Android APK

## 技术支持

- Android 项目详情：查看 `android/README.md`
- PWA 配置：查看 `frontend/vite.config.js`
