// Get the dominant color from a favicon URL
async function getDominantColor(faviconUrl) {
  if (!faviconUrl) return '#000000';
  
  try {
    const img = await createImageBitmap(await (await fetch(faviconUrl)).blob());
    const canvas = new OffscreenCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const pixels = imageData.data;
    const colorCounts = {};
    
    // Count color frequencies
    for (let i = 0; i < pixels.length; i += 4) {
      const color = `#${pixels[i].toString(16).padStart(2, '0')}${pixels[i+1].toString(16).padStart(2, '0')}${pixels[i+2].toString(16).padStart(2, '0')}`;
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    }
    
    // Find most frequent color
    return Object.entries(colorCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  } catch {
    return '#000000';
  }
}

// Sort tabs based on criteria
async function sortTabs(criteria, order) {
  const tabs = await chrome.tabs.query({currentWindow: true});
  
  // Add additional data needed for sorting
  const tabsWithData = await Promise.all(tabs.map(async tab => ({
    ...tab,
    color: await getDominantColor(tab.favIconUrl)
  })));
  
  // Sort based on criteria
  tabsWithData.sort((a, b) => {
    switch(criteria) {
      case 'date':
        return order === 'asc' ? a.id - b.id : b.id - a.id;
      case 'url':
        return order === 'asc' ? a.url.localeCompare(b.url) : b.url.localeCompare(a.url);
      case 'color':
        return order === 'asc' ? a.color.localeCompare(b.color) : b.color.localeCompare(a.color);
    }
  });
  
  // Move tabs to new positions
  for (let i = 0; i < tabsWithData.length; i++) {
    chrome.tabs.move(tabsWithData[i].id, {index: i});
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sortTabs') {
    sortTabs(request.criteria, request.order);
    sendResponse({success: true});
  }
  return true;
});
