const https = require('https');
const axios = require('axios');
const Fs = require('fs')

const Path = require('path')
const hostname = 'www.happyscribe.com';
const port = 443;
const outputDir = 'output';

// let transcripts = '';
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

    console.log("Creating export...")

    return axios.post('https://www.happyscribe.com/api/v1/exports', body, {
        headers: {
            'Authorization': 'Bearer UuyDDy9FT8CD8IB2uXGQWAtt',
            'Content-Type': 'application/json'
        }
    }).then(res => {
        console.log('Created export: ' + res.data.id);
        return res.data.id;
    }).catch(err => {
        console.log('Status code: ' + err)
        console.log('Failed to create export');
    })
}

const getExport = exportID => {
    return axios.get('https://www.happyscribe.com/api/v1/exports/' + exportID, {
        headers: {
            'Authorization': 'Bearer UuyDDy9FT8CD8IB2uXGQWAtt',
        }
    }).then(res => {
        if (res.data.download_link !== undefined) {
            console.log(res.status)
            console.log('Retrieved export: ' + res.data.download_link);
            return res.data.download_link;
        } else {
            getExport(exportID);
        }
    }).catch(err => {
        console.log('Status code: ' + err)
        console.log('Failed to retrieve export');
    })
}

const getTranscripts = url => {
    url = 'https://www.happyscribe.com/rails/active_storage/blobs/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBMmZodkE9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--c528af207c564b6eb490eeaf6ecaa08c299c41ad/export-1610438102.zip?disposition=attachment';

    if (!Fs.existsSync(outputDir)){
        Fs.mkdirSync(outputDir);
    }

    const path = Path.resolve(__dirname, outputDir, 'output.zip')
    const writer = Fs.createWriteStream(path)

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
                    resolve(true);
                }
                //no need to call the reject here, as it will have been called in the
                //'error' stream;
            });
        });
    })


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

createExport().then(exportID => {
    getExport(exportID).then(url => {
        getTranscripts(url)
    });
})