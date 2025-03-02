import { Arguments } from '../../core/utils/cli';
import { execute, InstallScript, BuildScript, RunScript } from '..';

const installScriptExecuteMock = jest.fn();
jest.mock('../install', () => ({
  InstallScript: function InstallScript(this: InstallScript) {
    this.execute = installScriptExecuteMock;
  },
}));

const buildScriptExecuteMock = jest.fn();
jest.mock('../build', () => ({
  BuildScript: function BuildScript(this: BuildScript) {
    this.execute = buildScriptExecuteMock;
  },
}));

const runScriptExecuteMock = jest.fn();
jest.mock('../run', () => ({
  RunScript: function RunScript(this: RunScript) {
    this.execute = runScriptExecuteMock;
  },
}));

const commandBuilderMock = {
  setDescription: jest.fn().mockReturnThis(),
  addArgument: jest.fn().mockReturnThis(),
  addOption: jest.fn().mockReturnThis(),
};
const commandBuilderCreateMock = jest.fn().mockReturnValue(commandBuilderMock);
const argumentsParserMock = jest.fn();

jest.mock('../../core/utils/cli', () => {
  return {
    ...jest.requireActual('../../core/utils/cli'),
    CommandBuilder: {
      create: () => commandBuilderCreateMock(),
    },
    ArgumentsParser: {
      parse: (...args: unknown[]) => argumentsParserMock(...args),
    },
  };
});

describe('core/script', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#execute', () => {
    it("should run the install script if the first argument is 'install'", async () => {
      const args = Arguments.create();

      const parsedArguments = Arguments.create({ script: 'install', env: 'test' });
      argumentsParserMock.mockReturnValue(parsedArguments);

      await execute();

      expect(argumentsParserMock).toHaveBeenCalledWith(commandBuilderMock, args);

      expect(commandBuilderMock.setDescription).toHaveBeenCalledWith('Runs a script');
      expect(commandBuilderMock.addArgument).toHaveBeenCalledWith('script', {
        describe: 'The script to run',
        type: 'string',
        choices: ['install', 'build', 'run'],
      });
      expect(commandBuilderMock.addOption).toHaveBeenCalledWith('env', {
        describe: 'The execution environment',
        type: 'string',
        default: 'production',
      });

      expect(installScriptExecuteMock).toHaveBeenCalledWith(parsedArguments, 'test');
      expect(buildScriptExecuteMock).not.toHaveBeenCalled();
      expect(runScriptExecuteMock).not.toHaveBeenCalled();
    });

    it("should run the build script if the first argument is 'build'", async () => {
      const args = Arguments.create();

      const parsedArguments = Arguments.create({ script: 'build', env: 'test' });
      argumentsParserMock.mockReturnValue(parsedArguments);

      await execute();

      expect(argumentsParserMock).toHaveBeenCalledWith(commandBuilderMock, args);

      expect(commandBuilderMock.setDescription).toHaveBeenCalledWith('Runs a script');
      expect(commandBuilderMock.addArgument).toHaveBeenCalledWith('script', {
        describe: 'The script to run',
        type: 'string',
        choices: ['install', 'build', 'run'],
      });
      expect(commandBuilderMock.addOption).toHaveBeenCalledWith('env', {
        describe: 'The execution environment',
        type: 'string',
        default: 'production',
      });

      expect(installScriptExecuteMock).not.toHaveBeenCalled();
      expect(buildScriptExecuteMock).toHaveBeenCalledWith(parsedArguments, 'test');
      expect(runScriptExecuteMock).not.toHaveBeenCalled();
    });

    it("should run the run script if the first argument is 'run'", async () => {
      const args = Arguments.create();

      const parsedArguments = Arguments.create({ script: 'run', env: 'test' });
      argumentsParserMock.mockReturnValue(parsedArguments);

      await execute();

      expect(argumentsParserMock).toHaveBeenCalledWith(commandBuilderMock, args);

      expect(commandBuilderMock.setDescription).toHaveBeenCalledWith('Runs a script');
      expect(commandBuilderMock.addArgument).toHaveBeenCalledWith('script', {
        describe: 'The script to run',
        type: 'string',
        choices: ['install', 'build', 'run'],
      });
      expect(commandBuilderMock.addOption).toHaveBeenCalledWith('env', {
        describe: 'The execution environment',
        type: 'string',
        default: 'production',
      });

      expect(installScriptExecuteMock).not.toHaveBeenCalled();
      expect(buildScriptExecuteMock).not.toHaveBeenCalled();
      expect(runScriptExecuteMock).toHaveBeenCalledWith(parsedArguments, 'test');
    });

    it('should do nothing if the script does not exist', async () => {
      const args = Arguments.create();

      const parsedArguments = Arguments.create({ env: 'test' });
      argumentsParserMock.mockReturnValue(parsedArguments);

      await execute();

      expect(argumentsParserMock).toHaveBeenCalledWith(commandBuilderMock, args);

      expect(commandBuilderMock.setDescription).toHaveBeenCalledWith('Runs a script');
      expect(commandBuilderMock.addArgument).toHaveBeenCalledWith('script', {
        describe: 'The script to run',
        type: 'string',
        choices: ['install', 'build', 'run'],
      });
      expect(commandBuilderMock.addOption).toHaveBeenCalledWith('env', {
        describe: 'The execution environment',
        type: 'string',
        default: 'production',
      });

      expect(installScriptExecuteMock).not.toHaveBeenCalled();
      expect(buildScriptExecuteMock).not.toHaveBeenCalled();
      expect(runScriptExecuteMock).not.toHaveBeenCalledWith();
    });
  });
});
