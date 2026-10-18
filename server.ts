import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';
import { SSR_LANG } from './src/i18n/language.service';
import { DEFAULT_LANG, LANG_COOKIE, Lang, isLang, readCookie } from './src/i18n/languages';

function requestLang(cookieHeader: string | undefined): Lang {
  const lang = readCookie(cookieHeader, LANG_COOKIE);
  return isLang(lang) ? lang : DEFAULT_LANG;
}

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });
  // Serve static files from /browser
  server.get('*.*', express.static(browserDistFolder, {
    maxAge: '1y'
  }));

  // All regular routes use the Angular engine
  server.get('*', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;
    const lang = requestLang(headers.cookie);
    // Prerendered (SSG) pages are French. CommonEngine serves them whenever publicPath is set,
    // so other languages drop it to force a real render (critical-CSS inlining needs it too).
    const isDefaultLang = lang === DEFAULT_LANG;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: isDefaultLang ? browserDistFolder : undefined,
        inlineCriticalCss: isDefaultLang ? undefined : false,
        providers: [
          { provide: APP_BASE_HREF, useValue: baseUrl },
          { provide: SSR_LANG, useValue: lang },
        ],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });

  return server;
}

function run(): void {
  // Deliberately not `PORT`: on Cloud Run that variable is injected into
  // every process in the container and set to whatever port nginx (the
  // container's public entrypoint) is expected to listen on, so reusing it
  // here would make this internal Node server race nginx for the same port.
  const port = process.env['SSR_PORT'] || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
