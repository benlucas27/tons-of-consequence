// Holds the feed the shared site code reads its data from (through ./doors). Must be filled BEFORE the shared code loads.
let feed = null;
export const setFeed = (f) => { feed = f; };
export const getFeed = () => feed;

export function door(file, name) {
  const v = feed && feed.data[file] ? feed.data[file][name] : undefined;
  return v && typeof v === 'object' && Array.isArray(v.$set) ? new Set(v.$set) : v;
}
