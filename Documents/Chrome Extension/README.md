# LinkedIn Profile Scraper Chrome Extension

A Chrome extension that scrapes LinkedIn profile data and stores it in a backend database. The extension allows users to collect profile information from LinkedIn pages and view the collected data through a popup interface.

## 🚀 Features

- **Profile Data Extraction**: Automatically scrapes LinkedIn profile information including:
  - Name and headline
  - Location
  - Connection count
  - Follower count
  - About section

- **Advanced LinkedIn Engagement (Task 3)**:
  - Add Like Count and Comment Count input fields to the popup UI.
  - Start Engagement button is enabled only when both fields have input.
  - On click, opens LinkedIn feed and automatically likes and comments on posts based on user input (randomized, human-like behavior).
  - Uses generic comments (e.g. "CFBR") for auto-commenting.
  - All Task 3 functions are clearly commented in the code for easy understanding.

- **Data Storage**: Stores collected profile data in a SQLite database via Express.js backend
- **User Interface**: Clean popup interface to view and manage collected profiles
- **Real-time Collection**: Collect data while browsing LinkedIn profiles

---

## Task 3: Advanced LinkedIn Engagement & Functions

**Task 3 Overview:**
This feature allows you to automate LinkedIn engagement (likes and comments) directly from the extension popup. You specify how many posts to like and comment on, and the extension performs these actions on your behalf with human-like timing and randomized behavior.

**UI Changes:**
- Two new input fields: Like Count and Comment Count
- "Start LinkedIn Engagement" button (enabled only when both fields have values)

**Core Task 3 Functions & Their Purpose:**

### In `popup.js`
- **Like/Comment Input Elements**: DOM references for the Like Count and Comment Count input fields and the Start Engagement button.
- **validateEngagementInputs**: Enables/disables the Start Engagement button based on input validation.
- **Input Event Listeners**: Re-validates the button state whenever the user changes the like/comment counts.
- **Start Engagement Button Handler**: Opens the LinkedIn feed in a new tab, injects the engagement script, and sends the like/comment counts to start the engagement process.

### In `linkedin-engagement.js`
- **engagementConfig**: Tracks how many likes/comments to do, how many are done, and prevents running the script multiple times.
- **genericComments**: List of comments to randomly use for auto-commenting.
- **chrome.runtime.onMessage Listener**: Listens for the "startEngagement" message from the popup, sets up engagementConfig, and starts the engagement process.
- **startEngagementProcess**: Waits for the LinkedIn feed to load, then starts performing the like/comment actions.
- **waitForPageLoad**: Waits until LinkedIn posts are present on the feed before starting engagement.
- **performEngagement**: Main loop that likes/comments on posts up to the user-specified count, scrolling to load more as needed, and randomizing actions to mimic human behavior.
- **getVisiblePosts**: Gets all LinkedIn posts currently visible in the viewport.
- **likePost**: Likes (reacts to) a single post if not already liked, with human-like delays and visual feedback.
- **commentOnPost**: Comments on a post using a random generic comment, with human-like typing and delays.
- **typeWithDelay**: Types text into a comment box with random delays, mimicking human typing.
- **scrollToLoadMore**: Scrolls the page to load more posts when needed.
- **randomDelay**: Utility for random timeouts between actions to avoid detection as a bot.
- **highlightAction**: Highlights a post after like/comment for visual feedback.
- **showCompletionMessage**: Shows a notification when engagement is complete, indicating how many likes/comments were performed.

> **Tip:** All Task 3 functions are clearly marked in the code with comments for easy navigation and understanding.

## 📁 Project Structure

```
Chrome Extension/
├── chrome-extension/            # Chrome extension files
│   ├── manifest.json            # Extension configuration
│   ├── popup.html               # Extension popup UI
│   ├── popup.js                 # Popup functionality
│   ├── content.js               # LinkedIn page content scraper
│   ├── linkedin-engagement.js   # LinkedIn auto-like/comment content script (Task 3)
│   ├── background.js            # Service worker
│   ├── styles.css               # UI styling
│   └── icons/                   # Extension icons
└── backend/                     # Node.js backend server
    ├── server.js                # Express server setup
    ├── routes/                  # API routes
    │   └── profiles.js          # Profile data endpoints
    ├── models/                  # Database models
    │   └── profile.js           # Profile model
    ├── config/                  # Database configuration
    │   └── db.js                # Database configuration
    ├── package.json             # Backend dependencies
    ├── profiles.db              # SQLite database
    └── .env                     # Environment variables
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- Chrome browser
- npm or yarn package manager

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Create .env file with your configuration
   echo "PORT=5000" > .env
   ```

4. Start the backend server:
   ```bash
   node server.js
   ```

   The server will run on `http://localhost:5000`

### Chrome Extension Setup

1. Open Chrome and navigate to `chrome://extensions/`

2. Enable "Developer mode" in the top right corner

3. Click "Load unpacked" and select the `chrome-extension` folder

4. The extension should now appear in your Chrome toolbar

## 🔧 Usage

### Profile Data Collection
1. **Start the Backend**: Ensure the backend server is running on `http://localhost:5000`
2. **Navigate to LinkedIn**: Go to any LinkedIn profile page (e.g., `https://www.linkedin.com/in/username`)
3. **Collect Data**: Click the extension icon and press "Collect Profile Data"
4. **View Data**: The collected profile information will be displayed in the popup

### Advanced LinkedIn Engagement (Task 3)
1. **Login to LinkedIn**: Make sure you are logged in to your LinkedIn account in Chrome.
2. **Open the Extension Popup**: Click the extension icon to open the popup.
3. **Set Like and Comment Counts**: Enter the desired number of likes (max 50) and comments (max 20) in the input fields.
4. **Start Engagement**: The "Start LinkedIn Engagement" button will be enabled when both fields have values. Click it to begin.
5. **Automatic Actions**: The extension will open the LinkedIn feed, then automatically like and comment on posts as specified, using random delays and generic comments for realism.
6. **Completion**: A notification will appear when the engagement is complete, showing how many likes/comments were performed.

### Developer Note
- All functions related to Task 3 are clearly commented in `popup.js` and `linkedin-engagement.js` for easy understanding and future modification.

## 📋 API Endpoints

### Backend Routes

- `GET /api/profiles` - Retrieve all collected profiles
- `POST /api/profiles` - Store a new profile
- `DELETE /api/profiles/:id` - Delete a specific profile

## 🐛 Troubleshooting

### Common Issues

**Issue**: "Collect Profile Data" button shows OK response but no data appears in popup

**Possible Solutions**:
1. Check if the backend server is running on `http://localhost:5000`
2. Verify the popup.js `fetchAndDisplayProfiles()` function is working correctly
3. Check browser console for JavaScript errors
4. Ensure LinkedIn page has fully loaded before collecting data
5. Verify content.js is properly injecting into LinkedIn pages

**Issue**: Extension not loading or permissions errors

**Solutions**:
1. Ensure all required permissions are granted in `manifest.json`
2. Check that host permissions include LinkedIn domains
3. Reload the extension in Chrome extensions page

**Issue**: Data not being scraped from LinkedIn

**Solutions**:
1. LinkedIn may have updated their page structure
2. Check content.js selectors are still valid
3. Ensure you're on a LinkedIn profile page (`/in/` URL pattern)

## 🔒 Permissions

The extension requires the following permissions:
- `tabs` - Access to browser tabs
- `scripting` - Inject content scripts
- `storage` - Store extension data
- `activeTab` - Access current tab content
- Host permissions for LinkedIn and localhost

## 🛡️ Privacy & Security

- Profile data is stored locally in your SQLite database
- No data is transmitted to external servers (except your local backend)
- Extension only activates on LinkedIn profile pages
- All data collection is user-initiated

## 🔧 Development

### Technologies Used

**Frontend (Extension)**:
- Vanilla JavaScript
- HTML5 & CSS3
- Chrome Extension APIs

**Backend**:
- Node.js
- Express.js
- Sequelize ORM
- SQLite database
- CORS middleware

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## ⚠️ Disclaimer

This extension is for educational and personal use only. Please respect LinkedIn's Terms of Service and robots.txt file. Use responsibly and in accordance with LinkedIn's data usage policies.

## 🆘 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Ensure all dependencies are properly installed
4. Verify the backend server is running and accessible

---

**Version**: 1.0.0  
**Last Updated**: July 2025
