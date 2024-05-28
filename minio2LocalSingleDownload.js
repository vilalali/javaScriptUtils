var Minio = require("minio");

var minioClient = new Minio.Client({
    endPoint: 'IP Address',
    port: 9000,
    useSSL: false,
    accessKey: '',
    secretKey: ''
});

const filename = "File Name";
const localFilePath = "/Path/File_Name";

minioClient.getObject("BucketName", filename, function (error, stream) {
    if (error) {
        return console.log(error);
    }

    // Variables to track progress
    let totalBytes = 0;
    let downloadedBytes = 0;

    // Get total size of the file
    minioClient.statObject("BucketName", filename, function(err, stat) {
        if (err) {
            return console.log("Unable to retrieve file size:", err);
        }
        totalBytes = stat.size;
    });

    // Pipe the stream to write to the file
    const fileStream = require('fs').createWriteStream(localFilePath);
    stream.pipe(fileStream);

    // Listen for data events to calculate progress
    stream.on('data', function(chunk) {
        downloadedBytes += chunk.length;
        const progress = Math.round((downloadedBytes / totalBytes) * 100);
        process.stdout.clearLine();  // Clear the previous progress output
        process.stdout.cursorTo(0);  // Move cursor to beginning of line
        process.stdout.write(`Download progress: ${progress}%`);
    });

    // Listen for the end event to indicate completion
    stream.on('end', function() {
        console.log();  // Move to next line after progress display
        console.log(`File downloaded to ${localFilePath}`);
        console.log("Download completed successfully!");
        process.exit(0); // Exit with success code 0
    });

    // Handle errors
    stream.on('error', function(err) {
        console.log(err);
        process.exit(1); // Exit with error code 1
    });
});

