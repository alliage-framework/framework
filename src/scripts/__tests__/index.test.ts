import { describe, it, expect, afterEach, vi } from 'vitest';
import { Arguments } from '../../core/utils/cli';
import { execute, InstallScript, BuildScript, RunScript } from '..';

const mocks = vi.hoisted(() => {
  const commandBuilderMock = {
    setDescription: vi.fn().mockReturnThis(),
    addArgument: vi.fn().mockReturnThis(),
    addOption: vi.fn().mockReturnThis(),
  };

  return {
    installScriptExecuteMock: vi.fn(),
    buildScriptExecuteMock: vi.fn(),
    runScriptExecuteMock: vi.fn(),
    argumentsParserMock: vi.fn(),
    commandBuilderMock,
    commandBuilderCreateMock: vi.fn().mockReturnValue(commandBuilderMock),
  }
});

vi.mock('../install', () => ({
  InstallScript: function InstallScript(this: InstallScript) {
    this.execute = mocks.installScriptExecuteMock;
  },
}));

vi.mock('../build', () => ({
  BuildScript: function BuildScript(this: BuildScript) {
    this.execute = mocks.buildScriptExecuteMock;
  },
}));

vi.mock('../run', () => ({
  RunScript: function RunScript(this: RunScript) {
    this.execute = mocks.runScriptExecuteMock;
  },
}));

vi.mock('../../core/utils/cli', async (importOriginal) => {
  const actual = await importOriginal() as typeof import('../../core/utils/cli');
  return {
    ...actual,
    CommandBuilder: {
      create: () => mocks.commandBuilderCreateMock(),
    },
    ArgumentsParser: {
      parse: (...args: unknown[]) => mocks.argumentsParserMock(...args),
    },
  };
});   

describe('core/script', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('#execute', () => {
    it("should run the install script if the first argument is 'install'", async () => {
      const args = Arguments.create();

      const parsedArguments = Arguments.create({ script: 'install', env: 'test' });
      mocks.argumentsParserMock.mockReturnValue(parsedArguments);

      await execute();

      expect(mocks.argumentsParserMock).toHaveBeenCalledWith(mocks.commandBuilderMock, args);

      expect(mocks.commandBuilderMock.setDescription).toHaveBeenCalledWith('Runs a script');
      expect(mocks.commandBuilderMock.addArgument).toHaveBeenCalledWith('script', {
        describe: 'The script to run',
        type: 'string',
        choices: ['install', 'build', 'run'],
      });
      expect(mocks.commandBuilderMock.addOption).toHaveBeenCalledWith('env', {
        describe: 'The execution environment',
        type: 'string',
        default: 'production',
      });

      expect(mocks.installScriptExecuteMock).toHaveBeenCalledWith(parsedArguments, 'test');
      expect(mocks.buildScriptExecuteMock).not.toHaveBeenCalled();
      expect(mocks.runScriptExecuteMock).not.toHaveBeenCalled();
    });

    it("should run the build script if the first argument is 'build'", async () => {
      const args = Arguments.create();

      const parsedArguments = Arguments.create({ script: 'build', env: 'test' });
      mocks.argumentsParserMock.mockReturnValue(parsedArguments);

      await execute();

      expect(mocks.argumentsParserMock).toHaveBeenCalledWith(mocks.commandBuilderMock, args);

      expect(mocks.commandBuilderMock.setDescription).toHaveBeenCalledWith('Runs a script');
      expect(mocks.commandBuilderMock.addArgument).toHaveBeenCalledWith('script', {
        describe: 'The script to run',
        type: 'string',
        choices: ['install', 'build', 'run'],
      });
      expect(mocks.commandBuilderMock.addOption).toHaveBeenCalledWith('env', {
        describe: 'The execution environment',
        type: 'string',
        default: 'production',
      });

      expect(mocks.installScriptExecuteMock).not.toHaveBeenCalled();
      expect(mocks.buildScriptExecuteMock).toHaveBeenCalledWith(parsedArguments, 'test');
      expect(mocks.runScriptExecuteMock).not.toHaveBeenCalled();
    });

    it("should run the run script if the first argument is 'run'", async () => {
      const args = Arguments.create();

      const parsedArguments = Arguments.create({ script: 'run', env: 'test' });
      mocks.argumentsParserMock.mockReturnValue(parsedArguments);

      await execute();

      expect(mocks.argumentsParserMock).toHaveBeenCalledWith(mocks.commandBuilderMock, args);

      expect(mocks.commandBuilderMock.setDescription).toHaveBeenCalledWith('Runs a script');
      expect(mocks.commandBuilderMock.addArgument).toHaveBeenCalledWith('script', {
        describe: 'The script to run',
        type: 'string',
        choices: ['install', 'build', 'run'],
      });
      expect(mocks.commandBuilderMock.addOption).toHaveBeenCalledWith('env', {
        describe: 'The execution environment',
        type: 'string',
        default: 'production',
      });

      expect(mocks.installScriptExecuteMock).not.toHaveBeenCalled();
      expect(mocks.buildScriptExecuteMock).not.toHaveBeenCalled();
      expect(mocks.runScriptExecuteMock).toHaveBeenCalledWith(parsedArguments, 'test');
    });

    it('should do nothing if the script does not exist', async () => {
      const args = Arguments.create();

      const parsedArguments = Arguments.create({ env: 'test' });
      mocks.argumentsParserMock.mockReturnValue(parsedArguments);

      await execute();

      expect(mocks.argumentsParserMock).toHaveBeenCalledWith(mocks.commandBuilderMock, args);

      expect(mocks.commandBuilderMock.setDescription).toHaveBeenCalledWith('Runs a script');
      expect(mocks.commandBuilderMock.addArgument).toHaveBeenCalledWith('script', {
        describe: 'The script to run',
        type: 'string',
        choices: ['install', 'build', 'run'],
      });
      expect(mocks.commandBuilderMock.addOption).toHaveBeenCalledWith('env', {
        describe: 'The execution environment',
        type: 'string',
        default: 'production',
      });

      expect(mocks.installScriptExecuteMock).not.toHaveBeenCalled();
      expect(mocks.buildScriptExecuteMock).not.toHaveBeenCalled();
      expect(mocks.runScriptExecuteMock).not.toHaveBeenCalledWith();
    });
  });
});