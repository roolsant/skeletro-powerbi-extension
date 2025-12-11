// --- SKELETRO V1.0: BACKGROUND EXTRACTION ONLY ---

document.getElementById('btnExtractBackground').addEventListener('click', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Inject script into ALL frames (including the report iframe)
    chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        function: extractBackgroundSmart
    });
    
    // Close popup immediately for better UX
    window.close();
});

// --- SMART EXTRACTION FUNCTION (SVG/PNG/JPG) ---
async function extractBackgroundSmart() {
    let tabName = "Background";
    try {
        // Try to get the active tab name from Power BI UI
        const activeTab = document.querySelector('.mat-tab-label-active, .pbi-page-navigation-bar-item.is-selected');
        if (activeTab) tabName = activeTab.innerText.trim().replace(/[^a-zA-Z0-9]/g, "_");
    } catch(e) {}

    let urls = new Set();
    
    // 1. Search IMG tags (ResourcePackage or Blobs)
    document.querySelectorAll('img').forEach(el => {
        if (el.src && (el.src.includes('resourcePackage') || el.src.startsWith('blob:'))) {
            // Filter out small UI icons
            if (el.clientWidth > 50 || el.clientHeight > 50) urls.add(el.src);
        }
    });
    
    // 2. Search CSS Background-Image
    document.querySelectorAll('div, section').forEach(el => {
        const style = window.getComputedStyle(el);
        const bg = style.backgroundImage;
        if (bg && bg.includes('url(')) {
            const link = bg.slice(bg.indexOf('url(')+4, -1).replace(/["']/g, "");
            if (link.includes('resourcePackage') || link.startsWith('blob:')) urls.add(link);
        }
    });

    if (urls.size === 0) return;

    console.log(`[Skeletro] Found ${urls.size} backgrounds.`);

    let i = 0;
    for (const url of urls) {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            
            // Smart Type Detection
            const mime = blob.type;
            let ext = ".png"; // Safe fallback
            
            if (mime.includes("svg")) ext = ".svg";
            else if (mime.includes("jpeg") || mime.includes("jpg")) ext = ".jpg";
            else if (url.includes(".svg")) ext = ".svg";

            // Create Download Link
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            
            // Name: TabName.svg or TabName_1.svg
            const suffix = urls.size > 1 ? `_${i + 1}` : "";
            a.download = `${tabName}${suffix}${ext}`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            i++;
        } catch (e) {
            console.error("Error processing image:", e);
        }
    }
}