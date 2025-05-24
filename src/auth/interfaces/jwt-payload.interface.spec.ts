import { JwtPayload } from './jwt-payload.interface';

describe('JwtPayload interface', () => {
  it('should return true for a valid payload', () => {
    const id = 'Abc123';
    const validPayload: JwtPayload = { id };

    expect(validPayload.id).toBe(id);
  });
});
