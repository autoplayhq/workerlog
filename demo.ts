import { WorkerLoggerLevel, createWorkerLoggerProvider, ILogger } from "./src/workerlog";

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

console.log("\n".repeat(6));
// reset
console.log("\u001b[39m\u001b[49m");

demo(logger.named("Example 1"));
demo(logger.named("Example", 1));
demo(logger.named("path", "/login").named("ip", "127.0.0.1"));

const concepts = ["Worker", "UserSession", "UserAccount", "OIDCHandoff"];
const ips = ["127.0.0.1", "192.168.0.6", "192.168.0.3"];
const paths = ["/login", "/signup", ""];

for (const ip of ips) {
  for (const c of concepts) {
    for (const path of paths) {
      demo(logger.named("ip", ip).named(c).named("path", path));
    }
  }
}

function demo(logger: ILogger) {
  if (Math.random() < 0.1) setTimeout(() => logger.todo(lorem()), Math.random() * 400);
  if (Math.random() < 0.2) setTimeout(() => logger.hmm(lorem()), Math.random() * 400);
  if (Math.random() < 0.1) setTimeout(() => logger.error(lorem()), Math.random() * 400);
  if (Math.random() < 0.1) setTimeout(() => logger.warn(lorem()), Math.random() * 400);
  setTimeout(() => logger.debug(lorem()), Math.random() * 400);
  setTimeout(() => logger.debug(lorem()), Math.random() * 400);
  setTimeout(() => logger.trace(lorem()), Math.random() * 400);
}

const LOREM =
  `lorem ipsum dolor, sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. duis aute irure dolor in reprehenderit in voluptate velit esse nulla pariatur. excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum
fusce ac turpis quis, ligula lacinia aliquet. mauris ipsum. nulla metus metus, ullamcorper vel, tincidunt sed, euismod in, nibh. quisque volutpat condimentum velit class aptent taciti sociosqu ad litora torquent per conubia nostra per inceptos himenaeos nam nec ante
vestibulum sapien proin quam etiam ultrices suspendisse in justo eu magna luctus suscipit sed lectus. integer euismod lacus luctus magna.  integer id quam. morbi mi. quisque nisl felis, venenatis tristique, dignissim in, ultrices sit amet, augue. proin sodales libero eget ante`.split(
    /\s+/g
  );
function lorem() {
  return new Array(Math.floor(Math.random() * 6) + 3)
    .fill(null)
    .map(() => LOREM[Math.floor(Math.random() * LOREM.length)])
    .join(" ");
}
