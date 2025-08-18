const fs = require('fs');
const path = require('path');

const imagesDir = './images';
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

fs.readdir(imagesDir, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }

    const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext);
    });

    const indexData = {
        images: imageFiles,
        lastUpdated: new Date().toISOString()
    };

    fs.writeFileSync(path.join(imagesDir, 'index.json'),
        JSON.stringify(indexData, null, 2));

    console.log(`Found ${imageFiles.length} images:`, imageFiles);
});