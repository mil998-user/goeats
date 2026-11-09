interface RestaurantSecrets {
  payphoneToken?: string | null;
  issuer?: ({ firmaElectronica?: string | null; codigoSri?: string | null } & Record<string, unknown>) | null;
}

// Payment tokens and the SRI signature never leave the server
export function hideRestaurantSecrets<T extends RestaurantSecrets>(restaurant: T) {
  const { payphoneToken, issuer, ...publicData } = restaurant;

  if (!issuer) {
    return { ...publicData, hasPayphoneToken: Boolean(payphoneToken), issuer };
  }

  const { firmaElectronica, codigoSri, ...publicIssuer } = issuer;
  return {
    ...publicData,
    hasPayphoneToken: Boolean(payphoneToken),
    issuer: { ...publicIssuer, hasSignature: Boolean(firmaElectronica && codigoSri) },
  };
}
