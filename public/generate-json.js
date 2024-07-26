const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { exiftool } = require('exiftool-vendored');

const imageDirectory = './images';
const previewDirectory = './previews';
const jsonFile = 'images.json';

// Ensure the preview directory exists
if (!fs.existsSync(previewDirectory)) {
    fs.mkdirSync(previewDirectory);
}

fs.readdir(imageDirectory, async (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }

    const imageFiles = files.filter(file => {
        return file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.png') || file.toLowerCase().endsWith('.jpeg');
    });

    try {
        const imageData = await Promise.all(imageFiles.map(async (file) => {
            const fullPath = path.join(imageDirectory, file);
            const previewPath = path.join(previewDirectory, `preview_${file}`);
            
            // Generate preview
            await sharp(fullPath)
                .resize(200) // Resize to 200px width, maintaining aspect ratio
                .toFile(previewPath);

            // Extract metadata using exiftool
            let exif = {};
            try {
                exif = await exiftool.read(fullPath);
                console.log(`Parsed EXIF for ${file}:`, exif);
            } catch (error) {
                console.error(`Error parsing EXIF for ${file}:`, error);
            }

            // Log individual EXIF properties to debug
            const deviceModel = exif.Model || 'Unknown';
            const fNumber = exif.FNumber ? `f/${exif.FNumber}` : 'Unknown';
            const exposureTime = exif.ExposureTime ? `${exif.ExposureTime}s` : 'Unknown';

            console.log(`EXIF data for ${file}:`);
            console.log(`  Device Model: ${deviceModel}`);
            console.log(`  fNumber: ${fNumber}`);
            console.log(`  Exposure Time: ${exposureTime}`);

            return {
                fullImage: fullPath,
                preview: previewPath,
                title: path.basename(file, path.extname(file)),
                deviceModel: deviceModel,
                fNumber: fNumber,
                exposureTime: exposureTime
            };
        }));

        // Write to JSON file using promises for better async control
        await fs.promises.writeFile(jsonFile, JSON.stringify(imageData, null, 2));

        console.log('JSON file has been saved with image filenames, preview paths, and metadata at images.json in this same directory.');
    } catch (error) {
        console.error('Error processing images:', error);
    }
});
