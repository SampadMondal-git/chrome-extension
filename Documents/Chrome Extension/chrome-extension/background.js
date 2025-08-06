// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Check if the message is a request to send profile data
  if (message.action === "sendProfileData") {
    console.log("Background script received profile data:", message.data);
    console.log("Profile data summary - Name:", message.data.name ? "name found" : "name not found", "URL:", message.data.url);
    
    // Validate data before sending
    if (!message.data.name) {
      console.error("REJECTED: Profile data missing required name field");
      sendResponse({ success: false, error: "Invalid profile data: missing name" });
      return true;
    }
    
    // Send the data to the backend server using a POST request
    fetch("http://localhost:5000/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message.data), // Convert data to JSON string
    })
      .then(res => {
        console.log("Backend response status:", res.status, res.statusText);
        if (!res.ok) {
          throw new Error(`Backend error: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then(result => {
        console.log("Profile saved to backend successfully:", result.id, result.name);
        sendResponse({ success: true, data: result });
      })
      .catch(err => {
        console.error("Failed to send to backend:", err);
        console.error("Profile data that failed:", message.data);
        sendResponse({ success: false, error: err.message });
      });
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }
  
  // Handle profile extraction errors
  if (message.action === "profileExtractionError") {
    console.error("Profile extraction failed:", message.url, message.error);
    // Could notify popup about the error here if needed
    return true;
  }
});
