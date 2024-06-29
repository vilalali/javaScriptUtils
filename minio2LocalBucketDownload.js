process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var Minio = require("minio");
var fs = require('fs');
var path = require('path');

// Create MinIO client instance
var minioClient = new Minio.Client({
    endPoint: 'minio.iiit.ac.in',
    port: 9000,
    useSSL: true,
    accessKey: '',
    secretKey: ''
});

const bucketName = "microlab/IGIB-COVID/MicroLabsGenomeSequences_02.2024_V29.tar.gz";
const localDownloadPath = "/data/codeDumpDfs/farhin";

// Ensure the local download directory exists
if (!fs.existsSync(localDownloadPath)) {
    fs.mkdirSync(localDownloadPath, { recursive: true });
}

// Function to download an object and show progress
async function downloadObject(objectName) {
    return new Promise((resolve, reject) => {
        minioClient.statObject(bucketName, objectName, function (err, stat) {
            if (err) {
                return reject("Unable to retrieve file size: " + err);
            }

            const totalBytes = stat.size;
            let downloadedBytes = 0;
            const filePath = path.join(localDownloadPath, objectName);

            // Ensure the directory structure exists
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            minioClient.getObject(bucketName, objectName, function (error, stream) {
                if (error) {
                    return reject(error);
                }

                const fileStream = fs.createWriteStream(filePath);
                stream.pipe(fileStream);

                stream.on('data', function (chunk) {
                    downloadedBytes += chunk.length;
                    const progress = Math.round((downloadedBytes / totalBytes) * 100);
                    process.stdout.clearLine();
                    process.stdout.cursorTo(0);
                    process.stdout.write(`Downloading ${objectName}: ${progress}%`);
                });

                stream.on('end', function () {
                    console.log(`\nFile ${objectName} downloaded to ${filePath}`);
                    resolve();
                });

                stream.on('error', function (err) {
                    reject(err);
                });
            });
        });
    });
}

// Function to download all objects in the bucket
async function downloadAllObjects() {
    const objectsList = [];
    const stream = minioClient.listObjects(bucketName, '', true);

    return new Promise((resolve, reject) => {
        stream.on('data', obj => objectsList.push(obj.name));
        stream.on('error', reject);
        stream.on('end', async () => {
            try {
                for (const objectName of objectsList) {
                    console.log(`Starting download for ${objectName}`);
                    await downloadObject(objectName);
                }
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    });
}

// Start the download process
downloadAllObjects()
    .then(() => {
        console.log('All files downloaded successfully!');
    })
    .catch(err => {
        console.error('Error downloading files:', err);
    });
