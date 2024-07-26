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

// Function to read existing JSON file
async function readExistingJson() {
    try {
        const data = await fs.promises.readFile(jsonFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.log('No existing JSON file found or error reading it. Starting fresh.');
        return [];
    }
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
        const existingData = await readExistingJson();
        const existingImageMap = new Map(existingData.map(item => [item.fullImage, item]));

        const imageData = await Promise.all(imageFiles.map(async (file) => {
            const fullPath = path.join(imageDirectory, file);
            const previewPath = path.join(previewDirectory, `preview_${file}`);
            
            // Generate preview
            await sharp(fullPath)
                .resize(500) // Resize to 500px width, maintaining aspect ratio
                .toFile(previewPath);

            // Extract metadata using exiftool
            let exif = {};
            try {
                exif = await exiftool.read(fullPath);
                console.log(`Parsed EXIF for ${file}:`, exif);
            } catch (error) {
                console.error(`Error parsing EXIF for ${file}:`, error);
            }
            async function generateAlbumDescriptions() {
                const albumDescriptions = {};
                const imageData = await readExistingJson();
                
                imageData.forEach(image => {
                    image.tags.forEach(tag => {
                        if (!albumDescriptions[tag]) {
                            albumDescriptions[tag] = `This is the ${tag} album. Add your description here.`;
                        }
                    });
                });
            
                await fs.promises.writeFile('album-descriptions.json', JSON.stringify(albumDescriptions, null, 2));
                console.log('Album descriptions file has been saved as album-descriptions.json');
            }
            
            // Call this function after processing images
            generateAlbumDescriptions();

            // Log individual EXIF properties to debug
            const deviceModel = exif.Model || 'Unknown';
            const fNumber = exif.FNumber ? `f/${exif.FNumber}` : 'Unknown';
            const exposureTime = exif.ExposureTime ? `${exif.ExposureTime}s` : 'Unknown';
            const dateTaken = exif.DateTimeOriginal || exif.CreateDate || new Date().toISOString();

            // Check if this image already exists in the JSON
            const existingImage = existingImageMap.get(fullPath);
            
            return {
                fullImage: fullPath,
                preview: previewPath,
                title: path.basename(file, path.extname(file)),
                deviceModel: deviceModel,
                fNumber: fNumber,
                exposureTime: exposureTime,
                dateTaken: dateTaken,
                tags: existingImage ? existingImage.tags : ['Unsorted']
            };
        }));

        // Write to JSON file using promises for better async control
        await fs.promises.writeFile(jsonFile, JSON.stringify(imageData, null, 2));

        console.log('JSON file has been saved with image filenames, preview paths, and metadata at images.json in this same directory.');
    } catch (error) {
        console.error('Error processing images:', error);
    }
});