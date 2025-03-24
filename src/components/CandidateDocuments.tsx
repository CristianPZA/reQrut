import React, { useState } from 'react';
import { Upload, Download } from 'lucide-react';
import type { CandidateDocument } from '../types/candidates';
import { uploadDocument } from '../lib/storage';
import { createLog } from '../lib/logs';
import { supabase } from '../lib/supabase';

interface Props {
  candidateId: string;
  documents: CandidateDocument[];
  onDocumentAdded: (doc: CandidateDocument) => void;
  canUpload: boolean;
}

const CandidateDocuments = ({ candidateId, documents, onDocumentAdded, canUpload }: Props) => {
  const [uploadingFile, setUploadingFile] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      // Upload file to Supabase Storage
      const fileUrl = await uploadDocument(file, candidateId);

      // Create document record in the database
      const { data: documentData, error: documentError } = await supabase
        .from('candidate_documents')
        .insert({
          candidate_id: candidateId,
          name: file.name,
          url: fileUrl
        })
        .select()
        .single();

      if (documentError) throw documentError;

      // Create log entry
      await createLog(
        'upload_document',
        'document',
        documentData.id,
        { document_name: file.name }
      );

      onDocumentAdded(documentData);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploadingFile(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Documents</h2>
      
      {canUpload && (
        <div className="mb-4">
          <label className="block w-full cursor-pointer">
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploadingFile}
            />
            <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
              {uploadingFile ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2 text-gray-500" />
                  <span className="text-gray-600">Ajouter un document</span>
                </>
              )}
            </div>
          </label>
        </div>
      )}
      
      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <span className="text-gray-700">{doc.name}</span>
            <a
              href={doc.url}
              download
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Download className="w-5 h-5" />
            </a>
          </div>
        ))}
        {documents.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            Aucun document
          </p>
        )}
      </div>
    </div>
  );
};

export default CandidateDocuments;