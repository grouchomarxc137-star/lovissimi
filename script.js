(function () {
  const data = window.siteData;
  if (!data) return;

  function byId(id) {
    return document.getElementById(id);
  }

  function formatDate(date) {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  function getDurationParts(from, to) {
    if (to <= from) {
      return { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    let months =
      (to.getFullYear() - from.getFullYear()) * 12 +
      (to.getMonth() - from.getMonth());

    const anchor = new Date(from);
    anchor.setMonth(anchor.getMonth() + months);
    if (anchor > to) {
      months -= 1;
      anchor.setMonth(anchor.getMonth() - 1);
    }

    const diffMs = Math.max(0, to - anchor);
    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { months, days, hours, minutes, seconds };
  }

  function getNextMonthlyAnniversary(baseDate) {
    const now = new Date();
    const next = new Date(baseDate);
    while (next <= now) {
      next.setMonth(next.getMonth() + 1);
    }
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
      }
    ];

    function updateCounters() {
      const now = new Date();
      events.forEach(function (eventItem) {
        if (!eventItem.counterEl) return;
        const since = getDurationParts(eventItem.date, now);
        eventItem.counterEl.textContent = `${since.months}mo ${since.days}d ${since.hours}h ${since.minutes}m ${since.seconds}s`;
        if (eventItem.fromDateEl) {
          eventItem.fromDateEl.textContent = "From: " + formatDate(eventItem.date);
        }

        const nextAnniversary = getNextMonthlyAnniversary(eventItem.date);
        const untilAnniversary = getDurationParts(now, nextAnniversary);

        if (eventItem.annDateEl) {
          eventItem.annDateEl.textContent = "Monthly anniversary: " + formatDate(nextAnniversary);
        }
        if (eventItem.annCounterEl) {
          eventItem.annCounterEl.textContent = `In: ${untilAnniversary.days}d ${untilAnniversary.hours}h ${untilAnniversary.minutes}m ${untilAnniversary.seconds}s`;
        }
      });
    }

    updateCounters();
    setInterval(updateCounters, 1000);
  }


  function initLockedHuntOverlay() {
    const lockedLink = document.querySelector('.locked-card[href="hunt.html"]');
    const overlay = byId("lock-overlay");
    const modal = byId("lock-modal");
    const form = byId("lock-form");
    const input = byId("lock-input");
    const error = byId("lock-error");
    const cancel = byId("lock-cancel");

    if (!lockedLink || !overlay || !modal || !form || !input || !error || !cancel) return;

    function openOverlay() {
      overlay.classList.remove("hidden");
      overlay.setAttribute("aria-hidden", "false");
      error.textContent = "";
      input.value = "";
      setTimeout(function () { input.focus(); }, 0);
    }

    function closeOverlay() {
      overlay.classList.add("hidden");
      overlay.setAttribute("aria-hidden", "true");
      modal.classList.remove("shake");
    }

    lockedLink.addEventListener("click", function (event) {
      event.preventDefault();
      openOverlay();
    });

    cancel.addEventListener("click", function () {
      closeOverlay();
    });

    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) {
        closeOverlay();
      }
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const value = input.value.trim().toLowerCase();
      if (value === String(data.hunt.password || "").toLowerCase()) {
        window.location.href = "hunt.html";
        return;
      }
      error.textContent = "Wrong password.";
      modal.classList.remove("shake");
      void modal.offsetWidth;
      modal.classList.add("shake");
    });
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
    const galleryGrid = byId("gallery-grid");
    const lightbox = byId("gallery-lightbox");
    const lightboxImg = byId("gallery-lightbox-image");
    const lightboxCaption = byId("gallery-lightbox-caption");
    const lightboxClose = byId("gallery-lightbox-close");
    if (!galleryGrid) return;

    function closeLightbox() {
      if (!lightbox) return;
      lightbox.classList.add("hidden");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    function openLightbox(src, caption) {
      if (!lightbox || !lightboxImg || !lightboxCaption) return;
      lightboxImg.src = src;
      lightboxImg.alt = caption;
      lightboxCaption.textContent = caption;
      lightbox.classList.remove("hidden");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    if (lightbox && lightboxClose) {
      lightboxClose.addEventListener("click", closeLightbox);
      lightbox.addEventListener("click", function (event) {
        if (event.target === lightbox) closeLightbox();
      });
      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closeLightbox();
      });
    }

    galleryGrid.innerHTML = "";
    const items = Object.values(data.gallery).flat();

    items.forEach(function (item, index) {
      const wrapper = document.createElement("article");
      wrapper.className = "gallery-item polaroid-item " + (index % 2 === 0 ? "tilt-left" : "tilt-right");

      const img = document.createElement("img");
      img.src = item.image;
      img.alt = item.caption;
      img.onerror = function () {
        this.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'><rect width='100%25' height='100%25' fill='%23f1dfaa'/><text x='50%25' y='50%25' text-anchor='middle' fill='%237a6745' font-size='16' font-family='sans-serif'>Add image file</text></svg>";
      };
      img.style.cursor = "zoom-in";
      img.addEventListener("click", function () {
        openLightbox(item.image, item.caption);
      });

      const caption = document.createElement("p");
      caption.textContent = item.caption;

      wrapper.appendChild(img);
      wrapper.appendChild(caption);
      galleryGrid.appendChild(wrapper);
    });
  }

  function initLoveBoardPage() {
    const form = byId("love-board-form");
    const list = byId("love-board-list");
    const emptyState = byId("love-board-empty");
    if (!form || !list || !emptyState) return;

    const authorInput = byId("love-board-author");
    const messageInput = byId("love-board-message");
    let messages = [];

    function renderMessages() {
      list.innerHTML = "";
      emptyState.style.display = messages.length === 0 ? "block" : "none";
      list.classList.toggle("scrollable", messages.length > 4);

      messages.forEach(function (item) {
        const card = document.createElement("article");
        card.className = "love-note";

        const title = document.createElement("p");
        title.className = "love-note-title";
        title.textContent = item.author + " wrote:";

        const text = document.createElement("p");
        text.className = "love-note-text";
        text.textContent = item.message;

        const meta = document.createElement("div");
        meta.className = "love-note-meta";

        const date = document.createElement("small");
        date.textContent = item.createdAt;

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "note-remove";
        removeBtn.textContent = "Remove";
        removeBtn.addEventListener("click", async function () {
          try {
            const response = await fetch(`/api/messages/${item.id}`, {
              method: "DELETE"
            });
            if (!response.ok) {
              throw new Error("Delete failed");
            }
            await refreshMessages();
          } catch (error) {
            emptyState.textContent = "Could not remove message right now.";
            emptyState.style.display = "block";
          }
        });

        meta.appendChild(date);
        meta.appendChild(removeBtn);
        card.appendChild(title);
        card.appendChild(text);
        card.appendChild(meta);
        list.appendChild(card);
      });
    }

    async function refreshMessages() {
      try {
        const response = await fetch("/api/messages");
        if (!response.ok) {
          throw new Error("Fetch failed");
        }
        messages = await response.json();
        renderMessages();
      } catch (error) {
        messages = [];
        renderMessages();
        emptyState.textContent = "Server not reachable. Start backend server.";
        emptyState.style.display = "block";
      }
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      const author = authorInput.value.trim();
      const message = messageInput.value.trim();
      if (!author || !message) return;

      try {
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ author, message })
        });
        if (!response.ok) {
          throw new Error("Save failed");
        }
        form.reset();
        await refreshMessages();
      } catch (error) {
        emptyState.textContent = "Could not save message right now.";
        emptyState.style.display = "block";
      }
    });

    refreshMessages();
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
  initLockedHuntOverlay();
  initMomentsPage();
  initHuntPage();
  initSignsPage();
  initGalleryPage();
  initLoveBoardPage();
  initLettersPage();
  initGamePage();
})();
