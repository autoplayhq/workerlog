import { createWorkerLoggerProvider } from "..";

// create logger provider
const provider = createWorkerLoggerProvider();

// root logger
const logger = provider.getLogger()

// create nested loggers
const appLogger = logger.named("App")

// create nested loggers with a name and a key
const pageLogger = appLogger.named("Page", "page_alwjkdkjapiu90182wq")
