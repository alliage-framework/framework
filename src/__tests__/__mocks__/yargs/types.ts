export interface YargsMock extends jest.Mock {
  apiMocks: {
    parserConfiguration: jest.Mock;
    scriptName: jest.Mock;
    command: jest.Mock;
    help: jest.Mock;
    positional: jest.Mock;
    option: jest.Mock;
    parseAsync: jest.Mock;
  };
  setExpectedArgs: (args: Record<string, unknown>) => void;
}
