import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import mpAdapter from "axios-miniprogram-adapter";
import { netConfig } from '@/config/net.config';
import { useUserStore } from '@/pinia/user';

axios.defaults.adapter = mpAdapter as any;

interface NetConfig {
  baseURL: string;
  contentType: string;
  requestTimeout: number;
  successCode: number[];
}

const { baseURL, contentType, requestTimeout, successCode }: NetConfig = netConfig;

let tokenLose: boolean = true;

const instance = axios.create({
  baseURL,
  timeout: requestTimeout,
  headers: {
    'Content-Type': contentType,
  },
});

// 请求头的添加
instance.interceptors.request.use(
  async (config: any) => {
    const userStore = useUserStore();
    const token = userStore.token;

    // 检查token是否过期，如果过期则刷新token
    if (!token) {
      return config;
    }

    const isTokenExpired = checkTokenExpired(userStore.userInfo?.expiresTime);

    if (isTokenExpired) {
      await userStore.refreshToken(); // 刷新token
    }

    config.headers.Authorization = `Bearer ${userStore.token}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data;
    return res;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 检查token是否过期
function checkTokenExpired(expiresTime: number | undefined) {
  if (!expiresTime) return true; // 如果没有过期时间，则视为过期
  const currentTimestamp = Math.floor(Date.now() / 1000); // 当前时间戳（秒）
  return expiresTime < currentTimestamp;
}

export default instance;
