export type Item = {
id: string;
title: string;
author: string;
category: string;
buyNow: number;
sellerSales: number;
sellerRating: number;
stock: number;
};

// Paginación / filtros
export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
}
export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

// Respuestas de API
export interface ApiError {
  code: string;            // p.ej. 'VALIDATION_ERROR'
  message: string;
  details?: unknown;
}
export interface ApiResponse<T> {
  data: T;
  error?: ApiError;
}