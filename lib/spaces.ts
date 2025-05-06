import { S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Initialize the S3 client for DigitalOcean Spaces
const getS3Client = () => {
  const s3Client = new S3({
    endpoint: `https://${process.env.SPACES_REGION}.digitaloceanspaces.com`,
    region: process.env.SPACES_REGION,
    credentials: {
      accessKeyId: process.env.SPACES_KEY!,
      secretAccessKey: process.env.SPACES_SECRET!,
    },
    forcePathStyle: false, // Required for DigitalOcean Spaces
  });
  
  return s3Client;
};

const getSpaceName = () => {
  return process.env.SPACES_NAME!;
};

// Upload a file to Spaces
export async function uploadFile(
  file: Buffer,
  key: string,
  contentType: string,
  isPublic: boolean = false
) {
  const s3Client = getS3Client();
  const spaceName = getSpaceName();
  
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: spaceName,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: isPublic ? 'public-read' : 'private',
    },
  });

  try {
    const result = await upload.done();
    return {
      success: true,
      key: key,
      etag: result.ETag,
      url: isPublic 
        ? `https://${spaceName}.${process.env.SPACES_REGION}.digitaloceanspaces.com/${key}`
        : null,
    };
  } catch (error) {
    console.error('Error uploading file to Spaces:', error);
    return { success: false, error };
  }
}

// Generate a signed URL for temporary access to a private file
export async function getSignedFileUrl(key: string, expiresIn = 3600) {
  const s3Client = getS3Client();
  const spaceName = getSpaceName();
  
  const command = new GetObjectCommand({
    Bucket: spaceName,
    Key: key,
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn,
    });
    return { success: true, url: signedUrl };
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return { success: false, error };
  }
}

// Delete a file from Spaces
export async function deleteFile(key: string) {
  const s3Client = getS3Client();
  const spaceName = getSpaceName();
  
  try {
    const command = new DeleteObjectCommand({
      Bucket: spaceName,
      Key: key,
    });
    
    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    console.error('Error deleting file from Spaces:', error);
    return { success: false, error };
  }
}

// Generate a pre-signed URL for direct client-side uploads
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
) {
  const s3Client = getS3Client();
  const spaceName = getSpaceName();
  
  const command = new PutObjectCommand({
    Bucket: spaceName,
    Key: key,
    ContentType: contentType,
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn,
    });
    return { 
      success: true, 
      url: signedUrl,
      key,
      fields: {
        Key: key,
        'Content-Type': contentType,
      }
    };
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    return { success: false, error };
  }
} 