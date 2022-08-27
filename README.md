# workerlog

A logging library for workers or servers.

![Screenshot of colorful logs from `npm run demo`](./demo.png)

## Features

✔ Colorful console logs

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

### Downgrading

For example,
```ts
// now, any logs that `cssRenderHelpers` wants to surface, will go through `appLogger` 
const cssLogger = appLogger.downgrade()
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
          meta.category,
          WorkerLoggerLevel[meta.level],
          prefix,
          message,
          ...(args ? [args] : [])
        );
      },
      warn(meta, message, args) {
        console.warn(
          meta.category,
          WorkerLoggerLevel[meta.level],
          prefix,
          message,
          ...(args ? [args] : [])
        );
      },
      debug(meta, message, args) {
        console.info(
          meta.category,
          WorkerLoggerLevel[meta.level],
          prefix,
          message,
          ...(args ? [args] : [])
        );
      },
      trace(meta, message, args) {
        console.debug(
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
