const fs = require('fs');
const path = require('path');

const imageDirectory = './images'; // directory where your images are stored
const jsonFile = 'images.json'; // JSON file to be created

fs.readdir(imageDirectory, (err, files) => {
    if (err) {
        console.error('Error: Error reading directory:', err);
        return;
    }

    const imageFiles = files.filter(file => {
        return file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.png') || file.toLowerCase().endsWith('.jpeg');
    });
    const imagePaths = imageFiles.map(file => path.join(imageDirectory, file));

    console.log(files);
    console.log(imagePaths);


    fs.writeFile(jsonFile, JSON.stringify(imagePaths, null, 2), err => {
        if (err) {
            console.error('Error: Error writing JSON file:', err);
            return;
        }

        console.log('JSON file has been saved with image filenames at images.json in this same directory .');
    });
});
