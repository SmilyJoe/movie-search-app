// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Movie } from '@/types/movie';
import { searchMovies, getTrendingMovies, getGenres } from '@/utils/api';

export default function Home() {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'favorites'>('search');

  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);

  // ★ 1. ページネーション用のステート追加
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // 初回ロード時にお気に入り読み込みとジャンル一覧取得
  useEffect(() => {
    const savedFavorites = localStorage.getItem('movie_favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error('お気に入りの読み込みに失敗しました', e);
      }
    }

    getGenres()
      .then((data) => setGenres(data))
      .catch((err) => console.error(err));
  }, []);

  // お気に入りの保存・切り替え
  const toggleFavorite = (movie: Movie, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    setFavorites((prev) => {
      const isAlreadyFavorite = prev.some((fav) => fav.id === movie.id);
      let updated: Movie[];
      if (isAlreadyFavorite) {
        updated = prev.filter((fav) => fav.id !== movie.id);
      } else {
        updated = [...prev, movie];
      }
      localStorage.setItem('movie_favorites', JSON.stringify(updated));
      return updated;
    });
  };

  const isFavorite = (id: number) => favorites.some((fav) => fav.id === id);

  // 検索ワード、またはページが変更されたときのデータ取得
  useEffect(() => {
    const fetchMoviesData = async () => {
      try {
        setLoading(true);
        setError(null);

        let data;
        if (!query.trim()) {
          data = await getTrendingMovies();
        } else {
          data = await searchMovies(query, page);
        }
        
        setMovies(data.results);
        setTotalPages(data.total_pages > 500 ? 500 : data.total_pages); // TMDB APIの制限対策として最大500ページまで
      } catch (err) {
        setError('映画データの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchMoviesData, 500);
    return () => clearTimeout(timer);
  }, [query, page]);

  // 検索窓に入力があったときはページを1ページ目に戻す
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setPage(1);
  };

  // ジャンル絞り込み
  const filteredMovies = movies.filter((movie) => {
    if (selectedGenreId === null) return true;
    const genreIds = (movie as any).genre_ids || [];
    return genreIds.includes(selectedGenreId);
  });

  const displayMovies = activeTab === 'search' ? filteredMovies : favorites;

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6 md:p-12 relative pb-20">
      <h1 className="text-3xl font-bold mb-6 text-center tracking-wider">🎬 映画検索アプリ</h1>

      {/* タブ切り替えボタン */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setActiveTab('search')}
          className={`px-5 py-2 rounded-xl font-semibold transition shadow-md ${
            activeTab === 'search'
              ? 'bg-blue-600 text-white shadow-blue-900/50'
              : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          🔍 映画を検索
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`px-5 py-2 rounded-xl font-semibold transition shadow-md ${
            activeTab === 'favorites'
              ? 'bg-blue-600 text-white shadow-blue-900/50'
              : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          ⭐ お気に入り ({favorites.length})
        </button>
      </div>

      {/* 検索入力欄 */}
      {activeTab === 'search' && (
        <div className="max-w-md mx-auto mb-6">
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="映画のタイトルを入力 (例: Batman, Avengers)..."
            className="w-full px-5 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-blue-500 shadow-inner"
          />
        </div>
      )}

      {/* ジャンル絞り込みボタンの一覧 */}
      {activeTab === 'search' && genres.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto mb-10">
          <button
            onClick={() => setSelectedGenreId(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              selectedGenreId === null
                ? 'bg-blue-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            すべて
          </button>
          {genres.map((genre) => (
            <button
              key={genre.id}
              onClick={() => setSelectedGenreId(genre.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedGenreId === genre.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {genre.name}
            </button>
          ))}
        </div>
      )}

      {/* ローディング中のスピナー表示 */}
      {activeTab === 'search' && loading && (
        <div className="flex flex-col items-center justify-center my-16">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400 text-sm">映画を探しています...</p>
        </div>
      )}

      {/* エラー表示 */}
      {activeTab === 'search' && error && <p className="text-center text-red-500 my-4">{error}</p>}

      {/* 検索結果が0件のときのアナウンス */}
      {activeTab === 'search' && !loading && displayMovies.length === 0 && !error && (
        <div className="text-center text-gray-400 my-16">
          <p className="text-lg">条件に一致する映画は見つかりませんでした。</p>
          <p className="text-sm text-gray-500 mt-2">別のキーワードやジャンルを試してみてください。</p>
        </div>
      )}

      {/* お気に入りタブが空の場合 */}
      {activeTab === 'favorites' && favorites.length === 0 && (
        <div className="text-center text-gray-500 my-16">
          <p className="text-lg">お気に入りに登録された映画はまだありません。</p>
          <p className="text-sm text-gray-600 mt-2">検索画面のハートマークを押して追加してみましょう！</p>
        </div>
      )}

      {/* 映画一覧グリッド */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {displayMovies.map((movie) => {
          const favorited = isFavorite(movie.id);
          return (
            <div
              key={movie.id}
              onClick={() => setSelectedMovie(movie)}
              className="bg-gray-800 rounded-xl overflow-hidden shadow-lg cursor-pointer transform transition duration-300 hover:scale-105 hover:shadow-2xl relative group border border-gray-700/50"
            >
              <button
                onClick={(e) => toggleFavorite(movie, e)}
                className={`absolute top-3 right-3 z-10 p-2.5 rounded-full backdrop-blur-md transition shadow-md ${
                  favorited
                    ? 'bg-red-500 text-white scale-110'
                    : 'bg-black bg-opacity-60 text-gray-300 hover:text-white hover:bg-opacity-80'
                }`}
                title={favorited ? 'お気に入り解除' : 'お気に入りに追加'}
              >
                {favorited ? '❤️' : '🤍'}
              </button>

              {movie.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                  alt={movie.title}
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="w-full h-64 bg-gray-700 flex items-center justify-center text-gray-500 text-sm">
                  No Image
                </div>
              )}
              <div className="p-4">
                <h2 className="text-sm font-semibold truncate text-gray-100">{movie.title}</h2>
                <p className="text-xs text-gray-400 mt-1">公開日: {movie.release_date || '未定'}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ★ 2. ページネーション（ページャー）のUI */}
      {activeTab === 'search' && query.trim() && totalPages > 1 && !loading && (
        <div className="flex justify-center items-center gap-4 mt-12">
          <button
            onClick={() => {
              setPage((prev) => Math.max(prev - 1, 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl bg-gray-800 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700 transition shadow"
          >
            ← 前へ
          </button>
          
          <span className="text-sm text-gray-300">
            <strong className="text-white">{page}</strong> / {totalPages} ページ
          </span>

          <button
            onClick={() => {
              setPage((prev) => Math.min(prev + 1, totalPages));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl bg-gray-800 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700 transition shadow"
          >
            次へ →
          </button>
        </div>
      )}

      {/* 詳細モーダル */}
      {selectedMovie && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl max-w-lg w-full p-6 relative border border-gray-700 shadow-2xl animate-fadeIn">
            <button
              onClick={() => setSelectedMovie(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl font-bold w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center transition"
            >
              ✕
            </button>

            <div className="flex flex-col sm:flex-row gap-6">
              {selectedMovie.poster_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}`}
                  alt={selectedMovie.title}
                  className="w-36 h-52 object-cover rounded-xl shadow-md mx-auto sm:mx-0 flex-shrink-0"
                />
              )}
              <div className="flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">{selectedMovie.title}</h2>
                  <p className="text-xs text-gray-400 mb-1">公開日: {selectedMovie.release_date || '未定'}</p>
                  <p className="text-sm text-yellow-400 mb-3 font-semibold">
                    ⭐ 評価: {selectedMovie.vote_average ? selectedMovie.vote_average.toFixed(1) : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-300 leading-relaxed line-clamp-5">
                    {selectedMovie.overview || 'あらすじが登録されていません。'}
                  </p>
                </div>

                <button
                  onClick={(e) => toggleFavorite(selectedMovie, e)}
                  className={`mt-4 px-4 py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 shadow-md ${
                    isFavorite(selectedMovie.id)
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  {isFavorite(selectedMovie.id) ? '❤️ お気に入りから外す' : '🤍 お気に入りに追加する'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}