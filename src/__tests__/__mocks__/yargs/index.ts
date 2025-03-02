import { YargsMock } from './types';

const yargsMock = jest.fn() as unknown as YargsMock;

const apiMocks = {
  parserConfiguration: jest.fn().mockReturnThis(),
  scriptName: jest.fn().mockReturnThis(),
  command: jest
    .fn()
    .mockImplementation(function command(this: YargsMock, _command, _description, callback) {
      callback(yargsMock('__MOCK_COMMAND_CALLBACK__'));
      return this;
    }),
  help: jest.fn().mockReturnThis(),
  positional: jest.fn().mockReturnThis(),
  option: jest.fn().mockReturnThis(),
  parseAsync: jest.fn().mockResolvedValue({}),
};

yargsMock.mockReturnValue(apiMocks);

yargsMock.apiMocks = apiMocks;
yargsMock.setExpectedArgs = (args) => {
  apiMocks.parseAsync.mockResolvedValue(args);
};

const originalMockClear = yargsMock.mockClear;
yargsMock.mockClear = function mockClear() {
  apiMocks.parseAsync.mockResolvedValue({});
  originalMockClear.call(this);
  return this;
};

export default yargsMock;
