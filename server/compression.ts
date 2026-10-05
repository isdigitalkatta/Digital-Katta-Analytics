import { Request, Response, NextFunction } from 'express';
import zlib from 'zlib';

/**
 * High-performance HTTP response compression middleware supporting Brotli ('br') and Gzip ('gzip').
 *
 * Why Brotli ('br')?
 * - Brotli provides 14-26% smaller file sizes than Gzip on JSON APIs, HTML, JS, and CSS bundles.
 * - Built natively into Node.js runtime (v11.7.0+) via `zlib.createBrotliCompress` — zero native compilation or npm bloat.
 * - Supported by 97%+ of modern web browsers (Chrome, Edge, Safari, Firefox).
 *
 * Why not raw zstd on Node.js?
 * - Zstandard ('zstd') requires native C++ binary dependencies (e.g., node-zstandard) which break cross-platform builds.
 * - Brotli is the accepted IETF web compression standard for HTTP Content-Encoding.
 */

// Content types that benefit significantly from compression
const COMPRESSIBLE_TYPES = /^(text\/|application\/json|application\/javascript|application\/xml|image\/svg\+xml)/i;

// Skip small payloads where compression overhead exceeds savings (< 1 KB)
const MIN_COMPRESSION_SIZE = 1024;

export function brotliGzipCompressionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  const supportsBrotli = /\bbr\b/.test(acceptEncoding);
  const supportsGzip = /\bgzip\b/.test(acceptEncoding);

  // If client doesn't accept br or gzip, proceed uncompressed
  if (!supportsBrotli && !supportsGzip) {
    return next();
  }

  // Always advertise that responses vary based on Accept-Encoding for CDN and browser caches
  res.setHeader('Vary', 'Accept-Encoding');

  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);

  let stream: zlib.BrotliCompress | zlib.Gzip | null = null;
  let encodingChosen: 'br' | 'gzip' | null = null;
  let isCompressionInitialized = false;

  function initCompression(chunk?: any, encoding?: BufferEncoding): boolean {
    if (isCompressionInitialized) return stream !== null;
    isCompressionInitialized = true;

    // Check if headers already sent or content-encoding already assigned
    if (res.headersSent || res.getHeader('Content-Encoding')) {
      return false;
    }

    const contentType = (res.getHeader('Content-Type') as string) || '';
    // Skip already compressed or non-textual formats (PDFs, images, archives)
    if (
      contentType.includes('application/pdf') ||
      contentType.includes('image/') ||
      contentType.includes('audio/') ||
      contentType.includes('video/') ||
      contentType.includes('font/')
    ) {
      return false;
    }

    // Prefer Brotli over Gzip when supported
    if (supportsBrotli) {
      encodingChosen = 'br';
      stream = zlib.createBrotliCompress({
        params: {
          [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
          // Quality 4 offers an optimal latency/compression balance for on-the-fly HTTP responses
          [zlib.constants.BROTLI_PARAM_QUALITY]: 4,
          [zlib.constants.BROTLI_PARAM_SIZE_HINT]: typeof chunk === 'string' ? Buffer.byteLength(chunk, encoding) : (chunk?.length || 0),
        },
      });
    } else if (supportsGzip) {
      encodingChosen = 'gzip';
      stream = zlib.createGzip({
        // Level 6 is the standard optimal balance for dynamic Gzip
        level: 6,
      });
    }

    if (stream && encodingChosen) {
      res.setHeader('Content-Encoding', encodingChosen);
      res.removeHeader('Content-Length'); // Content-length changes after compression

      stream.on('data', (compressedChunk: Buffer) => {
        originalWrite(compressedChunk);
      });

      stream.on('end', () => {
        originalEnd();
      });

      stream.on('error', (err) => {
        console.error(`[Compression error: ${encodingChosen}]`, err);
        originalEnd();
      });

      return true;
    }

    return false;
  }

  // Intercept res.write
  res.write = function (chunk: any, encodingOrCb?: any, cb?: any): boolean {
    if (!chunk) return true;

    if (!isCompressionInitialized) {
      initCompression(chunk, typeof encodingOrCb === 'string' ? (encodingOrCb as BufferEncoding) : undefined);
    }

    if (stream) {
      return stream.write(
        chunk,
        typeof encodingOrCb === 'string' ? (encodingOrCb as BufferEncoding) : undefined,
        typeof encodingOrCb === 'function' ? encodingOrCb : cb
      );
    }

    return originalWrite(chunk, encodingOrCb, cb);
  } as any;

  // Intercept res.end
  res.end = function (chunk?: any, encodingOrCb?: any, cb?: any): any {
    if (chunk) {
      if (!isCompressionInitialized) {
        initCompression(chunk, typeof encodingOrCb === 'string' ? (encodingOrCb as BufferEncoding) : undefined);
      }

      if (stream) {
        stream.end(
          chunk,
          typeof encodingOrCb === 'string' ? (encodingOrCb as BufferEncoding) : undefined,
          typeof encodingOrCb === 'function' ? encodingOrCb : cb
        );
        return res;
      }
    } else if (stream) {
      stream.end();
      return res;
    }

    return originalEnd(chunk, encodingOrCb, cb);
  } as any;

  next();
}
