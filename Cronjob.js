const cron = require('node-cron');
const marketing = require('./Models/Marketing'); // Update path to your marketing model

// Helper to convert "HH:mm" to Date object for today
const getTimeToday = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const now = new Date();
    now.setHours(hours, minutes, 0, 0);
    return now;
};

// Cron runs every minute
cron.schedule('* * * * *', async () => {
    try {
        const now = new Date();

        // Get all inactive markets
        const inactiveMarkets = await marketing.find({ market_status: 'inactive' });

        for (const market of inactiveMarkets) {
            if (!market.open_time || !market.close_time) continue;

            const openTime = getTimeToday(market.open_time);
            const closeTime = getTimeToday(market.close_time);

            // Handle markets that open after midnight and close in the day
            const isActive =
                (closeTime > openTime && now >= openTime && now <= closeTime) || // normal same-day market
                (closeTime < openTime && (now >= openTime || now <= closeTime)); // market spans midnight

            if (isActive) {
                // Update the market to active
                await marketing.findByIdAndUpdate(market._id, {
                    market_status: 'active',
                });
                console.log(`Activated market: ${market.name}`);
            }
        }
    } catch (err) {
        console.error('Error in market activation cron:', err);
    }
});
