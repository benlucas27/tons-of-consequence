import { createContext, useContext } from 'react';
export const FeedInfo = createContext({ feedVersion: '', feedSource: '', counts: {} });
export const useFeedInfo = () => useContext(FeedInfo);
