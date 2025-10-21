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


export const CATEGORIES = [
"Todo",
"Electonica",
"Musica",
"Deportes",
"Entretenimiento",
"Servicios",
] as const;
export type Category = (typeof CATEGORIES)[number];