const list = document.querySelector("#movie-list");
const status = document.querySelector("#status");
const summary = document.querySelector("#summary");
const search = document.querySelector("#search");
const genre = document.querySelector("#genre");
const loadButton = document.querySelector("#load-button");
const clearButton = document.querySelector("#clear-button");

let allMovies = [];

function setStatus(message, kind = "info") {
  if (!status) return;
  status.textContent = message;
  status.dataset.kind = kind;
}

function normalizeMovie(raw) {
  const item = raw && typeof raw === "object" ? raw : {};

  const title =
    typeof item.title === "string" && item.title.trim()
      ? item.title.trim()
      : "Без названия";

  const genreName =
    typeof item.genre === "string" && item.genre.trim()
      ? item.genre.trim()
      : "Без жанра";

  const parsedYear = Number(item.year);
  const year = Number.isFinite(parsedYear) && parsedYear > 0 ? parsedYear : "—";

  const parsedRating = Number(item.rating);
  const rating = Number.isFinite(parsedRating) ? parsedRating.toFixed(1) : "—";

  const parsedDuration = Number(item.duration);
  const duration =
    Number.isFinite(parsedDuration) && parsedDuration > 0
      ? `${parsedDuration} мин`
      : "—";

  const sessions = Array.isArray(item.sessions)
    ? item.sessions
        .filter((s) => typeof s === "string" && s.trim() !== "")
        .map((s) => s.trim())
    : [];

  const tags = Array.isArray(item.tags)
    ? item.tags
        .filter((t) => typeof t === "string" && t.trim() !== "")
        .map((t) => t.trim())
    : [];

  return {
    title,
    genre: genreName,
    year,
    rating,
    duration,
    sessions,
    tags,
  };
}

function syncGenreOptions(movies) {
  if (!genre || genre.options.length > 1) return;

  const uniqueGenres = [...new Set(movies.map((m) => m.genre))].sort((a, b) =>
    a.localeCompare(b, "ru")
  );

  uniqueGenres.forEach((genreItem) => {
    const option = document.createElement("option");
    option.value = genreItem;
    option.textContent = genreItem;
    genre.appendChild(option);
  });
}

function renderMovies(movies) {
  if (!list) return;

  list.replaceChildren();

  if (!Array.isArray(movies) || movies.length === 0) {
    const emptyBlock = document.createElement("div");
    emptyBlock.className = "empty";
    emptyBlock.textContent = "Фильмы не найдены. Попробуйте изменить фильтры или загрузить список заново.";
    list.appendChild(emptyBlock);
    return;
  }

  movies.forEach((movie) => {
    const article = document.createElement("article");
    article.className = "movie-card";

    const titleEl = document.createElement("h3");
    titleEl.textContent = movie.title;

    const metaEl = document.createElement("p");
    metaEl.className = "movie-meta";
    metaEl.textContent = `${movie.genre} • ${movie.year} • Рейтинг: ${movie.rating} • ${movie.duration}`;

    const sessionsEl = document.createElement("p");
    sessionsEl.className = "movie-sessions";
    if (movie.sessions.length > 0) {
      sessionsEl.textContent = `Ближайший сеанс: ${movie.sessions[0]} (${movie.sessions.join(", ")})`;
    } else {
      sessionsEl.textContent = "Сеансы пока не назначены";
    }

    const tagsEl = document.createElement("div");
    tagsEl.className = "movie-tags";
    if (movie.tags.length > 0) {
      movie.tags.forEach((tag) => {
        const span = document.createElement("span");
        span.className = "tag";
        span.textContent = `#${tag}`;
        tagsEl.appendChild(span);
      });
    } else {
      tagsEl.textContent = "Теги не указаны";
    }

    article.append(titleEl, metaEl, sessionsEl, tagsEl);
    list.appendChild(article);
  });
}

function applyFilters() {
  const query = search ? search.value.trim().toLowerCase() : "";
  const selectedGenre = genre ? genre.value.trim().toLowerCase() : "";

  const filtered = allMovies.filter((movie) => {
    const matchesTitle = movie.title.toLowerCase().includes(query);
    const matchesGenre =
      !selectedGenre ||
      selectedGenre === "all" ||
      movie.genre.toLowerCase() === selectedGenre;

    return matchesTitle && matchesGenre;
  });

  if (summary) {
    summary.textContent = `Показано: ${filtered.length} из ${allMovies.length}`;
  }

  renderMovies(filtered);
}

function setButtonsDisabled(disabled) {
  if (loadButton) loadButton.disabled = disabled;
  if (clearButton) clearButton.disabled = disabled;
}

async function fetchMovies(empty = false) {
  const url = empty ? "/api/movies?empty=1" : "/api/movies";

  setButtonsDisabled(true);
  setStatus("Загрузка данных...", "info");

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Ошибка сервера: ${response.status}`);
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.movies)) {
      throw new Error("Некорректный формат JSON: отсутствует массив movies");
    }

    allMovies = data.movies.map(normalizeMovie);
    syncGenreOptions(allMovies);
    applyFilters();

    if (allMovies.length === 0) {
      setStatus("Сервер вернул пустой список фильмов", "info");
    } else {
      setStatus(`Загружено фильмов: ${allMovies.length}`, "success");
    }
  } catch (error) {
    allMovies = [];
    applyFilters();
    setStatus(`Ошибка: ${error.message}`, "error");
  } finally {
    setButtonsDisabled(false);
  }
}

loadButton?.addEventListener("click", () => {
  if (search) search.value = "";
  if (genre) genre.value = genre.options[0]?.value ?? "";
  fetchMovies(false);
});

clearButton?.addEventListener("click", () => {
  fetchMovies(true);
});

search?.addEventListener("input", applyFilters);
genre?.addEventListener("change", applyFilters);

fetchMovies();
