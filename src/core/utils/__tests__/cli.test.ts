import yargs from 'yargs';

import { CommandBuilder, Arguments, ArgumentsParser } from '../cli';
import { YargsMock } from '../../../__tests__/__mocks__/yargs/types';

describe('core/utils/cli', () => {
  let PREV_ENV: NodeJS.ProcessEnv;
  beforeEach(() => {
    jest.resetModules();
    PREV_ENV = process.env;
    process.env = {};
  });

  afterEach(() => {
    process.env = PREV_ENV;
    jest.clearAllMocks();
  });

  describe('CommandBuilder', () => {
    describe('#addOption / #getOptions', () => {
      it('should correclty add an option', () => {
        const cb = CommandBuilder.create()
          .addOption('test-option1', {
            describe: 'Test option 1',
            type: 'string',
            default: 'default option 1',
          })
          .addOption('test-option2', {
            describe: 'Test option 2',
            type: 'boolean',
            default: true,
          })
          .addOption('test-option3', {
            describe: 'Test option 3',
            type: 'number',
            choices: [1, 2, 3],
          })

        expect(cb.getOptions()).toEqual({
          'test-option1': {
            default: 'default option 1',
            describe: 'Test option 1',
            type: 'string',
          },
          'test-option2': {
            default: true,
            describe: 'Test option 2',
            type: 'boolean',
          },
          'test-option3': {
            choices: [1, 2, 3],
            describe: 'Test option 3',
            type: 'number',
          },
        });
      });

      it('should return nothing if no option has been set', () => {
        expect(CommandBuilder.create().getOptions()).toEqual({});
      });
    });

    describe('#addArgument / #getArguments', () => {
      it('should correctly add an argumet', () => {
        const cb = CommandBuilder.create()
          .addArgument('test-argument1', {
            describe: 'Test argument 1',
            type: 'string',
            default: 'default argument 1',
          })
          .addArgument('test-argument2', {
            describe: 'Test argument 2',
            type: 'boolean',
            default: true,
          })
          .addArgument('test-argument3', {
            describe: 'Test argument 3',
            type: 'number',
            choices: [1, 2, 3],
          });

        expect(cb.getArguments()).toEqual([
          {
            default: 'default argument 1',
            describe: 'Test argument 1',
            name: 'test-argument1',
            type: 'string',
          },
          { default: true, describe: 'Test argument 2', name: 'test-argument2', type: 'boolean' },
          {
            choices: [1, 2, 3],
            describe: 'Test argument 3',
            name: 'test-argument3',
            type: 'number',
          },
        ]);
      });

      it('should return nothing is no argument has been set', () => {
        expect(CommandBuilder.create().getArguments()).toEqual([]);
      });
    });

    describe('#getDescription / #setDescription', () => {
      it('should correctly set the description', () => {
        const cb = CommandBuilder.create().setDescription('Test description');

        expect(cb.getDescription()).toEqual('Test description');
      });

      it('should return an empty string is no description has been set', () => {
        expect(CommandBuilder.create().getDescription()).toEqual('');
      });
    });
  });

  describe('Arguments', () => {
    describe('#get', () => {
      it("should return of the values of the 'parsedArgs'", () => {
        const agts = Arguments.create({ foo: 'bar', test: 42, isBoolean: true });

        expect(agts.get('foo')).toEqual('bar');
        expect(agts.get('test')).toBe(42);
        expect(agts.get('isBoolean')).toBe(true);
        expect(agts.get('unknownArgument')).toBeUndefined();
      });
    });

    describe('#getRemainingArgs', () => {
      it("should return the 'remainingArgs'", () => {
        const agts = Arguments.create({}, ['test', 'other', 'args']);

        expect(agts.getRemainingArgs()).toEqual(['test', 'other', 'args']);
      });
    });

    describe('#getCommand', () => {
      it('should return the command if no parent command is defined and it is not run through an NPM script', () => {
        process.env.npm_execpath = undefined;
        process.env.npm_lifecycle_event = undefined;

        const agts = Arguments.create({}, [], 'sub-command');

        expect(agts.getCommand()).toEqual('sub-command');
      });

      it('should return the npm script command if no command nor parent is defined', () => {
        process.env.npm_execpath = 'path/to/npm-cli.js';
        process.env.npm_lifecycle_event = 'test:script';

        const agts1 = Arguments.create({}, []);

        expect(agts1.getCommand()).toEqual('npm test:script');

        process.env.npm_execpath = 'path/to/yarn.js';
        process.env.npm_lifecycle_event = 'test:script';

        const agts2 = Arguments.create({}, []);

        expect(agts2.getCommand()).toEqual('yarn test:script');
      });

      it("should use the original script path if it's not npm or yarn", () => {
        process.env.npm_execpath = 'path/to/unknown-cli.js';
        process.env.npm_lifecycle_event = 'test:script';

        const agts = Arguments.create({}, []);

        expect(agts.getCommand()).toEqual('path/to/unknown-cli.js test:script');
      });

      it("should return the concatenation of the parent's command and the command", () => {
        process.env.npm_execpath = undefined;
        process.env.npm_lifecycle_event = undefined;

        const agts = Arguments.create(
          {},
          [],
          'sub-command',
          Arguments.create({}, [], 'parent-command'),
        );

        expect(agts.getCommand()).toEqual('parent-command sub-command');
      });

      it('should just return command if the parent is defined but has an empty command', () => {
        process.env.npm_execpath = undefined;
        process.env.npm_lifecycle_event = undefined;

        const agts = Arguments.create({}, [], 'sub-command', Arguments.create({}, [], ''));

        expect(agts.getCommand()).toEqual('sub-command');
      });
    });

    describe('#getParent', () => {
      it('should return the parent arguments', () => {
        const parent = Arguments.create({}, [], 'parent');
        const child = Arguments.create({}, [], 'child', parent);

        expect(child.getParent()).toBe(parent);
      });

      it('should return nothing if no parent is defined', () => {
        const agts = Arguments.create({}, [], 'command');

        expect(agts.getParent()).toBeUndefined();
      });
    });

    describe('#createChild', () => {
      it('should create a child Arguments', () => {
        process.env.npm_execpath = undefined;
        process.env.npm_lifecycle_event = undefined;

        const parent = Arguments.create({}, [], 'parent-command', Arguments.create());
        const child = parent.createChild({ foo: 'bar' }, ['test'], 'child-command');

        expect(child.getParent()).toBe(parent);
        expect(child.get('foo')).toEqual('bar');
        expect(child.getRemainingArgs()).toEqual(['test']);
        expect(child.getCommand()).toEqual('parent-command child-command');
      });

      it('should ignore the `subCommand` if the Arguments has no parent', () => {
        process.env.npm_execpath = undefined;
        process.env.npm_lifecycle_event = undefined;

        const parent = Arguments.create({}, [], 'parent-command');
        const child = parent.createChild({ foo: 'bar' }, ['test'], 'child-command');

        expect(child.getCommand()).toEqual('parent-command');
      });

      it('should have default values for each arguments', () => {
        process.env.npm_execpath = undefined;
        process.env.npm_lifecycle_event = undefined;

        const parent = Arguments.create(
          { test: 'test value' },
          [],
          'parent-command',
          Arguments.create(),
        );
        const child = parent.createChild();

        expect(child.getRemainingArgs()).toEqual([]);
        expect(child.getCommand()).toEqual('parent-command');
        expect(child.get('test')).toBeUndefined();
      });
    });
  });

  describe('ArgumentsParser', () => {
    describe('#parse', () => {
      const commandBuilder = CommandBuilder.create()
        .setDescription('Test description')
        .addOption('test-option1', {
          describe: 'Test option 1',
          type: 'string',
          default: 'default option 1',
        })
        .addOption('test-option2', {
          describe: 'Test option 2',
          type: 'boolean',
          default: true,
        })
        .addOption('test-option3', {
          describe: 'Test option 3',
          type: 'boolean',
          choices: [true, false],
        })
        .addArgument('test-argument1', {
          describe: 'Test argument 1',
          type: 'number',
          choices: [1, 2, 3],
        })
        .addArgument('test-argument2', {
          describe: 'Test argument 2',
          type: 'string',
          default: 'default argument 2',
        });

      it('should parse arguments according to the provided CommandBuilder', async () => {
        const yargsMock = (yargs as unknown) as YargsMock;
        yargsMock.setExpectedArgs({
          'test-argument1': 3,
          'test-argument2': 'test',
          'test-option1': 'hello',
          'test-option2': false,
          'test-option3': true,
          _: ['unwanted-arg'],
        });

        const args = await ArgumentsParser.parse(
          commandBuilder,
          Arguments.create(
            {},
            ['3', 'test', '--test-option1="hello"', '--test-option2=0', 'unwanted-arg'],
            'test-command',
            Arguments.create(),
          ),
        );

        expect(yargsMock).toHaveBeenNthCalledWith(1, [
          '3',
          'test',
          '--test-option1="hello"',
          '--test-option2=0',
          'unwanted-arg',
        ]);
        expect(yargsMock.apiMocks.parserConfiguration).toHaveBeenCalledWith({
          'unknown-options-as-args': true,
        });
        expect(yargsMock.apiMocks.scriptName).toHaveBeenCalledWith('test-command');

        expect(yargsMock.apiMocks.command).toHaveBeenCalledWith(
          '$0 <test-argument1> [test-argument2]',
          'Test description',
          expect.any(Function),
        );
        expect(yargsMock).toHaveBeenNthCalledWith(2, '__MOCK_COMMAND_CALLBACK__');
        expect(yargsMock.apiMocks.positional).toHaveBeenNthCalledWith(1, 'test-argument1', {
          describe: 'Test argument 1',
          type: 'number',
          choices: [1, 2, 3],
        });
        expect(yargsMock.apiMocks.positional).toHaveBeenNthCalledWith(2, 'test-argument2', {
          describe: 'Test argument 2',
          type: 'string',
          default: 'default argument 2',
        });
        expect(yargsMock.apiMocks.option).toHaveBeenCalledWith('test-option1', {
          describe: 'Test option 1',
          type: 'string',
          default: 'default option 1',
        });
        expect(yargsMock.apiMocks.option).toHaveBeenCalledWith('test-option2', {
          describe: 'Test option 2',
          type: 'boolean',
          default: true,
        });

        expect(yargsMock.apiMocks.help).toHaveBeenCalled();
        expect(args.get('test-argument1')).toEqual(3);
        expect(args.get('test-argument2')).toEqual('test');
        expect(args.get('test-option1')).toEqual('hello');
        expect(args.get('test-option2')).toEqual(false);
        expect(args.getRemainingArgs()).toEqual(['unwanted-arg']);
        expect(args.getCommand()).toEqual('test-command 3 test');
      });

      it("should return the same 'baseArgs' if nothing is configured in the command builder", async () => {
        const baseArgs = Arguments.create();
        const args = await ArgumentsParser.parse(CommandBuilder.create(), baseArgs);

        expect(args).toBe(baseArgs);
      });

      it('should allow to have no expected arguments', async () => {
        const yargsMock = (yargs as unknown) as YargsMock;
        // case1: without remaining args
        yargsMock.setExpectedArgs({
          '@__FIRST_ARGUMENT__@': '@__EMTPY_VALUE__@',
          'test-option': 'test',
          _: [],
        });

        const builder1 = CommandBuilder.create().addOption('test-option', {
          describe: 'Test option',
        });

        const args1 = await ArgumentsParser.parse(builder1, Arguments.create({}, ['--test-option=test']));

        expect(yargsMock.apiMocks.command).toHaveBeenCalledWith(
          '$0 [@__FIRST_ARGUMENT__@]',
          '',
          expect.any(Function),
        );

        expect(args1.getRemainingArgs()).toEqual([]);
        expect(args1.get('test-option')).toEqual('test');

        // case2: with remaining args
        yargsMock.setExpectedArgs({
          '@__FIRST_ARGUMENT__@': 'arg1',
          'test-option': 'test',
          _: ['arg2', 'arg3'],
        });

        const builder2 = CommandBuilder.create().addOption('test-option', {
          describe: 'Test option',
        });

        const args2 = await ArgumentsParser.parse(
          builder2,
          Arguments.create({}, ['--test-option=test', 'arg1', 'arg2', 'arg3']),
        );

        expect(yargsMock.apiMocks.command).toHaveBeenCalledWith(
          '$0 [@__FIRST_ARGUMENT__@]',
          '',
          expect.any(Function),
        );

        expect(args2.getRemainingArgs()).toEqual(['arg1', 'arg2', 'arg3']);
        expect(args2.get('test-option')).toEqual('test');
      });

      it("should allow the 'baseArgs' argument to be optional", async () => {
        const args = await ArgumentsParser.parse(CommandBuilder.create());

        expect(args).toBeInstanceOf(Arguments);
      });
    });
  });
});
