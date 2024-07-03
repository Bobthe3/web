const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const sizeOf = require('image-size');
const exif = require('exif-parser');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname)));

app.get('/images', async (req, res) => {
    const imageDir = path.join(__dirname, 'images');
    const files = await fs.readdir(imageDir);
    const images = [];

    for (const file of files) {
        const filePath = path.join(imageDir, file);
        const dimensions = sizeOf(filePath);
        const buffer = await fs.readFile(filePath);
        const parser = exif.create(buffer);
        const result = parser.parse();

        images.push({
            src: `/images/${file}`,
            title: result.tags.ImageDescription || file,
            date: result.tags.DateTimeOriginal || 'Unknown date',
            width: dimensions.width,
            height: dimensions.height
        });
    }

    res.json(images);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});