import { InstallScript } from '..';
import { Arguments } from '../../core/utils/cli';
import { Kernel } from '../../core/kernel';
import path from 'path';

jest.mock('../../core/kernel', () => {
  function Kernel() {};
  Kernel.prototype.build = jest.fn();
  Kernel.prototype.install = jest.fn();
  Kernel.prototype.run = jest.fn();
  return { Kernel };
});
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

const commandBuilderMock = {
  setDescription: jest.fn().mockReturnThis(),
  addArgument: jest.fn().mockReturnThis(),
};
const commandBuilderCreateMock = jest.fn().mockReturnValue(commandBuilderMock);
const argumentsParserMock = jest.fn();

describe('core/script/run', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('InstallScript', () => {
    describe('#execute', () => {
      it("should call the 'install' method of the kernel", async () => {
        jest.doMock(path.resolve('./alliage-modules.json'), () => ({}), { virtual: true });

        const args = Arguments.create();
        const buildScript = new InstallScript({ initial_value: 'test' });
        await buildScript.execute(args, 'test');

        expect(Kernel.prototype.build).not.toHaveBeenCalled();
        expect(Kernel.prototype.install).toHaveBeenCalledWith(args, 'test');
        expect(Kernel.prototype.run).not.toHaveBeenCalled();
      });
    });
  });
});
