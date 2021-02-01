import { getAlgorithm } from './utils';

const data = {
  nodes: [
    {
      id: 'A',
      label: 'A',
    },
    {
      id: 'B',
      label: 'B',
    },
    {
      id: 'C',
      label: 'C',
    },
    {
      id: 'D',
      label: 'D',
    },
    {
      id: 'E',
      label: 'E',
    },
    {
      id: 'F',
      label: 'F',
    },
    {
      id: 'G',
      label: 'G',
    },
    {
      id: 'H',
      label: 'H',
    },
  ],
  edges: [
    {
      source: 'A',
      target: 'B',
    },
    {
      source: 'B',
      target: 'C',
    },
    {
      source: 'C',
      target: 'G',
    },
    {
      source: 'A',
      target: 'D',
    },
    {
      source: 'A',
      target: 'E',
    },
    {
      source: 'E',
      target: 'F',
    },
    {
      source: 'F',
      target: 'D',
    },
    {
      source: 'D',
      target: 'E',
    },
  ],
};

describe('(Async) Shortest Path from source to target on graph', () => {
  it('find the shortest path', async () => {
    const { findShortestPathAsync } = await getAlgorithm();
    const { length, path } = await findShortestPathAsync(data, 'A', 'C');
    expect(length).toBe(2);
    expect(path).toStrictEqual(['A', 'B', 'C']);
  });

  it('find all paths', async () => {
    const { findAllPathAsync } = await getAlgorithm();
    const allPaths = await findAllPathAsync(data, 'A', 'E');
    expect(allPaths.length).toBe(3);
    expect(allPaths[0]).toStrictEqual(['A', 'D', 'F', 'E']);
    expect(allPaths[1]).toStrictEqual(['A', 'D', 'E']);
    expect(allPaths[2]).toStrictEqual(['A', 'E']);
  });

  it('find all paths in directed graph', async () => {
    const { findAllPathAsync } = await getAlgorithm();
    const allPaths = await findAllPathAsync(data, 'A', 'E', true);
    expect(allPaths.length).toStrictEqual(2);
    expect(allPaths[0]).toStrictEqual(['A', 'D', 'E']);
    expect(allPaths[1]).toStrictEqual(['A', 'E']);
  });
});
