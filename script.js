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
    const form = byId("stick-form");
    const board = byId("stick-board");
    const list = byId("stick-list");
    const emptyState = byId("stick-empty");
    if (!form || !board || !list || !emptyState) return;

    const authorInput = byId("stick-author");
    const messageInput = byId("stick-message");
    let notes = [];

    function noteColorClass(index) {
      const colors = ["note-yellow", "note-peach", "note-cream", "note-gold"];
      return colors[index % colors.length];
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    async function savePosition(id, x, y) {
      try {
        await fetch(`/api/stick-notes/${id}/position`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ x, y })
        });
      } catch (_err) {
        // Ignore save-position failures silently.
      }
    }

    function enableDrag(noteEl, item) {
      let dragging = false;
      let moved = false;
      let startX = 0;
      let startY = 0;
      let startLeft = 0;
      let startTop = 0;

      function onMove(clientX, clientY) {
        if (!dragging) return;
        const dx = clientX - startX;
        const dy = clientY - startY;
        const boardRect = board.getBoundingClientRect();
        const noteRect = noteEl.getBoundingClientRect();

        const nextLeft = clamp(startLeft + dx, 0, boardRect.width - noteRect.width);
        const nextTop = clamp(startTop + dy, 0, boardRect.height - noteRect.height);

        noteEl.style.left = `${nextLeft}px`;
        noteEl.style.top = `${nextTop}px`;

        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
      }

      function onEnd() {
        if (!dragging) return;
        dragging = false;
        noteEl.classList.remove("dragging");

        const x = parseFloat(noteEl.style.left) || 0;
        const y = parseFloat(noteEl.style.top) || 0;
        item.x = x;
        item.y = y;
        savePosition(item.id, x, y);

        window.removeEventListener("mousemove", mouseMove);
        window.removeEventListener("mouseup", mouseUp);
        window.removeEventListener("touchmove", touchMove);
        window.removeEventListener("touchend", touchEnd);
      }

      function mouseMove(e) { onMove(e.clientX, e.clientY); }
      function mouseUp() { onEnd(); }
      function touchMove(e) {
        const t = e.touches && e.touches[0];
        if (!t) return;
        onMove(t.clientX, t.clientY);
      }
      function touchEnd() { onEnd(); }

      noteEl.addEventListener("mousedown", function (e) {
        if (e.target.closest(".note-remove")) return;
        dragging = true;
        moved = false;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = parseFloat(noteEl.style.left) || 0;
        startTop = parseFloat(noteEl.style.top) || 0;
        noteEl.classList.add("dragging");
        window.addEventListener("mousemove", mouseMove);
        window.addEventListener("mouseup", mouseUp);
      });

      noteEl.addEventListener("touchstart", function (e) {
        if (e.target.closest(".note-remove")) return;
        const t = e.touches && e.touches[0];
        if (!t) return;
        dragging = true;
        moved = false;
        startX = t.clientX;
        startY = t.clientY;
        startLeft = parseFloat(noteEl.style.left) || 0;
        startTop = parseFloat(noteEl.style.top) || 0;
        noteEl.classList.add("dragging");
        window.addEventListener("touchmove", touchMove, { passive: true });
        window.addEventListener("touchend", touchEnd);
      }, { passive: true });

      noteEl.addEventListener("click", function (event) {
        if (event.target.closest(".note-remove")) return;
        if (moved) return;
        noteEl.classList.toggle("open");
      });
    }

    function renderNotes() {
      list.innerHTML = "";
      emptyState.style.display = notes.length === 0 ? "block" : "none";

      const boardRect = board.getBoundingClientRect();
      const cols = Math.max(1, Math.floor(boardRect.width / 180));

      notes.forEach(function (item, index) {
        const note = document.createElement("article");
        note.className = "stick-note " + noteColorClass(index);

        const title = document.createElement("p");
        title.className = "stick-title";
        title.textContent = item.author + " says:";

        const text = document.createElement("p");
        text.className = "stick-text";
        text.textContent = item.message;
        text.setAttribute("data-preview", item.message.length > 58 ? item.message.slice(0, 58) + "..." : item.message);

        const meta = document.createElement("div");
        meta.className = "stick-meta";

        const date = document.createElement("small");
        date.textContent = item.createdAt;

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "note-remove";
        removeBtn.textContent = "Delete";
        removeBtn.addEventListener("click", async function () {
          try {
            const response = await fetch(`/api/stick-notes/${item.id}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Delete failed");
            await refreshNotes();
          } catch (error) {
            emptyState.textContent = "Could not delete note right now.";
            emptyState.style.display = "block";
          }
        });

        meta.appendChild(date);
        meta.appendChild(removeBtn);
        note.appendChild(title);
        note.appendChild(text);
        note.appendChild(meta);

        const defaultX = (index % cols) * 170 + 10;
        const defaultY = Math.floor(index / cols) * 145 + 10;
        const x = Number.isFinite(item.x) ? item.x : defaultX;
        const y = Number.isFinite(item.y) ? item.y : defaultY;
        note.style.left = `${x}px`;
        note.style.top = `${y}px`;

        enableDrag(note, item);
        list.appendChild(note);
      });
    }

    async function refreshNotes() {
      try {
        const response = await fetch("/api/stick-notes");
        if (!response.ok) throw new Error("Fetch failed");
        notes = await response.json();
        renderNotes();
      } catch (error) {
        notes = [];
        renderNotes();
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
        const response = await fetch("/api/stick-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ author, message })
        });
        if (!response.ok) throw new Error("Save failed");
        form.reset();
        await refreshNotes();
      } catch (error) {
        emptyState.textContent = "Could not save note right now.";
        emptyState.style.display = "block";
      }
    });

    window.addEventListener("resize", function () {
      renderNotes();
    });

    refreshNotes();
  }


  function initLoveBoardPage() {
    const form = byId("love-board-form");
    const list = byId("love-board-list");
    const emptyState = byId("love-board-empty");
    if (!form || !list || !emptyState) return;

    const authorInput = byId("love-board-author");
    const messageInput = byId("love-board-message");
    const boardShell = document.querySelector(".love-board-shell");
    let messages = [];

    function showEnergyBurst() {
      if (boardShell) {
        boardShell.classList.remove("energy-pulse");
        void boardShell.offsetWidth;
        boardShell.classList.add("energy-pulse");
      }

      const burst = document.createElement("div");
      burst.className = "energy-burst";
      form.appendChild(burst);

      const icons = ["💛", "🕊️", "💛", "💫", "🕊️", "💛", "💛"];
      icons.forEach(function (icon, index) {
        const particle = document.createElement("span");
        particle.className = "energy-particle";
        particle.textContent = icon;
        const spread = (index - (icons.length - 1) / 2) * 18;
        const jitter = Math.round((Math.random() - 0.5) * 10);
        const dx = spread + jitter;
        const dy = -70 - Math.round(Math.random() * 26);
        particle.style.setProperty("--dx", dx + "px");
        particle.style.setProperty("--dy", dy + "px");
        particle.style.animationDelay = index * 0.035 + "s";
        burst.appendChild(particle);
      });

      setTimeout(function () {
        if (burst.parentNode) burst.parentNode.removeChild(burst);
      }, 1200);
    }

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
        showEnergyBurst();
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
    const form = byId("letters-form");
    const list = byId("letters-list");
    const emptyState = byId("letters-empty");
    if (!form || !list || !emptyState) return;

    const authorInput = byId("letters-author");
    const messageInput = byId("letters-message");
    let letters = [];

    function showSealPop() {
      const stamp = document.createElement("div");
      stamp.className = "seal-pop";
      stamp.textContent = "SEALED 💌";
      form.appendChild(stamp);
      requestAnimationFrame(function () {
        stamp.classList.add("show");
      });
      setTimeout(function () {
        stamp.classList.remove("show");
      }, 620);
      setTimeout(function () {
        if (stamp.parentNode) stamp.parentNode.removeChild(stamp);
      }, 980);
    }

    function showUnsealHearts(target) {
      const hearts = ["💛", "❤️", "💖"];
      for (let i = 0; i < 5; i += 1) {
        const heart = document.createElement("span");
        heart.className = "unseal-heart";
        heart.textContent = hearts[i % hearts.length];
        heart.style.left = 18 + i * 16 + Math.floor(Math.random() * 8) + "%";
        heart.style.animationDelay = i * 0.04 + "s";
        target.appendChild(heart);
        setTimeout(function () {
          if (heart.parentNode) heart.parentNode.removeChild(heart);
        }, 900);
      }
    }

    function renderLetters() {
      list.innerHTML = "";
      emptyState.style.display = letters.length === 0 ? "block" : "none";
      list.classList.toggle("scrollable", letters.length > 4);

      letters.forEach(function (item) {
        const envelope = document.createElement("article");
        envelope.className = "envelope-letter";

        const flap = document.createElement("div");
        flap.className = "envelope-flap";

        const body = document.createElement("div");
        body.className = "envelope-body";

        const title = document.createElement("p");
        title.className = "envelope-title";
        title.textContent = item.author + " wrote a sealed letter";

        const hint = document.createElement("p");
        hint.className = "envelope-hint";
        hint.textContent = "Tap to open";

        const content = document.createElement("div");
        content.className = "envelope-content";

        const text = document.createElement("p");
        text.className = "envelope-text";
        text.textContent = item.message;

        const meta = document.createElement("div");
        meta.className = "envelope-meta";

        const date = document.createElement("small");
        date.textContent = item.createdAt;

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "note-remove";
        removeBtn.textContent = "Delete";
        removeBtn.addEventListener("click", async function (event) {
          event.stopPropagation();
          try {
            const response = await fetch(`/api/letters/${item.id}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Delete failed");
            await refreshLetters();
          } catch (error) {
            emptyState.textContent = "Could not delete letter right now.";
            emptyState.style.display = "block";
          }
        });

        meta.appendChild(date);
        meta.appendChild(removeBtn);
        content.appendChild(text);
        content.appendChild(meta);

        body.appendChild(title);
        body.appendChild(hint);
        body.appendChild(content);

        envelope.appendChild(flap);
        envelope.appendChild(body);

        envelope.addEventListener("click", function () {
          const isOpening = !envelope.classList.contains("open");
          envelope.classList.toggle("open");
          if (isOpening) {
            showUnsealHearts(envelope);
          }
        });

        list.appendChild(envelope);
      });
    }

    async function refreshLetters() {
      try {
        const response = await fetch("/api/letters");
        if (!response.ok) throw new Error("Fetch failed");
        letters = await response.json();
        renderLetters();
      } catch (error) {
        letters = [];
        renderLetters();
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
        const response = await fetch("/api/letters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ author, message })
        });
        if (!response.ok) throw new Error("Save failed");
        showSealPop();
        form.reset();
        await refreshLetters();
      } catch (error) {
        emptyState.textContent = "Could not save letter right now.";
        emptyState.style.display = "block";
      }
    });

    refreshLetters();
  }

  function initGamePage() {
    const startGameBtn = byId("start-game");
    const heartBtn = byId("heart-btn");
    const gameTime = byId("game-time");
    const gameScore = byId("game-score");
    const gameMessage = byId("game-message");
    const playerInput = byId("game-player");
    const topList = byId("game-top-list");
    const recentList = byId("game-recent-list");

    if (!startGameBtn || !heartBtn || !gameTime || !gameScore || !gameMessage) return;

    let timer = null;
    let score = 0;
    let timeLeft = 15;

    async function fetchLeaderboard() {
      if (!topList || !recentList) return;
      try {
        const [topRes, recentRes] = await Promise.all([
          fetch('/api/game-scores/top'),
          fetch('/api/game-scores/recent')
        ]);
        if (!topRes.ok || !recentRes.ok) throw new Error('leaderboard fetch failed');
        const top = await topRes.json();
        const recent = await recentRes.json();

        topList.innerHTML = '';
        if (top.length === 0) {
          const li = document.createElement('li');
          li.textContent = 'No scores yet.';
          topList.appendChild(li);
        } else {
          top.forEach(function (row) {
            const li = document.createElement('li');
            li.textContent = `${row.player}: ${row.bestScore}`;
            topList.appendChild(li);
          });
        }

        recentList.innerHTML = '';
        if (recent.length === 0) {
          const li = document.createElement('li');
          li.textContent = 'No runs yet.';
          recentList.appendChild(li);
        } else {
          recent.forEach(function (row) {
            const li = document.createElement('li');
            li.textContent = `${row.player}: ${row.score} (${row.createdAt})`;
            recentList.appendChild(li);
          });
        }
      } catch (_error) {
        topList.innerHTML = '<li>Could not load leaderboard.</li>';
        recentList.innerHTML = '<li>Could not load recent runs.</li>';
      }
    }

    async function submitScore(finalScore) {
      if (!playerInput) return;
      const player = playerInput.value.trim();
      if (!player) {
        gameMessage.textContent = `Final score: ${finalScore}. Enter your name to save score.`;
        return;
      }

      try {
        const response = await fetch('/api/game-scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ player, score: finalScore })
        });
        if (!response.ok) throw new Error('save failed');
        gameMessage.textContent = `Final score: ${finalScore}. Saved for ${player}.`;
        fetchLeaderboard();
      } catch (_error) {
        gameMessage.textContent = `Final score: ${finalScore}. Could not save score.`;
      }
    }

    function stopGame() {
      clearInterval(timer);
      timer = null;
      heartBtn.disabled = true;
      startGameBtn.disabled = false;
      submitScore(score);
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

    fetchLeaderboard();
  }

  function initMoodPage() {
    const chooser = byId("mood-chooser");
    if (!chooser) return;

    const trackerPanel = byId("mood-tracker-panel");
    const choosePrincipessa = byId("choose-principessa");
    const choosePrincipe = byId("choose-principe");
    const personTitle = byId("mood-person-title");
    const monthLabel = byId("mood-month-label");
    const prevMonthBtn = byId("mood-prev-month");
    const nextMonthBtn = byId("mood-next-month");
    const grid = byId("mood-grid");
    const dateInput = byId("mood-date");
    const moodSelect = byId("mood-value");
    const saveBtn = byId("mood-save");
    const messageEl = byId("mood-message");

    const personNames = { principessa: "Principessa", principe: "Principe" };
    let activePerson = "";
    let activeMonth = "";
    let monthData = {};

    function getTodayInRome() {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Rome",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).formatToParts(new Date());
      const map = {};
      parts.forEach(function (p) { map[p.type] = p.value; });
      return `${map.year}-${map.month}-${map.day}`;
    }

    function formatMonthLabel(month) {
      const [year, mm] = month.split("-").map(Number);
      return new Date(year, mm - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }

    function daysInMonth(month) {
      const [year, mm] = month.split("-").map(Number);
      return new Date(year, mm, 0).getDate();
    }

    function shiftMonth(month, delta) {
      const [year, mm] = month.split("-").map(Number);
      const d = new Date(year, mm - 1 + delta, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      return `${y}-${m}`;
    }

    function moodClass(value) {
      return value >= 1 && value <= 5 ? `mood-${value}` : "";
    }

    async function loadMonth() {
      if (!activePerson || !activeMonth) return;
      try {
        const response = await fetch(`/api/moods?person=${encodeURIComponent(activePerson)}&month=${encodeURIComponent(activeMonth)}`);
        if (!response.ok) throw new Error("Fetch failed");
        const rows = await response.json();
        monthData = {};
        rows.forEach(function (row) {
          monthData[row.date] = row.mood;
        });
        renderMonth();
      } catch (_error) {
        messageEl.textContent = "Could not load moods right now.";
      }
    }

    function renderMonth() {
      if (!grid) return;
      grid.innerHTML = "";
      monthLabel.textContent = formatMonthLabel(activeMonth);

      const totalDays = daysInMonth(activeMonth);
      for (let day = 1; day <= totalDays; day += 1) {
        const dayStr = String(day).padStart(2, "0");
        const date = `${activeMonth}-${dayStr}`;
        const moodValue = monthData[date];
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = `mood-day ${moodClass(moodValue)}`.trim();
        cell.textContent = String(day);
        cell.addEventListener("click", function () {
          dateInput.value = date;
          if (moodValue) moodSelect.value = String(moodValue);
        });
        grid.appendChild(cell);
      }
    }

    function openTracker(person) {
      activePerson = person;
      activeMonth = getTodayInRome().slice(0, 7);
      monthData = {};
      personTitle.textContent = personNames[person];
      dateInput.value = getTodayInRome();
      trackerPanel.classList.remove("hidden");
      messageEl.textContent = "";
      loadMonth();
    }

    choosePrincipessa.addEventListener("click", function () { openTracker("principessa"); });
    choosePrincipe.addEventListener("click", function () { openTracker("principe"); });

    prevMonthBtn.addEventListener("click", function () {
      if (!activeMonth) return;
      activeMonth = shiftMonth(activeMonth, -1);
      loadMonth();
    });

    nextMonthBtn.addEventListener("click", function () {
      if (!activeMonth) return;
      activeMonth = shiftMonth(activeMonth, 1);
      loadMonth();
    });

    saveBtn.addEventListener("click", async function () {
      if (!activePerson) return;
      const date = dateInput.value;
      const mood = Number(moodSelect.value);
      if (!date) return;

      try {
        const response = await fetch("/api/moods", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ person: activePerson, date, mood })
        });
        if (!response.ok) throw new Error("Save failed");

        const month = date.slice(0, 7);
        if (month === activeMonth) {
          monthData[date] = mood;
          renderMonth();
        }

        messageEl.textContent = "Mood saved.";
        const totalDays = daysInMonth(month);
        const day = Number(date.slice(8, 10));
        if (month === activeMonth && day === totalDays) {
          activeMonth = shiftMonth(activeMonth, 1);
          dateInput.value = `${activeMonth}-01`;
          await loadMonth();
        }
      } catch (_error) {
        messageEl.textContent = "Could not save mood right now.";
      }
    });
  }


  initSharedHeader();
  initLockedHuntOverlay();
  initMomentsPage();
  initHuntPage();
  initSignsPage();
  initMoodPage();
  initLoveBoardPage();
  initLettersPage();
  initGamePage();
})();
