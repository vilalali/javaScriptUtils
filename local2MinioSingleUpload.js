var Minio = require("minio");
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var minioClient = new Minio.Client({
    endPoint: 'minio.iiit.ac.in',
    port: 9000,
    useSSL: false,
    accessKey: '73pTye4dlwCDeVGBihWy',
    secretKey: 'uK1lTvHMsdMLKidG5CenagszDLXst9h5vvUP4reW'
});

const filename = "IHub_Dataset_File4_Test.tar.gz";
const localFilePath = "/home/vilal/MyWork/IHub/DFSDataSet/IHub_Dataset_File4_Test.tar.gz";

// Create a readable stream from the local file
const fileStream = require('fs').createReadStream(localFilePath);

// Get file stats to determine file size for progress tracking
const stats = require('fs').statSync(localFilePath);
const totalBytes = stats.size;
let uploadedBytes = 0;

// Upload the file to MinIO
minioClient.putObject("datafoundation", filename, fileStream, totalBytes, function (error, etag) {
    if (error) {
        console.error("Error occurred while uploading:", error);
        process.exit(1); // Exit with error code 1
    }
    console.log(`File uploaded successfully. ETag: ${etag}`);
    process.exit(0); // Exit with success code 0
});

// Track upload progress
fileStream.on('data', function(chunk) {
    uploadedBytes += chunk.length;
    const progress = Math.round((uploadedBytes / totalBytes) * 100);
    process.stdout.clearLine();  // Clear the previous progress output
    process.stdout.cursorTo(0);  // Move cursor to beginning of line
    process.stdout.write(`Upload progress: ${progress}%`);
});

// Handle errors
fileStream.on('error', function(err) {
    console.error("Error occurred while reading file:", err);
    process.exit(1); // Exit with error code 1
});

