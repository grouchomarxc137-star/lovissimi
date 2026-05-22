(function () {
  const data = window.siteData;
  if (!data) return;

  function byId(id) {
    return document.getElementById(id);
  }

  function formatDate(date) {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  function getDurationParts(from, to) {
    const diffMs = Math.max(0, to - from);
    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { days, hours, minutes, seconds };
  }

  function getNextYearlyAnniversary(baseDate) {
    const now = new Date();
    const next = new Date(baseDate);
    next.setFullYear(now.getFullYear());
    if (next <= now) next.setFullYear(now.getFullYear() + 1);
    return next;
  }

  function initSharedHeader() {
    const relationshipTitle = byId("relationship-title");
    const relationshipSubtitle = byId("relationship-subtitle");
    if (relationshipTitle) relationshipTitle.textContent = data.relationship.title;
    if (relationshipSubtitle) relationshipSubtitle.textContent = data.relationship.subtitle;
  }

  function initMomentsPage() {
    const startedCounter = byId("started-counter");
    if (!startedCounter) return;

    const events = [
      {
        date: new Date(data.relationship.startedSpeakingDate),
        counterEl: startedCounter,
        fromDateEl: byId("started-date"),
        annDateEl: byId("started-anniversary-date"),
        annCounterEl: byId("started-anniversary-counter")
      },
      {
        date: new Date(data.relationship.firstMetDate),
        counterEl: byId("met-counter"),
        fromDateEl: byId("met-date"),
        annDateEl: byId("met-anniversary-date"),
        annCounterEl: byId("met-anniversary-counter")
      },
      {
        date: new Date(data.relationship.officialDate),
        counterEl: byId("official-counter"),
        fromDateEl: byId("official-date"),
        annDateEl: byId("official-anniversary-date"),
        annCounterEl: byId("official-anniversary-counter")
      },
      {
        date: new Date(data.relationship.firstDateDate),
        counterEl: byId("first-date-counter"),
        fromDateEl: byId("first-date-date"),
        annDateEl: byId("first-date-anniversary-date"),
        annCounterEl: byId("first-date-anniversary-counter")
      }
    ];

    function updateCounters() {
      const now = new Date();
      events.forEach(function (eventItem) {
        if (!eventItem.counterEl) return;
        const since = getDurationParts(eventItem.date, now);
        eventItem.counterEl.textContent = `${since.days}d ${since.hours}h ${since.minutes}m ${since.seconds}s`;
        if (eventItem.fromDateEl) {
          eventItem.fromDateEl.textContent = "From: " + formatDate(eventItem.date);
        }

        const nextAnniversary = getNextYearlyAnniversary(eventItem.date);
        const untilAnniversary = getDurationParts(now, nextAnniversary);

        if (eventItem.annDateEl) {
          eventItem.annDateEl.textContent = "Anniversary: " + formatDate(nextAnniversary);
        }
        if (eventItem.annCounterEl) {
          eventItem.annCounterEl.textContent = `In: ${untilAnniversary.days}d ${untilAnniversary.hours}h ${untilAnniversary.minutes}m ${untilAnniversary.seconds}s`;
        }
      });
    }

    updateCounters();
    setInterval(updateCounters, 1000);
  }

  function initHuntPage() {
    const huntForm = byId("hunt-form");
    const huntText = byId("hunt-text");
    if (!huntForm || !huntText) return;

    const huntPasswordInput = byId("hunt-password");
    const huntMessage = byId("hunt-message");
    const huntContent = byId("hunt-content");

    huntText.textContent = data.hunt.clue;

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
  }

  function initSignsPage() {
    const signsList = byId("signs-list");
    if (!signsList) return;
    signsList.innerHTML = "";
    data.signsLore.forEach(function (item) {
      const li = document.createElement("li");
      li.textContent = item;
      signsList.appendChild(li);
    });
  }

  function initGalleryPage() {
    const galleryTabs = byId("gallery-tabs");
    const galleryGrid = byId("gallery-grid");
    if (!galleryTabs || !galleryGrid) return;

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

    if (categories.length > 0) renderGalleryCategory(categories[0]);
  }

  function initTimelinePage() {
    const timelineList = byId("timeline-list");
    if (!timelineList) return;
    timelineList.innerHTML = "";
    data.timeline.forEach(function (entry) {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${entry.date} - ${entry.title}</strong><br>${entry.note}`;
      timelineList.appendChild(li);
    });
  }

  function initLettersPage() {
    const lettersList = byId("letters-list");
    if (!lettersList) return;

    function redactText(text) {
      return text.replace(/<redacted>/gi, '<span class="redacted">REDACTED</span>');
    }

    lettersList.innerHTML = "";
    data.letters.forEach(function (text, idx) {
      const letter = document.createElement("article");
      letter.className = "letter";
      letter.innerHTML = `<strong>Letter ${idx + 1}:</strong> ${redactText(text)}`;
      lettersList.appendChild(letter);
    });
  }

  function initGamePage() {
    const startGameBtn = byId("start-game");
    const heartBtn = byId("heart-btn");
    const gameTime = byId("game-time");
    const gameScore = byId("game-score");
    const gameMessage = byId("game-message");
    if (!startGameBtn || !heartBtn || !gameTime || !gameScore || !gameMessage) return;

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
        if (timeLeft <= 0) stopGame();
      }, 1000);
    });

    heartBtn.addEventListener("click", function () {
      if (heartBtn.disabled) return;
      score += 1;
      gameScore.textContent = String(score);
    });
  }

  initSharedHeader();
  initMomentsPage();
  initHuntPage();
  initSignsPage();
  initGalleryPage();
  initTimelinePage();
  initLettersPage();
  initGamePage();
})();
