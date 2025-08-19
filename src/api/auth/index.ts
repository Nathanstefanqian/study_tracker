import request from '@/utils/request'

 export interface LoginVO {
  phoneCode: string // wx.getPhoneNumber获得
  loginCode: any // wx.login方法获得
  userType: number // 3 摄影师  1 客户
}

// 发送短信验证码
export const sendSms = async (params: any) => {
  return await request.post('/member/auth/send-sms-code', params)
}

// 微信小程序一键登录
export const Login = async (params: LoginVO) => {
  return await request.post('/member/auth/weixin-mini-app-login', params)
}

// 登出系统
export const logOut = async () => {
  return await request.post('/member/auth/logout')
}

// 刷新令牌
export const refreshToken = async (token: any) => {
  return await request.post('/member/auth/refresh-token')
}