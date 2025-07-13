document.addEventListener('DOMContentLoaded', () => {
    const enableToggle = document.getElementById('enableToggle');
    const intervalInput = document.getElementById('intervalInput');
    const saveBtn = document.getElementById('saveBtn');
    const previewBtn = document.getElementById('previewBtn');
    const status = document.getElementById('status');
    
    // Category checkboxes
    const factsCategory = document.getElementById('factsCategory');
    const jokeCategory = document.getElementById('jokeCategory');
    const inspirationCategory = document.getElementById('inspirationCategory');
  
    // Load saved settings
    chrome.storage.sync.get(
      ['enabled', 'interval', 'categories', 'theme'], 
      ({ enabled, interval, categories }) => {
        enableToggle.checked = enabled ?? true;
        intervalInput.value = interval ?? 60;
        
        // Set category preferences if they exist
        if (categories) {
          factsCategory.checked = categories.includes('Random Fact');
          jokeCategory.checked = categories.includes('Joke');
          inspirationCategory.checked = categories.includes('Inspiration');
        }
    });
  
    // Save settings
    saveBtn.addEventListener('click', () => {
      const enabled = enableToggle.checked;
      const interval = parseInt(intervalInput.value, 10);
      
      // Get selected categories
      const categories = [];
      if (factsCategory.checked) categories.push('Random Fact');
      if (jokeCategory.checked) categories.push('Joke');
      if (inspirationCategory.checked) categories.push('Inspiration');
  
      if (isNaN(interval) || interval < 1) {
        showStatus("Please enter a valid interval (≥1 min)", 'error');
        return;
      }
      
      if (categories.length === 0) {
        showStatus("Please select at least one category", 'error');
        return;
      }

      const currentTheme = document.getElementById('songSelect').value;
  
      chrome.storage.sync.set({ enabled, interval, categories, theme: currentTheme }, () => {
        showStatus("Settings saved!", 'success');
        setTimeout(() => window.close(), 2000);
        
        // Update notification status based on user selection
        if (enabled) {
          // Enable notifications with the specified interval
          chrome.alarms.clearAll(() => {
            chrome.alarms.create({ periodInMinutes: interval });
          });
        } else {
          // Disable notifications by clearing all alarms
          chrome.alarms.clearAll();
        }
      });
    });
    
    // Preview notification
    previewBtn.addEventListener('click', () => {
      // Get selected categories
      const selectedCategories = [];
      if (factsCategory.checked) selectedCategories.push('Random Fact');
      if (jokeCategory.checked) selectedCategories.push('Joke');
      if (inspirationCategory.checked) selectedCategories.push('Inspiration');
      
      if (selectedCategories.length === 0) {
        showStatus("Please select at least one category", 'error');
        return;
      }
      
      // Randomly select a category from the user's preferences
      const randomCategory = selectedCategories[Math.floor(Math.random() * selectedCategories.length)];
      
      const timeout = 5000; // 5 seconds
      let didRespond = false;
      const timeoutId = setTimeout(() => {
        if (!didRespond) {
          showStatus("Preview took too long or failed", 'error');
        }
      }, timeout);

      // Send message to background script to show preview notification
      chrome.runtime.sendMessage(
        { action: 'previewNotification', category: randomCategory },
        (response) => {
          didRespond = true;
          clearTimeout(timeoutId);
          if (response && response.success) {
            showStatus("Preview notification sent!", 'success');
          } else {
            showStatus("Failed to send preview", 'error');
          }
        }
      );
    });

    window.addEventListener('DOMContentLoaded', () => {    
      // 🎵 NEW elements
      const songSelect = document.getElementById('songSelect');
      const audio      = document.getElementById('cheerSound');
      const category = document.getElementById('category-options');
      const intervalInput = document.getElementById('intervalInput');
    
      // 🔶 Palette map  (BG, ACCENT, TEXT, CARD, HOVER)
      const themes = {
        yellow: ['#FFF8E1', '#FFD966', '#5C3A00', '#FFE8A1', '#FFE699'],
        pink  : ['#FFF0F6', '#FF80C0', '#55002D', '#FFD1E8', '#FFBBDD'],
        purple: ['#F8F3FF', '#C0A3FF', '#3B236B', '#DCD2F5', '#D4C4FF'],
        blue  : ['#E7F5FF', '#6EC1FF', '#00304E', '#C2E4FA', '#A8D9FF'],
        green : ['#F0FFF4', '#79D99C', '#1F5533', '#D1F7DF', '#A8E8BF']
      };
    
      // Restore saved song/theme
      chrome.storage.sync.get('theme', ({ theme }) => {
        const chosen = theme || 'yellow';
        songSelect.value = chosen;
        applyTheme(chosen);
      });
    
      // 🔁 Loop audio while popup is open
      audio.loop   = true;
      audio.volume = 0.4;
    
      // ▶️ Play once user interacts
      const startAudio = () => {
        if (!audio.dataset.started) {
          audio.dataset.started = '1';
          audio.play().catch(()=>{});
        }
      };

      window.addEventListener('click', startAudio);
      window.addEventListener('mousemove', startAudio);
    
      // 🔄 Change theme & song on dropdown change
      songSelect.addEventListener('change', () => {
        const choice = songSelect.value;
        applyTheme(choice);
        chrome.storage.sync.set({ theme: choice });
        startAudio();
      });
    
      // 🖌️ helper
      function applyTheme(key) {
        const [bg, accent, text, card, hover] = themes[key];
        const root = document.documentElement.style;
        root.setProperty('--sunset-bg',     bg);
        root.setProperty('--sunset-accent', accent);
        root.setProperty('--sunset-text',   text);
        root.setProperty('--sunset-card',   card);
        root.setProperty('--sunset-hover',  hover);
    
        // swap audio src
        audio.pause();
        audio.currentTime = 0;
        audio.src = `${key}.mp3`;
        if (audio.dataset.started) audio.play().catch(()=>{});
        songSelect.style.backgroundColor = bg;
        songSelect.style.color           = text;
        intervalInput.style.backgroundColor = bg;
        intervalInput.style.color = text;
      }
    
      // ⛔ stop music when popup closes
      window.addEventListener('unload', () => {
        audio.pause();
        audio.currentTime = 0;
      });
    
      const audioToggle = document.getElementById('audioToggle');

      let isMuted = false;
      
      audioToggle.addEventListener('click', () => {
        isMuted = !isMuted;
        audio.muted = isMuted;
        audioToggle.textContent = isMuted ? '🔇' : '🔊';
      });  
    });    
    
    // Helper function to show status messages
    function showStatus(message, type) {
      status.textContent = message;
      status.className = type; // 'success' or 'error'
      status.style.display = 'block';
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        status.style.opacity = '0';
        setTimeout(() => {
          status.style.display = 'none';
          status.style.opacity = '1';
        }, 500);
      }, 2000);
    }
  });
  