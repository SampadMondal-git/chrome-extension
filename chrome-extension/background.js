// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Check if the message is a request to send profile data
  if (message.action === "sendProfileData") {
    console.log("🔄 Background script received profile data:", message.data);
    
    // Send the data to the backend server using a POST request
    fetch("http://localhost:5000/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message.data), // Convert data to JSON string
    })
      .then(res => {
        console.log("📡 Backend response status:", res.status, res.statusText);
        return res.json();
      })
      .then(result => {
        console.log("✅ Profile saved to backend:", result);
        sendResponse({ success: true, data: result });
      })
      .catch(err => {
        console.error("❌ Failed to send to backend:", err);
        sendResponse({ success: false, error: err.message });
      });
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }
});
