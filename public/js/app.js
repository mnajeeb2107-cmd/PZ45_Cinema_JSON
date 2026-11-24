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

// Универсальный поиск массива фильмов в JSON-ответе сервера
function extractMoviesArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return null;

  if (Array.isArray(payload.movies)) return payload.movies;
  if (Array.isArray(payload.data?.movies)) return payload.data.movies;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.results)) return payload.results;

  // Поиск первого вложенного массива в объекте
  for (const value of Object.values(payload)) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      for (const nested of Object.values(value)) {
        if (Array.isArray(nested)) return nested;
      }
    }
  }

  return null;
}

function normalizeMovie(raw) {
  const item = raw && typeof raw === "object" ? raw : {};

  return {
    title:
      typeof item.title === "string" && item.title.trim()
        ? item.title.trim()
        : "Без названия",
    genre:
      typeof item.genre === "string" && item.genre.trim()
        ? item.genre.trim()
        : "Жанр не указан",
    year:
      Number.isFinite(Number(item.year)) && Number(item.year) > 0
        ? Number(item.year)
        : "—",
    rating: Number.isFinite(Number(item.rating))
      ? Number(item.rating).toFixed(1)
      : "—",
    duration:
      Number.isFinite(Number(item.duration)) && Number(item.duration) > 0
        ? `${Number(item.duration)} мин`
        : "—",
    sessions: Array.isArray(item.sessions)
      ? item.sessions.filter((s) => typeof s === "string" && s.trim() !== "")
      : [],
    tags: Array.isArray(item.tags)
      ? item.tags.filter((t) => typeof t === "string" && t.trim() !== "")
      : [],
  };
}

function updateGenreSelect(movies) {
  if (!genre || movies.length === 0) return;

  const firstOption = genre.options[0];
  const existingValues = new Set(
    Array.from(genre.options).map((opt) => opt.value.toLowerCase())
  );

  const uniqueGenres = [...new Set(movies.map((m) => m.genre))].sort((a, b) =>
    a.localeCompare(b, "ru")
  );

  if (genre.options.length <= 1) {
    if (firstOption) {
      genre.replaceChildren(firstOption);
    }
    uniqueGenres.forEach((genreItem) => {
      if (!existingValues.has(genreItem.toLowerCase())) {
        const option = document.createElement("option");
        option.value = genreItem;
        option.textContent = genreItem;
        genre.appendChild(option);
      }
    });
  }
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
      sessionsEl.textContent = `Ближайший сеанс: ${movie.sessions[0]} (все сеансы: ${movie.sessions.join(", ")})`;
    } else {
      sessionsEl.textContent = "Сеансы пока не назначены";
    }
    const tagsEl = document.createElement("div");
    tagsEl.className = "movie-tags";
    if (movie.tags.length > 0) {
      movie.tags.forEach((tag) => {
        const tagSpan = document.createElement("span");
        tagSpan.className = "tag";
        tagSpan.textContent = `#${tag}`;
        tagsEl.appendChild(tagSpan);
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
async function fetchMovies(empty = false) {
  const url = empty ? "/api/movies?empty=1" : "/api/movies";
  setStatus("Загрузка данных...", "info");
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    const rawList = extractMoviesArray(data)
    if (!Array.isArray(rawList)) {
      throw new Error("Сервер не вернул список фильмов");
    }
    allMovies = rawList.map(normalizeMovie);
    updateGenreSelect(allMovies);
    applyFilters();

    setStatus(`Загружено записей: ${allMovies.length}`, "success");
  } catch (error) {
    allMovies = [];
    applyFilters();
    setStatus(`Ошибка: ${error.message}`, "error");
  }
}

document.querySelector("#load-button")?.addEventListener("click", () => {
  if (search) search.value = "";
  if (genre && genre.options.length > 0) genre.value = genre.options[0].value;
  fetchMovies(false);
});

document.querySelector("#clear-button")?.addEventListener("click", () => {
  fetchMovies(true);
});

search?.addEventListener("input", applyFilters);
genre?.addEventListener("change", applyFilters);
fetchMovies();
