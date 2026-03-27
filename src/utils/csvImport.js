import Papa from 'papaparse';
import { autoCategorize } from './categorize.js';

const REQUIRED_COLUMNS = ['date', 'description', 'amount'];

const ALIAS_GROUPS = {
  amount: ['amount', 'amt', 'value', 'transaction amount', 'amount inr', 'amount rs', 'debit amount', 'credit amount'],
  description: ['description', 'desc', 'narration', 'particulars', 'remarks', 'transaction details', 'details', 'name'],
  date: ['date', 'transaction date', 'txn date', 'value date', 'posted date', 'transactiondate', 'txn date time'],
  type: ['type', 'dr cr', 'debit credit', 'credit debit', 'txn type', 'transaction type', 'nature']
};

const normalizeKey = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/^\uFEFF/, '')
  .replace(/[\s_.-]+/g, ' ')
  .replace(/[^a-z0-9 ]/g, '')
  .trim();

const sanitize = (value) => String(value || '')
  .replace(/[<>]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const buildColumnMap = (headers) => {
  const sourceHeaders = headers.filter(Boolean);
  const normalizedToOriginal = new Map(sourceHeaders.map((header) => [normalizeKey(header), header]));

  const findByAliases = (aliases) => {
    for (const alias of aliases) {
      const directMatch = normalizedToOriginal.get(normalizeKey(alias));
      if (directMatch) return directMatch;
    }

    for (const header of sourceHeaders) {
      const normalizedHeader = normalizeKey(header);
      const hasNearMatch = aliases.some((alias) => {
        const normalizedAlias = normalizeKey(alias);
        return normalizedHeader.includes(normalizedAlias) || normalizedAlias.includes(normalizedHeader);
      });

      if (hasNearMatch) return header;
    }

    return null;
  };

  return {
    amount: findByAliases(ALIAS_GROUPS.amount),
    description: findByAliases(ALIAS_GROUPS.description),
    date: findByAliases(ALIAS_GROUPS.date),
    type: findByAliases(ALIAS_GROUPS.type)
  };
};

const parseAmount = (rawAmount) => {
  const source = String(rawAmount ?? '').trim();
  if (!source) return NaN;

  let cleaned = source
    .replace(/\s/g, '')
    .replace(/[₹$€£¥]/g, '')
    .replace(/[^0-9,.-]/g, '');

  if (!cleaned || cleaned === '-' || cleaned === '.' || cleaned === ',') return NaN;

  const sign = cleaned.includes('-') ? -1 : 1;
  cleaned = cleaned.replace(/-/g, '');

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  let normalized;

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = cleaned.replace(/,/g, '');
    }
  } else if (lastComma !== -1) {
    const decimals = cleaned.length - lastComma - 1;
    normalized = decimals > 0 && decimals <= 2
      ? cleaned.replace(/\./g, '').replace(',', '.')
      : cleaned.replace(/,/g, '');
  } else if (lastDot !== -1) {
    const decimals = cleaned.length - lastDot - 1;
    normalized = decimals > 2 ? cleaned.replace(/\./g, '') : cleaned;
  } else {
    normalized = cleaned;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed * sign : NaN;
};

const isValidDayMonth = (day, month) => day >= 1 && day <= 31 && month >= 1 && month <= 12;

const detectDatePreference = (rows, dateKey) => {
  let dmyScore = 0;
  let mdyScore = 0;

  for (let i = 0; i < rows.length && i < 200; i += 1) {
    const value = String(rows[i]?.[dateKey] ?? '').trim();
    const match = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
    if (!match) continue;

    const first = Number.parseInt(match[1], 10);
    const second = Number.parseInt(match[2], 10);

    if (first > 12 && second <= 12) dmyScore += 2;
    if (second > 12 && first <= 12) mdyScore += 2;

    if (first <= 12 && second <= 12) {
      dmyScore += 1;
      mdyScore += 1;
    }
  }

  return dmyScore >= mdyScore ? 'DMY' : 'MDY';
};

const parseDateToIso = (rawDate, datePreference) => {
  const value = String(rawDate ?? '').trim();
  if (!value) return null;

  const isoLike = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoLike) {
    const y = Number.parseInt(isoLike[1], 10);
    const m = Number.parseInt(isoLike[2], 10);
    const d = Number.parseInt(isoLike[3], 10);
    if (!isValidDayMonth(d, m)) return null;
    const dt = new Date(Date.UTC(y, m - 1, d));
    return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
  }

  const sepDate = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (sepDate) {
    const first = Number.parseInt(sepDate[1], 10);
    const second = Number.parseInt(sepDate[2], 10);
    let year = Number.parseInt(sepDate[3], 10);
    if (year < 100) year += 2000;

    let day;
    let month;

    if (first > 12 && second <= 12) {
      day = first;
      month = second;
    } else if (second > 12 && first <= 12) {
      day = second;
      month = first;
    } else if (datePreference === 'MDY') {
      month = first;
      day = second;
    } else {
      day = first;
      month = second;
    }

    if (!isValidDayMonth(day, month)) return null;
    const dt = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())).toISOString();
};

const inferType = (rawType, rawDescription, signedAmount) => {
  const typeValue = String(rawType ?? '').toLowerCase();
  const description = String(rawDescription ?? '').toLowerCase();

  if (typeValue) {
    if (/(^|\b)(cr|credit|income)(\b|$)/.test(typeValue)) return 'income';
    if (/(^|\b)(dr|debit|expense)(\b|$)/.test(typeValue)) return 'expense';
  }

  if (signedAmount < 0) return 'expense';
  if (/salary|bonus|refund|interest|freelance|income|credit/.test(description)) return 'income';
  return 'expense';
};

export const parseCsvText = (csvText) => {
  const normalizedContent = String(csvText || '')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .trim();

  if (!normalizedContent) {
    return Promise.reject(new Error('CSV input is empty.'));
  }

  return new Promise((resolve, reject) => {
    Papa.parse(normalizedContent, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => String(header || '').replace(/^\uFEFF/, '').trim(),
      complete: (results) => {
        const rows = Array.isArray(results.data) ? results.data : [];
        if (results.errors.length > 0 && rows.length === 0) {
          reject(new Error('Failed to parse CSV. Check file formatting and delimiters.'));
          return;
        }

        if (rows.length === 0) {
          reject(new Error('No rows found in CSV input.'));
          return;
        }

        resolve(rows);
      },
      error: (error) => reject(error)
    });
  });
};

export const normalizeCsvTransactions = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('No data found in the CSV.');
  }

  const firstRow = rows.find((row) => row && Object.keys(row).length > 0);
  if (!firstRow) {
    throw new Error('CSV headers were not detected. Ensure first row contains column names.');
  }

  const headers = Object.keys(firstRow).filter(Boolean);
  const columnMap = buildColumnMap(headers);

  if (!REQUIRED_COLUMNS.every((name) => Boolean(columnMap[name]))) {
    throw new Error(`Missing required columns. Found: ${headers.join(', ')}. Expected: Date, Description, Amount.`);
  }

  const datePreference = detectDatePreference(rows, columnMap.date);
  const seenKeys = new Set();

  const output = [];
  const errors = [];
  let duplicateRows = 0;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];

    const rawDate = row[columnMap.date];
    const rawDescription = row[columnMap.description];
    const rawAmount = row[columnMap.amount];
    const rawType = columnMap.type ? row[columnMap.type] : '';

    const signedAmount = parseAmount(rawAmount);
    const dateIso = parseDateToIso(rawDate, datePreference);
    const description = sanitize(rawDescription || 'Imported Transaction');

    if (!Number.isFinite(signedAmount) || signedAmount === 0) {
      errors.push(`Row ${index + 2}: invalid amount "${rawAmount ?? ''}"`);
      continue;
    }

    if (!dateIso) {
      errors.push(`Row ${index + 2}: invalid date "${rawDate ?? ''}"`);
      continue;
    }

    if (!description) {
      errors.push(`Row ${index + 2}: description is empty`);
      continue;
    }

    const type = inferType(rawType, description, signedAmount);
    const amount = Math.abs(signedAmount);

    const dedupeKey = `${dateIso}|${amount.toFixed(2)}|${description.toLowerCase()}|${type}`;
    if (seenKeys.has(dedupeKey)) {
      duplicateRows += 1;
      continue;
    }
    seenKeys.add(dedupeKey);

    const { category, icon } = autoCategorize(description);

    output.push({
      amount,
      category: category || 'Miscellaneous',
      description,
      icon: icon || 'more-horizontal',
      date: dateIso,
      type,
      status: 'Completed'
    });
  }

  if (output.length === 0) {
    throw new Error('No valid transactions found after processing. Check date and amount columns.');
  }

  return {
    transactions: output,
    summary: {
      totalRows: rows.length,
      validRows: output.length,
      skippedRows: rows.length - output.length,
      duplicateRows,
      errors: errors.slice(0, 8)
    }
  };
};
