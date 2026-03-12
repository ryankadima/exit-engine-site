import { toPng } from 'html-to-image';

export async function exportDashboardPng(elementId = 'dashboard-container', filename = 'linkedin-dashboard.png') {
  const node = document.getElementById(elementId);
  if (!node) throw new Error('Dashboard container not found');

  // Temporarily force exact dimensions
  const originalStyle = node.getAttribute('style') || '';

  const options = {
    width: 1200,
    height: 1200,
    pixelRatio: 2,
    cacheBust: true,
    style: {
      transform: 'none',
      transformOrigin: 'top left',
    },
    filter: (n) => {
      if (n.classList && n.classList.contains('no-export')) return false;
      return true;
    },
  };

  try {
    // First pass warms up font/SVG text rendering in html-to-image;
    // without it, SVG <text> elements (chart labels) can be missing in the output.
    await toPng(node, options);
    const dataUrl = await toPng(node, options);

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return dataUrl;
  } finally {
    node.setAttribute('style', originalStyle);
  }
}
