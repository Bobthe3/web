const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const sizeOf = require('image-size');
const exif = require('exif-parser');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname)));

// Function to shuffle array elements randomly
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

app.get('/images', async (req, res) => {
    try {
        const imageDir = path.join(__dirname, 'images');
        const files = await fs.readdir(imageDir);

        // Shuffle array of file names randomly
        const shuffledFiles = shuffleArray(files);

        const images = [];

        for (const file of shuffledFiles) {
            try {
                const filePath = path.join(imageDir, file);
                const dimensions = sizeOf(filePath);

                let title = path.parse(file).name; // Get filename without extension
                let deviceModel = 'Unknown device';

                // Check if the file is a JPEG and attempt to extract metadata
                if (file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg')) {
                    const buffer = await fs.readFile(filePath);

                    try {
                        const parser = exif.create(buffer);
                        const result = parser.parse();
                        
                        deviceModel = result.tags.Model || 'Unknown device';
                    } catch (exifError) {
                        console.error('Error parsing EXIF data:', exifError.message);
                    }
                }

                images.push({
                    src: `/images/${file}`,
                    title: title,
                    deviceModel: deviceModel,
                    width: dimensions.width,
                    height: dimensions.height
                });
            } catch (error) {
                console.error('Error processing file:', file, error.message);
                // Handle error gracefully, e.g., skip this file or use default values
            }
        }

        res.json(images);
    } catch (error) {
        console.error('Error reading directory:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
