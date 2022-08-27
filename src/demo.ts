import { WorkerLoggerLevel, createWorkerLoggerProvider, ILogger } from "./workerlog";

const provider = createWorkerLoggerProvider();
provider.configureLogging({
  min: 0,
});
provider.configureLogging({
  consoleColor: true,
  min: 0,
});
const logger = provider.getLogger();

console.log("No style!");
const name = "Hello";
const hmmf = new Array(255)
  .fill(null)
  .map((_, i) => `\u001b[38;5;${i}mF${i}`)
  .flat(2)
  .join();
console.log(hmmf);
const hmm = new Array(1)
  .fill(null)
  .map((_, i) => new Array(255).fill(null).map((_, j) => `\u001b[38;5;${i}m\u001b[48;5;${j}mF${i}B${j}`))
  .flat(2)
  .join();
console.log(hmm);
console.log("\u001b[48;5;12m\u001b[38;5;" + `${(name.charCodeAt(0) + name.charCodeAt(name.length - 1)) % 256}m` + name);

console.log("\n\n");
// reset
console.log("\u001b[39m\u001b[49m");

demo(logger.named("Example 1"));
demo(logger.named("Example", 1));
demo(logger.named("path", "/login").named("ip", "127.0.0.1"));

["a", "b2", "c", "ab5", "bb34", "cb", "ac23", "bc2", "cc"].forEach((a) => demo(logger.named(a + a)));

function demo(logger: ILogger) {
  logger.todo("todo!");
  logger.hmm("hmm!");
  logger.error("error!");
  logger.warn("warn!");
  logger.debug("debug!");
  logger.trace("trace!");
}
