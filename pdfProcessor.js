import * as pdfjsLib from 'pdfjs-dist';

// Configure worker. using CDN for simplicity in dev, but can be local.
// In production/student app we might need a different strategy or bundle it.
pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

export const getPdfContent = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    const images = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(' ');
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;

        // Image extraction is complex in pdf.js. 
        // We will extract text first as priority. 
        // If needed we can scan ops for images, but for now we focus on text/equations.
    }

    return { text: fullText, pageCount: pdf.numPages };
};
