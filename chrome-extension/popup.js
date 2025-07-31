document.getElementById("scrapeBtn").addEventListener("click", async () => {
    const urls = document.getElementById("urlInput").value
        .split("\n")
        .map(url => url.trim())
        .filter(url => url);

    if (urls.length === 0) {
        alert("Please enter at least one LinkedIn URL");
        return;
    }

    for (let url of urls) {
        chrome.tabs.create({ url, active: false }, (tab) => {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["content.js"]
            });
        });
    }
});

document.getElementById("refreshBtn").addEventListener("click", fetchAndDisplayProfiles);
document.addEventListener("DOMContentLoaded", fetchAndDisplayProfiles);

async function fetchAndDisplayProfiles() {
    try {
        console.log("🔄 Fetching profiles from backend...");
        const res = await fetch("http://localhost:5000/api/profiles");
        console.log("📡 Response status:", res.status, res.statusText);
        
        const profiles = await res.json();
        console.log("📊 Received profiles:", profiles);
        console.log("📊 Number of profiles:", profiles.length);
        
        const list = document.getElementById("profileList");
        console.log("🎯 Profile list element:", list);

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

        list.innerHTML = "";
        console.log("✅ Displaying", profiles.length, "profiles");
        profiles.forEach((p, index) => {
            console.log(`📝 Processing profile ${index + 1}:`, p);
            const item = document.createElement("div");
            item.className = "profile-card";
            item.innerHTML = `
                <div class="profile-name">${p.name || "Name not available"}</div>
                <div class="profile-headline">${p.headline || "No headline provided"}</div>
                <div class="profile-location">${p.location || "Location not specified"}</div>
                <div class="profile-stats">${p.connection_count || 0} connections • ${p.follower_count || 0} followers</div>
                
                ${p.bio ? `
                    <div class="profile-section">
                        <div class="profile-section-label">Bio</div>
                        <div class="profile-section-content">${p.bio}</div>
                    </div>
                ` : ''}

                ${p.about ? `
                    <div class="profile-section">
                        <div class="profile-section-label">About</div>
                        <div class="profile-section-content">${p.about}</div>
                    </div>
                ` : ''}

                <div class="profile-divider"></div>
                <button class="delete-btn" data-id="${p.id}">Remove Profile</button>
            `;
            list.appendChild(item);
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
        console.error('❌ Error fetching profiles:', error);
        console.error('❌ Error details:', error.message);
        document.getElementById("profileList").innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-text">Error loading profiles</div>
                <div class="empty-state-subtext">Please check your connection and try again</div>
            </div>
        `;
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
