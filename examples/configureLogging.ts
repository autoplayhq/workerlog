import { createWorkerLoggerProvider } from "..";

// create logger provider
const logger = createWorkerLoggerProvider();

// set custom logging behaviors (filtering and such)
logger.configureLogging({
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
