/**
 * App color constants
 * These colors are used throughout the app for consistent styling
 */
export const colors = {
  // Primary colors
  primary: '#000000', // Used in buttons and primary actions
  secondary: '#666666', // Used in secondary text and icons
  
  // Background colors
  background: '#FFFFFF',
  surfaceBackground: '#F3F4F6',
  
  // Border colors
  border: '#E5E7EB',
  
  // Text colors
  text: {
    primary: '#000000',
    secondary: '#666666',
    muted: '#9CA3AF',
  },
  
  // Status colors
  status: {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
  
  // Specific feature colors
  transport: {
    active: '#10B981',
    cancelled: '#EF4444',
    completed: '#6B7280',
    full: '#F59E0B',
  },
} as const;

// Add default export
export default colors; 