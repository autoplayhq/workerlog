import { createWorkerLoggerProvider } from "..";

// create logger provider
const provider = createWorkerLoggerProvider();

// root logger
const logger = provider.getLogger()

// create nested loggers
const appLogger = logger.named("App")

// see the breadth of logger functions with example messages
// all log functions accept one message and one optional arguments object

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
