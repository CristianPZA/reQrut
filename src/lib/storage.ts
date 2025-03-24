import { supabase } from './supabase';

export async function uploadDocument(file: File, candidateId: string): Promise<string> {
  try {
    // Create a unique file path including the candidate ID
    const filePath = `${candidateId}/${Date.now()}-${file.name}`;

    // Upload the file to the documents bucket
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get the private URL for the file
    const { data: { signedUrl }, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600); // URL valid for 1 hour

    if (urlError) throw urlError;

    return signedUrl;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
}

export async function getDocumentUrl(path: string): Promise<string> {
  try {
    const { data: { signedUrl }, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(path, 3600); // URL valid for 1 hour

    if (error) throw error;
    return signedUrl;
  } catch (error) {
    console.error('Error getting document URL:', error);
    throw error;
  }
}