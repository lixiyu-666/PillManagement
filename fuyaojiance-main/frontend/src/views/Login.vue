<template>
  <div class="login-container">
    <div class="login-box">
      <!-- 标题+副标题补充说明 -->
      <div class="login-header">
        <div class="login-title">服药监测</div>
        <div class="login-desc">请输入账号密码进行登录</div>
      </div>

      <van-form @submit="onSubmit">
        <van-cell-group inset>
          <!-- 账号输入框 - 使用用户图标 -->
          <van-field
            v-model="form.username"
            name="username"
            placeholder="请输入账号"
            :rules="[{ required: true, message: '请输入账号' }]"
          >
            <template #label>
              <div class="field-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#394352"/>
                </svg>
              </div>
            </template>
          </van-field>
          
          <!-- 密码输入框 - 使用锁图标 -->
          <van-field
            v-model="form.password"
            type="password"
            name="password"
            placeholder="请输入密码"
            :rules="[{ required: true, message: '请输入密码' }]"
            class="password-field"
          >
            <template #label>
              <div class="field-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 8H20C21.1 8 22 8.9 22 10V20C22 21.1 21.1 22 20 22H4C2.9 22 2 21.1 2 20V10C2 8.9 2.9 8 4 8H6V6C6 3.79 7.79 2 10 2H14C16.21 2 18 3.79 18 6V8ZM16 8V6C16 4.9 15.1 4 14 4H10C8.9 4 8 4.9 8 6V8H16ZM6 10H4V20H20V10H18V12H16V10H8V12H6V10Z" fill="#394352"/>
                </svg>
              </div>
            </template>
          </van-field>
        </van-cell-group>

        <div class="remember-password">
          <van-checkbox v-model="rememberPassword">记住密码</van-checkbox>
        </div>

        <div class="login-btn">
          <van-button round block type="primary" native-type="submit" :loading="loading">
            立即登录
          </van-button>
        </div>
      </van-form>

      <!-- 新增：底部版权/版本信息 -->
      <div class="login-footer">
        <div class="copyright">© 2026 服药监测系统 版本 1.0.0</div>
        <div class="slogan">健康管理，从按时服药开始</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { login } from '@/api'
import dayjs from 'dayjs'

const router = useRouter()

const form = ref({
  username: '',
  password: ''
})

const loading = ref(false)
const rememberPassword = ref(true) // 默认记住密码

// 保存账号密码的key
const REMEMBER_KEY = 'remembered_credentials'
const REMEMBER_EXPIRE_KEY = 'remember_expire_time'

// 加载记住的账号密码
const loadRememberedCredentials = () => {
  try {
    const expireTime = localStorage.getItem(REMEMBER_EXPIRE_KEY)
    if (expireTime && dayjs().isBefore(dayjs(expireTime))) {
      const remembered = localStorage.getItem(REMEMBER_KEY)
      if (remembered) {
        const credentials = JSON.parse(remembered)
        form.value.username = credentials.username || ''
        form.value.password = credentials.password || ''
        rememberPassword.value = true
      }
    } else {
      // 过期了，清除
      localStorage.removeItem(REMEMBER_KEY)
      localStorage.removeItem(REMEMBER_EXPIRE_KEY)
    }
  } catch (e) {
    console.error('加载记住的账号密码失败', e)
  }
}

// 保存账号密码
const saveCredentials = () => {
  if (rememberPassword.value) {
    const expireTime = dayjs().add(7, 'day').toISOString() // 一周后过期
    localStorage.setItem(REMEMBER_KEY, JSON.stringify({
      username: form.value.username,
      password: form.value.password
    }))
    localStorage.setItem(REMEMBER_EXPIRE_KEY, expireTime)
  } else {
    // 不记住，清除保存的账号密码
    localStorage.removeItem(REMEMBER_KEY)
    localStorage.removeItem(REMEMBER_EXPIRE_KEY)
  }
}

const onSubmit = async () => {
  loading.value = true
  try {
    const data = await login(form.value)
    // 保存token
    localStorage.setItem('token', data.token)
    localStorage.setItem('username', data.username)
    
    // 保存账号密码（如果勾选了记住密码）
    saveCredentials()
    
    showToast('登录成功')
    // 跳转到首页
    router.push('/')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadRememberedCredentials()
})
</script>

<style scoped>
/* 整体背景 更换简约清新渐变配色 */
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e0f7fa 0%, #f5f7fa 100%);
  padding: 20px;
  box-sizing: border-box;
}

/* 登录卡片 优化圆角、阴影、宽度 */
.login-box {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 20px;
  padding: 40px 30px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
}

/* 头部标题区域 */
.login-header {
  margin-bottom: 36px;
  text-align: center;
}

.login-title {
  font-size: 26px;
  font-weight: 700;
  color: black;
  margin-bottom: 8px;
}

.login-desc {
  font-size: 14px;
  color: #969799;
}

/* 输入框图标样式 */
.field-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-right: 8px;
}

/* 调整输入框样式以适应图标 */
:deep(.van-field) {
  padding-left: 10px;
}

/* 为密码输入框添加底部边框 */
:deep(.password-field) {
  border-bottom: 1px solid #ebedf0;
  margin-bottom: 16px; /* 增加下边距，使记住密码离得更远 */
}

/* 记住密码区域 */
.remember-password {
  padding: 16px 10px 0;
  font-size: 14px;
  color: #666;
  margin-top: 8px; /* 增加上边距，使其离密码输入框更远 */
}

/* 调整记住密码勾选框图标大小 */
:deep(.remember-password .van-checkbox__icon) {
  font-size: 16px; /* 调整图标大小 */
}

:deep(.remember-password .van-checkbox__icon .van-icon) {
  width: 16px;
  height: 16px;
  line-height: 16px;
}

/* 登录按钮区域 */
.login-btn {
  margin-top: 28px;
  padding: 0 10px;
}

.login-btn :deep(.van-button--primary) {
  background: linear-gradient(90deg, #1989fa, #409eff);
  border: none;
  height: 46px;
  font-size: 16px;
}

/* 新增：底部版权/版本信息样式 */
.login-footer {
  margin-top: 36px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
  color: #999;
  font-size: 12px;
  line-height: 1.8;
}
</style>