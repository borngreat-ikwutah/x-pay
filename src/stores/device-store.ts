import { create } from 'zustand';

interface DeviceState {
  isMobile: boolean;
  checkDevice: (initialMobile?: boolean) => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  isMobile: true,
  checkDevice: (initialMobile?: boolean) => {
    if (typeof initialMobile === 'boolean') {
      set({ isMobile: initialMobile });
      return;
    }
    if (typeof window !== 'undefined') {
      set({ isMobile: window.innerWidth <= 768 });
    }
  },
}));
