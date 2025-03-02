import { RunScript } from '..';
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

describe('core/script/run', () => {
  describe('RunScript', () => {
    describe('#execute', () => {
      it("should call the 'run' method of the kernel", async () => {
        jest.doMock(path.resolve('./alliage-modules.json'), () => ({}), { virtual: true });

        const args = Arguments.create();
        const runScript = new RunScript({ initial_value: 'test' });
        await runScript.execute(args, 'test');

        expect(Kernel.prototype.build).not.toHaveBeenCalled();
        expect(Kernel.prototype.install).not.toHaveBeenCalled();
        expect(Kernel.prototype.run).toHaveBeenCalledWith(args, 'test');
      });
    });
  });
});
