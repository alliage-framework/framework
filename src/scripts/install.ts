import { AbstractScript } from '../core/script/index.js';
import { Arguments } from '../core/utils/cli.js';

export class InstallScript extends AbstractScript {
  public async execute(args: Arguments, env: string) {
    await super.execute(args, env);
    return this.getKernel().install(args, env);
  }
}
