// hooks/useNotification.ts

interface ToastOptions {
  title: string;
  icon?: 'success' | 'loading' | 'none';
  duration?: number;
}

interface ModalOptions {
  title: string;
  content: string;
  showCancel?: boolean;
  cancelText?: string;
  confirmText?: string;
}

export function useNotification() {
  const isModalVisible = ref(false);

  const message = (options: ToastOptions) => {
    uni.showToast({
      title: options.title,
      icon: options.icon || 'none',
      duration: options.duration || 1500
    });
  };

  const showModal = (options: ModalOptions) => {
    isModalVisible.value = true;
    return new Promise<void>((resolve, reject) => {
      uni.showModal({
        title: options.title,
        content: options.content,
        showCancel: options.showCancel ?? true,
        cancelText: options.cancelText || '取消',
        confirmText: options.confirmText || '确定',
        success: (res) => {
          isModalVisible.value = false;
          if (res.confirm) {
            resolve();
          } else if (res.cancel) {
            reject();
          }
        }
      });
    });
  };

  return { message, showModal, isModalVisible };
}
