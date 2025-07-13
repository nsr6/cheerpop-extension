importScripts('facts.js');

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ interval: 60, enabled: true }); // Default: every 60 mins
  scheduleAlarm(60);
});

chrome.alarms.onAlarm.addListener(async () => {
      const { enabled, categories } = await chrome.storage.sync.get(['enabled', 'categories']);
      if (!enabled) return;

      const preferred = categories || ['Random Fact', 'Joke', 'Inspiration'];
      const cat = preferred[Math.floor(Math.random() * preferred.length)];

      let fact;
      try {
        fact = await fetchFactByCategory(cat);                
      } catch (e) {
        console.warn(e);
        fact = getRandomFactByCategory(cat);                  
      }

      const notificationId = `smile-reminder-${Date.now()}-${cat}`;
      
      chrome.notifications.create(notificationId, {
        type: 'basic',
        iconUrl: 'icon.png',
        title: `😊 ${cat} Time! 😊`,
        message: fact,
        priority: 2, // 0 to 2, with 2 being highest priority
        requireInteraction: false, // Notification won't auto-dismiss
        buttons: [
          { title: 'Thanks for the smile!' },
          { title: 'Show me another' }
        ],
        contextMessage: 'Click for more options'
      });
  });
  
// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'previewNotification') {
    (async () => {
      const category = request.category || 'Science';
      let fact;
      try {
        fact = await fetchFactByCategory(category);
      } catch {
        fact = getRandomFactByCategory(category);
      }

      const notificationId = `smile-preview-${Date.now()}-${category}`;

      chrome.notifications.create(notificationId, {
        type: 'basic',
        iconUrl: 'icon.png',
        title: `😊 ${category} Preview! 😊`,
        message: fact,
        priority: 2,
        requireInteraction: false,
        buttons: [
          { title: 'Thanks for the smile!' },
          { title: 'Show me another' }
        ],
        contextMessage: 'Preview notification'
      });

      sendResponse({ success: true });
    })();

    return true;
  }
});

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  // Extract category from notification ID if it exists
  const parts = notificationId.split('-');
  const category = parts.length > 2 ? parts[2] : null;
  
  if (buttonIndex === 1) { // "Show me another" button
    // Close current notification
    chrome.notifications.clear(notificationId);
    
    // Show a new notification with a different fact
    let newFact;
    try {
      newFact = category ? await fetchFactByCategory(category) : getRandomFact();
    } catch {
      newFact = getRandomFactByCategory(category);
    }
    
    const newNotificationId = 'smile-reminder-' + Date.now();
    
    chrome.notifications.create(newNotificationId, {
      type: 'basic',
      iconUrl: 'icon.png',
      title: '😊 Another Smile! 😊',
      message: newFact,
      priority: 2,
      requireInteraction: false,
      buttons: [
        { title: 'Thanks for the smile!' },
        { title: 'Show me another' }
      ],
      contextMessage: 'Click for more options'
    });
  } else { // "Thanks for the smile!" button
    chrome.notifications.clear(notificationId);
  }
});

// Handle notification clicks to show category selection
chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.notifications.clear(notificationId);
  
  // Create a notification with category buttons
  const categoryNotificationId = 'smile-categories-' + Date.now();
  chrome.notifications.create(categoryNotificationId, {
    type: 'basic',
    iconUrl: 'icon.png',
    title: '😊 Choose a Category 😊',
    message: 'What kind of pop-up would you like to see?',
    priority: 2,
    requireInteraction: false,
    buttons: [
      { title: '🔬 Random Fact' },
      { title: '🦄 Joke' }
    ]
  });
});

// Handle category selection
chrome.notifications.onButtonClicked.addListener(async(notificationId, buttonIndex) => {
  if (notificationId.startsWith('smile-categories-')) {
    chrome.notifications.clear(notificationId);
    
    let category;
    if (buttonIndex === 0) {
      category = 'Random Fact';
    } else if (buttonIndex === 1) {
      category = 'Joke';
    }
    
    if (category) {
      let fact;
      try {
        fact = await fetchFactByCategory(category);
      } catch {
        fact = getRandomFactByCategory(category);
      }
      const newNotificationId = `smile-reminder-${Date.now()}-${category}`;
      
      chrome.notifications.create(newNotificationId, {
        type: 'basic',
        iconUrl: 'icon.png',
        title: `😊 ${category} Fact 😊`,
        message: fact,
        priority: 2,
        requireInteraction: false,
        buttons: [
          { title: 'Thanks for the smile!' },
          { title: 'Show me another' }
        ],
        contextMessage: `${category} category - Click for more options`
      });
    }
  }
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.interval) {
    scheduleAlarm(changes.interval.newValue);
  }
});

function scheduleAlarm(interval) {
  chrome.alarms.clearAll(() => {
    chrome.alarms.create({ periodInMinutes: interval });
  });
}
