const animations = {};

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.addEventListener('click', () => {
        // Toggle active class
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Show selected tab content
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.getElementById(btn.dataset.tab).classList.add('active');
        if (btn.dataset.tab === 'favouritesTab') {
          renderFavourites();
        }
      });
    });

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
  
      chrome.storage.sync.set({ enabled, interval, categories }, () => {
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
      const intervalInput = document.getElementById('intervalInput');
    
      const themes = {
        dawn: ['linear-gradient(to bottom, #CCFFFF, #D8E4E9)', '#97c8ec', '#00304E', '#C2E4FA', '#A8D9FF'],
        morning:   ['#FFFBE6', '#FFE066', '#6B4F00', '#FFF1B8', '#FFE799'],
        evening: [
          'url("sunset bg2.png")',
          '#e6794bff',  
          '#4A1F0F', 
          '#FFD2A6', 
          '#FFC38A'
        ],        
        night:     ['#1B1B3A', '#5C4D7D', '#EAEAEA', '#2C2C54', '#3D3D70']
      };

      function getTimeBasedTheme() {
        const hour = new Date().getHours();
        if(hour>=4 && hour < 7) return 'dawn';
        if (hour >= 7 && hour < 16) return 'morning';  
        if( hour >= 16 && hour < 19) return 'evening';
        return 'night';               
      }


      const initialTheme = getTimeBasedTheme();
      applyTheme(initialTheme);
    
      function applyTheme(key) {
        const [bg, accent, text, card, hover] = themes[key];
        const root = document.documentElement.style;
        if (bg.includes('linear-gradient') || bg.includes('url(')) {
          document.body.style.background = bg;
          root.setProperty('--sunset-bg', ''); // Clear CSS var to avoid conflicts
        } else {
          root.setProperty('--sunset-bg', bg);
          document.body.style.background = '';
        }
        root.setProperty('--sunset-accent', accent);
        root.setProperty('--sunset-text',   text);
        root.setProperty('--sunset-card',   card);
        root.setProperty('--sunset-hover',  hover);
    
        intervalInput.style.backgroundColor = bg;
        intervalInput.style.color = text;

        const animMap = {
          morning: 'sunrise',
          dawn: 'birds',
          evening: 'sunset',
          night: 'moon'
        };

        const animationName = animMap[key];
        Object.values(animations).forEach(animList => {
          animList.forEach(anim => anim.destroy());
        });

        animations[animationName] = [];

        // Attach animation to each `.animated-bg` separately
        document.querySelectorAll('.animated-bg').forEach(el => {
          el.innerHTML = ''; // clear old content
          el.style.opacity = animationName === 'sunrise' ? '0.35' :
                       animationName === 'moon'    ? '0.15' : '1';
          const anim = lottie.loadAnimation({
            container: el,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: `${animationName}.json`
          });
          animations[animationName].push(anim);
        });
      }
    });    
    
    // Helper function to show status messages
    function showStatus(message, type) {
      status.textContent = message;
      status.className = type;
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

    function renderFavourites() {
      chrome.storage.sync.get('favourites', ({ favourites }) => {
        const favList = document.getElementById('favouritesList');
        if (!favList) return;

        favList.innerHTML = ''; // Clear existing items

        if (favourites && favourites.length) {
          favourites.slice().reverse().forEach((fav, index) => {
            const li = document.createElement('li');
            li.className = 'favourite-card';

            const textSpan = document.createElement('span');
            textSpan.textContent = `${fav.text}`;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = 'Remove';
            deleteBtn.addEventListener('click', () => {
              removeFavourite(index);
            });

            li.appendChild(textSpan);
            li.appendChild(deleteBtn);
            favList.appendChild(li);
          });
        } else {
          favList.innerHTML = '<li>No favourites yet.</li>';
        }
      });
    }

    function removeFavourite(indexToRemove) {
      chrome.storage.sync.get('favourites', ({ favourites }) => {
        if (!favourites || favourites.length === 0) return;

        favourites.splice(favourites.length - 1 - indexToRemove, 1); // Reverse order
        chrome.storage.sync.set({ favourites }, () => {
          renderFavourites(); // Refresh the list
        });
      });
    }
  });
  