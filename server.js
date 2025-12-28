const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const https = require('https');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

app.get('/api/fetch-pdf', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        // Go to the page
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

        // Logic to extract the PDF URL
        // From analysis: The download button usually calls a function or has a direct link.
        // We will try to find the direct link or the script that generates it.
        
        const pdfUrl = await page.evaluate(() => {
            // Priority 1: Check for direct 'sitepdfs' link in scripts (as seen in analysis)
            const scripts = Array.from(document.querySelectorAll('script')).map(s => s.innerText);
            const scriptMatch = scripts.join('\n').match(/https:\/\/www\.selfstudys\.com\/sitepdfs\/[a-zA-Z0-9]+/);
            if (scriptMatch) return scriptMatch[0];

            // Priority 2: Check standard download buttons
            const downloadBtn = document.querySelector('a.bg-red.me-3') || 
                                document.querySelector('a[href*="/sitepdfs/"]') ||
                                document.querySelector('a.downloadPdfBtn');
            
            if (downloadBtn && downloadBtn.href && downloadBtn.href.includes('/sitepdfs/')) {
                return downloadBtn.href;
            }

            // Priority 3: Check for onclick handlers causing navigation (less reliable to scrape staticly, but we can try to parse it)
            // If the button calls downloadFile('url'), we can try to regex that.
            const html = document.documentElement.innerHTML;
            const functionMatch = html.match(/downloadFile\(['"](https:\/\/www\.selfstudys\.com\/sitepdfs\/[^'"]+)['"]\)/);
            if (functionMatch) return functionMatch[1];
            
            return null;
        });

        if (!pdfUrl) {
            throw new Error('Could not find PDF URL on the page');
        }

        console.log('Found PDF URL:', pdfUrl);

        // Stream the PDF to the client
        https.get(pdfUrl, (pdfRes) => {
            if (pdfRes.statusCode !== 200) {
                res.status(pdfRes.statusCode).json({ error: 'Failed to fetch PDF from source' });
                return;
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="downloaded-paper.pdf"');
            pdfRes.pipe(res);
        }).on('error', (e) => {
            console.error(e);
            res.status(500).json({ error: 'Error streaming PDF' });
        });

    } catch (error) {
        console.error('Error scraping:', error);
        res.status(500).json({ error: 'Failed to process the URL: ' + error.message });
    } finally {
        if (browser) await browser.close();
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
