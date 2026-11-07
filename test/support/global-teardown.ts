export default async function globalTeardown(): Promise<void> {
  await globalThis.__CLINIC_POSTGRES__?.stop();
}
