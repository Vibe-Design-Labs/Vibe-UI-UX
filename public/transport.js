// Local/Worker builds use the same-origin relay. build:pages switches only
// the generated static artifact to direct browser requests to TokenDance.
export const transportMode = 'relay';
