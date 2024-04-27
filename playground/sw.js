function isCacheable(request) {

    return request.method === 'GET' && (request.mode === 'cors' || new URL(request.url).origin === self.origin)
}

self.addEventListener('install', async (event) => {

    event.waitUntil(async () => {

        await clients.claim();
    });
})

self.addEventListener('fetch', async (event) => {

    event.respondWith(
        (async () => {

        // console.debug(event.request);

        const cache = await caches.open('css-parser-playground');

        if (!isCacheable(event.request)) return fetch(event.request);

        let response = await cache.match(event.request);

        console.debug(response);

        if (response != null) {

            return response;
        }

        response = await fetch(event.request);

        console.debug(response);

        if (response == null || !response.ok) {

            return fetch(event.request)
        }

        console.debug(response.headers.get('Content-Type'));

        if (response.ok && response.headers.get('Content-Type')?.includes('text/css')) {

            await cache.put(event.request, response.clone());
        }

        return response.ok ? response : fetch(event.request);

        // return fetch(event.request)
    })()
    )
})