import yargs from 'yargs';
const CLI_PATTERNS: [RegExp, string][] = [
  [/npm-cli\.js$/, 'npm'],
  [/yarn\.js$/, 'yarn'],
  [/pnpm-cli\.js$/, 'pnpm'],
  [/bun$/, 'bun'],
  [/deno$/, 'deno'],
];

const EMPTY_VALUE = '@__EMTPY_VALUE__@';
const FIRST_ARGUMENT = '@__FIRST_ARGUMENT__@';

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

export class ArgumentsParser {
  protected builder: CommandBuilder;

  protected arguments: Arguments;

  protected constructor(builder: CommandBuilder, baseArgs: Arguments = Arguments.create()) {
    this.builder = builder;
    this.arguments = baseArgs;
  }

  protected async parse() {
    const builderArgs = this.builder.getArguments();
    const builderOptions = Object.entries(this.builder.getOptions());
    const hasArgs = builderArgs.length > 0;
    const hasOptions = builderOptions.length > 0;

    if (!hasArgs && !hasOptions) {
      return this.arguments;
    }

    const argumentList = hasArgs
      ? builderArgs
      : [
          {
            name: FIRST_ARGUMENT,
            describe: 'no arguments required',
            default: EMPTY_VALUE,
          },
        ];

    const { _, $0, ...parsedArgs } = await yargs(this.arguments.getRemainingArgs())
      .parserConfiguration({
        'unknown-options-as-args': true,
      })
      .scriptName(this.arguments.getCommand())
      .command(
        `$0 ${argumentList
          .map((args) => (args.default ? `[${args.name}]` : `<${args.name}>`))
          .join(' ')}`,
        this.builder.getDescription(),
        (subYargs: yargs.Argv) => {
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
      )
      .help()
      .parseAsync();

    const { [FIRST_ARGUMENT]: _firstArg, ...args } = parsedArgs;
    return this.arguments.createChild(
      args as ParsedArgs,
      this._computeRemainingArgs(hasArgs, parsedArgs, _.map((a) => a.toString())),
      builderArgs.map(({ name }) => parsedArgs[name]).join(' '),
    );
  }

  private _computeRemainingArgs(hasArgs: boolean, parsedArgs: Record<string, unknown>, remainingArgs: string[]) {
    if (hasArgs || parsedArgs[FIRST_ARGUMENT] === EMPTY_VALUE) {
      return remainingArgs;
    }

    return [parsedArgs[FIRST_ARGUMENT] as string, ...remainingArgs.map((a) => a.toString())];
  }

  private _convertChoices(choices: ArgumentDescrition['choices']) {
    return choices?.map((c) => (typeof c === 'boolean' ? ((c as true) || undefined) : c));
  }

  static parse(builder: CommandBuilder, baseArgs?: Arguments) {
    return new ArgumentsParser(builder, baseArgs).parse();
  }
}
