document.getElementById("scrapeBtn").addEventListener("click", async () => {
    const urls = document.getElementById("urlInput").value
        .split("\n")
        .map(url => url.trim())
        .filter(url => url.startsWith("https://www.linkedin.com/in/"));

    if (urls.length === 0) {
        alert("Please enter at least one valid LinkedIn profile URL (must start with https://www.linkedin.com/in/)");
        return;
    }

    if (urls.length < 3) {
        alert("Please enter at least 3 LinkedIn profile URLs as required");
        return;
    }

    const scrapeBtn = document.getElementById("scrapeBtn");
    const originalText = scrapeBtn.textContent;
    
    try {
        // Disable button during processing
        scrapeBtn.disabled = true;
        scrapeBtn.textContent = "Processing...";
        
        await processProfilesSequentially(urls);
        
        alert(`Successfully processed ${urls.length} LinkedIn profiles!`);
        
        // Refresh the profile list to show new data
        setTimeout(() => {
            fetchAndDisplayProfiles();
        }, 2000);
        
    } catch (error) {
        console.error("Error processing profiles:", error);
        alert("Error processing profiles: " + error.message);
    } finally {
        // Re-enable button
        scrapeBtn.disabled = false;
        scrapeBtn.textContent = originalText;
    }
});

// Function to process LinkedIn profiles sequentially
async function processProfilesSequentially(urls) {
    console.log(`Starting sequential processing of ${urls.length} profiles`);
    
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        console.log(`Processing profile ${i + 1}/${urls.length}: ${url}`);
        
        // Update button text to show progress
        const scrapeBtn = document.getElementById("scrapeBtn");
        scrapeBtn.textContent = `Fetching real-time data ${i + 1}/${urls.length}...`;
        
        try {
            await processSingleProfile(url, i + 1);
            console.log(`Successfully processed profile ${i + 1}`);
            
            // Wait between profiles to avoid overwhelming LinkedIn and ensure fresh data
            if (i < urls.length - 1) {
                console.log(`Waiting 6 seconds before next profile for fresh data...`);
                scrapeBtn.textContent = `Waiting for next profile... (${i + 1}/${urls.length} completed)`;
                await new Promise(resolve => setTimeout(resolve, 6000));
            }
        } catch (error) {
            console.error(`Error processing profile ${i + 1}:`, error);
            // Continue with next profile even if one fails
        }
    }
    
    console.log(`Completed processing all ${urls.length} profiles`);
}

// Function to process a single LinkedIn profile
function processSingleProfile(url, profileNumber) {
    return new Promise((resolve, reject) => {
        console.log(`Opening profile ${profileNumber}: ${url}`);
        
        // Create a new tab with the LinkedIn profile
        chrome.tabs.create({ url, active: false }, (tab) => {
            if (chrome.runtime.lastError) {
                reject(new Error(`Failed to create tab: ${chrome.runtime.lastError.message}`));
                return;
            }
            
            console.log(`Created tab ${tab.id} for profile ${profileNumber}`);
            
            // Wait longer for the tab to load and LinkedIn to render real-time data
            setTimeout(() => {
                console.log(`Injecting content script for real-time data extraction...`);
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ["content.js"]
                }, (results) => {
                    if (chrome.runtime.lastError) {
                        console.error(`Script injection failed for profile ${profileNumber}:`, chrome.runtime.lastError.message);
                        // Close the tab and continue
                        chrome.tabs.remove(tab.id);
                        reject(new Error(`Script injection failed: ${chrome.runtime.lastError.message}`));
                        return;
                    }
                    
                    console.log(`Content script injected for profile ${profileNumber}`);
                    
                    // Close the tab after allowing enough time for real-time data extraction
                    setTimeout(() => {
                        console.log(`Real-time data extraction completed for profile ${profileNumber}`);
                        chrome.tabs.remove(tab.id, () => {
                            console.log(`Successfully closed tab for profile ${profileNumber}`);
                            resolve();
                        });
                    }, 12000); // Wait 12 seconds for data extraction (increased from 8)
                });
            }, 5000); // Wait 5 seconds for page load (increased from 3)
        });
    });
}

document.getElementById("refreshBtn").addEventListener("click", fetchAndDisplayProfiles);
// Removed automatic fetching on popup load - only fetch when user clicks refresh button

// Task 3: LinkedIn Engagement Feature
// These elements correspond to the Like Count and Comment Count input fields and the Start Engagement button in the popup.
const likeCountInput = document.getElementById("likeCount");
const commentCountInput = document.getElementById("commentCount");
const startEngagementBtn = document.getElementById("startEngagementBtn");
const engagementStatus = document.getElementById("engagementStatus");

// Task 3: Enable/disable Start Engagement button based on input validation
// Only enables the button if at least one of the Like or Comment count fields has a value > 0
function validateEngagementInputs() {
    const likeCount = parseInt(likeCountInput.value) || 0;
    const commentCount = parseInt(commentCountInput.value) || 0;
    
    // Enable button only if at least one field has a value > 0
    const isValid = likeCount > 0 || commentCount > 0;
    startEngagementBtn.disabled = !isValid;
}

// Task 3: Add event listeners for Like/Comment input fields
// On input, re-validate to enable/disable the Start Engagement button
likeCountInput.addEventListener("input", validateEngagementInputs);
commentCountInput.addEventListener("input", validateEngagementInputs);

// Task 3: Start LinkedIn engagement process when button is clicked
// This handler opens the LinkedIn feed and initiates the auto-like/comment process based on user input.
startEngagementBtn.addEventListener("click", async () => {
    const likeCount = parseInt(likeCountInput.value) || 0;
    const commentCount = parseInt(commentCountInput.value) || 0;
    
    if (likeCount === 0 && commentCount === 0) {
        showEngagementStatus("Please enter at least one count value.", "error");
        return;
    }
    
    try {
        // Task 3: Disable button during process to prevent duplicate clicks
        startEngagementBtn.disabled = true;
        startEngagementBtn.textContent = "Starting...";
        
        showEngagementStatus(`Starting LinkedIn engagement: ${likeCount} likes, ${commentCount} comments`, "info");
        
        // Task 3: Open LinkedIn feed page in a new tab
        chrome.tabs.create({ 
            url: "https://www.linkedin.com/feed/", 
            active: true 
        }, (tab) => {
            // Task 3: Wait for tab to load, then inject content script for engagement
            setTimeout(() => {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ["linkedin-engagement.js"]
                }, () => {
                    // Task 3: Send like and comment count to content script to start engagement
                    chrome.tabs.sendMessage(tab.id, {
                        action: "startEngagement",
                        likeCount: likeCount,
                        commentCount: commentCount
                    });
                });
            }, 2000);
        });
        
        showEngagementStatus("LinkedIn feed opened. Engagement process started!", "success");
        
    } catch (error) {
        console.error("Engagement error:", error);
        showEngagementStatus("Failed to start engagement: " + error.message, "error");
    } finally {
        // Task 3: Re-enable button after engagement attempt (with delay for UX)
        setTimeout(() => {
            startEngagementBtn.disabled = false;
            startEngagementBtn.textContent = "Start LinkedIn Engagement";
            validateEngagementInputs(); // Recheck validation
        }, 3000);
    }
});

// Show engagement status messages
function showEngagementStatus(message, type) {
    engagementStatus.textContent = message;
    engagementStatus.className = `engagement-status ${type}`;
    
    // Auto-hide success messages after 5 seconds
    if (type === "success" || type === "info") {
        setTimeout(() => {
            engagementStatus.style.display = "none";
        }, 5000);
    }
}

let isFetching = false;

async function fetchAndDisplayProfiles() {
    if (isFetching) {
        console.log("Already fetching profiles, skipping this call...");
        return;
    }
    
    isFetching = true;
    console.log("Starting fetch operation, isFetching set to true");
    
    try {
        console.log("Fetching profiles from backend...");
        const res = await fetch("http://localhost:5000/api/profiles");
        console.log("📡 Response status:", res.status, res.statusText);
        
        const profiles = await res.json();
        console.log("Received profiles:", profiles);
        console.log("Number of profiles:", profiles.length);
        
        // Check for duplicate URLs in the response
        const urls = profiles.map(p => p.url);
        const uniqueUrls = [...new Set(urls)];
        if (urls.length !== uniqueUrls.length) {
            console.warn("Backend returned duplicate profiles!", {
                total: urls.length,
                unique: uniqueUrls.length,
                duplicates: urls.length - uniqueUrls.length
            });
        }
        
        const list = document.getElementById("profileList");
        console.log("Profile list element:", list);
        console.log("Current list content before clearing:", list.innerHTML.length, "characters");

        if (profiles.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <div class="empty-state-text">No profiles collected yet</div>
                    <div class="empty-state-subtext">Add LinkedIn URLs above and click "Start Collection Process"</div>
                </div>
            `;
            return;
        }

        // FORCE CLEAR the list completely - this is critical to prevent duplicates
        const profileList = document.getElementById("profileList");
        
        // Remove all existing content completely
        while (profileList.firstChild) {
            profileList.removeChild(profileList.firstChild);
        }
        
        // Double-check it's empty
        profileList.innerHTML = "";
        console.log("List FORCE CLEARED, current content:", profileList.innerHTML.length, "characters");
        
        console.log("Displaying", profiles.length, "profiles");
        profiles.forEach((p, index) => {
            console.log(`Processing profile ${index + 1}:`, p.name);
            const item = document.createElement("div");
            item.className = "profile-card";
            
            // Format bio content to show line by line with bullet points
            let formattedBio = "";
            if (p.bio) {
                const bioLines = p.bio.split(/[·•\n]/).filter(line => line.trim());
                formattedBio = bioLines.map(line => line.trim()).join('<br>');
            }
            
            item.innerHTML = `
                <div class="profile-name">${p.name || "Name not available"}</div>
                ${p.location ? `<div class="profile-location">${p.location}</div>` : ''}
                <div class="profile-stats">${p.connection_count || 0} connections • ${p.follower_count || 0} followers</div>
                
                ${p.bio ? `
                    <div class="profile-section">
                        <div class="profile-section-label"><strong>Bio</strong></div>
                        <div class="profile-section-content">${formattedBio}</div>
                    </div>
                ` : ''}

                ${p.about ? `
                    <div class="profile-section">
                        <div class="profile-section-label"><strong>About</strong></div>
                        <div class="profile-section-content">${p.about.replace(/\n/g, '<br>')}</div>
                    </div>
                ` : ''}

                <div class="profile-divider"></div>
                <button class="delete-btn" data-id="${p.id}">Remove Profile</button>
            `;
            profileList.appendChild(item);
        });

        // Delete individual profile
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const profileId = e.target.getAttribute('data-id');
                if (confirm('Are you sure you want to remove this profile?')) {
                    try {
                        const res = await fetch(`http://localhost:5000/api/profiles/${profileId}`, {
                            method: "DELETE"
                        });
                        const json = await res.json();

                        if (res.ok) {
                            alert(json.message || "Profile deleted successfully.");
                            fetchAndDisplayProfiles(); // Refresh list
                        } else {
                            throw new Error(json.error || "Failed to delete");
                        }
                    } catch (err) {
                        alert("Failed to delete profile: " + err.message);
                        console.error("Profile deletion error:", err);
                    }
                }
            });
        });

    } catch (error) {
        console.error('Error fetching profiles:', error);
        console.error('Error details:', error.message);
        document.getElementById("profileList").innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-text">Error loading profiles</div>
                <div class="empty-state-subtext">Please check your connection and try again</div>
            </div>
        `;
    } finally {
        isFetching = false;
        console.log("Fetch operation completed, isFetching reset to false");
    }
}

document.getElementById("clearDataBtn")?.addEventListener("click", async () => {
    try {
        const confirmed = confirm("Are you sure you want to permanently delete all saved profile data? This action cannot be undone.");
        if (!confirmed) return;

        const res = await fetch("http://localhost:5000/api/profiles", {
            method: "DELETE"
        });
        const json = await res.json();

        if (res.ok) {
            alert("All profile data has been successfully deleted.");
            fetchAndDisplayProfiles(); // Refresh UI
        } else {
            throw new Error(json.error || "Unknown error occurred");
        }
    } catch (err) {
        alert("Failed to delete data: " + err.message);
        console.error('Delete error:', err);
    }
});
