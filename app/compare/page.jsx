'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';

/* Helpers */
function N(v) {
  return String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}
function toTitle(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/(^|[\s_-])([a-zà-ú])/g, (_, p, c) => p + c.toUpperCase());
}

/** Junta vários datasets do /public/data com sanitização */
function mergeDatasets(list) {
  const admMap = new Map();
  const g
