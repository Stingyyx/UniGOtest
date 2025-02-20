import { DefaultAvatar } from '../../assets';

export const IMAGES = {
  DEFAULT_AVATAR: DefaultAvatar,
} as const;

// Add type safety
export type ImageKeys = keyof typeof IMAGES; 