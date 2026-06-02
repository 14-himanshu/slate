export const isNotificationSupported = () => 'Notification' in window;

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) return false;
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

export const sendNotification = (title: string, options?: NotificationOptions) => {
  if (!isNotificationSupported()) return;
  
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/vite.svg', // Assuming vite.svg is the favicon/icon
      ...options,
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
};
