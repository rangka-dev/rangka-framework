import { describe, it, expect } from 'vitest';
import { Card } from '../card';

describe('Card API surface', () => {
  it('exports Card with sub-components', () => {
    expect(Card).toBeDefined();
    expect(Card.Header).toBeDefined();
    expect(Card.Title).toBeDefined();
    expect(Card.Description).toBeDefined();
    expect(Card.Action).toBeDefined();
    expect(Card.Content).toBeDefined();
    expect(Card.Footer).toBeDefined();
  });

  it('sub-components have display names', () => {
    expect(Card.Header.displayName).toBe('Card.Header');
    expect(Card.Title.displayName).toBe('Card.Title');
    expect(Card.Description.displayName).toBe('Card.Description');
    expect(Card.Action.displayName).toBe('Card.Action');
    expect(Card.Content.displayName).toBe('Card.Content');
    expect(Card.Footer.displayName).toBe('Card.Footer');
  });
});
