/**
 * Minimal typing for the part of `ws` that scripts/evidence/responsive.ts uses.
 *
 * `ws` is already present in node_modules as a transitive dependency, and this is an evidence
 * script rather than shipped code, so a local declaration is preferred to adding `@types/ws`
 * to the project's dependencies. If `ws` ever disappears from the tree, the script fails at
 * import with a clear error and the evidence run stops — it cannot silently produce wrong
 * numbers.
 */
declare module 'ws' {
  class WebSocket {
    constructor(address: string, options?: { maxPayload?: number });
    on(event: 'message', listener: (data: unknown) => void): this;
    once(event: 'open', listener: () => void): this;
    once(event: 'error', listener: (err: Error) => void): this;
    send(data: string): void;
    close(): void;
  }
  export default WebSocket;
}
