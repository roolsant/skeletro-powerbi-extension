chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "download_file") {
        // Cria uma URL para o conteúdo (JSON ou Texto)
        const blob = new Blob([request.content], {type: "application/json"});
        const reader = new FileReader();
        
        reader.onload = function(e) {
            chrome.downloads.download({
                url: e.target.result,
                filename: "PBI_Extract/" + request.filename, // Salva numa subpasta
                saveAs: false
            });
        };
        reader.readAsDataURL(blob);
    }
});