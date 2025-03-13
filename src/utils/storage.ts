import { supabase } from '../lib/supabase';

/**
 * Uploads a profile picture for a member
 * @param file The file to upload
 * @param tenantId The tenant ID
 * @param userId The user ID
 * @returns The public URL of the uploaded file
 */
export async function uploadProfilePicture(file: File, tenantId: string, userId: string) {
  // Validate parameters
  if (!tenantId || !userId) {
    throw new Error('Tenant ID and User ID are required');
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }

  // Validate file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size must be less than 5MB');
  }

  // Generate a unique filename with proper path structure
  const fileExt = file.name.split('.').pop();
  const fileName = `${tenantId}/${userId}/${Math.random()}.${fileExt}`;

  try {
    // Delete any existing profile pictures for this user
    const { data: existingFiles } = await supabase.storage
      .from('profiles')
      .list(`${tenantId}/${userId}`);

    if (existingFiles && existingFiles.length > 0) {
      await supabase.storage
        .from('profiles')
        .remove(existingFiles.map(file => `${tenantId}/${userId}/${file.name}`));
    }

    // Upload the new file
    const { error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profiles')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
}

/**
 * Deletes all profile pictures for a user
 * @param tenantId The tenant ID
 * @param userId The user ID
 */
export async function deleteProfilePicture(tenantId: string, userId: string) {
  try {
    // Get list of files in the user's directory
    const { data: files } = await supabase.storage
      .from('profiles')
      .list(`${tenantId}/${userId}`);

    if (files && files.length > 0) {
      // Delete all files in the directory
      const { error } = await supabase.storage
        .from('profiles')
        .remove(files.map(file => `${tenantId}/${userId}/${file.name}`));

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    throw error;
  }
}