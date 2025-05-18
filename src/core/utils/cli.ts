import yargs, { Argv } from 'yargs';
const CLI_PATTERNS: [RegExp, string][] = [
  [/npm-cli\.js$/, 'npm'],
  [/yarn\.js$/, 'yarn'],
  [/pnpm-cli\.js$/, 'pnpm'],
  [/bun$/, 'bun'],
  [/deno$/, 'deno'],
];

type ParsedArgs = { [key: string]: string | number | boolean };

export class Arguments {
  private remainingArgs: string[];

  private parsedArgs: ParsedArgs;

  private command: string;

  private parentArguments?: Arguments;

  private constructor(
    parsedArgs: ParsedArgs = {},
    remainingArgs: string[] = process.argv.slice(2),
    command: string = '',
    parentArguments?: Arguments,
  ) {
    this.parsedArgs = parsedArgs;
    this.remainingArgs = remainingArgs;
    this.parentArguments = parentArguments;
    if (this.parentArguments) {
      const parentCommand = this.parentArguments.getCommand();
      this.command =
        parentCommand.length > 0
          ? `${parentCommand}${command && command.length > 0 ? ` ${command}` : ''}`
          : command;
    } else if (process.env.npm_execpath && process.env.npm_lifecycle_event) {
      this.command = `${
        CLI_PATTERNS.find(([pattern]) => pattern.test(process.env.npm_execpath as string))?.[1] ??
        process.env.npm_execpath
      } ${process.env.npm_lifecycle_event}`;
    } else {
      this.command = command;
    }
  }

  get<T = string>(name: string): T {
    return this.parsedArgs[name] as unknown as T;
  }

  getRemainingArgs() {
    return this.remainingArgs;
  }

  getCommand() {
    return this.command;
  }

  getParent() {
    return this.parentArguments;
  }

  createChild(parsedArgs: ParsedArgs = {}, remainingArgs: string[] = [], subCommand: string = '') {
    return Arguments.create(
      parsedArgs,
      remainingArgs,
      this.parentArguments ? subCommand : '',
      this,
    );
  }

  static create(
    parsedArgs?: ParsedArgs,
    args?: string[],
    command?: string,
    parentArguments?: Arguments,
  ) {
    return new Arguments(parsedArgs, args, command, parentArguments);
  }
}

export interface ArgumentDescrition {
  describe: string;
  type?: 'number' | 'string' | 'boolean';
  default?: string | number | boolean;
  choices?: (string | number | boolean)[];
}

export class CommandBuilder {
  private arguments: Array<ArgumentDescrition & { name: string }>;

  private options: { [name: string]: ArgumentDescrition };

  private description: string;

  private constructor() {
    this.arguments = [];
    this.options = {};
    this.description = '';
  }

  public addOption(name: string, description: ArgumentDescrition) {
    this.options[name] = description;
    return this;
  }

  public addArgument(name: string, description: ArgumentDescrition) {
    this.arguments.push({
      name,
      ...description,
    });
    return this;
  }

  public setDescription(desc: string) {
    this.description = desc;
    return this;
  }

  public getDescription() {
    return this.description;
  }

  public getOptions() {
    return Object.freeze({ ...this.options });
  }

  public getArguments() {
    return Object.freeze([...this.arguments]);
  }

  public static create() {
    return new CommandBuilder();
  }
}

export class ArgumentParserValidationError extends Error {
  constructor(public help: string) {
    super('Invalid arguments');
  }
}

export type ArgumentParserParseOptions = {
  exitOnFailure: boolean;
};

export class ArgumentsParser {
  protected builder: CommandBuilder;

  protected arguments: Arguments;

  protected constructor(builder: CommandBuilder, baseArgs: Arguments = Arguments.create()) {
    this.builder = builder;
    this.arguments = baseArgs;
  }

  protected async parse({ exitOnFailure }: ArgumentParserParseOptions) {
    const builderArgs = this.builder.getArguments();
    const builderOptions = Object.entries(this.builder.getOptions());
    const hasArgs = builderArgs.length > 0;
    const hasOptions = builderOptions.length > 0;

    if (!hasArgs && !hasOptions) {
      return this.arguments;
    }

    const yargsInstance = yargs(this.arguments.getRemainingArgs())
      .parserConfiguration({
        'unknown-options-as-args': true,
      })
      .scriptName(this.arguments.getCommand());

    if (hasArgs) {
      yargsInstance.command(
        `$0 ${builderArgs
          .map((args) => (args.default ? `[${args.name}]` : `<${args.name}>`))
          .join(' ')}`,
        this.builder.getDescription(),
        (subYargs: Argv) => {
          builderArgs.forEach(({ name, ...desc }) =>
            subYargs.positional(name, {
              ...desc,
              choices: this._convertChoices(desc.choices),
            }),
          );
          builderOptions.forEach(([name, desc]) =>
            subYargs.option(name, {
              ...desc,
              choices: this._convertChoices(desc.choices),
            }),
          );
        },
      );
    } else {
      builderOptions.forEach(([name, desc]) =>
        yargsInstance.option(name, {
          ...desc,
          choices: this._convertChoices(desc.choices),
        }),
      );
    }

    try {
      const {
        _,
        $0: _scriptName,
        ...parsedArgs
      } = await yargsInstance
        .help()
        .showHelpOnFail(false)
        .fail((_msg, err) => {
          throw err ?? new Error('yargs_validation_error');
        })
        .parseAsync();

      return this.arguments.createChild(
        parsedArgs as ParsedArgs,
        _.map((a) => a.toString()),
        builderArgs.map(({ name }) => parsedArgs[name]).join(' '),
      );
    } catch (err) {
      const help = await new Promise<string>((resolve) => yargsInstance.showHelp(resolve));
      if (exitOnFailure) {
        console.error(help);
        process.exit(1);
      }
      if (err instanceof Error && err.message === 'yargs_validation_error') {
        throw new ArgumentParserValidationError(help);
        /* v8 ignore next 3 lines */
      }
      throw err;
    }
  }

  private _convertChoices(choices: ArgumentDescrition['choices']) {
    return choices?.map((c) => (typeof c === 'boolean' ? (c as true) || undefined : c));
  }

  static parse(
    builder: CommandBuilder,
    baseArgs?: Arguments,
    { exitOnFailure = true }: Partial<ArgumentParserParseOptions> = {},
  ) {
    return new ArgumentsParser(builder, baseArgs).parse({ exitOnFailure });
  }
}
