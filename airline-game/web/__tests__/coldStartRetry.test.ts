import { getMeta, ApiError } from '@/services/api';

const jsonRes = (status: number, body: unknown): Response =>
  ({ status, ok: status >= 200 && status < 300, json: async () => body } as Response);

describe('S2 cold-start retry', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('retries 503 (waking instance) then succeeds on 200', async () => {
    jest.useFakeTimers();
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonRes(503, null))
      .mockResolvedValueOnce(jsonRes(503, null))
      .mockResolvedValueOnce(jsonRes(200, { cities: [], aircraftModels: [] }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const promise = getMeta();
    await jest.advanceTimersByTimeAsync(1500);
    await jest.advanceTimersByTimeAsync(3000);
    const meta = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(meta).toEqual({ cities: [], aircraftModels: [] });
  });

  it('does not retry a 404 — surfaces immediately for S1 recovery', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue(jsonRes(404, { error: { message: 'Game not found', type: 'not_found' } }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(getMeta()).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
