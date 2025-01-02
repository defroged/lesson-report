// /api/fetchData.js
import { google } from 'googleapis';

const MASTER_PASSWORD = 'blues'; 

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { password } = req.query;

    if (!password) {
        return res.status(400).json({ error: 'Password is required.' });
    }
    if (password === MASTER_PASSWORD) {
        return res.status(200).json({ isMaster: true });
    }

    const spreadsheetId = process.env.SPREADSHEET_ID;
    const sheetName = process.env.SHEET_NAME || 'Sheet1';
    const googleClientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const googlePrivateKey = process.env.GOOGLE_PRIVATE_KEY;

    // Check for missing environment variables
    if (!spreadsheetId || !googleClientEmail || !googlePrivateKey) {
        console.error('Missing one or more required environment variables.');
        return res.status(500).json({ error: 'Server configuration error.' });
    }

    try {
        const auth = new google.auth.JWT(
            googleClientEmail, 
            null,
            googlePrivateKey.replace(/\\n/g, '\n'), 
            ['https://www.googleapis.com/auth/spreadsheets.readonly']
        );

        const sheets = google.sheets({ version: 'v4', auth });
        const range = `${sheetName}!A:M`;
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        const data = response.data.values;

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'No data found in the spreadsheet.' });
        }
        const rows = data.slice(1);
        const match = rows.find(
            (row) => row[12] && row[12].trim() === password.trim()
        );

        if (match) {
            const userName = match[0];
            const className = match[1] || 'No class name provided'; 
            return res.status(200).json({ className, userName });
        } else {
            return res.status(404).json({ error: 'Invalid password.' });
        }
    } catch (error) {
        console.error('Error fetching data from Google Sheets:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}