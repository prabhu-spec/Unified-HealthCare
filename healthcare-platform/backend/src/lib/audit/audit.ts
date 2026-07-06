export function auditLog(event: {
  userId: string;
  action: string;
  resource: string;
  tenant: string;
}) {
  console.log(JSON.stringify({
    ...event,
    timestamp: new Date().toISOString(),
  }));
}
