type Constructor<T = object> = new (...args: any[]) => T;

// author: https://github.com/stevenulibarri/jest-typescript-mock-reference
export const instantiateClassMock = <T>(Clazz: Constructor<T>): jest.Mocked<T> => {
  return new Clazz() as jest.Mocked<T>;
};
