import { defineStore } from 'pinia';
import * as AuthApi from '@/api/auth';

interface UserInfo {
  userId: string;
  accessToken: string;
  expiresTime: number;
  openid: string;
  refreshToken: string;
}

interface UserState {
  token: string;
  userInfo: UserInfo | null;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: uni.getStorageSync('token') || '',
    userInfo: JSON.parse(uni.getStorageSync('userInfo') || 'null'),
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    getUserInfo: (state) => state.userInfo,
  },
  actions: {
    setToken(token: string) {
      this.token = token;
      uni.setStorageSync('token', token);
    },
    setUserInfo(userInfo: UserInfo) {
      this.userInfo = userInfo;
      uni.setStorageSync('userInfo', JSON.stringify(userInfo));
    },
    clearUser() {
      this.token = '';
      this.userInfo = null;
      uni.removeStorageSync('token');
      uni.removeStorageSync('userInfo');
    },
    async login(params: AuthApi.LoginVO) {
      try {
        const res: any = await AuthApi.Login(params);
        if (res.code === 0) {
          const { accessToken, ...userInfo } = res.data;
          this.setToken(accessToken);
          this.setUserInfo(userInfo);
        } else {
          throw new Error(res.msg || '登录失败');
        }
      } catch (error) {
        console.error('登录失败', error);
      }
    },
    async logout() {
      await AuthApi.logOut(); // 调用登出接口
      this.clearUser();
    },
    async refreshToken() {
      try {
        const res: any = await AuthApi.refreshToken(this.userInfo?.refreshToken);
        if (res.code === 0) {
          const { accessToken } = res.data;
          this.setToken(accessToken);
        } else {
          throw new Error(res.msg || '刷新token失败');
        }
      } catch (error) {
        console.error('刷新token失败', error);
      }
    },
  },
});
