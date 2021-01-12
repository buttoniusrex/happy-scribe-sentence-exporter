const https = require('https');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const extract = require('extract-zip');

const hostname = 'www.happyscribe.com';
const port = 443;
const outputDir = `${__dirname}/output`;
const outputFile = 'output.zip'

let options = {
    host: hostname,
    port: port,
    headers: { 'Authorization': 'Bearer UuyDDy9FT8CD8IB2uXGQWAtt' }
};

const getTranscriptMetadataAll = () => {
    options.path = '/api/v1/transcriptions'
    return callApi(options);
};

const getTranscriptMetadata = () => {
    return getTranscriptMetadataAll().then(value => {
        const data = JSON.parse(value);
        const transcripts = data.results.map(element => {
            return element.id;
        });
        return transcripts;
    });
};

const createExport = () => {
    const body = {
        "export": {
            "format": "json",
            "transcription_ids": [
                "3797fa9832a24a389e43a016e91396ee",
                "ebed7524dce043a096c38b89e4258a08",
                "55332ae619a84ebca79eb2ae1cd7c3ad"
            ]
        }
    }

    console.log("Creating export...");

    return axios.post('https://www.happyscribe.com/api/v1/exports', body, {
        headers: {
            'Authorization': 'Bearer UuyDDy9FT8CD8IB2uXGQWAtt',
            'Content-Type': 'application/json'
        }
    }).then(res => {
        console.log('Created export: ' + res.data.id + '\n');
        return res.data.id;
    }).catch(err => {
        console.log('Status code: ' + err)
        console.log('Failed to create export');
    })
};

const getExport = exportID => {
    console.log("Retrieving export...");

    return axios.get('https://www.happyscribe.com/api/v1/exports/' + exportID, {
        headers: {
            'Authorization': 'Bearer UuyDDy9FT8CD8IB2uXGQWAtt',
        }
    }).then(res => {
        return new Promise((resolve, reject) => {
            if (res.data.download_link !== undefined) {
                console.log('Retrieved export: ' + res.data.download_link + '\n');
                resolve(res.data.download_link);
            } else {
                getExport(exportID);
            }
        })
    }).catch(err => {
        console.log('Status code: ' + err)
        console.log('Failed to retrieve export');
    })
};

const getTranscripts = url => {
    console.log('Downloading transcripts...')
    url = 'https://www.happyscribe.com/rails/active_storage/blobs/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBMmZodkE9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--c528af207c564b6eb490eeaf6ecaa08c299c41ad/export-1610438102.zip?disposition=attachment';

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    const outputPath = path.resolve(outputDir, outputFile)
    const writer = fs.createWriteStream(outputPath)

    return axios({
        url,
        method: 'GET',
        responseType: 'stream'
    }).then(response => {
        return new Promise((resolve, reject) => {
            response.data.pipe(writer);
            let error = null;
            writer.on('error', err => {
                error = err;
                writer.close();
                reject(err);
            });
            writer.on('close', () => {
                if (!error) {
                    console.log('Downloaded transcripts: ' + outputPath + '\n')
                    resolve(outputPath);
                }
            });
        });
    })
};

const extractTranscripts = filePath => {
    console.log('Extracting transcripts...')
    const target = outputDir
    return new Promise((resolve, reject) => {
        try {
            extract(filePath, { dir: target })
            console.log('Extraction complete: ' + target + "\n");
            resolve(true);
          } catch (err) {
            reject(err);
          }
    });
};

const buildSentences = () => {

}

const callApi = (options) => {
    return new Promise((resolve, reject) => {
        https.get(options, (response) => {
            let payload = '';
            response.on('data', function (data) {
                payload += data.toString();
            });
            response.on('end', function () {
                try {
                    t = JSON.parse(payload);
                    if (t.error === 'Unauthorized') reject('ERROR: Invalid API token. Exiting.');
                } catch (error) {
                    reject('ERROR: Failed to parse API response. Exiting.');
                }
                resolve(payload);
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
};

// getTranscriptMetadata().then(val => {
//     console.log("Output: " + val)
//     exportTranscript(val);
// });

// createExport().then(exportID => {
getExport('2618e59a-035f-4927-afa7-64a9585bbf50')
.then(url => {
    getTranscripts(url)
    .then(filePath => {
        extractTranscripts(filePath).then(res => {
            console.log("alright we ready")
        })
    })
});
// })