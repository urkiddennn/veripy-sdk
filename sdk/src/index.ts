export type EmailDeliverability = 'deliverable' | 'risky' | 'undeliverable';

export interface VerifyResult {
  valid: boolean;
  email: string;
  results: {
    syntax: boolean;
    disposable: boolean;
    mx_records: boolean;
    mailbox: boolean;
  };
  score: number;
  timestamp: number;
  reason?: string;
  // High-level computed status helpers
  status: EmailDeliverability;
  isSafeToSend: boolean;
  isRisky: boolean;
  isDisposable: boolean;
}

export interface RateLimitOptions {
  enabled?: boolean;
  burst?: number;
  tokensPerMinute?: number;
}

export interface SpamDetectionOptions {
  enabled?: boolean;
  windowMs?: number;
  maxSimilarRequests?: number;
}

export interface VeripyConfig {
  spamDetection?: boolean | SpamDetectionOptions;
  rateLimit?: boolean | RateLimitOptions;
  timeoutMs?: number;
  retries?: number;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
}

export interface VerifyOptions {
  spamDetection?: boolean | SpamDetectionOptions;
  rateLimit?: boolean | RateLimitOptions;
  timeoutMs?: number;
  retries?: number;
  headers?: Record<string, string>;
}

export interface BatchVerifyOptions extends VerifyOptions {
  concurrency?: number;
}

export interface BatchVerifyItemResult {
  email: string;
  success: boolean;
  result?: VerifyResult;
  error?: Error;
}

export interface CsvVerifyOptions extends BatchVerifyOptions {
  emailColumn?: string;
  delimiter?: string;
  hasHeader?: boolean;
}

export interface CsvRowResult {
  [key: string]: any;
  veripy_valid: boolean;
  veripy_status: EmailDeliverability;
  veripy_score: number;
  veripy_disposable: boolean;
}

export interface CsvVerifyResult {
  csv: string;
  total: number;
  validCount: number;
  invalidCount: number;
  rows: CsvRowResult[];
}

export class VeripyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VeripyError';
  }
}

export class VeripyValidationError extends VeripyError {
  constructor(message: string = 'Invalid email format provided to SDK.') {
    super(`Veripy Error: ${message}`);
    this.name = 'VeripyValidationError';
  }
}

export class VeripyRateLimitError extends VeripyError {
  public readonly retryAfterMs: number;

  constructor(message: string, retryAfterMs: number = 0) {
    super(`Veripy Error: ${message}`);
    this.name = 'VeripyRateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

export class VeripySpamError extends VeripyError {
  constructor(message: string = 'Spam behavior detected. Too many highly similar requests locally.') {
    super(`Veripy Error: ${message}`);
    this.name = 'VeripySpamError';
  }
}

export class VeripyTimeoutError extends VeripyError {
  constructor(message: string = 'Request timed out.') {
    super(`Veripy Error: ${message}`);
    this.name = 'VeripyTimeoutError';
  }
}

export class VeripyApiError extends VeripyError {
  public readonly status: number;
  public readonly statusText: string;
  public readonly data?: any;

  constructor(status: number, statusText: string, data?: any) {
    const errorMsg = data?.error || data?.message || statusText;
    super(`Veripy API Error: ${status} - ${errorMsg}`);
    this.name = 'VeripyApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

function resolveRateLimit(opt?: boolean | RateLimitOptions): RateLimitOptions {
  if (opt === undefined) return { enabled: true, burst: 10, tokensPerMinute: 10 };
  if (typeof opt === "boolean") return { enabled: opt, burst: 10, tokensPerMinute: 10 };
  return {
    enabled: opt.enabled ?? true,
    burst: opt.burst ?? 10,
    tokensPerMinute: opt.tokensPerMinute ?? 10,
  };
}

function resolveSpamDetection(opt?: boolean | SpamDetectionOptions): SpamDetectionOptions {
  if (opt === undefined) return { enabled: true, windowMs: 60000, maxSimilarRequests: 3 };
  if (typeof opt === "boolean") return { enabled: opt, windowMs: 60000, maxSimilarRequests: 3 };
  return {
    enabled: opt.enabled ?? true,
    windowMs: opt.windowMs ?? 60000,
    maxSimilarRequests: opt.maxSimilarRequests ?? 3,
  };
}

function enrichResult(raw: any, email: string): VerifyResult {
  const score = typeof raw.score === 'number' ? raw.score : (raw.valid ? 0.9 : 0.0);
  const isValid = Boolean(raw.valid);
  const hasMx = raw.results?.mx_records !== false;

  // Resilient check: valid high-score emails are never disposable
  const isDisposable =
    raw.reason === 'disposable_email' ||
    (!isValid && (raw.results?.disposable === true || (raw.results?.disposable === false && score < 0.3)));

  let status: EmailDeliverability = 'undeliverable';
  if (isValid && score >= 0.8 && !isDisposable && hasMx) {
    status = 'deliverable';
  } else if (isValid && score >= 0.3) {
    status = 'risky';
  }

  return {
    valid: isValid,
    email,
    results: {
      syntax: Boolean(raw.results?.syntax ?? true),
      disposable: isDisposable,
      mx_records: hasMx,
      mailbox: Boolean(raw.results?.mailbox ?? true),
    },
    score,
    timestamp: raw.timestamp || Date.now(),
    reason: raw.reason,
    status,
    isSafeToSend: status === 'deliverable',
    isRisky: status === 'risky',
    isDisposable,
  };
}

// RFC 4180 simple CSV row parser
function parseCsvLine(line: string, delimiter: string = ','): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function escapeCsvCell(cell: any, delimiter: string = ','): string {
  const str = String(cell ?? '');
  if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const DEFAULT_URL =
  (typeof process !== "undefined"
    ? process.env?.VERIPY_URL ||
      process.env?.NEXT_PUBLIC_VERIPY_URL ||
      process.env?.VITE_VERIPY_URL
    : undefined) || "https://lovable-alpaca-951.eu-west-1.convex.site";

export class VeripyClient {
  private url: string;
  private apiKey: string;
  private globalConfig: VeripyConfig;

  // Local memory cache for spam detection
  private history: { email: string; timestamp: number }[] = [];

  // Local token bucket state
  private tokens: number;
  private lastRefill: number = Date.now();

  constructor(options: { url?: string; apiKey: string; config?: VeripyConfig }) {
    const url = options.url || DEFAULT_URL;

    if (!url) {
      throw new VeripyError(
        "VeripyClient requires a url. Please provide it in the options or set VERIPY_URL environment variable.",
      );
    }
    this.url = url;

    if (!options.apiKey) {
      throw new VeripyError("VeripyClient requires an apiKey.");
    }
    this.apiKey = options.apiKey;
    this.globalConfig = options.config || {};

    const initialRateLimit = resolveRateLimit(this.globalConfig.rateLimit);
    this.tokens = initialRateLimit.burst ?? 10;
  }

  private isSimilar(email1: string, email2: string): boolean {
    const parts1 = email1.toLowerCase().split("@");
    const parts2 = email2.toLowerCase().split("@");
    if (parts1.length !== 2 || parts2.length !== 2) return false;

    const [local1, domain1] = parts1;
    const [local2, domain2] = parts2;

    if (domain1 !== domain2) return false;
    if (local1 === local2) return true;

    const base1 = local1.replace(/\d+$/, "");
    const base2 = local2.replace(/\d+$/, "");

    if (base1.length > 0 && base1 === base2) {
      return true;
    }

    const plusBase1 = local1.split("+")[0];
    const plusBase2 = local2.split("+")[0];
    if (
      (local1.includes("+") || local2.includes("+")) &&
      plusBase1.length > 0 &&
      plusBase1 === plusBase2
    ) {
      return true;
    }

    return false;
  }

  private checkRateLimit(config: RateLimitOptions): void {
    const burst = config.burst ?? 10;
    const tokensPerMinute = config.tokensPerMinute ?? 10;
    const refillRatePerMs = tokensPerMinute / (60 * 1000);

    const now = Date.now();
    const timePassed = now - this.lastRefill;

    this.tokens = Math.min(burst, this.tokens + timePassed * refillRatePerMs);
    this.lastRefill = now;

    if (this.tokens < 1) {
      const waitMs = Math.ceil((1 - this.tokens) / refillRatePerMs);
      throw new VeripyRateLimitError(
        `Rate limit exceeded locally. Wait ${Math.ceil(waitMs / 1000)}s before retrying.`,
        waitMs,
      );
    }

    this.tokens -= 1;
  }

  private checkSpamDetection(email: string, config: SpamDetectionOptions): void {
    const windowMs = config.windowMs ?? 60000;
    const maxSimilar = config.maxSimilarRequests ?? 3;
    const now = Date.now();

    this.history = this.history.filter((req) => now - req.timestamp < windowMs);

    const similarCount = this.history.filter((req) => this.isSimilar(req.email, email)).length;

    if (similarCount >= maxSimilar) {
      throw new VeripySpamError(
        `Spam behavior detected. Exceeded limit of ${maxSimilar} similar requests within ${Math.ceil(windowMs / 1000)}s.`,
      );
    }

    this.history.push({ email, timestamp: now });
  }

  private async fetchWithRetry(
    email: string,
    options: {
      timeoutMs: number;
      retries: number;
      headers?: Record<string, string>;
      fetchFn: typeof fetch;
    },
  ): Promise<VerifyResult> {
    const { timeoutMs, retries, headers, fetchFn } = options;
    let attempt = 0;

    while (true) {
      let controller: AbortController | undefined;
      let timeoutId: any;

      if (timeoutMs > 0) {
        controller = new AbortController();
        timeoutId = setTimeout(() => controller!.abort(), timeoutMs);
      }

      try {
        const response = await fetchFn(`${this.url}/v1/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.apiKey,
            ...headers,
          },
          body: JSON.stringify({ email }),
          signal: controller?.signal,
        });

        if (!response.ok) {
          const error = await response
            .json()
            .catch(() => ({ error: response.statusText }));

          const isRetryable =
            response.status === 429 || (response.status >= 500 && response.status < 600);

          if (isRetryable && attempt < retries) {
            attempt++;
            const retryHeader = response.headers?.get?.("Retry-After");
            const backoffMs = retryHeader
              ? Math.max(100, parseInt(retryHeader, 10) * 1000)
              : Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            await new Promise((r) => setTimeout(r, backoffMs));
            continue;
          }

          throw new VeripyApiError(response.status, response.statusText, error);
        }

        const raw = await response.json();
        return enrichResult(raw, email);
      } catch (err: any) {
        if (err.name === "AbortError" || controller?.signal?.aborted) {
          throw new VeripyTimeoutError(`Request timed out after ${timeoutMs}ms.`);
        }
        if (err instanceof VeripyError) {
          throw err;
        }
        if (attempt < retries) {
          attempt++;
          const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise((r) => setTimeout(r, backoffMs));
          continue;
        }
        throw new VeripyError(err?.message || "Network request failed");
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    }
  }

  /**
   * Verifies an email address.
   * @param email The email address to verify.
   * @param options Optional configuration to override settings for this call.
   * @returns A Promise resolving to the enriched verification result.
   */
  async verify(email: string, options?: VerifyOptions): Promise<VerifyResult> {
    const cleanEmail = email?.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new VeripyValidationError("Invalid email format provided to SDK.");
    }

    const rateLimitOpt = resolveRateLimit(
      options?.rateLimit !== undefined ? options.rateLimit : this.globalConfig.rateLimit,
    );
    if (rateLimitOpt.enabled) {
      this.checkRateLimit(rateLimitOpt);
    }

    const spamOpt = resolveSpamDetection(
      options?.spamDetection !== undefined
        ? options.spamDetection
        : this.globalConfig.spamDetection,
    );
    if (spamOpt.enabled) {
      this.checkSpamDetection(cleanEmail, spamOpt);
    }

    const timeoutMs = options?.timeoutMs ?? this.globalConfig.timeoutMs ?? 10000;
    const retries = options?.retries ?? this.globalConfig.retries ?? 0;
    const headers = { ...this.globalConfig.headers, ...options?.headers };
    const fetchFn = this.globalConfig.fetch || globalThis.fetch;

    return this.fetchWithRetry(cleanEmail, {
      timeoutMs,
      retries,
      headers,
      fetchFn,
    });
  }

  /**
   * Verifies an array of emails concurrently with bounded worker pool.
   * @param emails Array of email addresses to verify.
   * @param options Configuration options including concurrency.
   * @returns Array of results for each email.
   */
  async verifyBatch(
    emails: string[],
    options?: BatchVerifyOptions,
  ): Promise<BatchVerifyItemResult[]> {
    const concurrency = Math.max(1, options?.concurrency ?? 5);
    const results: BatchVerifyItemResult[] = new Array(emails.length);
    let currentIndex = 0;

    const worker = async () => {
      while (currentIndex < emails.length) {
        const index = currentIndex++;
        const email = emails[index];
        try {
          const res = await this.verify(email, options);
          results[index] = { email, success: true, result: res };
        } catch (err: any) {
          results[index] = { email, success: false, error: err };
        }
      }
    };

    const workerCount = Math.min(concurrency, emails.length);
    const workers = Array.from({ length: workerCount }, () => worker());
    await Promise.all(workers);

    return results;
  }

  /**
   * Parses CSV string, verifies email column concurrently, and returns enriched CSV.
   *
   * @param csvContent Raw CSV text
   * @param options CSV configuration (emailColumn, delimiter, concurrency)
   * @returns Result with generated CSV string and row-by-row metrics
   */
  async verifyCsv(
    csvContent: string,
    options?: CsvVerifyOptions,
  ): Promise<CsvVerifyResult> {
    const delimiter = options?.delimiter ?? ',';
    const hasHeader = options?.hasHeader ?? true;
    const rawLines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);

    if (rawLines.length === 0) {
      return { csv: '', total: 0, validCount: 0, invalidCount: 0, rows: [] };
    }

    const firstLineValues = parseCsvLine(rawLines[0], delimiter);
    let emailColIndex = -1;
    let headers: string[] = [];
    let dataStartIdx = 0;

    if (hasHeader) {
      headers = firstLineValues;
      const targetCol = (options?.emailColumn || 'email').toLowerCase();
      emailColIndex = headers.findIndex((h) => h.toLowerCase() === targetCol);
      dataStartIdx = 1;
    }

    // Auto-detect email column if not matched
    if (emailColIndex === -1) {
      const sample = parseCsvLine(rawLines[dataStartIdx] || rawLines[0], delimiter);
      emailColIndex = sample.findIndex((val) => val.includes('@'));
      if (emailColIndex === -1) emailColIndex = 0;
    }

    if (!hasHeader) {
      headers = Array.from({ length: firstLineValues.length }, (_, i) => `col_${i + 1}`);
    }

    const dataLines = rawLines.slice(dataStartIdx);
    const parsedRows = dataLines.map((line) => parseCsvLine(line, delimiter));
    const emailsToVerify = parsedRows.map((cols) => cols[emailColIndex] || '');

    const batchResults = await this.verifyBatch(emailsToVerify, options);

    let validCount = 0;
    let invalidCount = 0;

    const rows: CsvRowResult[] = [];
    const outputLines: string[] = [];

    // Header line
    const outputHeaders = [
      ...headers,
      'veripy_valid',
      'veripy_status',
      'veripy_score',
      'veripy_disposable',
    ];
    outputLines.push(outputHeaders.map((h) => escapeCsvCell(h, delimiter)).join(delimiter));

    for (let i = 0; i < parsedRows.length; i++) {
      const cols = parsedRows[i];
      const batchItem = batchResults[i];
      const res = batchItem.result;

      const isValid = Boolean(res?.valid);
      const status: EmailDeliverability = res?.status || 'undeliverable';
      const score = res?.score ?? 0;
      const isDisposable = Boolean(res?.isDisposable);

      if (isValid) {
        validCount++;
      } else {
        invalidCount++;
      }

      const rowObj: any = {};
      headers.forEach((h, idx) => {
        rowObj[h] = cols[idx] ?? '';
      });
      rowObj.veripy_valid = isValid;
      rowObj.veripy_status = status;
      rowObj.veripy_score = score;
      rowObj.veripy_disposable = isDisposable;
      rows.push(rowObj);

      const outputRowCells = [
        ...cols,
        isValid,
        status,
        score,
        isDisposable,
      ];
      outputLines.push(outputRowCells.map((c) => escapeCsvCell(c, delimiter)).join(delimiter));
    }

    return {
      csv: outputLines.join('\n'),
      total: parsedRows.length,
      validCount,
      invalidCount,
      rows,
    };
  }
}

export default VeripyClient;
