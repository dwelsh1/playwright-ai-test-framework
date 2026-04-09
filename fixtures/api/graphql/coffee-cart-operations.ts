/**
 * GraphQL operation documents for Coffee Cart `POST /api/graphql`.
 * Keep strings stable; import into specs instead of inline query text.
 */

export const COFFEES_QUERY = /* GraphQL */ `
  query Coffees {
    coffees {
      name
      price
      discounted
      recipe {
        name
        quantity
      }
    }
  }
`;

export const INVALID_FIELD_QUERY = /* GraphQL */ `
  query Broken {
    coffees {
      name
      notARealField
    }
  }
`;
