import { AbstractScript } from '../core/script';
import { Arguments } from '../core/utils/cli';

export class BuildScript extends AbstractScript {
  public async execute(args: Arguments, env: string) {
    await super.execute(args, env);
    return this.getKernel().build(args, env);
  }
}
