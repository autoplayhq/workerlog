/** @public configuration type */
export interface IWorkerLogger {
  error(level: IWorkerLogMeta, message: string, args?: WorkerLoggable): void;
  warn(level: IWorkerLogMeta, message: string, args?: WorkerLoggable): void;
  debug(level: IWorkerLogMeta, message: string, args?: WorkerLoggable): void;
  trace(level: IWorkerLogMeta, message: string, args?: WorkerLoggable): void;
}

/** Passed in when you configure your own logger endpoint via {@link IWorkerLogger} */
export type IWorkerLogMeta = Readonly<{
  category: "general" | "todo" | "troubleshooting";
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

/**
 * "Downgraded" {@link ILogger} for passing down to utility functions.
 *
 * A util logger is usually back by some specific {@link _Audience}.
 */
export interface IUtilLogger {
  /** Usually equivalent to `console.error`. */
  error(message: string, args?: WorkerLoggable): void;
  /** Usually equivalent to `console.warn`. */
  warn(message: string, args?: WorkerLoggable): void;
  /** Usually equivalent to `console.info`. */
  debug(message: string, args?: WorkerLoggable): void;
  /** Usually equivalent to `console.debug`. */
  trace(message: string, args?: WorkerLoggable): void;
  named(name: string, key?: string): IUtilLogger;
}

export type WorkerLoggable = Record<string, any>;
export type WorkerLogFn = (message: string, args?: WorkerLoggable) => void;

export type _WorkerLogFns = Readonly<{
  [P in keyof typeof LEVELS]: WorkerLogFn;
}>;

/** Internal worker logger */
export interface ILogger extends _WorkerLogFns {
  named(name: string, key?: string | number): ILogger;
  downgrade(): IUtilLogger;
}

export type IWorkerLoggerConfig =
  | /** default {@link console} */
  "console"
  | {
      type: "console";
      /** default `true` */
      colors?: boolean;
      /** default {@link console} */
      console?: IWorkerConsoleLogger;
    }
  | {
      type: "named";
      named(names: string[]): IWorkerLogger;
    }
  | {
      type: "keyed";
      keyed(
        nameAndKeys: {
          name: string;
          key?: string | number;
        }[]
      ): IWorkerLogger;
    };

export type IWorkerLogSource = {
  names: { name: string; key?: number | string }[];
};

export type IWorkerLogIncludes = {
  /**
   * General information max level.
   * e.g. `Project imported might be corrupted`
   */
  min?: WorkerLoggerLevel;
};

export type IWorkerLoggingConfig = IWorkerLogIncludes & {
  /**
   * Override the level of logging on a per logger source basis.
   *
   * Return `void` to indicate that the settings for the root logger should be used
   */
  include?: (source: IWorkerLogSource) => IWorkerLogIncludes | void;
  consoleColor?: boolean;
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

type InternalLoggerStyleRef = {
  italic?: RegExp;
  bold?: RegExp;
  color?: (name: string) => string;
  collapseOnRE: RegExp;
  prefixMemo: Map<string, string>;
  prefix(this: InternalLoggerStyleRef, name: string): string;
  collapsed(this: InternalLoggerStyleRef, name: string): string;
};

type InternalLoggerRef = {
  loggingConsoleColor: boolean;
  loggerConsoleStyle: boolean;
  includes: Required<IWorkerLogIncludes>;
  filtered: (
    this: IWorkerLogSource,
    level: _LoggerLevel,
    message: string,
    args?: WorkerLoggable | (() => WorkerLoggable)
  ) => void;
  include: (obj: IWorkerLogSource) => IWorkerLogIncludes | void;
  create: (obj: IWorkerLogSource) => ILogger;
  createExt: (obj: IWorkerLogSource) => IWorkerLogger;
  style: InternalLoggerStyleRef;
  named(this: InternalLoggerRef, parent: IWorkerLogSource, name: string, key?: number | string): ILogger;
};

// FUTURE: Allow choosing hashing style?
// Doc: Look at the ../wikipedia-ansi-color-chart.png to estimate how to position
const mutedAnsi = (x: number, y: number) => 22 + (x % 11) + (y % 6) * 36;

const DEFAULTS: InternalLoggerRef = {
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
  named(this: InternalLoggerRef, parent, name, key) {
    return this.create({
      names: [...parent.names, { name, key }],
    });
  },
  style: {
    bold: undefined, // /Service$/
    italic: undefined, // /Model$/
    prefixMemo: new Map<string, string>([
      // handle empty names so we don't have to check for
      // name.length > 0 during this.css('')
      ["", ""],
      // bring a specific override
      // ["Marker", "color:#aea9ff;font-size:0.75em;text-transform:uppercase"]
    ]),
    collapseOnRE: /[a-z- ]+/g,
    color: undefined,
    // create collapsed name
    // insert collapsed name into cssMemo with original's style
    collapsed(this, name) {
      if (name.length < 5) return name;
      const collapsed = name.replace(this.collapseOnRE, "");
      if (!this.prefixMemo.has(collapsed)) {
        this.prefixMemo.set(collapsed, this.prefix(name));
      }
      return collapsed;
    },
    prefix(this, name): string {
      const found = this.prefixMemo.get(name);
      if (found) return found;
      let prefix =
        this.color?.(name) ?? "\u001b[38;5;" + `${mutedAnsi(name.charCodeAt(0), name.charCodeAt(name.length - 1))}m`;
      /**
       * "\\033[4m  Underline on"
       * "\\033[24m Underline off"
       * "\\033[1m  Bold on"
       * "\\033[21m Bold off"
       */
      if (this.bold) {
        prefix += this.bold.test(name) ? "\u001b[1m" : "\u001b[21m";
      }
      if (this.italic) {
        prefix += this.italic.test(name) ? "\u001b[4m" : "\u001b[24m";
      }
      this.prefixMemo.set(name, prefix);
      return prefix;
    },
  },
};

/** @public internal facing root logger */
export type IWorkerInternalLogger = {
  configureLogger(config: IWorkerLoggerConfig): void;
  configureLogging(config: IWorkerLoggingConfig): void;
  getLogger(): ILogger;
};

export type IWorkerInternalLoggerOptions = {
  _error?: (message: string, args?: object) => void;
  _debug?: (message: string, args?: object) => void;
};

export function createWorkerLoggerProvider(
  useConsole: IWorkerConsoleLogger = console,
  // Not yet, used, but good pattern to have in case we want to log something
  // or report something interesting.
  _options: IWorkerInternalLoggerOptions = {}
): IWorkerInternalLogger {
  const ref: InternalLoggerRef = {
    ...DEFAULTS,
    includes: { ...DEFAULTS.includes },
  };
  const createConsole = {
    styled: createConsoleLoggerStyled.bind(ref, useConsole),
    noStyle: createConsoleLoggerNoStyle.bind(ref, useConsole),
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
        ref.loggerConsoleStyle = config.colors ?? DEFAULTS.loggerConsoleStyle;
        ref.create = getConCreate();
      } else if (config.type === "keyed") {
        ref.createExt = (source) => config.keyed(source.names);
        ref.create = createExtBound;
      } else if (config.type === "named") {
        ref.createExt = configNamedToKeyed.bind(null, config.named);
        ref.create = createExtBound;
      }
    },
    configureLogging(config) {
      ref.includes.min = config.min ?? DEFAULTS.includes.min;
      ref.include = config.include ?? DEFAULTS.include;
      ref.loggingConsoleColor = config.consoleColor ?? DEFAULTS.loggingConsoleColor;
      ref.create = getConCreate();
    },
    getLogger() {
      return ref.create({ names: [] });
    },
  };
}

// make things accessible on the default export
createWorkerLoggerProvider.WorkerLoggerLevel = WorkerLoggerLevel;

export default createWorkerLoggerProvider;

/** used by `configureLogger` for `'named'` */
function configNamedToKeyed(namedFn: (names: string[]) => IWorkerLogger, source: IWorkerLogSource): IWorkerLogger {
  const names: string[] = [];
  for (let { name, key } of source.names) {
    names.push(key == null ? name : `${name} (${key})`);
  }
  return namedFn(names);
}

// external logger (provided from user)
function createExtLogger(this: InternalLoggerRef, source: IWorkerLogSource): ILogger {
  const includes = { ...this.includes, ...this.include(source) };
  const f = this.filtered;
  const named = this.named.bind(this, source);
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
  const logger: ILogger = {
    hmm: _hmm,
    todo: _todo,
    error: _error,
    warn: _warn,
    debug: _debug,
    trace: _trace,
    //
    named,
    downgrade() {
      return {
        debug: logger.debug,
        error: logger.error,
        warn: logger.warn,
        trace: logger.trace,
        named(name, key) {
          return logger.named(name, key).downgrade();
        },
      };
    },
  };

  return logger;
}

function createConsoleLoggerStyled(
  this: InternalLoggerRef,
  con: IWorkerConsoleLogger,
  source: IWorkerLogSource
): ILogger {
  const includes = { ...this.includes, ...this.include(source) };

  const len = source.names.length;
  const nameArr = new Array(len);
  for (let i = 0; i < source.names.length; i++) {
    const { name, key } = source.names[i];
    nameArr[i] = `${this.style.prefix(name)}${name}`;
    if (key != null) {
      const keyStr = `#${key}`;
      nameArr[i] += this.style.prefix(keyStr) + keyStr;
    }
  }
  // // reset (also ends up adding a space at the end)
  // nameArr[len] = "\u001b[39m\u001b[49m";

  const f = this.filtered;
  const named = this.named.bind(this, source);
  return _createConsoleLogger(f, source, includes, con, true, nameArr, named);
}

function createConsoleLoggerNoStyle(
  this: InternalLoggerRef,
  con: IWorkerConsoleLogger,
  source: IWorkerLogSource
): ILogger {
  const includes = { ...this.includes, ...this.include(source) };

  const nameArr = new Array(source.names.length);
  for (let i = 0; i < source.names.length; i++) {
    const { name, key } = source.names[i];
    nameArr[i] = name;
    if (key != null) {
      nameArr[i] += `#${key}`;
    }
  }

  const f = this.filtered;
  const named = this.named.bind(this, source);
  return _createConsoleLogger(f, source, includes, con, false, nameArr, named);
}

const COLOR_HMM = "\u001b[38;5;13m";
const COLOR_TODO = "\u001b[38;5;14m";
const COLOR_ERROR = "\u001b[38;5;9m";
const COLOR_WARN = "\u001b[38;5;11m";
const COLOR_DEBUG = "\u001b[38;5;15m";
const COLOR_TRACE = "\u001b[38;5;7m";
/** Used by {@link createConsoleLoggerNoStyle} and {@link createConsoleLoggerStyled} */
function _createConsoleLogger(
  f: (this: IWorkerLogSource, level: _LoggerLevel, message: string, args?: object | undefined) => void,
  source: IWorkerLogSource,
  includes: Required<IWorkerLogIncludes>,
  con: IWorkerConsoleLogger,
  styled: boolean,
  prefix: ReadonlyArray<any>,
  named: (name: string, key?: string | number | undefined) => ILogger
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
  const logger: ILogger = {
    hmm: _hmm,
    todo: _todo,
    error: _error,
    warn: _warn,
    debug: _debug,
    trace: _trace,
    //
    named,
    downgrade() {
      return {
        debug: logger.debug,
        error: logger.error,
        warn: logger.warn,
        trace: logger.trace,
        named(name, key) {
          return logger.named(name, key).downgrade();
        },
      };
    },
  };

  return logger;
}
