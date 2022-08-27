import { createWorkerLoggerProvider, WorkerLoggerLevel } from "..";

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

// or set your own named logger
logger.configureLogger({
  type: "named",
  named(names) {
    // named loggers do not have a separate "key" option.
    // the key option is concatenated into the name.
    const prefix = names.join(" ");
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
