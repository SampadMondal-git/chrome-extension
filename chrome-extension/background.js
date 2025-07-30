// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Check if the message is a request to send profile data
  if (message.action === "sendProfileData") {
    // Send the data to the backend server using a POST request
    fetch("http://localhost:5000/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message.data), // Convert data to JSON string
    })
      .then(res => res.json()) // Parse JSON response
      .then(result => {
        console.log("Profile saved to backend:", result); // Log success
      })
      .catch(err => {
        console.error("Failed to send to backend:", err); // Handle error
      });
  }
});
