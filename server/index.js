const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

/**
 * Enhanced CSV Parsing with Auto-detection
 * This handles various formats: Date, Description, Amount
 */
app.post('/api/parse-csv', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];
    const filePath = req.file.path;

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            // Clean up the uploaded file
            fs.unlinkSync(filePath);

            // Return the structured JSON
            res.json({
                success: true,
                count: results.length,
                data: results
            });
        })
        .on('error', (error) => {
            console.error('CSV Parsing Error:', error);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            res.status(500).json({ error: 'Failed to parse CSV file' });
        });
});

app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
});
