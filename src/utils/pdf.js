const PDF_HOST = "pub-5c3d4294745645bfb40dddc883e0604a.r2.dev";

export function getPdfUrl(url) {
  try {
    const pdfUrl = new URL(url);

    if (pdfUrl.hostname === PDF_HOST) {
      return `/pdf${pdfUrl.pathname}${pdfUrl.search}`;
    }
  } catch {
    return url;
  }

  return url;
}
