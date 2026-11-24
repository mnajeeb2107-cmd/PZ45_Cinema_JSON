document.addEventListener("DOMContentLoaded", () => {
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

    const year = Number(item.year);
    const rating = Number(item.rating);
    const duration = Number(item.duration);

    return {
      title: typeof item.title === "string" && item.title.trim() ? item.title.trim() : "Без названия",
      genre: typeof item.genre === "string" && item.genre.trim() ? item.genre.trim() : "Без жанра",
      year: Number.isFinite(year) && year > 0 ? year : null,
      rating: Number.isFinite(rating) ? rating : null,
      duration: Number.isFinite(duration) && duration > 0 ? duration : null,
      sessions: Array.isArray(item.sessions)
        ? item.sessions.map((s) => String(s).trim()).filter(Boolean)
        : [],
      tags: Array.isArray(item.tags)
        ? item.tags.map((t) => String(t).trim()).filter(Boolean)
        : [],
    };
  }

  function renderMovies(movies) {
    if (!list) return;
    list.replaceChildren();

    if (!movies.length) {
      const emptyEl = document.createElement("div");
      emptyEl.className = "empty";
      emptyEl.textContent = "Фильмы не найдены";
      list.append(emptyEl);
      return;
    }

    const fragment = document.createDocumentFragment();

    movies.forEach((movie) => {
      const card = document.createElement("article");
      card.className = "movie-card";

      const titleEl = document.createElement("h3");
      titleEl.textContent = movie.title;

      const metaEl = document.createElement("p");
      const yearText = movie.year !== null ? `${movie.year} г.` : "Год не указан";
      const durationText = movie.duration !== null ? `${movie.duration} мин.` : "Длительность не указана";
      const ratingText = movie.rating !== null ? `Рейтинг: ${movie.rating}` : "Без рейтинга";
      metaEl.textContent = `${movie.genre} • ${yearText} • ${durationText} • ${ratingText}`;

      const sessionEl = document.createElement("p");
      sessionEl.textContent =
        movie.sessions.length > 0
          ? `Ближайший сеанс: ${movie.sessions[0]}`
          : "Сеансы пока не назначены";

      card.append(titleEl, metaEl, sessionEl);

      if (movie.tags.length > 0) {
        const tagsEl = document.createElement("p");
        tagsEl.className = "tags";
        tagsEl.textContent = `Теги: ${movie.tags.join(", ")}`;
        card.append(tagsEl);
      }

      fragment.append(card);
    });

    list.append(fragment);
  }

  function applyFilters() {
    const query = search ? search.value.trim().toLowerCase() : "";
    const selectedGenre = genre ? genre.value : "";

    const filtered = allMovies.filter((movie) => {
      const matchesTitle = movie.title.toLowerCase().includes(query);
      const matchesGenre =
        !selectedGenre ||
        selectedGenre === "all" ||
        movie.genre.toLowerCase() === selectedGenre.toLowerCase();
      return matchesTitle && matchesGenre;
    });

    if (summary) {
      summary.textContent = `Показано: ${filtered.length} из ${allMovies.length}`;
    }
    renderMovies(filtered);
  }

  async function fetchMovies(empty = false) {
    setStatus("Загрузка данных...", "info");

    try {
      const url = "/api/movies" + (empty ? "?empty=1" : "");
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data || !Array.isArray(data.movies)) {
        throw new Error("Некорректный формат ответа сервера");
      }

      allMovies = data.movies.map(normalizeMovie);
      applyFilters();

      setStatus(
        allMovies.length > 0
          ? `Загружено фильмов: ${allMovies.length}`
          : "Список фильмов пуст",
        "success"
      );
    } catch (error) {
      allMovies = [];
      applyFilters();
      setStatus(`Ошибка: ${error.message}`, "error");
    }
  }

  const loadBtn = document.querySelector("#load-button");
  const clearBtn = document.querySelector("#clear-button");

  if (loadBtn) loadBtn.addEventListener("click", () => fetchMovies());
  if (clearBtn) clearBtn.addEventListener("click", () => fetchMovies(true));
  if (search) search.addEventListener("input", applyFilters);
  if (genre) genre.addEventListener("change", applyFilters);

  fetchMovies();
});
