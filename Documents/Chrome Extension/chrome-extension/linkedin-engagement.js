// Task 3: LinkedIn Engagement Content Script
// This script handles automatic liking and commenting on LinkedIn posts as specified by user input from the extension popup.
console.log("LinkedIn Engagement script loaded");

// Task 3: Configuration object to track engagement state
let engagementConfig = {
    likeCount: 0,           // Number of likes to perform
    commentCount: 0,        // Number of comments to perform
    likesCompleted: 0,      // Number of likes completed
    commentsCompleted: 0,   // Number of comments completed
    isRunning: false        // Flag to prevent multiple concurrent engagements
};

// Generic comments to use
// Task 3: Array of generic comments to use for auto-commenting
const genericComments = [
    "CFBR",
    "Great insights!",
    "Thanks for sharing!",
    "Interesting perspective!",
    "Well said!",
    "Valuable content!",
    "Thanks for the update!",
    "Good point!"
];

// Task 3: Listen for messages from popup to start engagement
// When the popup sends a 'startEngagement' message, initialize counts and begin the engagement process
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "startEngagement") {
        console.log("Received engagement request:", message);
        engagementConfig.likeCount = message.likeCount;
        engagementConfig.commentCount = message.commentCount;
        engagementConfig.likesCompleted = 0;
        engagementConfig.commentsCompleted = 0;
        
        startEngagementProcess();
        sendResponse({ status: "started" });
    }
});

// Task 3: Entry point for liking and commenting automation
// Waits for page load, then performs engagement actions
async function startEngagementProcess() {
    if (engagementConfig.isRunning) {
        console.log("Engagement already running");
        return;
    }
    
    engagementConfig.isRunning = true;
    console.log("Starting engagement process...");
    
    try {
        // Wait for page to fully load
        await waitForPageLoad();
        
        // Start the engagement loop
        await performEngagement();
        
    } catch (error) {
        console.error("Engagement process failed:", error);
    } finally {
        engagementConfig.isRunning = false;
        console.log("Engagement process completed");
        showCompletionMessage();
    }
}

// Task 3: Wait for LinkedIn feed posts to load before starting engagement
async function waitForPageLoad() {
    console.log("Waiting for LinkedIn feed to load...");
    
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            const posts = document.querySelectorAll('[data-urn*="urn:li:activity"]');
            if (posts.length > 0) {
                console.log(`Found ${posts.length} posts on the page`);
                clearInterval(checkInterval);
                resolve();
            }
        }, 1000);
        
        // Timeout after 15 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
            resolve();
        }, 15000);
    });
}

// Task 3: Main loop to perform the specified number of likes and comments on posts
// Randomizes actions and scrolls to load more posts as needed
async function performEngagement() {
    const totalActions = engagementConfig.likeCount + engagementConfig.commentCount;
    console.log(`Target: ${engagementConfig.likeCount} likes, ${engagementConfig.commentCount} comments`);
    
    let actionCount = 0;
    const maxScrollAttempts = 10;
    let scrollAttempts = 0;
    
    while (actionCount < totalActions && scrollAttempts < maxScrollAttempts) {
        const posts = getVisiblePosts();
        console.log(`Found ${posts.length} visible posts`);
        
        if (posts.length === 0) {
            console.log("Scrolling to load more posts...");
            await scrollToLoadMore();
            scrollAttempts++;
            await randomDelay(2000, 4000);
            continue;
        }
        
        // Process each post
        for (const post of posts) {
            if (actionCount >= totalActions) break;
            
            // Skip if we've already processed this post
            if (post.dataset.processed) continue;
            
            // Mark as processed
            post.dataset.processed = "true";
            
            // Decide action based on remaining counts
            const needsLike = engagementConfig.likesCompleted < engagementConfig.likeCount;
            const needsComment = engagementConfig.commentsCompleted < engagementConfig.commentCount;
            
            if (needsLike && Math.random() > 0.3) { // 70% chance to like if needed
                await likePost(post);
                engagementConfig.likesCompleted++;
                actionCount++;
                await randomDelay(1500, 3500);
            } else if (needsComment && Math.random() > 0.5) { // 50% chance to comment if needed
                await commentOnPost(post);
                engagementConfig.commentsCompleted++;
                actionCount++;
                await randomDelay(3000, 6000);
            }
            
            // Random delay between posts
            await randomDelay(1000, 2500);
        }
        
        // Scroll to see more posts
        if (actionCount < totalActions) {
            console.log("Scrolling for more posts...");
            await scrollToLoadMore();
            scrollAttempts++;
            await randomDelay(2000, 4000);
        }
    }
    
    console.log(`Completed: ${engagementConfig.likesCompleted} likes, ${engagementConfig.commentsCompleted} comments`);
}

// Task 3: Get all LinkedIn posts currently visible in the viewport
function getVisiblePosts() {
    const posts = document.querySelectorAll('[data-urn*="urn:li:activity"]');
    return Array.from(posts).filter(post => {
        const rect = post.getBoundingClientRect();
        return rect.top >= 0 && rect.top <= window.innerHeight;
    });
}

// Task 3: Like (react to) a single LinkedIn post if not already liked
async function likePost(post) {
    try {
        // Look for like button - LinkedIn uses various selectors
        const likeSelectors = [
            'button[aria-label*="Like"]',
            'button[data-control-name="like"]',
            '.react-button__trigger',
            '.social-actions-button--reaction'
        ];
        
        let likeButton = null;
        for (const selector of likeSelectors) {
            likeButton = post.querySelector(selector);
            if (likeButton && !likeButton.classList.contains('active')) {
                break;
            }
        }
        
        if (likeButton && !likeButton.classList.contains('active')) {
            console.log("Liking post...");
            
            // Scroll post into view
            post.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await randomDelay(500, 1000);
            
            // Click like button
            likeButton.click();
            
            // Visual feedback
            highlightAction(post, 'like');
            
        } else {
            console.log("Like button not found or already liked");
        }
    } catch (error) {
        console.error("Error liking post:", error);
    }
}

// Task 3: Comment on a single LinkedIn post using a random generic comment
async function commentOnPost(post) {
    try {
        console.log("Commenting on post...");
        
        // Scroll post into view
        post.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await randomDelay(1000, 2000);
        
        // Look for comment button
        const commentSelectors = [
            'button[aria-label*="Comment"]',
            'button[data-control-name="comment"]',
            '.social-actions-button--comment'
        ];
        
        let commentButton = null;
        for (const selector of commentSelectors) {
            commentButton = post.querySelector(selector);
            if (commentButton) break;
        }
        
        if (commentButton) {
            // Click comment button to open comment box
            commentButton.click();
            await randomDelay(1000, 2000);
            
            // Find comment input
            const commentInput = post.querySelector('.ql-editor, .comments-comment-texteditor, [contenteditable="true"]');
            
            if (commentInput) {
                // Select random comment
                const comment = genericComments[Math.floor(Math.random() * genericComments.length)];
                
                // Focus and type comment
                commentInput.focus();
                await randomDelay(500, 1000);
                
                // Type comment with human-like delays
                await typeWithDelay(commentInput, comment);
                
                await randomDelay(1000, 2000);
                
                // Find and click post/submit button
                const submitSelectors = [
                    'button[data-control-name="comment.post"]',
                    '.comments-comment-box__submit-button',
                    'button[type="submit"]'
                ];
                
                let submitButton = null;
                for (const selector of submitSelectors) {
                    submitButton = post.querySelector(selector);
                    if (submitButton && !submitButton.disabled) break;
                }
                
                if (submitButton && !submitButton.disabled) {
                    submitButton.click();
                    console.log(`Posted comment: "${comment}"`);
                    
                    // Visual feedback
                    highlightAction(post, 'comment');
                } else {
                    console.log("Submit button not found or disabled");
                }
            } else {
                console.log("Comment input not found");
            }
        } else {
            console.log("Comment button not found");
        }
    } catch (error) {
        console.error("Error commenting on post:", error);
    }
}

// Task 3: Type text into an input element with random delays to mimic human typing
async function typeWithDelay(element, text) {
    for (let i = 0; i < text.length; i++) {
        element.textContent += text[i];
        
        // Trigger input events
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('keyup', { bubbles: true }));
        
        // Random typing delay
        await randomDelay(50, 150);
    }
}

// Task 3: Scroll the page to load more posts
async function scrollToLoadMore() {
    window.scrollBy({
        top: window.innerHeight * 0.8,
        behavior: 'smooth'
    });
    
    // Wait for content to load
    await randomDelay(2000, 3000);
}

// Task 3: Utility to wait a random amount of time between actions (to mimic human behavior)
function randomDelay(min, max) {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
}

// Task 3: Highlight a post briefly after like or comment for visual feedback
function highlightAction(post, action) {
    const color = action === 'like' ? '#0a66c2' : '#057642';
    const originalBorder = post.style.border;
    
    post.style.border = `3px solid ${color}`;
    post.style.transition = 'border 0.3s ease';
    
    setTimeout(() => {
        post.style.border = originalBorder;
    }, 2000);
}

// Task 3: Show a notification when engagement is complete (shows how many likes/comments were done)
function showCompletionMessage() {
    // Create completion notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #057642;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        max-width: 300px;
    `;
    
    notification.innerHTML = `
        <div style="margin-bottom: 8px; font-weight: 600;">Engagement Complete!</div>
        <div>Likes: ${engagementConfig.likesCompleted}/${engagementConfig.likeCount}</div>
        <div>Comments: ${engagementConfig.commentsCompleted}/${engagementConfig.commentCount}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 10 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 10000);
}

// Task 3: Initialization log
console.log("LinkedIn Engagement script initialized");
