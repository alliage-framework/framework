import { BuildScript } from '..';
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

describe('core/script/build', () => {
  describe('BuildScript', () => {
    describe('#execute', () => {
      it("should call the 'build' method of the kernel", async () => {
        jest.doMock(path.resolve('./alliage-modules.json'), () => ({}), { virtual: true });

        const args = Arguments.create();
        const buildScript = new BuildScript({ initial_value: 'test' });
        await buildScript.execute(args, 'test');

        expect(Kernel.prototype.build).toHaveBeenCalledWith(args, 'test');
        expect(Kernel.prototype.install).not.toHaveBeenCalled();
        expect(Kernel.prototype.run).not.toHaveBeenCalled();
      });
    });
  });
});
