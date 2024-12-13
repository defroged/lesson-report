// /pages/api/fetchData.js

import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { password } = req.query;

  if (!password) {
    return res.status(400).json({ error: 'Password is required.' });
  }

  const spreadsheetId = process.env.SPREADSHEET_ID;
  const sheetName = process.env.SHEET_NAME || 'Sheet1';

  try {
    // Initialize Google Sheets API client
    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL, // Service account email
      null,
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Private key
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );

    const sheets = google.sheets({ version: 'v4', auth });

    // Define the range to fetch (columns A to M)
    const range = `${sheetName}!A:M`;

    // Fetch data from Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const data = response.data.values;

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'No data found in the spreadsheet.' });
    }

    // Skip the header row
    const rows = data.slice(1);

    // Find the row where column M matches the provided password
    const match = rows.find(
      (row) => row[12] && row[12].trim() === password.trim()
    );

    if (match) {
      const className = match[1] || 'No class name provided'; // Column B (index 1)
      return res.status(200).json({ className });
    } else {
      return res.status(404).json({ error: 'Invalid password.' });
    }
  } catch (error) {
    console.error('Error fetching data from Google Sheets:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
