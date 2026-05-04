import React, { useState, useCallback, useEffect } from 'react';
import { type FileRejection, useDropzone } from 'react-dropzone';
import './ImageUpload.css';

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
  initialImage?: string | null;
  file?: File | null;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload, initialImage, file }) => {
  const [preview, setPreview] = useState<string | null>(initialImage || null);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview(initialImage || null);
    }
  }, [file, initialImage]);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections?.length) {
      const first = fileRejections[0];
      const name = first?.file?.name ? ` (${first.file.name})` : '';
      const firstError = first?.errors?.[0];
      const reason =
        firstError?.code === 'file-too-large'
          ? 'Изображение слишком большое (макс. 5 МБ)'
          : firstError?.message || 'файл отклонён';
      setErrorText(`${reason}${name}`);
      return;
    }

    if (acceptedFiles && acceptedFiles.length > 0) {
      setErrorText(null);
      const droppedFile = acceptedFiles[0];
      onImageUpload(droppedFile);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    // Accept any image; backend still validates extensions/MIME.
    accept: {
      'image/*': [],
    },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  return (
    <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
      <input {...getInputProps()} />
      {preview ? (
        <img
          src={preview}
          alt="Preview"
          className="image-preview"
          onError={() => {
            setErrorText('Не удалось отобразить изображение. Попробуйте другой файл (PNG/JPG) или пересохраните картинку.');
          }}
        />
      ) : (
        <p>Перетащите сюда файл или кликните для выбора</p>
      )}
      {errorText && (
        <p style={{ marginTop: 8, color: '#cf1322', fontSize: 12 }}>
          {errorText}
        </p>
      )}
    </div>
  );
};

export default ImageUpload;
