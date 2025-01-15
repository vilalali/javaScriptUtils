const Minio = require('minio');
const fs = require('fs');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Source MinIO client configuration
const sourceMinioClient = new Minio.Client({
  endPoint: '',
  port: 9000,
  useSSL: true,
  accessKey: '',
  secretKey: '',
  insecure: true,
});

// Destination MinIO client configuration
const destinationMinioClient = new Minio.Client({
  endPoint: '',
  port: 9000,
  useSSL: true,
  accessKey: '',
  secretKey: '',
  insecure: true,
});

// Source and destination configuration
const sourceBucket = 'datafoundation';
const destinationBucket = 'datafoundation-dev';
const folderPrefix = '52e67bb5-5acd-438d-a13b-f255cee17432/'; // Folder name to copy (with trailing slash)

// Copy objects from source to destination
async function copyFolder() {
  try {
    const objectsStream = sourceMinioClient.listObjectsV2(sourceBucket, folderPrefix, true);
    let totalSize = 0;
    let copiedSize = 0;

    // First pass to calculate total size
    for await (const obj of objectsStream) {
      totalSize += obj.size; // Track total size for progress calculation
    }

    // Reset stream for second pass (copying objects)
    const objectsStream2 = sourceMinioClient.listObjectsV2(sourceBucket, folderPrefix, true);

    // Copy objects from source to destination
    for await (const obj of objectsStream2) {
      const sourceObject = obj.name;
      const destinationObject = sourceObject; // Keep the same structure

      const objectStream = await sourceMinioClient.getObject(sourceBucket, sourceObject);
      
      // Track progress
      const progressStream = new (require('stream')).Transform({
        transform(chunk, encoding, callback) {
          copiedSize += chunk.length; // Increment copied size
          const progress = ((copiedSize / totalSize) * 100).toFixed(2); // Calculate percentage progress
          process.stdout.write(`\rProgress: ${progress}% (${copiedSize} / ${totalSize} bytes)`);
          callback(null, chunk);
        },
      });

      // Pipe the stream through progressStream
      objectStream.pipe(progressStream);

      // Put the object into the destination bucket
      await destinationMinioClient.putObject(destinationBucket, destinationObject, progressStream);

      console.log(`\nCopied: ${sourceObject} -> ${destinationBucket}/${destinationObject}`);
    }

    console.log('Folder copy completed.');
  } catch (err) {
    console.error('Error copying folder:', err);
  }
}

// Start the copy process
copyFolder();
