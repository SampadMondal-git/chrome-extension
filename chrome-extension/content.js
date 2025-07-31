(async function () {
    console.log("✅ content.js injected!");

    // Wait for page load
    await new Promise((resolve) => {
        if (document.readyState === "complete") return resolve();
        window.addEventListener("load", resolve);
    });

    // Helper to extract number from string
    function extractNumber(text) {
        if (!text) return 0;
        const match = text.replace(/,/g, "").match(/\d+/);
        return match ? parseInt(match[0]) : 0;
    }

    // More robust selectors for LinkedIn profile data
    const name = document.querySelector('h1')?.innerText?.trim() 
        || document.querySelector('[data-anonymize="person-name"]')?.innerText?.trim()
        || document.querySelector('.text-heading-xlarge')?.innerText?.trim() 
        || "";

    const headline = document.querySelector('.text-body-medium')?.innerText?.trim()
        || document.querySelector('[data-anonymize="headline"]')?.innerText?.trim()
        || document.querySelector('.break-words')?.innerText?.trim()
        || "";

    const location = document.querySelector('.text-body-small')?.innerText?.trim()
        || document.querySelector('[data-anonymize="location"]')?.innerText?.trim()
        || "";

    // Get connections & followers with more flexible approach
    let connection_count = 0;
    let follower_count = 0;

    const spans = Array.from(document.querySelectorAll("span"));

    const connectionSpan = spans.find(el => /connections?/i.test(el.innerText));
    if (connectionSpan) {
        connection_count = extractNumber(connectionSpan.innerText);
        if (connectionSpan.innerText.includes("500")) connection_count = 500;
    }

    const followerSpan = spans.find(el => /followers?/i.test(el.innerText));
    if (followerSpan) {
        follower_count = extractNumber(followerSpan.innerText);
    }

    // Get about section with multiple fallback strategies
    let about = "";
    const aboutSelectors = [
        'section[data-section="summary"] .pv-shared-text-with-see-more',
        'section.pv-about-section .pv-shared-text-with-see-more',
        '[data-section="about"] .inline-show-more-text',
        '.pv-about__summary-text',
        'section.artdeco-card .inline-show-more-text'
    ];

    for (const selector of aboutSelectors) {
        const aboutElement = document.querySelector(selector);
        if (aboutElement && aboutElement.innerText.trim()) {
            about = aboutElement.innerText.trim();
            break;
        }
    }

    // Get meta description (fallback bio)
    const bio = document.querySelector('meta[name="description"]')?.content || "";

    const profileData = {
        name,
        headline,
        location,
        connection_count,
        follower_count,
        about,
        bio,
        url: window.location.href
    };

    console.log("🔍 Scraped Profile:", profileData);

    // Validate that we got some meaningful data
    if (!name && !headline) {
        console.warn("⚠️ No profile data found - page might not be fully loaded or selectors need updating");
        return;
    }

    // Send to backend via background script messaging
    try {
        console.log("📤 Sending data to background script...");
        
        // Use Chrome messaging to send data to background script
        chrome.runtime.sendMessage({
            action: "sendProfileData",
            data: profileData
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("❌ Messaging error:", chrome.runtime.lastError.message);
            } else {
                console.log("✅ Data sent to background script successfully");
            }
        });
        
    } catch (err) {
        console.error("❌ Failed to send data:", err);
        console.error("❌ Make sure your extension is properly loaded");
    }
})();
