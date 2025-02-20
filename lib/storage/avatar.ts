// [Cursor] Avatar Implementation - March 29, 2024
// Following Error Prevention Plan:
// - Optimize image loading
// - Add proper error handling
// - Document component usage patterns

import { supabase } from '../supabase';
import * as ExpoImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Alert } from 'react-native';

const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const TEMP_DIRECTORY = FileSystem.cacheDirectory + 'ImagePicker/';

/**
 * Uploads a user avatar to Supabase Storage
 * @param uri - The local URI of the image to upload
 * @param userId - The user's ID for creating the storage path
 * @returns Promise<{ url: string }> - The public URL of the uploaded avatar
 * 
 * Usage pattern:
 * 1. Call pickImage() to get image URI
 * 2. Pass URI to uploadAvatar() with user ID
 * 3. Update profile with returned URL
 * 
 * Error handling:
 * - Checks file existence
 * - Validates file size
 * - Handles upload failures
 * - Cleans up temporary files
 */
export async function uploadAvatar(uri: string, userId: string) {
  let processedUri = uri;
  try {
    // Validate input
    if (!uri || !userId) {
      throw new Error('Invalid input: URI and userId are required');
    }

    // Check file existence and size
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    // Check if size property exists and validate
    const fileSize = (fileInfo as any).size;
    if (typeof fileSize !== 'number') {
      throw new Error('Could not determine file size');
    }

    // Optimize image if needed
    if (fileSize > MAX_FILE_SIZE) {
      const manipResult = await manipulateAsync(
        uri,
        [{ resize: { width: 400, height: 400 } }],
        { compress: 0.7, format: SaveFormat.JPEG }
      );
      processedUri = manipResult.uri;

      // Verify optimization worked
      const optimizedInfo = await FileSystem.getInfoAsync(processedUri);
      const optimizedSize = (optimizedInfo as any).size;
      if (typeof optimizedSize !== 'number' || optimizedSize > MAX_FILE_SIZE) {
        throw new Error('Image optimization failed');
      }
    }

    const fileExt = processedUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/avatar.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload to Supabase with retry
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        const response = await fetch(processedUri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, blob, {
            upsert: true,
            contentType: `image/${fileExt}`
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        return { url: publicUrl };
      } catch (error) {
        if (retryCount === maxRetries) throw error;
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    throw new Error('Upload failed after retries');
  } catch (error: any) {
    console.error('[Cursor] Error uploading avatar:', error);
    Alert.alert(
      'Error Uploading Avatar',
      error.message || 'An unexpected error occurred'
    );
    throw error;
  } finally {
    // Clean up temporary files
    if (processedUri !== uri) {
      try {
        await FileSystem.deleteAsync(processedUri, { idempotent: true });
      } catch (cleanupError) {
        console.warn('[Cursor] Error cleaning up temporary file:', cleanupError);
      }
    }
  }
}

/**
 * Launches the image picker for avatar selection
 * @returns Promise<string | null> - The URI of the selected image
 * 
 * Error handling:
 * - Checks permissions
 * - Validates selection
 * - Handles cancellation
 */
export async function pickImage() {
  try {
    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant access to your photo library to select an avatar.'
      );
      throw new Error('Permission to access camera roll is required');
    }

    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      allowsMultipleSelection: false,
      base64: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }
    
    return null;
  } catch (error: any) {
    console.error('[Cursor] Error picking image:', error);
    Alert.alert(
      'Error Selecting Image',
      error.message || 'An unexpected error occurred'
    );
    throw error;
  }
} 