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
 * Bulk Transaction Upload (JSON based)
 * Safe and performant for large datasets
 */
app.post('/api/transactions/bulk', (req, res) => {
    const transactions = req.body;

    if (!Array.isArray(transactions)) {
        return res.status(400).json({ error: 'Data must be an array of transactions' });
    }

    // Basic security: limit size
    if (transactions.length > 5000) {
        return res.status(400).json({ error: 'Too many transactions at once (limit 5000)' });
    }

    try {
        const validated = transactions.filter(tx => {
            // Ensure basic fields exist and are sanitized strings/numbers
            return tx.amount !== undefined && tx.description && tx.date;
        }).map(tx => ({
            ...tx,
            amount: parseFloat(tx.amount) || 0,
            description: String(tx.description).substring(0, 255), // Basic sanitization
            date: new Date(tx.date).toISOString().split('T')[0] // Standardize date
        }));

        console.log(`Received ${validated.length} transactions for bulk processing`);
        
        // In a real app, you would save to DB here
        // For now, we return success to acknowledge the data
        res.json({
            success: true,
            message: `Successfully processed ${validated.length} transactions`,
            count: validated.length,
            records: validated.slice(0, 5) // Return a few for verification
        });
    } catch (error) {
        console.error('Bulk Upload Error:', error);
        res.status(500).json({ error: 'Server error during bulk processing' });
    }
});

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
