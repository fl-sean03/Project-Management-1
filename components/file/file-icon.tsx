'use client';

import { FileText, Image, FileArchive, FileSpreadsheet, FileCode, Film, Music, File } from 'lucide-react';

interface FileIconProps {
  extension?: string;
  size?: number;
}

export function FileIcon({ extension = '', size = 24 }: FileIconProps) {
  const getIconByType = () => {
    // Normalize extension (remove dot if present and convert to lowercase)
    const ext = extension.replace(/^\./, '').toLowerCase();
    
    // Document types
    if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) {
      return <FileText size={size} />;
    }
    
    // Image types
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext)) {
      return <Image size={size} />;
    }
    
    // Archive types
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return <FileArchive size={size} />;
    }
    
    // Spreadsheet types
    if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) {
      return <FileSpreadsheet size={size} />;
    }
    
    // Code types
    if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'php', 'py', 'java', 'c', 'cpp', 'cs', 'rb'].includes(ext)) {
      return <FileCode size={size} />;
    }
    
    // Video types
    if (['mp4', 'webm', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(ext)) {
      return <Film size={size} />;
    }
    
    // Audio types
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(ext)) {
      return <Music size={size} />;
    }
    
    // Default for unknown types
    return <File size={size} />;
  };

  return (
    <div className="flex items-center justify-center w-full h-full text-muted-foreground">
      {getIconByType()}
    </div>
  );
} 