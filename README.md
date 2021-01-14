# happyscribe-to-anki
*Generate Anki cards from Happy Scribe transcripts*

`happyscribe-to-anki` is a command-line utility to export transcript data from (https://www.happyscribe.com/) to Anki-compatible decks containing the following four fields: Sentence, Translation, Notes, Audio.


## Pre-requisites

- The audio files should be placed into the Anki media directory. On macOS, this is `~/Library/Application Support/Anki2/Me/collection.media/`
- These audio files should have the exact same name as what was uploaded to Happy Scribe.

## To run

1. Add your Happy Scribe API key to config.json
2. Run `node app.js` to retrieve the transcript IDs which represent each transcript
3. Run `node app.js` again to use the IDs to create an export
4. Run `node app.js <EXPORT_ID>` to download and extract the transcripts from a ZIP file.
5. Run `node app.js csv <OUTPUT_DESTINATION>` to convert the transcripts to a CSV file.
6. Import into Anki

## Notes

At present there is an occasional issue with Step 3, where it will fail to locate the download URL. Repeating Step 3 will eventually cause it to work, however this is a workaround for the time being.
