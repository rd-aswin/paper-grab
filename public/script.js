document.getElementById('downloadBtn').addEventListener('click', async () => {
    const urlInput = document.getElementById('urlInput');
    const url = urlInput.value.trim();
    const btn = document.getElementById('downloadBtn');
    const status = document.getElementById('status');

    if (!url) {
        status.textContent = 'Please enter a URL';
        status.className = 'status-msg error';
        return;
    }

    if (!url.includes('selfstudys.com')) {
        status.textContent = 'Please enter a valid SelfStudys URL';
        status.className = 'status-msg error';
        return;
    }

    // UI Loading State
    btn.classList.add('loading');
    btn.disabled = true;
    status.textContent = 'Analyzing page and fetching PDF... This may take a moment.';
    status.className = 'status-msg';

    try {
        const response = await fetch(`/api/fetch-pdf?url=${encodeURIComponent(url)}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to download');
        }

        // Handle file download
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `selfstudys-paper-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);

        status.textContent = 'Download started successfully!';
        status.className = 'status-msg success';

    } catch (error) {
        console.error(error);
        status.textContent = error.message;
        status.className = 'status-msg error';
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
});
