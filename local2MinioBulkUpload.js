var Minio = require("minio");
var fs = require('fs');
var path = require('path');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var minioClient = new Minio.Client({
    endPoint: 'IP Address',
    port: 9000,
    useSSL: true,
    accessKey: '',
    secretKey: ''
});

const folderPath = "/home/path";

fs.readdir(folderPath, (err, files) => {
    if (err) {
        console.error("Error reading directory:", err);
        process.exit(1); // Exit with error code 1
    }

    files.forEach(file => {
        const localFilePath = path.join(folderPath, file);

        // Create a readable stream from the local file
        const fileStream = fs.createReadStream(localFilePath);

        // Get file stats to determine file size for progress tracking
        const stats = fs.statSync(localFilePath);
        const totalBytes = stats.size;
        let uploadedBytes = 0;

        // Upload the file to MinIO
        minioClient.putObject("YourBucketName", file, fileStream, totalBytes, function (error, etag) {
            if (error) {
                console.error(`Error occurred while uploading ${file}:`, error);
                process.exit(1); // Exit with error code 1
            }
            console.log(`File ${file} uploaded successfully. ETag: ${etag}`);
        });

        // Track upload progress
        fileStream.on('data', function (chunk) {
            uploadedBytes += chunk.length;
            const progress = Math.round((uploadedBytes / totalBytes) * 100);
            process.stdout.clearLine();  // Clear the previous progress output
            process.stdout.cursorTo(0);  // Move cursor to beginning of line
            process.stdout.write(`Uploading ${file}: ${progress}%`);
        });

        // Handle errors
        fileStream.on('error', function (err) {
            console.error(`Error occurred while reading file ${file}:`, err);
            process.exit(1); // Exit with error code 1
        });
    });
});

