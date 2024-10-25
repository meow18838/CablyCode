const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');
const ico = require('png-to-ico');

async function createIcons() {
    try {
        // Create build directory if it doesn't exist
        if (!fs.existsSync('build')) {
            fs.mkdirSync('build');
        }

        // Check if source image exists
        if (!fs.existsSync('image.png')) {
            console.error('Error: image.png not found in root directory');
            process.exit(1);
        }

        console.log('Reading source image...');
        const image = await Jimp.read('image.png');
        
        // Create different sizes
        const sizes = [16, 24, 32, 48, 64, 128, 256];
        const pngFiles = [];

        for (const size of sizes) {
            console.log(`Creating ${size}x${size} PNG...`);
            const resized = image.clone().resize(size, size);
            const outputPath = path.join('build', `icon-${size}.png`);
            await resized.writeAsync(outputPath);
            pngFiles.push(outputPath);
        }

        console.log('Creating ICO file...');
        const icoBuffer = await ico(pngFiles.map(f => fs.readFileSync(f)));
        fs.writeFileSync('build/icon.ico', icoBuffer);

        // Clean up temporary PNG files
        pngFiles.forEach(f => fs.unlinkSync(f));

        console.log('Icons created successfully in build/icon.ico!');
    } catch (error) {
        console.error('Error creating icons:', error);
        process.exit(1);
    }
}

createIcons().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
