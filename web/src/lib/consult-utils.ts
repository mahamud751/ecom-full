export function makeConsultNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 900 + 100);
  return `CB-${ts}-${rand}`;
}

export function statusLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "Waiting for doctor";
    case "CONFIRMED":
      return "Confirmed";
    case "IN_CALL":
      return "In consultation";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    case "NO_SHOW":
      return "No show";
    default:
      return status;
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case "PENDING":
      return "bg-amber-100 text-amber-800";
    case "CONFIRMED":
      return "bg-sky-100 text-sky-800";
    case "IN_CALL":
      return "bg-emerald-100 text-emerald-800";
    case "COMPLETED":
      return "bg-gray-100 text-gray-700";
    case "CANCELLED":
    case "NO_SHOW":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}
