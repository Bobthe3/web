const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imageDirectory = './images';
const previewDirectory = './images/previews';
const jsonFile = 'images.json';

// Ensure the preview directory exists
if (!fs.existsSync(previewDirectory)){
    fs.mkdirSync(previewDirectory);
}

fs.readdir(imageDirectory, async (err, files) => {
    if (err) {
        console.error('Error: Error reading directory:', err);
        return;
    }

    const imageFiles = files.filter(file => {
        return file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.png') || file.toLowerCase().endsWith('.jpeg');
    });

    const imageData = await Promise.all(imageFiles.map(async (file) => {
        const fullPath = path.join(imageDirectory, file);
        const previewPath = path.join(previewDirectory, `preview_${file}`);
        
        // Generate preview
        await sharp(fullPath)
            .resize(300) // Resize to 200px width, maintaining aspect ratio
            .toFile(previewPath);

        return {
            fullImage: fullPath,
            preview: previewPath
        };
    }));

    fs.writeFile(jsonFile, JSON.stringify(imageData, null, 2), err => {
        if (err) {
            console.error('Error: Error writing JSON file:', err);
            return;
        }

        console.log('JSON file has been saved with image filenames and preview paths at images.json in this same directory.');
    });
});