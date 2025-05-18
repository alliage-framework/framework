import { InstallScript } from '..';
import { Arguments } from '../../core/utils/cli';
import { Kernel } from '../../core/kernel';
import { vi, describe, it, expect } from 'vitest';
import path from 'path';

vi.mock('../../core/kernel', () => {
  function Kernel() {};
  Kernel.prototype.build = vi.fn();
  Kernel.prototype.install = vi.fn();
  Kernel.prototype.run = vi.fn();
  return { Kernel };
});

describe('core/script/install', () => {
  describe('InstallScript', () => {
    describe('#execute', () => {
      it("should call the 'install' method of the kernel", async () => {
        vi.doMock(path.resolve('./alliage-modules.json'), () => ({ default: {}}));

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