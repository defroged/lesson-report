// api/getClassEvents.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const calendarId = 'ronward.english@gmail.com';
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
  const className = req.query.className;
  
  // If className is not provided, return error
  if (!className) {
    return res.status(400).json({ error: 'Missing className parameter' });
  }
  
  // Set up timeMin and timeMax for the past month
  const now = new Date();
  const timeMaxDate = new Date(now.getTime());
  const timeMinDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

  const timeMin = req.query.timeMin ? new Date(req.query.timeMin).toISOString() : timeMinDate.toISOString();
  const timeMax = req.query.timeMax ? new Date(req.query.timeMax).toISOString() : timeMaxDate.toISOString();

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;

  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const calendarResponse = await fetch(url);
    if (!calendarResponse.ok) {
      throw new Error(`Failed to fetch calendar events: ${calendarResponse.statusText}`);
    }
    const calendarData = await calendarResponse.json();
    
    // Filter events for the given className
    const filteredEvents = (calendarData.items || []).filter(event => {
      return event.summary && event.summary.includes(className);
    }).map(event => {
      // Format date as YYYY-MM-DD
      const eventDate = event.start.dateTime || event.start.date;
      const formattedDate = new Date(eventDate).toISOString().split('T')[0];
      return {
        summary: event.summary,
        date: formattedDate
      };
    });

    res.status(200).json({ events: filteredEvents });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).send('Internal Server Error');
  }
};
