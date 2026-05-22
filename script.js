(function () {
  const data = window.siteData;

  const relationshipTitle = document.getElementById("relationship-title");
  const relationshipSubtitle = document.getElementById("relationship-subtitle");

  const startedCounter = document.getElementById("started-counter");
  const officialCounter = document.getElementById("official-counter");
  const monthlyCounter = document.getElementById("monthly-counter");

  const startedDateEl = document.getElementById("started-date");
  const officialDateEl = document.getElementById("official-date");
  const monthlyDateEl = document.getElementById("monthly-date");

  const huntForm = document.getElementById("hunt-form");
  const huntPasswordInput = document.getElementById("hunt-password");
  const huntMessage = document.getElementById("hunt-message");
  const huntContent = document.getElementById("hunt-content");
  const huntText = document.getElementById("hunt-text");

  const signsList = document.getElementById("signs-list");
  const galleryTabs = document.getElementById("gallery-tabs");
  const galleryGrid = document.getElementById("gallery-grid");
  const timelineList = document.getElementById("timeline-list");
  const lettersList = document.getElementById("letters-list");

  const startGameBtn = document.getElementById("start-game");
  const heartBtn = document.getElementById("heart-btn");
  const gameTime = document.getElementById("game-time");
  const gameScore = document.getElementById("game-score");
  const gameMessage = document.getElementById("game-message");

  relationshipTitle.textContent = data.relationship.title;
  relationshipSubtitle.textContent = data.relationship.subtitle;
  huntText.textContent = data.hunt.clue;

  const startedSpeakingDate = new Date(data.relationship.startedSpeakingDate);
  const officialDate = new Date(data.relationship.officialDate);

  startedDateEl.textContent = "From: " + formatDate(startedSpeakingDate);
  officialDateEl.textContent = "From: " + formatDate(officialDate);

  function formatDate(date) {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  function getDurationParts(from, to) {
    const diffMs = to - from;
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    return { days, hours, minutes };
  }

  function getNextMonthlyAnniversary(baseDate) {
    const now = new Date();
    const next = new Date(baseDate);
    next.setHours(0, 0, 0, 0);

    while (next <= now) {
      next.setMonth(next.getMonth() + 1);
    }

    return next;
  }

  function updateCounters() {
    const now = new Date();
    const started = getDurationParts(startedSpeakingDate, now);
    const official = getDurationParts(officialDate, now);

    startedCounter.textContent = `${started.days}d ${started.hours}h ${started.minutes}m`;
    officialCounter.textContent = `${official.days}d ${official.hours}h ${official.minutes}m`;

    const nextMonthly = getNextMonthlyAnniversary(officialDate);
    const monthly = getDurationParts(now, nextMonthly);
    monthlyCounter.textContent = `${monthly.days}d ${monthly.hours}h ${monthly.minutes}m`;
    monthlyDateEl.textContent = "Next: " + formatDate(nextMonthly);
  }

  huntForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const value = huntPasswordInput.value.trim().toLowerCase();

    if (value === data.hunt.password.toLowerCase()) {
      huntContent.classList.remove("hidden");
      huntMessage.textContent = "Unlocked.";
      huntMessage.style.color = "#3c7a30";
    } else {
      huntContent.classList.add("hidden");
      huntMessage.textContent = "Wrong password, try again.";
      huntMessage.style.color = "#b33131";
    }
  });

  function renderSigns() {
    signsList.innerHTML = "";
    data.signsLore.forEach(function (item) {
      const li = document.createElement("li");
      li.textContent = item;
      signsList.appendChild(li);
    });
  }

  function renderGalleryCategory(categoryName) {
    galleryGrid.innerHTML = "";
    const items = data.gallery[categoryName] || [];

    items.forEach(function (item) {
      const wrapper = document.createElement("article");
      wrapper.className = "gallery-item";

      const img = document.createElement("img");
      img.src = item.image;
      img.alt = item.caption;
      img.onerror = function () {
        this.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'><rect width='100%25' height='100%25' fill='%23f1dfaa'/><text x='50%25' y='50%25' text-anchor='middle' fill='%237a6745' font-size='16' font-family='sans-serif'>Add image file</text></svg>";
      };

      const caption = document.createElement("p");
      caption.textContent = item.caption;

      wrapper.appendChild(img);
      wrapper.appendChild(caption);
      galleryGrid.appendChild(wrapper);
    });
  }

  function renderGalleryTabs() {
    const categories = Object.keys(data.gallery);

    categories.forEach(function (category, index) {
      const tab = document.createElement("button");
      tab.className = "tab" + (index === 0 ? " active" : "");
      tab.textContent = category;
      tab.addEventListener("click", function () {
        document.querySelectorAll(".tab").forEach(function (el) {
          el.classList.remove("active");
        });
        tab.classList.add("active");
        renderGalleryCategory(category);
      });
      galleryTabs.appendChild(tab);
    });

    if (categories.length > 0) {
      renderGalleryCategory(categories[0]);
    }
  }

  function renderTimeline() {
    timelineList.innerHTML = "";
    data.timeline.forEach(function (entry) {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${entry.date} - ${entry.title}</strong><br>${entry.note}`;
      timelineList.appendChild(li);
    });
  }

  function redactText(text) {
    return text.replace(/<redacted>/gi, '<span class="redacted">REDACTED</span>');
  }

  function renderLetters() {
    lettersList.innerHTML = "";
    data.letters.forEach(function (text, idx) {
      const letter = document.createElement("article");
      letter.className = "letter";
      letter.innerHTML = `<strong>Letter ${idx + 1}:</strong> ${redactText(text)}`;
      lettersList.appendChild(letter);
    });
  }

  let timer = null;
  let score = 0;
  let timeLeft = 15;

  function stopGame() {
    clearInterval(timer);
    timer = null;
    heartBtn.disabled = true;
    startGameBtn.disabled = false;
    gameMessage.textContent = `Final score: ${score}.`;
  }

  startGameBtn.addEventListener("click", function () {
    score = 0;
    timeLeft = 15;
    gameScore.textContent = String(score);
    gameTime.textContent = String(timeLeft);
    gameMessage.textContent = "Go!";
    startGameBtn.disabled = true;
    heartBtn.disabled = false;

    timer = setInterval(function () {
      timeLeft -= 1;
      gameTime.textContent = String(timeLeft);
      if (timeLeft <= 0) {
        stopGame();
      }
    }, 1000);
  });

  heartBtn.addEventListener("click", function () {
    if (heartBtn.disabled) return;
    score += 1;
    gameScore.textContent = String(score);
  });

  renderSigns();
  renderGalleryTabs();
  renderTimeline();
  renderLetters();
  updateCounters();
  setInterval(updateCounters, 30000);
})();
