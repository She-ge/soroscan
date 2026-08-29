export interface SC21Event {
  contractId: string;
  topic: string;
  payload: string[];
}

export function filterSC21Events(events: SC21Event[], topicFilter: string): SC21Event[] {
  return events.filter((e) => e.topic === topicFilter);
}
