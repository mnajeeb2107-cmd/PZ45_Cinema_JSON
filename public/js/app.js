const list = document.querySelector("#movie-list");
const status = document.querySelector("#status");
const summary = document.querySelector("#summary");
const search = document.querySelector("#search");
const genre = document.querySelector("#genre");

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

  const genreValue =
    typeof item.genre === "string" && item.genre.trim()
      ? item.genre.trim()
      : "Жанр не указан";

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
        .map((s) => (typeof s === "string" ? s.trim() : String(s ?? "")))
        .filter(Boolean)
    : [];

  const tags = Array.isArray(item.tags)
    ? item.tags
        .map((t) => (typeof t === "string" ? t.trim() : String(t ?? "")))
        .filter(Boolean)
    : [];

  return {
    title,
    genre: genreValue,
    year,
    rating,
    duration,
    sessions,
    tags,
  };
}

function renderMovies(movies) {
  if (!list) return;

  list.replaceChildren();

  if (!Array.isArray(movies) || movies.length === 0) {
    const emptyBlock = document.createElement("div");
    emptyBlock.className = "empty";
    emptyBlock.textContent = "Фильмы не найдены.";
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
      sessionsEl.textContent = `Ближайший сеанс: ${movie.sessions} (все: ${movie.sessions.join(", ")})`;
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
    summary.textContent = `Найдено: ${filtered.length} из ${allMovies.length}`;
  }

  renderMovies(filtered);
}

async function fetchMovies(empty = false) {
  const url = empty ? "/api/movies?empty=1" : "/api/movies";
  setStatus("Загрузка...", "info");

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const rawMovies = Array.isArray(data?.movies) ? data.movies : [];

    if (!data || !Array.isArray(data.movies)) {
      throw new Error("Поле data.movies не является массивом");
    }

    allMovies = rawMovies.map(normalizeMovie);
    applyFilters();
    setStatus(`Загружено фильмов: ${allMovies.length}`, "success");
  } catch (error) {
    allMovies = [];
    applyFilters();
    setStatus(`Ошибка загрузки: ${error.message}`, "error");
  }
}

document
  .querySelector("#load-button")
  ?.addEventListener("click", () => fetchMovies(false));

document
  .querySelector("#clear-button")
  ?.addEventListener("click", () => fetchMovies(true));

search?.addEventListener("input", applyFilters);
genre?.addEventListener("change", applyFilters);

fetchMovies();
