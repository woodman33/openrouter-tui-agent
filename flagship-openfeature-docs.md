@cloudflare/flagship
npm version npm downloads license

OpenFeature-compliant provider SDK for Flagship, Cloudflare's globally distributed, low-latency feature flag platform.

Server-side (Node.js, Cloudflare Workers) and client-side (browser) support via isolated sub-path exports. Tree-shakeable — importing @cloudflare/flagship/server never loads @openfeature/web-sdk and vice versa.

Install

Server-side (Node.js, Cloudflare Workers):

npm install @cloudflare/flagship @openfeature/server-sdk
Client-side (browser):

npm install @cloudflare/flagship @openfeature/web-sdk
Quick start — server

import { OpenFeature } from '@openfeature/server-sdk';
import { FlagshipServerProvider } from '@cloudflare/flagship/server';

await OpenFeature.setProviderAndWait(
  new FlagshipServerProvider({ appId: 'your-app-id', accountId: 'your-account-id', authToken: 'your-token' }),
);

const client = OpenFeature.getClient();
const enabled = await client.getBooleanValue('dark-mode', false, { userId: 'user-123' });
Quick start — Cloudflare Workers

The recommended approach for Cloudflare Workers. Uses a wrangler binding — no HTTP overhead, no auth tokens needed.

Configure in wrangler.json:

{
  "flagship": [{ "binding": "FLAGS", "app_id": "<your-app-id>" }]
}
import { OpenFeature } from '@openfeature/server-sdk';
import { FlagshipServerProvider } from '@cloudflare/flagship/server';
import type { FlagshipBinding } from '@cloudflare/flagship/server';

export default {
  async fetch(request: Request, env: { FLAGS: FlagshipBinding }): Promise<Response> {
    await OpenFeature.setProviderAndWait(new FlagshipServerProvider({ binding: env.FLAGS }));

    const client = OpenFeature.getClient();
    const darkMode = await client.getBooleanValue('dark-mode', false, {
      targetingKey: new URL(request.url).searchParams.get('userId') ?? 'anonymous',
    });

    return Response.json({ darkMode });
  },
};
Quick start — HTTP

For Workers without a Flagship binding, or non-Workers server environments:

import { OpenFeature } from '@openfeature/server-sdk';
import { FlagshipServerProvider } from '@cloudflare/flagship/server';

let initialized = false;

export default {
  async fetch(request: Request): Promise<Response> {
    if (!initialized) {
      await OpenFeature.setProviderAndWait(
        new FlagshipServerProvider({ appId: 'your-app-id', accountId: 'your-account-id', authToken: 'your-token' }),
      );
      initialized = true;
    }

    const client = OpenFeature.getClient();
    const darkMode = await client.getBooleanValue('dark-mode', false, {
      userId: new URL(request.url).searchParams.get('userId') ?? 'anonymous',
    });

    return Response.json({ darkMode });
  },
};
Quick start — browser

import { OpenFeature } from '@openfeature/web-sdk';
import { FlagshipClientProvider } from '@cloudflare/flagship/web';

await OpenFeature.setProviderAndWait(
  new FlagshipClientProvider({
    appId: 'your-app-id',
    accountId: 'your-account-id',
    authToken: 'your-token',
    prefetchFlags: ['dark-mode', 'welcome-message'],
  }),
);

await OpenFeature.setContext({ userId: 'user-123', plan: 'premium' });

const client = OpenFeature.getClient();
const darkMode = client.getBooleanValue('dark-mode', false);
Features

Feature	Description
OpenFeature compliant	Implements the CNCF OpenFeature specification
Workers binding	Native wrangler binding support — zero HTTP overhead, no auth tokens
Server + client	Async per-request (server) and sync cache-based (browser) providers
Server providers	FlagshipServerProvider works via HTTP or wrangler binding
All flag types	Boolean, string, number, and object (JSON)
Authentication	authToken option adds Authorization: Bearer to every request (HTTP only)
Logging	logging option surfaces fetch errors and cache misses (off by default)
Retries + timeouts	Configurable retry logic with AbortController-based timeouts (HTTP only)
Hooks	Built-in LoggingHook and TelemetryHook
Tree-shakeable	Server and client bundles are fully isolated
TypeScript	Strict types throughout
Packages

Export	Description	Peer dependency
@cloudflare/flagship	Core client, types, errors	None
@cloudflare/flagship/server	FlagshipServerProvider + hooks	@openfeature/server-sdk
@cloudflare/flagship/web	FlagshipClientProvider	@openfeature/web-sdk
Documentation

API reference
OpenFeature specification
Examples
Development

pnpm install         # install dependencies
pnpm run dev         # watch mode
pnpm run test        # run tests
pnpm run build       # build for distribution
Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change. See the repository for more details.

License

Apache-2.0
Readme
Keywords

openfeaturefeature-flagsflagshipprovide---
title: OpenFeature SDK
description: Use the @cloudflare/flagship OpenFeature SDK to evaluate Flagship feature flags from Workers, Node.js, or the browser.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/flagship/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# OpenFeature SDK

Evaluate Flagship feature flags from any JavaScript runtime using OpenFeature.

[OpenFeature ↗](https://openfeature.dev/) is the CNCF standard for feature flag interfaces. It provides a vendor-neutral API so you can switch between flag providers without changing evaluation code.

The [@cloudflare/flagship ↗](https://www.npmjs.com/package/@cloudflare/flagship) package is an OpenFeature-compatible SDK for evaluating Flagship feature flags. The source code is available on [GitHub ↗](https://github.com/cloudflare/flagship).

The SDK includes two providers:

* **FlagshipServerProvider** — For server-side runtimes such as [Cloudflare Workers](https://developers.cloudflare.com/workers/), Node.js, and other server-side JavaScript environments. Each evaluation call makes an asynchronous request to the Flagship evaluation endpoint.
* **FlagshipClientProvider** — For browser applications. Pre-fetches all flag values on initialization and evaluates synchronously from an in-memory cache.

Note

If you are running inside a Cloudflare Worker, the [binding](https://developers.cloudflare.com/flagship/binding/) is the recommended approach because it avoids HTTP overhead. You can also [pass the binding to the OpenFeature SDK](https://developers.cloudflare.com/flagship/sdk/server-provider/) to get the best of both. Use the SDK without a binding when running in non-Worker runtimes like Node.js or the browser.

## Installation

For server-side usage:

 npm  yarn  pnpm  bun 

```
npm i @cloudflare/flagship @openfeature/server-sdk
```

```
yarn add @cloudflare/flagship @openfeature/server-sdk
```

```
pnpm add @cloudflare/flagship @openfeature/server-sdk
```

```
bun add @cloudflare/flagship @openfeature/server-sdk
```

For browser usage:

 npm  yarn  pnpm  bun 

```
npm i @cloudflare/flagship @openfeature/web-sdk
```

```
yarn add @cloudflare/flagship @openfeature/web-sdk
```

```
pnpm add @cloudflare/flagship @openfeature/web-sdk
```

```
bun add @cloudflare/flagship @openfeature/web-sdk
```

## Next steps

* Set up the [server provider](https://developers.cloudflare.com/flagship/sdk/server-provider/) for Workers, Node.js, or other server-side runtimes.
* Set up the [client provider](https://developers.cloudflare.com/flagship/sdk/client-provider/) for browser applications.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/flagship/","name":"Flagship"}},{"@type":"ListItem","position":3,"item":{"@id":"/flagship/sdk/","name":"OpenFeature SDK"}}]}
```
---
title: Server provider
description: Set up the FlagshipServerProvider to evaluate feature flags from Workers, Node.js, or other server-side JavaScript runtimes using OpenFeature.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/flagship/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Server provider

The `FlagshipServerProvider` implements the OpenFeature server provider interface. The provider works in [Cloudflare Workers](https://developers.cloudflare.com/workers/), Node.js, and any server-side JavaScript runtime that supports the Fetch API.

Inside a Cloudflare Worker, you can pass the Flagship [binding](https://developers.cloudflare.com/flagship/binding/) directly to the provider. This avoids HTTP overhead and is the recommended approach. Outside of Workers, initialize the provider with an app ID and account ID — each evaluation call makes an HTTP request to the Flagship evaluation endpoint.

## Setup

* [ With binding ](#tab-panel-6499)
* [ With app ID ](#tab-panel-6500)

Pass the Flagship binding directly to the provider. This is the recommended approach inside a Worker.

* [  JavaScript ](#tab-panel-6497)
* [  TypeScript ](#tab-panel-6498)

JavaScript

```

import { OpenFeature } from "@openfeature/server-sdk";

import { FlagshipServerProvider } from "@cloudflare/flagship";


export default {

  async fetch(request, env) {

    await OpenFeature.setProviderAndWait(

      new FlagshipServerProvider({ binding: env.FLAGS }),

    );


    const client = OpenFeature.getClient();


    const showNewCheckout = await client.getBooleanValue(

      "new-checkout",

      false,

      { targetingKey: "user-42", plan: "enterprise" },

    );


    if (showNewCheckout) {

      return new Response("New checkout enabled!");

    }


    return new Response("Standard checkout.");

  },

};


```

TypeScript

```

import { OpenFeature } from "@openfeature/server-sdk";

import { FlagshipServerProvider } from "@cloudflare/flagship";


export default {

  async fetch(request: Request, env: Env): Promise<Response> {

    await OpenFeature.setProviderAndWait(

      new FlagshipServerProvider({ binding: env.FLAGS }),

    );


    const client = OpenFeature.getClient();


    const showNewCheckout = await client.getBooleanValue(

      "new-checkout",

      false,

      { targetingKey: "user-42", plan: "enterprise" },

    );


    if (showNewCheckout) {

      return new Response("New checkout enabled!");

    }


    return new Response("Standard checkout.");

  },

};


```

Use an app ID, account ID, and an API token when running outside of a Worker (for example, in Node.js). The provider makes HTTP requests to the Flagship evaluation endpoint. Generate an [API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) from your Cloudflare account with Flagship read permissions.

* [  JavaScript ](#tab-panel-6493)
* [  TypeScript ](#tab-panel-6494)

JavaScript

```

import { OpenFeature } from "@openfeature/server-sdk";

import { FlagshipServerProvider } from "@cloudflare/flagship";


await OpenFeature.setProviderAndWait(

  new FlagshipServerProvider({

    appId: "<APP_ID>",

    accountId: "<ACCOUNT_ID>",

    authToken: "<API_TOKEN>",

  }),

);


const client = OpenFeature.getClient();


const showNewCheckout = await client.getBooleanValue("new-checkout", false, {

  targetingKey: "user-42",

  plan: "enterprise",

});


```

TypeScript

```

import { OpenFeature } from "@openfeature/server-sdk";

import { FlagshipServerProvider } from "@cloudflare/flagship";


await OpenFeature.setProviderAndWait(

  new FlagshipServerProvider({

    appId: "<APP_ID>",

    accountId: "<ACCOUNT_ID>",

    authToken: "<API_TOKEN>",

  }),

);


const client = OpenFeature.getClient();


const showNewCheckout = await client.getBooleanValue("new-checkout", false, {

  targetingKey: "user-42",

  plan: "enterprise",

});


```

## Configuration options

| Option    | Type     | Required | Description                                                                                                                                                               |
| --------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| binding   | Flagship | No       | The Flagship binding from env.FLAGS. Use this inside a Worker for best performance. Authentication is handled automatically through the binding.                          |
| appId     | string   | No       | The Flagship app ID from the Cloudflare dashboard. Required when not using a binding.                                                                                     |
| accountId | string   | No       | Your Cloudflare account ID. Required when not using a binding.                                                                                                            |
| authToken | string   | No       | A Cloudflare [API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) with Flagship read permissions. Required when not using a binding. |

Provide either `binding` or `appId`, `accountId`, and `authToken`.

## Evaluation context

OpenFeature uses an evaluation context to pass user attributes to the flag provider. The `targetingKey` field is the primary user identifier.

Pass additional attributes alongside `targetingKey` to match [targeting rules](https://developers.cloudflare.com/flagship/targeting/). For example, you can include `plan`, `country`, or any custom attribute your rules reference.

* [  JavaScript ](#tab-panel-6489)
* [  TypeScript ](#tab-panel-6490)

JavaScript

```

const value = await client.getBooleanValue("new-checkout", false, {

  targetingKey: "user-42",

  plan: "enterprise",

  country: "US",

});


```

TypeScript

```

const value = await client.getBooleanValue("new-checkout", false, {

  targetingKey: "user-42",

  plan: "enterprise",

  country: "US",

});


```

## Available hooks

The SDK ships with two hooks that you can attach to the OpenFeature client.

* **LoggingHook** — Logs structured information for every evaluation.
* **TelemetryHook** — Captures timing and event data for observability.

* [  JavaScript ](#tab-panel-6491)
* [  TypeScript ](#tab-panel-6492)

JavaScript

```

import { LoggingHook, TelemetryHook } from "@cloudflare/flagship";


OpenFeature.addHooks(new LoggingHook(), new TelemetryHook());


```

TypeScript

```

import { LoggingHook, TelemetryHook } from "@cloudflare/flagship";


OpenFeature.addHooks(new LoggingHook(), new TelemetryHook());


```

## Migrate from another provider

If you use another OpenFeature-compatible provider (for example, LaunchDarkly or Flagsmith), switch to Flagship by replacing the provider initialization. No changes are needed at evaluation call sites.

* [  JavaScript ](#tab-panel-6495)
* [  TypeScript ](#tab-panel-6496)

JavaScript

```

// Before

await OpenFeature.setProviderAndWait(

  new LaunchDarklyProvider({ sdkKey: "..." }),

);


// After

await OpenFeature.setProviderAndWait(

  new FlagshipServerProvider({

    appId: "<APP_ID>",

    accountId: "<ACCOUNT_ID>",

    authToken: "<API_TOKEN>",

  }),

);


```

TypeScript

```

// Before

await OpenFeature.setProviderAndWait(

  new LaunchDarklyProvider({ sdkKey: "..." }),

);


// After

await OpenFeature.setProviderAndWait(

  new FlagshipServerProvider({

    appId: "<APP_ID>",

    accountId: "<ACCOUNT_ID>",

    authToken: "<API_TOKEN>",

  }),

);


```

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/flagship/","name":"Flagship"}},{"@type":"ListItem","position":3,"item":{"@id":"/flagship/sdk/","name":"OpenFeature SDK"}},{"@type":"ListItem","position":4,"item":{"@id":"/flagship/sdk/server-provider/","name":"Server provider"}}]}
```
---
title: Server provider
description: Set up the FlagshipServerProvider to evaluate feature flags from Workers, Node.js, or other server-side JavaScript runtimes using OpenFeature.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/flagship/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Server provider

The `FlagshipServerProvider` implements the OpenFeature server provider interface. The provider works in [Cloudflare Workers](https://developers.cloudflare.com/workers/), Node.js, and any server-side JavaScript runtime that supports the Fetch API.

Inside a Cloudflare Worker, you can pass the Flagship [binding](https://developers.cloudflare.com/flagship/binding/) directly to the provider. This avoids HTTP overhead and is the recommended approach. Outside of Workers, initialize the provider with an app ID and account ID — each evaluation call makes an HTTP request to the Flagship evaluation endpoint.

## Setup

* [ With binding ](#tab-panel-6499)
* [ With app ID ](#tab-panel-6500)

Pass the Flagship binding directly to the provider. This is the recommended approach inside a Worker.

* [  JavaScript ](#tab-panel-6497)
* [  TypeScript ](#tab-panel-6498)

JavaScript

```

import { OpenFeature } from "@openfeature/server-sdk";

import { FlagshipServerProvider } from "@cloudflare/flagship";


export default {

  async fetch(request, env) {

    await OpenFeature.setProviderAndWait(

      new FlagshipServerProvider({ binding: env.FLAGS }),

    );


    const client = OpenFeature.getClient();


    const showNewCheckout = await client.getBooleanValue(

      "new-checkout",

      false,

      { targetingKey: "user-42", plan: "enterprise" },

    );


    if (showNewCheckout) {

      return new Response("New checkout enabled!");

    }


    return new Response("Standard checkout.");

  },

};


```

TypeScript

```

import { OpenFeature } from "@openfeature/server-sdk";

import { FlagshipServerProvider } from "@cloudflare/flagship";


export default {

  async fetch(request: Request, env: Env): Promise<Response> {

    await OpenFeature.setProviderAndWait(

      new FlagshipServerProvider({ binding: env.FLAGS }),

    );


    const client = OpenFeature.getClient();


    const showNewCheckout = await client.getBooleanValue(

      "new-checkout",

      false,

      { targetingKey: "user-42", plan: "enterprise" },

    );


    if (showNewCheckout) {

      return new Response("New checkout enabled!");

    }


    return new Response("Standard checkout.");

  },

};


```

Use an app ID, account ID, and an API token when running outside of a Worker (for example, in Node.js). The provider makes HTTP requests to the Flagship evaluation endpoint. Generate an [API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) from your Cloudflare account with Flagship read permissions.

* [  JavaScript ](#tab-panel-6493)
* [  TypeScript ](#tab-panel-6494)

JavaScript

```

import { OpenFeature } from "@openfeature/server-sdk";

import { FlagshipServerProvider } from "@cloudflare/flagship";


await OpenFeature.setProviderAndWait(

  new FlagshipServerProvider({

    appId: "<APP_ID>",

    accountId: "<ACCOUNT_ID>",

    authToken: "<API_TOKEN>",

  }),

);


const client = OpenFeature.getClient();


const showNewCheckout = await client.getBooleanValue("new-checkout", false, {

  targetingKey: "user-42",

  plan: "enterprise",

});


```

TypeScript

```

import { OpenFeature } from "@openfeature/server-sdk";

import { FlagshipServerProvider } from "@cloudflare/flagship";


await OpenFeature.setProviderAndWait(

  new FlagshipServerProvider({

    appId: "<APP_ID>",

    accountId: "<ACCOUNT_ID>",

    authToken: "<API_TOKEN>",

  }),

);


const client = OpenFeature.getClient();


const showNewCheckout = await client.getBooleanValue("new-checkout", false, {

  targetingKey: "user-42",

  plan: "enterprise",

});


```

## Configuration options

| Option    | Type     | Required | Description                                                                                                                                                               |
| --------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| binding   | Flagship | No       | The Flagship binding from env.FLAGS. Use this inside a Worker for best performance. Authentication is handled automatically through the binding.                          |
| appId     | string   | No       | The Flagship app ID from the Cloudflare dashboard. Required when not using a binding.                                                                                     |
| accountId | string   | No       | Your Cloudflare account ID. Required when not using a binding.                                                                                                            |
| authToken | string   | No       | A Cloudflare [API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) with Flagship read permissions. Required when not using a binding. |

Provide either `binding` or `appId`, `accountId`, and `authToken`.

## Evaluation context

OpenFeature uses an evaluation context to pass user attributes to the flag provider. The `targetingKey` field is the primary user identifier.

Pass additional attributes alongside `targetingKey` to match [targeting rules](https://developers.cloudflare.com/flagship/targeting/). For example, you can include `plan`, `country`, or any custom attribute your rules reference.

* [  JavaScript ](#tab-panel-6489)
* [  TypeScript ](#tab-panel-6490)

JavaScript

```

const value = await client.getBooleanValue("new-checkout", false, {

  targetingKey: "user-42",

  plan: "enterprise",

  country: "US",

});


```

TypeScript

```

const value = await client.getBooleanValue("new-checkout", false, {

  targetingKey: "user-42",

  plan: "enterprise",

  country: "US",

});


```

## Available hooks

The SDK ships with two hooks that you can attach to the OpenFeature client.

* **LoggingHook** — Logs structured information for every evaluation.
* **TelemetryHook** — Captures timing and event data for observability.

* [  JavaScript ](#tab-panel-6491)
* [  TypeScript ](#tab-panel-6492)

JavaScript

```

import { LoggingHook, TelemetryHook } from "@cloudflare/flagship";


OpenFeature.addHooks(new LoggingHook(), new TelemetryHook());


```

TypeScript

```

import { LoggingHook, TelemetryHook } from "@cloudflare/flagship";


OpenFeature.addHooks(new LoggingHook(), new TelemetryHook());


```

## Migrate from another provider

If you use another OpenFeature-compatible provider (for example, LaunchDarkly or Flagsmith), switch to Flagship by replacing the provider initialization. No changes are needed at evaluation call sites.

* [  JavaScript ](#tab-panel-6495)
* [  TypeScript ](#tab-panel-6496)

JavaScript

```

// Before

await OpenFeature.setProviderAndWait(

  new LaunchDarklyProvider({ sdkKey: "..." }),

);


// After

await OpenFeature.setProviderAndWait(

  new FlagshipServerProvider({

    appId: "<APP_ID>",

    accountId: "<ACCOUNT_ID>",

    authToken: "<API_TOKEN>",

  }),

);


```

TypeScript

```

// Before

await OpenFeature.setProviderAndWait(

  new LaunchDarklyProvider({ sdkKey: "..." }),

);


// After

await OpenFeature.setProviderAndWait(

  new FlagshipServerProvider({

    appId: "<APP_ID>",

    accountId: "<ACCOUNT_ID>",

    authToken: "<API_TOKEN>",

  }),

);


```

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/flagship/","name":"Flagship"}},{"@type":"ListItem","position":3,"item":{"@id":"/flagship/sdk/","name":"OpenFeature SDK"}},{"@type":"ListItem","position":4,"item":{"@id":"/flagship/sdk/server-provider/","name":"Server provider"}}]}
```
---
title: Client provider
description: Set up the FlagshipClientProvider to evaluate feature flags synchronously in browser applications using the OpenFeature web SDK.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/flagship/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Client provider

The `FlagshipClientProvider` implements the OpenFeature web provider interface for browser applications. It pre-fetches a declared set of flag values on initialization and resolves evaluations synchronously from an in-memory cache.

This makes the provider suitable for client-side rendering where synchronous access to flag values is required.

Important

The client provider requires an API token to fetch flag values. This token is not scoped to a single app, so anyone with the token can **evaluate flags** across all apps in your account. Use the client provider with caution in public-facing applications.

## prefetchFlags

`prefetchFlags` is a required array of flag keys that the provider fetches during initialization and on every context change. Only flags listed in this array are available for synchronous evaluation — any flag key not included returns a `FLAG_NOT_FOUND` error at resolution time.

**Fetch behavior:**

* **On initialization** — all flags in `prefetchFlags` are fetched in parallel and stored in an in-memory cache. The provider transitions to `READY` once all fetches complete (individual failures are non-fatal).
* **On context change** — the cache is invalidated and all flags are re-fetched for the new context. This is required by the [static context paradigm ↗](https://openfeature.dev/specification/glossary/#static-context-paradigm) used by the OpenFeature web SDK, where context is set globally and providers are expected to re-evaluate when it changes.
* **At resolution time** — evaluations are served synchronously from the cache. No network request is made during `getBooleanValue`, `getStringValue`, etc.

## Setup

The following example initializes the provider with a set of pre-fetched flags and evaluates them in a browser application.

* [  JavaScript ](#tab-panel-6487)
* [  TypeScript ](#tab-panel-6488)

JavaScript

```

import { OpenFeature } from "@openfeature/web-sdk";

import { FlagshipClientProvider } from "@cloudflare/flagship";


await OpenFeature.setProviderAndWait(

  new FlagshipClientProvider({

    appId: "<APP_ID>",

    accountId: "<ACCOUNT_ID>",

    authToken: "<API_TOKEN>",

    prefetchFlags: ["promo-banner", "dark-mode", "max-uploads"],

  }),

);


// Set evaluation context globally. The provider re-fetches all prefetchFlags

// whenever the context changes.

await OpenFeature.setContext({ targetingKey: "user-42", plan: "enterprise" });


const client = OpenFeature.getClient();


// Synchronous — served from the in-memory cache.

const showBanner = client.getBooleanValue("promo-banner", false);


if (showBanner) {

  document.getElementById("banner").style.display = "block";

}


```

TypeScript

```

import { OpenFeature } from "@openfeature/web-sdk";

import { FlagshipClientProvider } from "@cloudflare/flagship";


await OpenFeature.setProviderAndWait(

  new FlagshipClientProvider({

    appId: "<APP_ID>",

    accountId: "<ACCOUNT_ID>",

    authToken: "<API_TOKEN>",

    prefetchFlags: ["promo-banner", "dark-mode", "max-uploads"],

  }),

);


// Set evaluation context globally. The provider re-fetches all prefetchFlags

// whenever the context changes.

await OpenFeature.setContext({ targetingKey: "user-42", plan: "enterprise" });


const client = OpenFeature.getClient();


// Synchronous — served from the in-memory cache.

const showBanner = client.getBooleanValue("promo-banner", false);


if (showBanner) {

  document.getElementById("banner").style.display = "block";

}


```

Note

`getBooleanValue` on the client provider is synchronous and does not require `await`, unlike the [server provider](https://developers.cloudflare.com/flagship/sdk/server-provider/).

## Configuration options

| Option        | Type       | Required | Description                                                                                                                            |
| ------------- | ---------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| appId         | string     | Yes      | The Flagship app ID from the Cloudflare dashboard.                                                                                     |
| accountId     | string     | Yes      | Your Cloudflare account ID.                                                                                                            |
| authToken     | string     | Yes      | A Cloudflare [API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) with Flagship read permissions. |
| prefetchFlags | string\[\] | Yes      | Flag keys to fetch on initialization and on every context change. Flags not in this list return FLAG\_NOT\_FOUND at evaluation time.   |

## When to use the client provider

Use the client provider in browser applications, single-page apps, or any client-side JavaScript environment.

Evaluations are synchronous, so they do not block rendering. Flag values are fetched once during initialization and re-fetched whenever the evaluation context changes. To force a refresh, update the context via `OpenFeature.setContext(...)`.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/flagship/","name":"Flagship"}},{"@type":"ListItem","position":3,"item":{"@id":"/flagship/sdk/","name":"OpenFeature SDK"}},{"@type":"ListItem","position":4,"item":{"@id":"/flagship/sdk/client-provider/","name":"Client provider"}}]}
```
---
title: Targeting rules
description: Serve different Flagship flag values to different users based on attributes, conditions, and logical grouping.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/flagship/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Targeting rules

Targeting rules let you serve different flag values to different users based on their attributes. Each flag can have zero or more rules.

Rules are evaluated in sequential order, from top to bottom. The first rule whose conditions match is used, and its configured variation is returned. If no rule matches, Flagship returns the flag's default variation.

When a flag is disabled, the default variation is always returned regardless of rules.

## How rules work

A rule consists of:

* **Conditions** — One or more attribute comparisons that must be satisfied. For example, `country equals "US"` or `plan in ["enterprise", "business"]`.
* **Serve variation** — The variation to return when the rule matches.
* **Rollout** (optional) — A percentage-based gradual release. Only the specified percentage of matching users receive the rule's variation. The rest continue to the next rule.

## Condition structure

Each condition compares an attribute from the evaluation context against a value using an operator:

* **Attribute** — The context key to evaluate (for example, `userId`, `country`, `plan`).
* **Operator** — The comparison to perform. Flagship supports [11 operators](https://developers.cloudflare.com/flagship/targeting/operators/).
* **Value** — The value to compare against. Can be a string, number, or array depending on the operator.

## Logical grouping

Conditions within a rule can be grouped with `AND`/`OR` operators and nested up to six levels deep.

For example, to target enterprise users in the US or Canada:

* `AND`:  
   * `plan equals "enterprise"`  
   * `OR`:  
         * `country equals "US"`  
         * `country equals "CA"`

## Learn more

* [ Operators ](https://developers.cloudflare.com/flagship/targeting/operators/)
* [ Percentage rollouts ](https://developers.cloudflare.com/flagship/targeting/percentage-rollouts/)

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/flagship/","name":"Flagship"}},{"@type":"ListItem","position":3,"item":{"@id":"/flagship/targeting/","name":"Targeting rules"}}]}
```
---
title: Operators
description: Reference for the 11 comparison operators available in Flagship targeting rule conditions, including equality, comparison, string, and array operators.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/flagship/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Operators

Flagship supports 11 comparison operators for targeting rule conditions. Each operator compares an attribute from the [evaluation context](https://developers.cloudflare.com/flagship/concepts/#evaluation-context) against a specified value.

## Operator reference

| Operator                  | Description                                                                          | Example                                                 | Value type                |
| ------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------- | ------------------------- |
| equals                    | Returns true if the attribute value matches the specified value.                     | country equals "US"                                     | String                    |
| not\_equals               | Returns true if the attribute value does not match the specified value.              | plan not\_equals "free"                                 | String                    |
| greater\_than             | Returns true if the attribute value is greater than the specified value.             | age greater\_than 18                                    | Number, ISO 8601 datetime |
| less\_than                | Returns true if the attribute value is less than the specified value.                | loginCount less\_than 5                                 | Number, ISO 8601 datetime |
| greater\_than\_or\_equals | Returns true if the attribute value is greater than or equal to the specified value. | score greater\_than\_or\_equals 90                      | Number, ISO 8601 datetime |
| less\_than\_or\_equals    | Returns true if the attribute value is less than or equal to the specified value.    | createdAt less\_than\_or\_equals "2025-01-01T00:00:00Z" | Number, ISO 8601 datetime |
| contains                  | Returns true if the attribute value contains the specified substring.                | email contains "@cloudflare.com"                        | String                    |
| starts\_with              | Returns true if the attribute value starts with the specified prefix.                | path starts\_with "/api/v2"                             | String                    |
| ends\_with                | Returns true if the attribute value ends with the specified suffix.                  | domain ends\_with ".dev"                                | String                    |
| in                        | Returns true if the attribute value is in the specified array.                       | country in \["US", "CA", "UK"\]                         | Array                     |
| not\_in                   | Returns true if the attribute value is not in the specified array.                   | userId not\_in \["blocked-1", "blocked-2"\]             | Array                     |

## Operator categories

### Equality operators

`equals`, `not_equals`

Use these operators for exact string matching. The comparison is case-sensitive.

### Comparison operators

`greater_than`, `less_than`, `greater_than_or_equals`, `less_than_or_equals`

These operators work with numeric values and ISO 8601 datetime strings. When comparing datetimes, provide the value in ISO 8601 format (for example, `"2025-01-01T00:00:00Z"`).

### String operators

`contains`, `starts_with`, `ends_with`

These operators perform substring matching against the attribute value. All string comparisons are case-sensitive.

### Array operators

`in`, `not_in`

The value must be an array. Flagship checks whether the attribute value is a member of the specified array.

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/flagship/","name":"Flagship"}},{"@type":"ListItem","position":3,"item":{"@id":"/flagship/targeting/","name":"Targeting rules"}},{"@type":"ListItem","position":4,"item":{"@id":"/flagship/targeting/operators/","name":"Operators"}}]}
```
---
title: Binding API
description: Evaluate Flagship feature flags directly in Cloudflare Workers using the native binding with type-safe methods and automatic fallback.
image: https://developers.cloudflare.com/dev-products-preview.png
---

> Documentation Index  
> Fetch the complete documentation index at: https://developers.cloudflare.com/flagship/llms.txt  
> Use this file to discover all available pages before exploring further.

[Skip to content](#%5Ftop) 

# Binding API

Workers access Flagship through a binding that you add to your Wrangler configuration file. The `binding` field sets the variable name you use in your Worker code.

* [  wrangler.jsonc ](#tab-panel-6465)
* [  wrangler.toml ](#tab-panel-6466)

JSONC

```

{

  "flagship": [

    {

      "binding": "FLAGS",

      "app_id": "<APP_ID>",

    },

  ],

}


```

TOML

```

[[flagship]]

binding = "FLAGS"

app_id = "<APP_ID>"


```

Replace `<APP_ID>` with the app ID from your Flagship app. If you have not created an app yet, refer to the [Get started guide](https://developers.cloudflare.com/flagship/get-started/#create-an-app-and-a-flag). With this configuration, the binding is available as `env.FLAGS`. Refer to [Configuration](https://developers.cloudflare.com/flagship/configuration/) for additional options such as binding to multiple apps.

The binding provides type-safe methods for evaluating feature flags. If an evaluation fails or a flag is not found, the method returns the default value you provide.

* [  JavaScript ](#tab-panel-6467)
* [  TypeScript ](#tab-panel-6468)

JavaScript

```

export default {

  async fetch(request, env) {

    const enabled = await env.FLAGS.getBooleanValue("new-feature", false, {

      userId: "user-42",

    });

    return new Response(enabled ? "Feature on" : "Feature off");

  },

};


```

TypeScript

```

export default {

  async fetch(request: Request, env: Env): Promise<Response> {

    const enabled = await env.FLAGS.getBooleanValue("new-feature", false, {

      userId: "user-42",

    });

    return new Response(enabled ? "Feature on" : "Feature off");

  },

};


```

The binding has the type `Flagship` from the `@cloudflare/workers-types` package.

* [ Types ](https://developers.cloudflare.com/flagship/binding/types/)
* [ Methods ](https://developers.cloudflare.com/flagship/binding/methods/)

```json
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"/directory/","name":"Directory"}},{"@type":"ListItem","position":2,"item":{"@id":"/flagship/","name":"Flagship"}},{"@type":"ListItem","position":3,"item":{"@id":"/flagship/binding/","name":"Binding API"}}]}
```
r