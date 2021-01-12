const https = require('https');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const extract = require('extract-zip');
const stripBom = require('strip-bom');

const hostname = 'www.happyscribe.com';
const port = 443;
const outputDir = `${__dirname}/output`;
const outputDirJSON = `${outputDir}/json`;

const outputFile = 'output.zip'

const sentences = [];

// End points
let transcriptsUrl = 'https://www.happyscribe.com/api/v1/transcriptions';
let exportsUrl = 'https://www.happyscribe.com/api/v1/exports';

let transcriptIds = [];

let options = {
    host: hostname,
    port: port,
    headers: { 'Authorization': 'Bearer UuyDDy9FT8CD8IB2uXGQWAtt' }
};

const getTranscriptMetadataAll = (endpoint) => {
    return axios.get(endpoint, {
        headers: {
            'Authorization': 'Bearer UuyDDy9FT8CD8IB2uXGQWAtt',
        }
    })
};

const getTranscriptMetadata = (endpoint) => {
    return getTranscriptMetadataAll(endpoint).then(value => {



        return new Promise((resolve, reject) => {
            if (value.data.results.length > 0) {
                console.log("Retrieving transcripts metadata...")

                const ids = value.data.results.map(element => {
                    return element.id;
                });
                transcriptIds.push(ids);
                getTranscriptMetadata(value.data._links.next.url)
            } else {
                let finalIds = [];

                // Flatten the array
                transcriptIds.map((arr, idx) => {
                    arr.forEach(e => {
                        finalIds.push(e);
                    })
                })
                resolve(finalIds)
            }
        })
    });
};

const createExport = ids => {
    const body = {
        "export": {
            "format": "json",
            "transcription_ids": ids
        }
    }

    console.log("Creating export...");

    return axios.post(exportsUrl, body, {
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

    return axios.get(exportsUrl + '/' + exportID, {
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
    // url = 'https://www.happyscribe.com/rails/active_storage/blobs/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBMmZodkE9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--c528af207c564b6eb490eeaf6ecaa08c299c41ad/export-1610438102.zip?disposition=attachment';

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
            extract(filePath, { dir: outputDirJSON })
            console.log('Extraction complete: ' + target + "\n");
            resolve(true);
        } catch (err) {
            reject(err);
        }
    });
};

const readTranscripts = () => {
    return new Promise((resolve, reject) => {
        fs.readdir(outputDirJSON, (err, files) => {
            if (err)
                reject(err);
            else {
                console.log("Files " + files)
                files.forEach(file => {

                    console.log('Reading ' + file + '...');

                    let data = JSON.parse(stripBom(fs.readFileSync(outputDirJSON + '/' + file, "utf8")));

                    // Access the individual words and construct the full sentence
                    data.forEach(d => {
                        let sentence = '';
                        d.words.forEach(w => {
                            sentence += w.text;
                        })
                        sentences.push(sentence);
                    })
                })
                resolve(sentences);
            }
        })
    })
}

// 31990abe-249d-43b1-b85e-cb466b9e1759
// getExport('31990abe-249d-43b1-b85e-cb466b9e1759')
getTranscriptMetadata(transcriptsUrl)
    .then(ids => {
        console.log(ids)
        return createExport(ids)
    })
    .then(exportID => {
        console.log("Export id: " + exportId)
        return getExport(exportID)
    })
    .then(url => {
        console.log('URL: ' + url)
        getTranscripts(url)
    })
    .then(filePath => {
        return extractTranscripts(filePath)
    })
    .then(res => {
        return readTranscripts()
    })
    .then(res => {
        console.log(sentences);
    });


