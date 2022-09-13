/** @public configuration type */
export interface IWorkerLogger {
  error(level: IWorkerLogMeta, message: string, args?: WorkerLoggable): void;
  warn(level: IWorkerLogMeta, message: string, args?: WorkerLoggable): void;
  debug(level: IWorkerLogMeta, message: string, args?: WorkerLoggable): void;
  trace(level: IWorkerLogMeta, message: string, args?: WorkerLoggable): void;
}

export type IWorkerLogCategory = "general" | "todo" | "troubleshooting";

/** Passed in when you configure your own logger endpoint via {@link IWorkerLogger} */
export type IWorkerLogMeta = Readonly<{
  category: IWorkerLogCategory;
  level: WorkerLoggerLevel;
}>;

/** @public configuration type */
export interface IWorkerConsoleLogger {
  /** ERROR level logs */
  error(message: string, ...args: any[]): void;
  /** WARN level logs */
  warn(message: string, ...args: any[]): void;
  /** DEBUG level logs */
  info(message: string, ...args: any[]): void;
  /** TRACE level logs */
  debug(message: string, ...args: any[]): void;
}

export type WorkerLoggable = Record<string, any>;
export type WorkerLogFn = (message: string, args?: WorkerLoggable) => void;

export type _WorkerLogFns = Readonly<{
  [P in keyof typeof LEVELS]: WorkerLogFn;
}>;

/** workerlog Logger */
export interface ILogger<TCtx = unknown> extends _WorkerLogFns {
  readonly ctx: TCtx;
  with(newContext: Partial<TCtx>): ILogger<TCtx>;
  named(name: string, key?: string | number): ILogger<TCtx>;
}

export type IWorkerLoggerConfig<TCtx> =
  | /** default {@link console} */
  "console"
  | {
      type: "console";
      /** default `true` This logger supports ANSI colors. */
      ansiColors?: boolean;
      /** default {@link console} (the built-in global logger) */
      console?: IWorkerConsoleLogger;
    }
  | {
      type: "named";
      named(names: string[], ctx: TCtx): IWorkerLogger;
    }
  | {
      type: "keyed";
      keyed(
        nameAndKeys: {
          name: string;
          key?: string | number;
        }[],
        ctx: TCtx
      ): IWorkerLogger;
    };

export type IWorkerLogSource<TCtx> = {
  names: { name: string; key?: number | string }[];
  ctx: TCtx;
};

export type IWorkerLogIncludes = {
  /**
   * General information max level.
   * e.g. `Project imported might be corrupted`
   */
  min?: WorkerLoggerLevel;
};
type RegExpTestLike = { test(value: string): boolean };

/** Parameters fo {@link IWorkerLoggingConfig.consoleStyle} */
export type IWorkerLoggingStyleConfig = {
  /** Disable style. You can also just pass `false` or `null` to {@link IWorkerLoggingConfig.consoleStyle}, so this is here for convenience. */
  disable?: boolean;
  /**
   * Doc: Look at the ../wikipedia-ansi-color-chart.png to estimate how to position.
   *
   * e.g.
   * @example
   * // full gamut
   * name => `\u001b[38;5;${(name.charCodeAt(0) + name.charCodeAt(name.length - 1)) % 178 + 52}m`,
   * // muted section of chart
   * name => `\u001b[38;5;${22 + (name.charCodeAt(0) % 12) + (name.charCodeAt(name.length - 1) % 6) * 36}m`,
   * // loud section of chart
   * name => `\u001b[38;5;${40 + (name.charCodeAt(0) % 12) + (name.charCodeAt(name.length - 1) % 6) * 36}m`,
   */
  color?: "bright" | "muted" | "grayscale" | ((nameOrKey: string) => string);
  /**
   * Test a value to see whether italic should be applied.
   * Use a RegExp or similar with `test(str): bool` function.
   */
  bold?: RegExp | RegExpTestLike | ((nameOrKey: string) => boolean);
  /**
   * Test a value to see whether italic should be applied.
   * Use a RegExp or similar with `test(str): bool` function.
   */
  italic?: RegExp | RegExpTestLike | ((nameOrKey: string) => boolean);
  /**
   * Test a value to see whether underline should be applied.
   * Use a RegExp or similar with `test(str): bool` function.
   */
  underline?: RegExp | RegExpTestLike | ((nameOrKey: string) => boolean);
  /**
   * Test a value to see whether collapsing or a custom replace string should be applied.
   *
   * @remarks
   * Replacing does not affect the style, so color, bold, italic, and underline are all determined
   * before the replacement happens.
   */
  replace?: "collapse" | ((name: string) => string);
  /**
   * Test a value to see whether truncation or a custom replace string should be applied.
   *
   * @remarks
   * Replacing does not affect the style, so color, bold, italic, and underline are all determined
   * before the replacement happens.
   */
  replaceKey?: "truncate" | ((key: string) => string);
};

export type IWorkerLoggingConfig<TCtx> = IWorkerLogIncludes & {
  /**
   * Override the level of logging on a per logger source basis.
   *
   * Return `void` to indicate that the settings for the root logger should be used
   */
  include?: (source: IWorkerLogSource<TCtx>) => IWorkerLogIncludes | void;
  /** Defaults to `true` */
  consoleStyle?: boolean | null | IWorkerLoggingStyleConfig;
};

/** @internal */
enum _Category {
  GENERAL = 1 << 0,
  TODO = 1 << 1,
  TROUBLESHOOTING = 1 << 2,
}

export enum WorkerLoggerLevel {
  TRACE = 1 << 3,
  DEBUG = 1 << 4,
  WARN = 1 << 5,
  ERROR = 1 << 6,
}

/**
 * @internal Worker internal "dev" levels are odd numbers
 *
 * You can check if a level is odd quickly by doing `level & 1 === 1`
 */
export enum _LoggerLevel {
  /** @internal this was an unexpected event */
  _HMM = WorkerLoggerLevel.ERROR | _Category.TROUBLESHOOTING,
  _TODO = WorkerLoggerLevel.ERROR | _Category.TODO,
  _ERROR = WorkerLoggerLevel.ERROR | _Category.GENERAL,
  _WARN = WorkerLoggerLevel.WARN | _Category.GENERAL,
  /** @internal debug logs for implementation details */
  _DEBUG = WorkerLoggerLevel.DEBUG | _Category.GENERAL,
  /**
   * The lowest logging level number.
   * @internal trace logs for implementation details
   */
  _TRACE = WorkerLoggerLevel.TRACE | _Category.GENERAL,
}

const LEVELS = {
  hmm: getLogMeta(_LoggerLevel._HMM),
  todo: getLogMeta(_LoggerLevel._TODO),
  error: getLogMeta(_LoggerLevel._ERROR),
  warn: getLogMeta(_LoggerLevel._WARN),
  debug: getLogMeta(_LoggerLevel._DEBUG),
  trace: getLogMeta(_LoggerLevel._TRACE),
};

function getLogMeta(level: _LoggerLevel): IWorkerLogMeta {
  return Object.freeze({
    category: hasFlag(level, _Category.TROUBLESHOOTING)
      ? "troubleshooting"
      : hasFlag(level, _Category.TODO)
      ? "todo"
      : "general",
    level:
      // I think this is equivalent... but I'm not using it until we have tests.
      // this code won't really impact performance much anyway, since it's just computed once
      // up front.
      // level &
      // (WorkerLoggerLevel.TRACE |
      //   WorkerLoggerLevel.DEBUG |
      //   WorkerLoggerLevel.WARN |
      //   WorkerLoggerLevel.ERROR),
      hasFlag(level, WorkerLoggerLevel.ERROR)
        ? WorkerLoggerLevel.ERROR
        : hasFlag(level, WorkerLoggerLevel.WARN)
        ? WorkerLoggerLevel.WARN
        : hasFlag(level, WorkerLoggerLevel.DEBUG)
        ? WorkerLoggerLevel.DEBUG
        : // no other option
          WorkerLoggerLevel.TRACE,
  });
}

/**
 * This is a helper function to determine whether the logger level has a bit flag set.
 *
 * Flags are interesting, because they give us an opportunity to very easily set up filtering
 * based on category and level. This is not available from public api, yet, but it's a good
 * start.
 */
function hasFlag(level: _LoggerLevel, flag: number): boolean {
  return (level & flag) === flag;
}

/**
 * @internal
 *
 * You'd think max, means number "max", but since we use this system of bit flags,
 * we actually need to go the other way, with comparisons being math less than.
 *
 * NOTE: Keep this in the same file as {@link _Audience} to ensure basic compilers
 * can inline the enum values.
 */
function shouldLog(includes: Required<IWorkerLogIncludes>, level: _LoggerLevel) {
  return includes.min <= level;
}

/** @internal */
export { shouldLog as _loggerShouldLog };

type InternalReplaceNameFn = (this: InternalLoggerStyleRef, name: string) => string;
function createInternalReplaceFn(replacer: (name: string) => string): InternalReplaceNameFn {
  return function replaceCollapse(this, name) {
    const collapsed = replacer(name);
    if (!this.prefixMemo.has(collapsed)) {
      this.prefixMemo.set(collapsed, this.prefix(name));
    }
    return collapsed;
  };
}

type InternalLoggerStyleRef = {
  bold?: RegExpTestLike;
  italic?: RegExpTestLike;
  underline?: RegExpTestLike;
  // if bold or italic exist, then we should have a prefix reset
  suffix: string;
  color?: (name: string) => string;
  ansiColor?: (x: number, y: number) => number;
  /** replace names */
  replace?: InternalReplaceNameFn;
  replaceKey?: InternalReplaceNameFn;
  prefixMemo: Map<string, string>;
  prefix(this: InternalLoggerStyleRef, name: string): string;
};

type InternalLoggerRef<TCtx> = {
  loggingConsoleColor: boolean;
  loggerConsoleStyle: boolean;
  includes: Required<IWorkerLogIncludes>;
  filtered: (
    this: IWorkerLogSource<TCtx>,
    level: _LoggerLevel,
    message: string,
    args?: WorkerLoggable | (() => WorkerLoggable)
  ) => void;
  include: (obj: IWorkerLogSource<TCtx>) => IWorkerLogIncludes | void;
  create: (obj: IWorkerLogSource<any>) => ILogger<any>;
  createExt: (obj: IWorkerLogSource<any>) => IWorkerLogger;
  style: InternalLoggerStyleRef;
  named(
    this: InternalLoggerRef<TCtx>,
    parent: IWorkerLogSource<TCtx>,
    name: string,
    key?: number | string
  ): ILogger<TCtx>;
  with(this: InternalLoggerRef<TCtx>, parent: IWorkerLogSource<TCtx>, partial: Partial<TCtx>): ILogger<TCtx>;
};

const EMPTY_STRING = "";
/**
 * hmm... we don't actually do the resetting stuff like this. It didn;'t seem to work as well as just straight full reset.
 * "\\033[3m  Italics on"
 * "\\033[23m Italics off"
 * "\\033[4m  Underline on"
 * "\\033[24m Underline off"
 * "\\033[1m  Bold on"
 * "\\033[21m Bold off"
 * "\\033[0m Reset everything"
 */
const ANSI_BOLD = "\u001b[1m";
const ANSI_ITALIC = "\u001b[3m";
const ANSI_UNDERLINE = "\u001b[4m";
const ANSI_RESET = "\u001b[0m";
function muted(x: number, y: number) {
  return 22 + (x % 12) + (y % 6) * 36;
}
const DEFAULTS: InternalLoggerRef<unknown> = {
  loggingConsoleColor: true,
  loggerConsoleStyle: true,
  includes: Object.freeze({
    min: WorkerLoggerLevel.WARN,
  }),
  filtered: function defaultFiltered() {},
  include: function defaultInclude() {
    return {};
  },
  create: null!,
  createExt: null!,
  named(this: InternalLoggerRef<unknown>, parent, name, key) {
    return this.create({
      names: [...parent.names, { name, key }],
      ctx: parent.ctx,
    });
  },
  with(this: InternalLoggerRef<unknown>, parent, partial) {
    return this.create({
      names: parent.names,
      ctx: typeof parent.ctx === "object" && parent.ctx != null ? { ...parent.ctx, ...partial } : partial,
    });
  },
  style: {
    bold: undefined, // /Service$/
    italic: undefined, // /Model$/
    underline: undefined, // /IP$/
    replace: undefined,
    suffix: EMPTY_STRING,
    // should be assigned new anytime logging settings change
    // so different logging settings don't share a cache.
    prefixMemo: newPrefixMemo(),
    color: undefined,
    ansiColor: muted,
    // create collapsed name
    // insert collapsed name into cssMemo with original's style
    prefix(this, name): string {
      const found = this.prefixMemo.get(name);
      if (found != null) return found;
      let prefix =
        this.color !== undefined
          ? this.color(name)
          : this.ansiColor !== undefined
          ? `\u001b[38;5;${this.ansiColor(name.charCodeAt(0), name.charCodeAt(name.length - 1))}m`
          : "";
      if (this.bold?.test(name)) {
        prefix += ANSI_BOLD;
      }
      if (this.italic?.test(name)) {
        prefix += ANSI_ITALIC;
      }
      if (this.underline?.test(name)) {
        prefix += ANSI_UNDERLINE;
      }
      this.prefixMemo.set(name, prefix);
      return prefix;
    },
  },
};

/** @public internal facing root logger */
export type IWorkerLoggerProvider<TCtx> = {
  configureLogger(config: IWorkerLoggerConfig<TCtx>): void;
  configureLogging(config: IWorkerLoggingConfig<TCtx>): void;
  getLogger(): ILogger<TCtx>;
};

function newPrefixMemo(): Map<string, string> {
  return new Map<string, string>([
    // handle empty names so we don't have to check for
    // name.length > 0 during this.css('')
    [EMPTY_STRING, EMPTY_STRING],
  ]);
}

// // Not yet, used, but good pattern to have in case we want to log something
// // or report something interesting.
// export type IWorkerInternalLoggerOptions = {
//   _error?: (message: string, args?: object) => void;
//   _debug?: (message: string, args?: object) => void;
// };

export function createWorkerLoggerProvider<$Ctx = void>({
  console = globalThis.console,
  ctx,
}: {
  console?: IWorkerConsoleLogger;
  ctx?: $Ctx;
} = {}): IWorkerLoggerProvider<$Ctx> {
  const ref: InternalLoggerRef<any> = {
    ...(DEFAULTS as InternalLoggerRef<any>),
  };
  const createConsole = {
    styled: createConsoleLoggerStyled.bind(ref, console),
    noStyle: createConsoleLoggerNoStyle.bind(ref, console),
  };
  // using external logger
  const createExtBound = createExtLogger.bind(ref);
  function getConCreate() {
    return ref.loggingConsoleColor && ref.loggerConsoleStyle ? createConsole.styled : createConsole.noStyle;
  }
  ref.create = getConCreate();

  return {
    configureLogger(config) {
      if (config === "console") {
        ref.loggerConsoleStyle = DEFAULTS.loggerConsoleStyle;
        ref.create = getConCreate();
      } else if (config.type === "console") {
        ref.loggerConsoleStyle = config.ansiColors ?? DEFAULTS.loggerConsoleStyle;
        ref.create = getConCreate();
      } else if (config.type === "keyed") {
        ref.createExt = (source) => config.keyed(source.names, source.ctx);
        ref.create = createExtBound;
      } else if (config.type === "named") {
        ref.createExt = configNamedToKeyed.bind(null, config.named as (names: string[], ctx: unknown) => IWorkerLogger);
        ref.create = createExtBound;
      }
    },
    configureLogging(config) {
      ref.includes = { ...ref.includes };
      ref.includes.min = config.min ?? DEFAULTS.includes.min;
      ref.include = config.include ?? DEFAULTS.include;
      const styleConfig = config.consoleStyle === null ? false : config.consoleStyle ?? true;
      // console.log("%%%".repeat(12), { styleConfig });
      if (!styleConfig) {
        ref.loggingConsoleColor = false;
      } else {
        ref.loggingConsoleColor = true;
        if (styleConfig !== true) {
          // must start with a new prefixMemo so other results don't conflict
          const refStyle = { ...DEFAULTS.style, prefixMemo: newPrefixMemo() };
          ref.style = refStyle;
          refStyle.bold = testLike(styleConfig.bold);
          refStyle.italic = testLike(styleConfig.italic);
          refStyle.underline = testLike(styleConfig.underline);
          if (styleConfig.bold || styleConfig.italic) refStyle.suffix = ANSI_RESET;
          if (styleConfig.replace === "collapse") {
            const collapseOnRE = /[a-z- ]+/g;
            refStyle.replace = createInternalReplaceFn((name) =>
              name.length < 5 ? name : name.replace(collapseOnRE, EMPTY_STRING)
            );
          } else if (styleConfig.replace) {
            refStyle.replace = createInternalReplaceFn(styleConfig.replace);
          }
          if (styleConfig.replaceKey === "truncate") {
            refStyle.replaceKey = createInternalReplaceFn((key) => (key.length > 16 ? key.slice(0, 16) : key));
          } else if (styleConfig.replaceKey) {
            refStyle.replaceKey = createInternalReplaceFn(styleConfig.replaceKey);
          }
          switch (styleConfig.color) {
            // Doc: Look at the ../wikipedia-ansi-color-chart.png to estimate how to position
            case "bright":
              refStyle.ansiColor = function bright(x: number, y: number) {
                return 40 + (x % 12) + (y % 6) * 36;
              };
              break;
            case "grayscale":
              refStyle.ansiColor = function grayscale(x: number, y: number) {
                return 240 + ((x + y) % 12);
              };
              break;
            case "muted":
            // no color override function, so default to muted ansi color
            case undefined:
              refStyle.ansiColor = muted;
              break;
            default:
              refStyle.color = styleConfig.color;
          }
        }
      }
      // console.log("%%%".repeat(12), { ref });
      ref.create = getConCreate() as (obj: IWorkerLogSource<$Ctx>) => ILogger<$Ctx>;
    },
    getLogger() {
      return ref.create({ names: [], ctx });
    },
  };
}

function testLike(x: undefined | RegExpTestLike | ((s: string) => boolean)): undefined | RegExpTestLike {
  return typeof x === "function" ? { test: x } : x;
}

// make things accessible on the default export
createWorkerLoggerProvider.WorkerLoggerLevel = WorkerLoggerLevel;

export default createWorkerLoggerProvider;

/** used by `configureLogger` for `'named'` */
function configNamedToKeyed<TCtx>(
  namedFn: (names: string[], ctx: TCtx) => IWorkerLogger,
  source: IWorkerLogSource<TCtx>
): IWorkerLogger {
  const names: string[] = [];
  for (let { name, key } of source.names) {
    names.push(key == null ? name : `${name} (${key})`);
  }
  return namedFn(names, source.ctx);
}

// external logger (provided from user)
function createExtLogger<TCtx>(this: InternalLoggerRef<TCtx>, source: IWorkerLogSource<TCtx>): ILogger<TCtx> {
  const includes = { ...this.includes, ...this.include(source) };
  const f = this.filtered;
  const named = this.named.bind(this, source);
  const withCtx = this.with.bind(this, source);
  const ext = this.createExt(source);

  const _HMM = shouldLog(includes, _LoggerLevel._HMM);
  const _TODO = shouldLog(includes, _LoggerLevel._TODO);
  const _ERROR = shouldLog(includes, _LoggerLevel._ERROR);
  const _WARN = shouldLog(includes, _LoggerLevel._WARN);
  const _DEBUG = shouldLog(includes, _LoggerLevel._DEBUG);
  const _TRACE = shouldLog(includes, _LoggerLevel._TRACE);
  const _hmm = _HMM ? ext.error.bind(ext, LEVELS.hmm) : f.bind(source, _LoggerLevel._HMM);
  const _todo = _TODO ? ext.error.bind(ext, LEVELS.todo) : f.bind(source, _LoggerLevel._TODO);
  const _error = _ERROR ? ext.error.bind(ext, LEVELS.error) : f.bind(source, _LoggerLevel._ERROR);
  const _warn = _WARN ? ext.warn.bind(ext, LEVELS.warn) : f.bind(source, _LoggerLevel._WARN);
  const _debug = _DEBUG ? ext.debug.bind(ext, LEVELS.debug) : f.bind(source, _LoggerLevel._DEBUG);
  const _trace = _TRACE ? ext.trace.bind(ext, LEVELS.trace) : f.bind(source, _LoggerLevel._TRACE);
  const logger: ILogger<TCtx> = {
    ctx: source.ctx,
    with: withCtx,
    hmm: _hmm,
    todo: _todo,
    error: _error,
    warn: _warn,
    debug: _debug,
    trace: _trace,
    //
    named,
  };

  return logger;
}

function createConsoleLoggerStyled<TCtx>(
  this: InternalLoggerRef<TCtx>,
  con: IWorkerConsoleLogger,
  source: IWorkerLogSource<TCtx>
): ILogger<TCtx> {
  const includes = { ...this.includes, ...this.include(source) };

  const len = source.names.length;
  const nameArr = new Array(len);
  for (let i = 0; i < source.names.length; i++) {
    let { name, key } = source.names[i];
    name = this.style.replace?.(name) ?? name;
    nameArr[i] = `${this.style.prefix(name)}${name}${this.style.suffix}`;
    if (key != null) {
      let keyStr = String(key);
      if (this.style.replaceKey) keyStr = this.style.replaceKey(keyStr);
      nameArr[i] += `${this.style.prefix(keyStr)}#${keyStr}${this.style.suffix}`;
    }
  }

  const named = this.named.bind(this, source);
  const withCtx = this.with.bind(this, source);
  return _createConsoleLogger(this.filtered, source, includes, con, true, nameArr, named, withCtx);
}

function createConsoleLoggerNoStyle<TCtx>(
  this: InternalLoggerRef<TCtx>,
  con: IWorkerConsoleLogger,
  source: IWorkerLogSource<TCtx>
): ILogger<TCtx> {
  const includes = { ...this.includes, ...this.include(source) };

  const nameArr = new Array(source.names.length);
  for (let i = 0; i < source.names.length; i++) {
    const { name, key } = source.names[i];
    nameArr[i] = name;
    if (key != null) {
      nameArr[i] += `#${key}`;
    }
  }

  const named = this.named.bind(this, source);
  const withCtx = this.with.bind(this, source);
  return _createConsoleLogger(this.filtered, source, includes, con, false, nameArr, named, withCtx);
}

const COLOR_HMM = ANSI_RESET + "\u001b[38;5;13m";
const COLOR_TODO = ANSI_RESET + "\u001b[38;5;14m";
const COLOR_ERROR = ANSI_RESET + "\u001b[38;5;9m";
const COLOR_WARN = ANSI_RESET + "\u001b[38;5;11m";
const COLOR_DEBUG = ANSI_RESET + "\u001b[38;5;15m";
const COLOR_TRACE = ANSI_RESET + "\u001b[38;5;7m";
/** Used by {@link createConsoleLoggerNoStyle} and {@link createConsoleLoggerStyled} */
function _createConsoleLogger<TCtx>(
  f: (
    this: IWorkerLogSource<TCtx>,
    level: _LoggerLevel,
    message: string,
    args?: object | undefined,
    ctx?: TCtx
  ) => void,
  source: IWorkerLogSource<TCtx>,
  includes: Required<IWorkerLogIncludes>,
  con: IWorkerConsoleLogger,
  styled: boolean,
  prefix: ReadonlyArray<any>,
  named: (name: string, key?: string | number | undefined) => ILogger<TCtx>,
  withCtx: (partial: Partial<TCtx>) => ILogger<TCtx>
) {
  const _HMM = shouldLog(includes, _LoggerLevel._HMM);
  const _TODO = shouldLog(includes, _LoggerLevel._TODO);
  const _ERROR = shouldLog(includes, _LoggerLevel._ERROR);
  const _WARN = shouldLog(includes, _LoggerLevel._WARN);
  const _DEBUG = shouldLog(includes, _LoggerLevel._DEBUG);
  const _TRACE = shouldLog(includes, _LoggerLevel._TRACE);
  const _hmm = _HMM
    ? styled
      ? con.error.bind(con, `${COLOR_HMM}HMM? `, ...prefix, COLOR_HMM)
      : con.error.bind(con, ...prefix)
    : f.bind(source, _LoggerLevel._HMM);
  const _todo = _TODO
    ? styled
      ? con.error.bind(con, `${COLOR_TODO}TODO `, ...prefix, COLOR_TODO)
      : con.error.bind(con, ...prefix)
    : f.bind(source, _LoggerLevel._TODO);
  const _error = _ERROR
    ? styled
      ? con.error.bind(con, `${COLOR_ERROR}ERROR`, ...prefix, COLOR_ERROR)
      : con.error.bind(con, ...prefix)
    : f.bind(source, _LoggerLevel._ERROR);
  const _warn = _WARN
    ? styled
      ? con.warn.bind(con, `${COLOR_WARN}WARN `, ...prefix, COLOR_WARN)
      : con.warn.bind(con, ...prefix)
    : f.bind(source, _LoggerLevel._WARN);
  const _debug = _DEBUG
    ? styled
      ? con.info.bind(con, `${COLOR_DEBUG}DEBUG`, ...prefix, COLOR_DEBUG)
      : con.info.bind(con, ...prefix)
    : f.bind(source, _LoggerLevel._DEBUG);
  const _trace = _TRACE
    ? styled
      ? con.debug.bind(con, `${COLOR_TRACE}TRACE`, ...prefix, COLOR_TRACE)
      : con.debug.bind(con, ...prefix)
    : f.bind(source, _LoggerLevel._TRACE);
  const logger: ILogger<TCtx> = {
    ctx: source.ctx,
    with: withCtx,
    hmm: _hmm,
    todo: _todo,
    error: _error,
    warn: _warn,
    debug: _debug,
    trace: _trace,
    //
    named,
  };

  return logger;
}
