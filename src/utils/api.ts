// src/utils/api.ts
import { MovieApiResponse } from '@/types/movie';

const BASE_URL = 'https://api.themoviedb.org/3';

// 映画をキーワード検索する関数
export async function searchMovies(query: string, page: number = 1): Promise<MovieApiResponse> {
  if (!query.trim()) {
    return { page: 1, results: [], total_pages: 0, total_results: 0 };
  }

  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  const res = await fetch(
    `${BASE_URL}/search/movie?api_key=${apiKey}&language=ja-JP&query=${encodeURIComponent(query)}&page=${page}`
  );

  if (!res.ok) {
    throw new Error('映画データの取得に失敗しました');
  }

  const data: MovieApiResponse = await res.json();
  return data;
}

// ★ 追加：今週のトレンド映画を取得する関数
export async function getTrendingMovies(): Promise<MovieApiResponse> {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  const res = await fetch(
    `${BASE_URL}/trending/movie/week?api_key=${apiKey}&language=ja-JP`
  );

  if (!res.ok) {
    throw new Error('トレンド映画データの取得に失敗しました');
  }

  const data: MovieApiResponse = await res.json();
  return data;
}

// 映画のジャンル一覧を取得する関数
export async function getGenres(): Promise<{ id: number; name: string }[]> {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  const res = await fetch(
    `${BASE_URL}/genre/movie/list?api_key=${apiKey}&language=ja-JP`
  );

  if (!res.ok) {
    throw new Error('ジャンルデータの取得に失敗しました');
  }

  const data = await res.json();
  return data.genres;
}
