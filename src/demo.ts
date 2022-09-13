import { createWorkerLoggerProvider, ILogger } from "./workerlog";

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

const provider = createWorkerLoggerProvider();
async function allDemos() {
  provider.configureLogging({
    consoleStyle: {
      bold: () => true,
    },
    min: 0,
  });
  const demoLogger = provider.getLogger().named("-".repeat(12) + " demo.ts " + "-".repeat(12));

  demoLogger.debug("No Style");
  provider.configureLogging({
    consoleStyle: false,
    min: 0,
  });
  await appDemo(provider.getLogger());

  demoLogger.debug("Styled with grayscale");
  provider.configureLogging({
    consoleStyle: {
      color: "grayscale",
    },
    min: 0,
  });
  await appDemo(provider.getLogger());

  demoLogger.debug("Style with bold *User* & underlined *Session*");
  provider.configureLogging({
    consoleStyle: {
      bold: /User/,
      italic: /Session/,
    },
    min: 0,
  });
  await appDemo(provider.getLogger());

  demoLogger.debug("Styled with custom color function, bold *User* & underlined *Session*");
  provider.configureLogging({
    consoleStyle: {
      bold: /User/,
      italic: /Session/,
      color(name) {
        return `\u001b[38;5;${40 + (name.charCodeAt(0) % 12) + (name.charCodeAt(name.length - 1) % 6) * 36}m`;
      },
    },
    min: 0,
  });
  await appDemo(provider.getLogger());

  demoLogger.debug("Styled with collapsed names, same custom color function, bold *User* & underlined *Session*");
  provider.configureLogging({
    consoleStyle: {
      replace: "collapse",
      bold: /User/,
      italic: /Session/,
      color(name) {
        return `\u001b[38;5;${40 + (name.charCodeAt(0) % 12) + (name.charCodeAt(name.length - 1) % 6) * 36}m`;
      },
    },
    min: 0,
  });
  await appDemo(provider.getLogger());
}

const concepts = ["Worker", "UserSession", "UserAccount", "OIDCHandoff"];
const ips = ["127.0.0.1", "192.168.0.6", "192.168.0.3"];
const paths = ["/login", "/signup", ""];

const PAUSE = 400;
const LOREM =
  `lorem ipsum dolor, sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. duis aute irure dolor in reprehenderit in voluptate velit esse nulla pariatur. excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum
fusce ac turpis quis, ligula lacinia aliquet. mauris ipsum. nulla metus metus, ullamcorper vel, tincidunt sed, euismod in, nibh. quisque volutpat condimentum velit class aptent taciti sociosqu ad litora torquent per conubia nostra per inceptos himenaeos nam nec ante
vestibulum sapien proin quam etiam ultrices suspendisse in justo eu magna luctus suscipit sed lectus. integer euismod lacus luctus magna.  integer id quam. morbi mi. quisque nisl felis, venenatis tristique, dignissim in, ultrices sit amet, augue. proin sodales libero eget ante`.split(
    /\s+/g
  );

// must be called after the const declarations
allDemos().catch(console.error);

function appDemo(logger: ILogger) {
  demo(logger.named("Example 1"));
  demo(logger.named("Example", 1));
  demo(logger.named("path", "/login").named("ip", "127.0.0.1"));
  for (const ip of ips) {
    for (const c of concepts) {
      for (const path of paths) {
        demo(logger.named("ip", ip).named(c).named("path", path));
      }
    }
  }
  return wait(PAUSE);
}
function demo(logger: ILogger) {
  if (Math.random() < 0.1) setTimeout(() => logger.todo(lorem()), Math.random() * PAUSE);
  if (Math.random() < 0.2) setTimeout(() => logger.hmm(lorem()), Math.random() * PAUSE);
  if (Math.random() < 0.1) setTimeout(() => logger.error(lorem()), Math.random() * PAUSE);
  if (Math.random() < 0.1) setTimeout(() => logger.warn(lorem()), Math.random() * PAUSE);
  setTimeout(() => logger.debug(lorem()), Math.random() * PAUSE);
  setTimeout(() => logger.debug(lorem()), Math.random() * PAUSE);
  setTimeout(() => logger.trace(lorem()), Math.random() * PAUSE);
}

function lorem() {
  return new Array(Math.floor(Math.random() * 6) + 3)
    .fill(null)
    .map(() => LOREM[Math.floor(Math.random() * LOREM.length)])
    .join(" ");
}

function wait(n: number): Promise<void> {
  return new Promise((res) => setTimeout(res, n));
}
