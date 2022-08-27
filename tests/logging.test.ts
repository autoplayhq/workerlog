import { WorkerLoggerLevel } from "../src/workerlog";
import { describeLogger } from "./test-helpers";

describeLogger("Worker internal logger", (setup) => {
  describe("default logger", () => {
    test("it reports public messages", () => {
      const t = setup().t();

      t.expectIncluded("_error", "error");
      t.expectIncluded("_hmm", "error");
      t.expectIncluded("_todo", "error");
      t.expectIncluded("_warn", "warn");
      t.expectExcluded("_debug");
      t.expectExcluded("_trace");
    });
  });

  describe("custom logging", () => {
    test("it can include all logs", () => {
      const h = setup();

      const initial = h.t();

      h.internal.configureLogging({
        min: WorkerLoggerLevel.TRACE,
      });

      const t = h.t();

      // initial logger will not have been able to acknowledge
      // the logging config update.
      initial.expectExcluded("_debug");

      t.expectIncluded("_hmm", "error");
      t.expectIncluded("_debug", "info");
      t.expectIncluded("_trace", "debug");
    });

    test("it can include WARN level dev and internal logs", () => {
      const h = setup();

      h.internal.configureLogging({
        min: WorkerLoggerLevel.WARN,
      });

      const t = h.t();

      t.expectIncluded("_hmm", "error");

      t.expectExcluded("_debug");
      t.expectExcluded("_trace");
    });
  });

  // describe("named and keys", () => {
  //   test("default with no name has no colors", () => {
  //     const h = setup();
  //     const app = h.t().named("App");
  //     const appK2 = app.named("K", 1);

  //     app.expectIncluded("errorPublic", "error", ["App", { not: /K.*#1/ }]);
  //     app.expectIncluded("warnPublic", "warn", ["App", { not: /K.*#1/ }]);
  //     appK2.expectIncluded("errorPublic", "error", ["App", /App.*K.*#1/]);
  //     appK2.expectIncluded("warnPublic", "warn", ["App", /App.*K.*#1/]);
  //   });
  // });
  // describe("downgrade", () => {
  //   test(".downgrade.public() with defaults", () => {
  //     const h = setup();

  //     const publ = h.t().downgrade.public();

  //     publ.expectIncluded("error", "error");
  //     publ.expectIncluded("warn", "warn");
  //     publ.expectExcluded("debug");
  //     publ.expectExcluded("trace");
  //   });

  //   test(".downgrade.dev() with defaults", () => {
  //     const h = setup();

  //     const dev = h.t().downgrade.dev();

  //     dev.expectExcluded("error");
  //     dev.expectExcluded("warn");
  //     dev.expectExcluded("debug");
  //     dev.expectExcluded("trace");
  //   });

  //   test(".downgrade.internal() with defaults", () => {
  //     const h = setup();

  //     const internal = h.t().downgrade.internal();

  //     internal.expectExcluded("error");
  //     internal.expectExcluded("warn");
  //     internal.expectExcluded("debug");
  //     internal.expectExcluded("trace");
  //   });

  //   test(".downgrade.internal() can be named", () => {
  //     const h = setup();

  //     h.internal.configureLogging({
  //       internal: true,
  //       min: WorkerLoggerLevel.TRACE,
  //     });

  //     const internal = h.t().downgrade.internal();
  //     const appleInternal = internal.named("Apple");

  //     internal.expectIncluded("error", "error", [{ not: "Apple" }]);
  //     internal.expectIncluded("warn", "warn", [{ not: "Apple" }]);
  //     internal.expectIncluded("debug", "info", [{ not: "Apple" }]);
  //     internal.expectIncluded("trace", "debug", [{ not: "Apple" }]);

  //     appleInternal.expectIncluded("error", "error", ["Apple"]);
  //     appleInternal.expectIncluded("warn", "warn", ["Apple"]);
  //     appleInternal.expectIncluded("debug", "info", ["Apple"]);
  //     appleInternal.expectIncluded("trace", "debug", ["Apple"]);
  //   });

  //   test(".downgrade.public() debug/trace warns internal", () => {
  //     const h = setup();
  //     {
  //       h.internal.configureLogging({
  //         internal: true,
  //       });
  //       const publ = h.t().downgrade.public();

  //       publ.expectIncluded("error", "error", [{ not: "filtered out" }]);
  //       publ.expectIncluded("warn", "warn", [{ not: "filtered out" }]);

  //       // warnings go through internal loggers since public loggers do not have a trace or debug level
  //       publ.expectIncluded("debug", "warn", ["filtered out"]);
  //       publ.expectIncluded("trace", "warn", ["filtered out"]);
  //     }

  //     {
  //       h.internal.configureLogging({
  //         dev: true,
  //       });
  //       const publ = h.t().downgrade.public();

  //       publ.expectIncluded("error", "error", [{ not: /filtered out/ }]);
  //       publ.expectIncluded("warn", "warn", [{ not: /filtered out/ }]);

  //       // warnings only go through internal loggers
  //       publ.expectExcluded("debug");
  //       publ.expectExcluded("trace");
  //     }
  //   });
  // });
});
