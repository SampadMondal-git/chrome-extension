function getText(selector) {
  const el = document.querySelector(selector);
  return el ? el.innerText.trim() : "";
}

function getTextMultipleSelectors(selectors) {
  for (const selector of selectors) {
    const text = getText(selector);
    if (text) return text;
  }
  return "";
}

function extractProfileData() {
  // Try multiple selectors for name - LinkedIn changes these frequently
  const nameSelectors = [
    "h1.text-heading-xlarge",
    "h1.text-heading-xlarge.inline.t-24.v-align-middle.break-words",
    "h1[data-generated-suggestion-target]",
    ".pv-text-details__left-panel h1",
    ".ph5.pb5 h1",
    "section.pv-top-card div h1",
    "h1.break-words",
    ".pv-top-card--list h1",
    "[data-anonymize='person-name'] h1",
    "main h1"
  ];

  const name = getTextMultipleSelectors(nameSelectors);
  
  // Also try multiple selectors for headline
  const headlineSelectors = [
    ".text-body-medium.break-words",
    ".pv-text-details__left-panel .text-body-medium",
    ".ph5.pb5 .text-body-medium",
    ".pv-top-card div.text-body-medium"
  ];
  
  const headline = getTextMultipleSelectors(headlineSelectors);
  
  // Location selectors
  const locationSelectors = [
    ".text-body-small.inline.t-black--light.break-words",
    ".pv-text-details__left-panel .text-body-small",
    ".ph5.pb5 .text-body-small"
  ];
  
  const location = getTextMultipleSelectors(locationSelectors);
  
  const about = getText("#about ~ div .pv-shared-text-with-see-more") || 
                getText(".pv-about-section .pv-shared-text-with-see-more") ||
                getText("[data-section='summary'] .pv-shared-text-with-see-more");
  
  const bio = getText(".pv-text-details__left-panel");

  const spans = Array.from(document.querySelectorAll("span"));
  const followersSpan = spans.find(s => s.innerText.toLowerCase().includes("followers"));
  const connectionsSpan = spans.find(s => s.innerText.toLowerCase().includes("connections"));

  const followerText = followersSpan ? followersSpan.innerText : "";
  const connectionText = connectionsSpan ? connectionsSpan.innerText : "";

  // Debug logging
  console.log("🔍 Debug info:");
  console.log("Name found:", name);
  console.log("Headline found:", headline);
  console.log("Location found:", location);
  
  // If name is still empty, try one more aggressive approach
  let finalName = name;
  if (!finalName) {
    // Look for any h1 with text content in the main area
    const h1Elements = Array.from(document.querySelectorAll('h1'));
    const nameH1 = h1Elements.find(h1 => {
      const text = h1.innerText.trim();
      return text && text.length > 0 && text.length < 100; // Reasonable name length
    });
    finalName = nameH1 ? nameH1.innerText.trim() : "";
    console.log("Fallback name search result:", finalName);
  }

  return {
    name: finalName,
    headline,
    location,
    about,
    bio,
    follower_count: parseInt(followerText.replace(/\D/g, "")) || 0,
    connection_count: parseInt(connectionText.replace(/\D/g, "")) || 0,
    url: window.location.href,
  };
}

(async () => {
  try {
    const data = extractProfileData();
    console.log("📤 Sending data to background:", data);

    // Send to background
    chrome.runtime.sendMessage({ action: "sendProfileData", data });

  } catch (err) {
    console.error("❌ Scraping error:", err);
  }
})();