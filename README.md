# workerlog

A logging worker for workers.

## Features

✔ Multiple levels based on audience. Public, Developers, Internal

✔ Colorful browser logs

✔ CommonJS

✔ ES Modules

✔ TypeScript

### Usage

We can create loggers which are essentially nested from their parent.
```ts
import { createWorkerLoggerProvider } from "@autoplay/workerlog";

// create logger provider
const provider = createWorkerLoggerProvider();

// root logger
const logger = provider.getLogger()

// create nested loggers
const appLogger = logger.named("App")

// create nested loggers with a name and a key
const pageLogger = appLogger.named("Page", page.id)
```

We can log for a variety of audiences.
```ts
import { createWorkerLoggerProvider } from "@autoplay/workerlog";

// create logger provider
const provider = createWorkerLoggerProvider();

// root logger
const logger = provider.getLogger()

// create nested loggers
const appLogger = logger.named("App")

// create nested loggers with a name and a key
const pageLogger = appLogger.named("Page", page.id)
```

See the breadth of logger functions with example messages.
All log functions accept one message and one optional arguments object.
```ts
// internal log functions
appLogger._error("We've experienced a general problem")
appLogger._hmm("This doesn't look right")
appLogger._todo("I'm not finished")
appLogger._kapow("Lookie here! I guess we do execute this code")
appLogger._warn("I'm not finished")
appLogger._debug("Opening page", { pageId: "..." })
appLogger._trace("User mouse clicked", { mouseEvent: "..." })

// developer log functions
appLogger.errorDev("Data passed in was malformed")
appLogger.warnDev("Challenge with loading exports sourcemaps. Ensure you're compiling with esm: true")
appLogger.debugDev("Page loaded", { pageId: "...", duration: "...", objects: 120 })
appLogger.traceDev("Loading page's external object", { pageId: "...", objectId: "..." })

// public log functions
appLogger.errorPublic("Something that just cannot go unnoticed!")
appLogger.warnPublic("Something so so important!")
```

### Lazy logging

All log functions also come with a `.lazy.<logfn>(message, () => args)` version.
```ts
// execute the inner function only if the log is included in logging
appLogger.lazy.debugDev("Page loaded", () => ({ pageId: "...", pageMeta: calculatePageMeta() }))
```

### Downgrading

In many places in your code such as in utility functions, you don't know which
audience the logs are for. So, in this case, you can use `.downgrade.<audience>()`
to produce a `IUtilLogger` (which is also nameable).

It looks like the following:
```ts
export interface IUtilLogger {
  /** Usually equivalent to `console.error`. */
  error(message: string, args?: WorkerLoggable): void;
  /** Usually equivalent to `console.warn`. */
  warn(message: string, args?: WorkerLoggable): void;
  /** Usually equivalent to `console.info`. */
  debug(message: string, args?: WorkerLoggable): void;
  /** Usually equivalent to `console.debug`. */
  trace(message: string, args?: WorkerLoggable): void;
  named(name: string, key?: string): IUtilLogger;
}
```

For example,
```ts
// now, any logs that `cssRenderHelpers` wants to surface, will go through
// the `internal` audience.
const cssLogger = appLogger.downgrade.internal()
cssRenderHelpers.convertBezier(cssLogger, "...")
```

### Configurable with a TypeScript API

#### Configure what gets logged

```ts
import { createWorkerLoggerProvider } from "@autoplay/workerlog";

// create logger provider
const provider = createWorkerLoggerProvider();

// set custom logging behaviors (filtering and such)
provider.configureLogging({
  // disable style to the console (if the logger does not support style, this won't have an effect)
  consoleStyle: false,
  // include logs made for the dev audience
  dev: true,
  // include logs made for the internal audience
  internal: true,

  // configure the behavior of inclusion based on source of the logs
  include(source) {
    if (source.names.find(n => n.name === "XYZSystem")) {
      // include internal logs for XYZSystem children
      return {
        internal: true
      }
    }

    if (source.names.find(n => n.name === "Rendering")) {
      // suppress all logs under the "Rendering" tree
      return {
        internal: false,
        dev: false,
        min: Infinity,
      }
    }

    if (source.names.find(n => n.name === "Page" && n.key === "page_ajkwhloieuw8990se")) {
      // enable all logs for page "page_ajkwhloieuw8990se"
      // this source would have been constructed via something like `parentLogger.named("Page", page.id)`
      return {
        internal: true,
        min: 0,
      }
    }
  },
});
```

#### Configure how it gets logged

```ts
import { createWorkerLoggerProvider, WorkerLoggerLevel } from "@autoplay/workerlog";

// create logger provider
const logger = createWorkerLoggerProvider();

// set a custom console
logger.configureLogger({
  type: "console",
  console: console,
  // disable colorful styling
  style: false,
});

// disable console styling, and set default console
logger.configureLogger({
  type: "console",
  style: false,
});

// set your own keyed logger
logger.configureLogger({
  type: "keyed",
  keyed(nameAndKeys) {
    const prefix = nameAndKeys
      .map((a) => (a.key ? `${a.name}#${a.key}` : a.name))
      .join(" ");
    return {
      error(meta, message, args) {
        console.error(
          meta.audience,
          meta.category,
          WorkerLoggerLevel[meta.level],
          prefix,
          message,
          ...(args ? [args] : [])
        );
      },
      warn(meta, message, args) {
        console.warn(
          meta.audience,
          meta.category,
          WorkerLoggerLevel[meta.level],
          prefix,
          message,
          ...(args ? [args] : [])
        );
      },
      debug(meta, message, args) {
        console.info(
          meta.audience,
          meta.category,
          WorkerLoggerLevel[meta.level],
          prefix,
          message,
          ...(args ? [args] : [])
        );
      },
      trace(meta, message, args) {
        console.debug(
          meta.audience,
          meta.category,
          WorkerLoggerLevel[meta.level],
          prefix,
          message,
          ...(args ? [args] : [])
        );
      },
    };
  },
});
```

## License

This project is licensed under the terms of the [MIT license](https://opensource.org/licenses/MIT).
