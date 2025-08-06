(async function () {
    // Prevent duplicate execution on the same page
    if (window.linkedinProfileExtracted) {
        console.log("Content script already executed on this page, skipping...");
        return;
    }
    
    // Mark this page as processed
    window.linkedinProfileExtracted = true;
    
    console.log("content.js injected!");
    console.log("Current URL:", window.location.href);
    console.log("Page title:", document.title);

    // Wait for page load
    await new Promise((resolve) => {
        if (document.readyState === "complete") return resolve();
        window.addEventListener("load", resolve);
    });
    
    // Wait longer for LinkedIn's dynamic content and real-time data to load
    console.log("Waiting for dynamic content and real-time follower data...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Additional wait to ensure follower counts are fully loaded
    console.log("Ensuring follower/connection counts are up-to-date...");
    let retryCount = 0;
    while (retryCount < 3) {
        const testSpans = Array.from(document.querySelectorAll("span"));
        const hasFollowers = testSpans.some(el => /followers?/i.test(el.innerText));
        const hasConnections = testSpans.some(el => /connections?/i.test(el.innerText));
        
        if (hasFollowers && hasConnections) {
            console.log("Follower and connection data detected, proceeding...");
            break;
        }
        
        console.log(`Retry ${retryCount + 1}/3: Waiting for follower/connection data to load...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        retryCount++;
    }

    // Helper to extract and preserve LinkedIn's exact display format for numbers
    function extractNumber(text) {
        if (!text) return "0";
        
        // Clean the text and make it lowercase for easier processing
        const cleanText = text.replace(/,/g, "").toLowerCase().trim();
        console.log("Extracting number from:", text, "→ cleaned:", cleanText);
        
        // First try to find exact numbers (like 2115121)
        const exactMatch = cleanText.match(/([0-9]+)\+?/);
        if (exactMatch) {
            const exactNumber = exactMatch[1];
            const hasPlus = cleanText.includes('+');
            
            // If it's a large exact number (6+ digits), keep it as is
            if (exactNumber.length >= 6) {
                const displayValue = hasPlus ? `${exactNumber}+` : exactNumber;
                console.log(`Exact number preserved: "${text}" → "${displayValue}"`);
                return displayValue;
            }
        }
        
        // Handle LinkedIn's abbreviated formats (K, M, B)
        const match = cleanText.match(/([0-9]+\.?[0-9]*)\s*([kmb]?)\+?/);
        if (!match) {
            console.log("No number pattern found in:", text);
            return "0";
        }
        
        console.log("Regex match results:", {
            fullMatch: match[0],
            number: match[1], 
            suffix: match[2],
            hasPlus: cleanText.includes('+')
        });
        
        const number = parseFloat(match[1]);
        const suffix = match[2];
        const hasPlus = cleanText.includes('+');
        
        console.log("🔍 Parsed values:", { number, suffix, hasPlus });
        
        let result;
        let displayValue;
        
        switch (suffix) {
            case 'k': // thousands
                result = Math.round(number * 1000);
                displayValue = hasPlus ? `${result}+` : result.toString();
                break;
            case 'm': // millions
                result = Math.round(number * 1000000);
                displayValue = hasPlus ? `${result}+` : result.toString();
                break;
            case 'b': // billions
                result = Math.round(number * 1000000000);
                displayValue = hasPlus ? `${result}+` : result.toString();
                break;
            default:
                result = Math.round(number);
                displayValue = hasPlus ? `${result}+` : result.toString();
        }
        
        console.log(`Converted "${text}" → "${displayValue}"`);
        return displayValue;
    }

    // More robust selectors for LinkedIn profile data
    const name = document.querySelector('h1')?.innerText?.trim() 
        || document.querySelector('[data-anonymize="person-name"]')?.innerText?.trim()
        || document.querySelector('.text-heading-xlarge')?.innerText?.trim() 
        || "";



    // More robust location extraction with multiple fallback strategies
    let location = "";
    const locationSelectors = [
        '.pv-text-details__left-panel .text-body-small.break-words',
        '.pv-text-details__left-panel .text-body-small',
        '.pb2 .text-body-small',
        '[data-anonymize="location"]',
        '.pv-entity__location .text-body-small',
        '.pv-top-card--list-bullet .text-body-small',
        'section.artdeco-card .text-body-small',
        '.pv-top-card .text-body-small',
        '.pv-top-card--list .text-body-small',
        '.pv-top-card-v2-ctas .text-body-small',
        '.pv-top-card__list-bullet-item .text-body-small',
        '.pv-top-card__list-bullet-item',
        '.text-body-small.break-words',
        '.pv-text-details__left-panel span.text-body-small'
    ];
    
    console.log("Starting location extraction with", locationSelectors.length, "selectors");
    
    for (const selector of locationSelectors) {
        const locationElement = document.querySelector(selector);
        console.log(`Trying selector: ${selector}`);
        
        if (locationElement) {
            const text = locationElement.innerText.trim();
            console.log(`Found element with text: "${text}"`);
            
            if (text && 
                !text.includes('connection') && 
                !text.includes('follower') &&
                !text.includes('Contact info') &&
                !text.includes('Message') &&
                !text.includes('See contact info') &&
                !text.includes('mutual') &&
                text.length > 2) {
                location = text;
                console.log("Location found with selector:", selector, "→", location);
                break;
            } else {
                console.log(`Rejected: contains excluded terms or too short`);
            }
        } else {
            console.log(`No element found`);
        }
    }
    
    // If no location found, try extracting from bio as fallback
    if (!location) {
        console.log("No location found with selectors, trying bio fallback...");
        const bioText = document.querySelector('.pv-about-section .pv-about__summary-text')?.innerText ||
                       document.querySelector('.pv-about__summary-text')?.innerText ||
                       document.querySelector('[data-generated-suggestion-target]')?.innerText ||
                       document.querySelector('.pv-shared-text-with-see-more')?.innerText || "";
        
        if (bioText) {
            // Look for "Location: [location]" pattern in bio
            const locationMatch = bioText.match(/Location:\s*([^·•\n]+)/i);
            if (locationMatch) {
                location = locationMatch[1].trim();
                console.log("Location extracted from bio:", location);
            }
        }
        
        if (!location) {
            console.log("No location found with any method");
        }
    }

    // Get connections & followers with enhanced real-time extraction
    let connection_count = "0";
    let follower_count = "0";

    console.log("Starting real-time follower/connection extraction...");
    
    // Try multiple approaches to get the most current data
    const allElements = Array.from(document.querySelectorAll("span, div, a"));
    console.log("Found", allElements.length, "elements for connection/follower extraction");

    // Enhanced connection extraction with multiple patterns
    const connectionPatterns = [
        /([0-9,]+[kmb]?\+?)\s*connections?/i,
        /connections?[:\s]*([0-9,]+[kmb]?\+?)/i,
        /([0-9,]+[kmb]?\+?)\s*connection/i
    ];
    
    for (const element of allElements) {
        const text = element.innerText || element.textContent || "";
        for (const pattern of connectionPatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                connection_count = extractNumber(match[1]);
                console.log("Connection count found:", text.trim(), "→", connection_count);
                break;
            }
        }
        if (connection_count !== "0") break;
    }

    // Enhanced follower extraction with multiple patterns
    const followerPatterns = [
        /([0-9,]+[kmb]?\+?)\s*followers?/i,
        /followers?[:\s]*([0-9,]+[kmb]?\+?)/i,
        /([0-9,]+[kmb]?\+?)\s*follower/i
    ];
    
    for (const element of allElements) {
        const text = element.innerText || element.textContent || "";
        for (const pattern of followerPatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                follower_count = extractNumber(match[1]);
                console.log("Follower count found:", text.trim(), "→", follower_count);
                break;
            }
        }
        if (follower_count !== "0") break;
    }
    
    // Final validation and logging
    if (connection_count === "0") {
        console.log("No connection count found with any pattern");
    }
    if (follower_count === "0") {
        console.log("No follower count found with any pattern");
    }
    
    console.log("Real-time extraction results:", {
        connections: connection_count,
        followers: follower_count,
        timestamp: new Date().toISOString()
    });

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
        location,
        connection_count,
        follower_count,
        about,
        bio,
        url: window.location.href
    };

    console.log("Scraped Profile:", profileData);
    console.log("Data validation - Name:", name ? "Name found" : "Name not found", "URL:", url ? "URL found" : "URL not found");
    console.log("Connection count:", connection_count, "Follower count:", follower_count);
    console.log("About length:", about ? about.length : 0, "Bio length:", bio ? bio.length : 0);

    // Validate that we got some meaningful data and not LinkedIn's generic content
    if (!name || 
        name.includes("Join LinkedIn") || 
        name.includes("LinkedIn") && name.length < 10 ||
        bio.includes("750 million+ members") ||
        bio.includes("Manage your professional identity") ||
        document.title.includes("Join LinkedIn") ||
        document.title.includes("LinkedIn: Log In")) {
        
        console.error("CRITICAL: Invalid profile data detected - this appears to be LinkedIn's generic signup page");
        console.error("Current URL:", window.location.href);
        console.error("Page title:", document.title);
        console.error("Extracted name:", name);
        console.error("Bio snippet:", bio.substring(0, 100));
        
        // Send error message to background script
        chrome.runtime.sendMessage({
            action: "profileExtractionError",
            url: window.location.href,
            error: "LinkedIn generic page detected - not a valid profile"
        });
        return;
    }

    // Send to backend via background script messaging
    try {
        console.log("Sending data to background script...");
        
        // Use Chrome messaging to send data to background script
        chrome.runtime.sendMessage({
            action: "sendProfileData",
            data: profileData
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Messaging error:", chrome.runtime.lastError.message);
            } else {
                console.log("Data sent to background script successfully");
            }
        });
        
    } catch (err) {
        console.error("Failed to send data:", err);
        console.error("Make sure your extension is properly loaded");
    }
})();
