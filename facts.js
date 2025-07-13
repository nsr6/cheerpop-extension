const facts = [
    // Science facts
    { category: "Random Fact", emoji: "🔬", text: "Honey never spoils. Archaeologists found edible honey in ancient Egyptian tombs." },
    { category: "Random Fact", emoji: "🔬", text: "Bananas are berries, but strawberries aren't." },
    { category: "Random Fact", emoji: "🔬", text: "Octopuses have three hearts." },
    { category: "Random Fact", emoji: "🧪", text: "A bolt of lightning contains enough energy to toast 100,000 slices of bread." },
    { category: "Random Fact", emoji: "🧪", text: "Humans share 50% of their DNA with bananas." },
    
    // Animal facts
    { category: "Random Fact", emoji: "🦄", text: "The unicorn is the national animal of Scotland." },
    { category: "Random Fact", emoji: "🦩", text: "A group of flamingos is called a 'flamboyance'." },
    { category: "Random Fact", emoji: "🐘", text: "Elephants are the only mammals that can't jump." },
    { category: "Random Fact", emoji: "🦒", text: "A giraffe's tongue is typically 45-50 cm long and is black to protect against sunburn." },
    
    // Jokes
    { category: "Joke", emoji: "😂", text: "Why don't scientists trust atoms? Because they make up everything!" },
    { category: "Joke", emoji: "😂", text: "I told my wife she was drawing her eyebrows too high. She looked surprised." },
    { category: "Joke", emoji: "🤣", text: "What do you call a fake noodle? An impasta!" },
    { category: "Joke", emoji: "🤣", text: "Why did the scarecrow win an award? Because he was outstanding in his field!" },
    
    // Inspirational quotes
    { category: "Inspiration", emoji: "✨", text: "The only way to do great work is to love what you do. - Steve Jobs" },
    { category: "Inspiration", emoji: "💫", text: "Believe you can and you're halfway there. - Theodore Roosevelt" }
  ];
  
  function getRandomFact() {
    const randomFact = facts[Math.floor(Math.random() * facts.length)];
    return `${randomFact.emoji} ${randomFact.text}`;
  }
  
  function getRandomFactByCategory(category) {
    const categoryFacts = facts.filter(fact => fact.category === category);
    if (categoryFacts.length === 0) return getRandomFact();
    
    const randomFact = categoryFacts[Math.floor(Math.random() * categoryFacts.length)];
    return `${randomFact.emoji} ${randomFact.text}`;
  }

  async function fetchFactByCategory(cat) {
    switch (cat) {
      case "Joke":
        return await fetch("https://v2.jokeapi.dev/joke/Any?type=single")
          .then(res => res.json())
          .then(data => data.joke || "Here's a joke!");

      case "Inspiration":
        return await fetch("https://zenquotes.io/api/random")
          .then(res => res.json())
          .then(data => `${data[0].q} — ${data[0].a}`);

      case "Random Fact":
        return await fetch("https://uselessfacts.jsph.pl/random.json?language=en")
          .then(res => res.json())
          .then(data => data.text || "Here's a fun fact!");
    }
 }
