// Hermes provides btoa/atob at runtime, but the React Native TS config has no DOM lib.
declare function btoa(data: string): string;
declare function atob(data: string): string;
